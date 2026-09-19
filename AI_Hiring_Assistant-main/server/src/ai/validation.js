const QUESTION_CATEGORIES = ['technical', 'behavioral', 'situational', 'culturalFit'];
const LEVELS = ['1', '2', '3', '4', '5'];

// Shared with Gemini structured output so the model and local validator use the same contract.
export const KIT_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    jobDescription: {
      type: 'object',
      properties: {
        roleTitle: { type: 'string' },
        roleSummary: { type: 'string' },
        keyResponsibilities: { type: 'array', items: { type: 'string' } },
        requiredSkills: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              skill: { type: 'string' },
              proficiency: { type: 'string' },
              why: { type: 'string' },
            },
            required: ['skill', 'proficiency', 'why'],
          },
        },
        niceToHaveSkills: {
          type: 'array',
          items: {
            type: 'object',
            properties: { skill: { type: 'string' }, why: { type: 'string' } },
            required: ['skill', 'why'],
          },
        },
        compensationGuidance: { type: 'string' },
        whyJoinUs: { type: 'string' },
        whatWeLookFor: { type: 'string' },
      },
      required: [
        'roleTitle',
        'roleSummary',
        'keyResponsibilities',
        'requiredSkills',
        'niceToHaveSkills',
        'compensationGuidance',
        'whyJoinUs',
        'whatWeLookFor',
      ],
    },
    interviewQuestions: {
      type: 'object',
      properties: Object.fromEntries(
        QUESTION_CATEGORIES.map((category) => [
          category,
          {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                purpose: { type: 'string' },
                guidance: { type: 'string' },
                whatToLookFor: { type: 'array', items: { type: 'string' } },
                dimensions: { type: 'array', items: { type: 'string' } },
              },
              required: ['question', 'purpose', 'guidance', 'whatToLookFor', 'dimensions'],
            },
          },
        ]),
      ),
      required: QUESTION_CATEGORIES,
    },
    rubric: {
      type: 'object',
      properties: {
        dimensions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              weight: { type: 'number' },
              linkedResponsibilities: { type: 'array', items: { type: 'string' } },
              levels: {
                type: 'object',
                properties: Object.fromEntries(LEVELS.map((level) => [level, { type: 'string' }])),
                required: LEVELS,
              },
            },
            required: ['name', 'description', 'weight', 'linkedResponsibilities', 'levels'],
          },
        },
      },
      required: ['dimensions'],
    },
  },
  required: ['jobDescription', 'interviewQuestions', 'rubric'],
};

const asText = (value) =>
  typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();

const asList = (value) => {
  if (Array.isArray(value)) return value;
  if (value == null || value === '') return [];
  return [value];
};

const asStringList = (value) => asList(value).map(asText).filter(Boolean);

/** Gemini sometimes returns skills as plain strings and sometimes as objects. */
function normalizeSkill(entry) {
  if (typeof entry === 'string') return { skill: entry.trim(), proficiency: '', why: '' };
  return {
    skill: asText(entry?.skill ?? entry?.name),
    proficiency: asText(entry?.proficiency ?? entry?.level),
    why: asText(entry?.why ?? entry?.reason),
  };
}

function normalizeQuestion(entry, index, category) {
  return {
    id: `${category}-${index + 1}`,
    question: asText(entry?.question ?? entry?.prompt),
    purpose: asText(entry?.purpose),
    guidance: asText(entry?.guidance ?? entry?.probe),
    whatToLookFor: asStringList(entry?.whatToLookFor ?? entry?.signals),
    dimensions: asStringList(entry?.dimensions ?? entry?.dimension ?? entry?.competencies),
  };
}

function normalizeDimension(entry, index) {
  const rawLevels = entry?.levels ?? {};
  const levels = {};
  for (const level of LEVELS) {
    levels[level] = asText(rawLevels[level] ?? rawLevels[Number(level)]);
  }

  const weight = Number(entry?.weight);
  return {
    id: `dim-${index + 1}`,
    name: asText(entry?.name ?? entry?.dimension) || `Dimension ${index + 1}`,
    description: asText(entry?.description),
    weight: Number.isFinite(weight) ? Math.min(Math.max(weight, 1), 3) : 1,
    linkedResponsibilities: asStringList(entry?.linkedResponsibilities),
    levels,
  };
}

/**
 * Coerces the model's output into the canonical kit shape and reports only the
 * problems that make a kit unusable. Shape drift is repaired silently; missing
 * substance is reported so the caller can ask the model to fix it.
 */
export function normalizeKit(raw) {
  const problems = [];
  const source = raw?.jobDescription || raw?.rubric ? raw : raw?.hiringKit ?? {};

  const jd = source.jobDescription ?? {};
  const jobDescription = {
    roleTitle: asText(jd.roleTitle ?? jd.title),
    roleSummary: asText(jd.roleSummary ?? jd.summary),
    keyResponsibilities: asStringList(jd.keyResponsibilities ?? jd.responsibilities),
    requiredSkills: asList(jd.requiredSkills).map(normalizeSkill).filter((skill) => skill.skill),
    niceToHaveSkills: asList(jd.niceToHaveSkills).map(normalizeSkill).filter((skill) => skill.skill),
    compensationGuidance: asText(jd.compensationGuidance),
    whyJoinUs: asText(jd.whyJoinUs),
    whatWeLookFor: asText(jd.whatWeLookFor),
  };

  const rawQuestions = source.interviewQuestions ?? {};
  const interviewQuestions = {};
  for (const category of QUESTION_CATEGORIES) {
    const alias = category === 'culturalFit' ? rawQuestions.cultural ?? rawQuestions.culture : undefined;
    interviewQuestions[category] = asList(rawQuestions[category] ?? alias)
      .map((entry, index) => normalizeQuestion(entry, index, category))
      .filter((question) => question.question);
  }

  const dimensions = asList(source.rubric?.dimensions ?? source.rubric)
    .map(normalizeDimension)
    .filter((dimension) => dimension.name && Object.values(dimension.levels).some(Boolean));

  if (!jobDescription.roleSummary) problems.push('jobDescription.roleSummary is empty.');
  if (jobDescription.keyResponsibilities.length < 5) {
    problems.push('jobDescription.keyResponsibilities needs at least 6 entries.');
  }
  if (!jobDescription.requiredSkills.length) problems.push('jobDescription.requiredSkills is empty.');

  const questionCount = QUESTION_CATEGORIES.reduce(
    (total, category) => total + interviewQuestions[category].length,
    0,
  );
  if (questionCount < 8) problems.push(`Only ${questionCount} interview questions were returned; at least 9 are required.`);
  for (const category of QUESTION_CATEGORIES) {
    if (!interviewQuestions[category].length) {
      problems.push(`interviewQuestions.${category} is empty.`);
    }
  }

  if (dimensions.length < 5) problems.push(`Only ${dimensions.length} rubric dimensions were returned; 5 to 7 are required.`);
  for (const dimension of dimensions) {
    const missing = LEVELS.filter((level) => !dimension.levels[level]);
    if (missing.length) {
      problems.push(`Rubric dimension "${dimension.name}" is missing level descriptions ${missing.join(', ')}.`);
    }
  }

  return {
    problems,
    kit: {
      jobDescription,
      interviewQuestions,
      rubric: { dimensions: dimensions.slice(0, 7) },
    },
  };
}

export { QUESTION_CATEGORIES, LEVELS };
