import { Router } from 'express';
import multer from 'multer';
import { asyncRoute, badRequest } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { extractText } from '../rag/ingest.js';
import { generateJson, isGeminiEnabled } from '../ai/gemini.js';

const router = Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const RESUME_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    email: { type: 'string' },
    phone: { type: 'string' },
    experience: { type: 'string' },
    currentRole: { type: 'string' },
    skills: { type: 'array', items: { type: 'string' } },
  },
  required: ['name', 'email', 'phone', 'experience', 'currentRole', 'skills'],
};

function normalizeExtracted(value) {
  return {
    name: String(value?.name ?? '').trim().slice(0, 120),
    email: String(value?.email ?? '').trim().slice(0, 160),
    phone: String(value?.phone ?? '').trim().slice(0, 40),
    experience: String(value?.experience ?? '').trim().slice(0, 80),
    currentRole: String(value?.currentRole ?? '').trim().slice(0, 160),
    skills: Array.isArray(value?.skills)
      ? value.skills.map((skill) => String(skill).trim().slice(0, 80)).filter(Boolean).slice(0, 30)
      : [],
  };
}

async function analyzeResume(text) {
  const local = normalizeExtracted(detectResume(text));
  if (!isGeminiEnabled()) return { extracted: local, source: 'local-fallback' };

  const prompt = `You extract candidate profile details from resume text. Return only JSON matching the supplied schema.

Rules:
- Copy only information explicitly present in the resume. Never guess or invent details.
- Use an empty string when a field is not present.
- Put technologies, tools, programming languages, certifications, and professional competencies in skills.
- Keep experience as a concise human-readable value such as "5 years" or "2019-2024".
- Return the candidate's most recent or clearly stated professional role as currentRole.

Resume text:
${text.slice(0, 24000)}`;

  try {
    const generated = await generateJson(prompt, {
      temperature: 0.1,
      maxOutputTokens: 1200,
      responseSchema: RESUME_RESPONSE_SCHEMA,
    });
    const extracted = normalizeExtracted(generated);
    const usefulFields = [extracted.name, extracted.email, extracted.experience, extracted.currentRole, ...extracted.skills]
      .filter(Boolean).length;
    return usefulFields ? { extracted, source: 'gemini' } : { extracted: local, source: 'local-fallback' };
  } catch (error) {
    console.warn(`[resume] AI analysis failed; using local extraction: ${error.message}`);
    return { extracted: local, source: 'local-fallback' };
  }
}

function detectResume(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/[•▪◦]/g, '|').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const lowerText = text.toLowerCase();
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? '';
  const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() ?? '';
  const labeled = (labels) => {
    const labelPattern = labels.join('|');
    const match = text.match(new RegExp(`(?:${labelPattern})\\s*[:\\-]\\s*([^\\n|]+)`, 'i'));
    return match?.[1]?.trim() ?? '';
  };

  const experienceMatch = text.match(/(\d+(?:\.\d+)?)\s*\+?\s*years?\s*(?:of\s*)?experience/i);
  const dateYears = [...text.matchAll(/\b(19\d{2}|20\d{2})\s*(?:-|–|to)\s*(19\d{2}|20\d{2}|present|current)\b/gi)]
    .map((match) => (Number(match[2]) || new Date().getFullYear()) - Number(match[1]))
    .filter((years) => years > 0 && years < 60);
  const experience = experienceMatch
    ? `${experienceMatch[1]} years`
    : dateYears.length
      ? `${Math.max(...dateYears)} years`
      : labeled(['experience', 'total experience']);

  const roleLine = labeled(['current role', 'title', 'position']) || lines.find((line) =>
    /\b(engineer|developer|manager|designer|analyst|specialist|consultant|lead|director|coordinator|architect|administrator)\b/i.test(line),
  ) || '';

  const skillsHeading = lines.findIndex((line) => /^(technical )?(skills?|technologies|core competencies|expertise)\s*:?$/i.test(line));
  const skillLine = lines.find((line) => /^(technical )?(skills?|technologies|core competencies|expertise)\s*:/i.test(line));
  const skillLines = skillLine
    ? [skillLine.replace(/^[^:]+:/, '')]
    : skillsHeading >= 0
      ? lines.slice(skillsHeading + 1, skillsHeading + 4)
      : [];
  const skills = skillLines
    .join('|')
    .split(/[,|;/]/)
    .map((skill) => skill.replace(/^[-*\s]+/, '').trim())
    .filter((skill) => skill && skill.length <= 60 && !/^(experience|education|projects|certifications)$/i.test(skill))
    .slice(0, 30);

  const name = labeled(['name', 'candidate']) || lines.slice(0, 6).find((line) =>
    /^[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,3}$/.test(line) && !/resume|curriculum vitae/i.test(line),
  ) || '';

  return {
    name,
    email,
    phone,
    experience,
    currentRole: roleLine ?? '',
    skills,
  };
}

router.post('/candidates/resume', upload.single('resume'), asyncRoute(async (req, res) => {
  if (!req.file) throw badRequest('Attach a PDF or DOCX resume.');
  const text = await extractText(req.file.buffer, req.file.originalname);
  if (text.length < 40) throw badRequest('That resume produced almost no text. It may be a scanned image.');

  const analysis = await analyzeResume(text);
  res.json({
    filename: req.file.originalname,
    extracted: analysis.extracted,
    extractionSource: analysis.source,
    textPreview: text.slice(0, 500),
  });
}));

export default router;