import { embedQuery, isGeminiEnabled } from '../ai/gemini.js';
import { getChunks, getLexicalIndex, hasEmbeddings } from './knowledgeBase.js';
import { cosineSimilarity } from './vector.js';

export const TOP_K = 5;

const CANDIDATE_DEPTH = 24;
const RRF_K = 60;
const DENSE_WEIGHT = 1.0;
const LEXICAL_WEIGHT = 0.85;
const MAX_CHUNKS_PER_SOURCE = 2;

// Categories that carry the "how to interview well" guidance. At least one must
// reach the prompt, otherwise the model writes a rubric with no anchoring advice.
const GUIDANCE_CATEGORIES = new Set(['evaluation', 'methodology', 'behavioral', 'process']);

const ROLE_FAMILY_PATTERNS = [
  [/(front[\s-]?end|react|vue|angular|ui engineer|web developer)/i, 'frontend-engineer'],
  [/(back[\s-]?end|api|node|django|rails|platform engineer|server)/i, 'backend-engineer'],
  [/(data|analyst|analytics|bi\b|scientist|machine learning|ml\b)/i, 'data-analyst'],
  [/(devops|sre|infrastructure|cloud|platform reliability)/i, 'backend-engineer'],
  [/(software|engineer|developer|programmer|full[\s-]?stack)/i, 'software-engineer'],
  [/(product manager|product owner|\bpm\b)/i, 'product-manager'],
  [/(design|ux|ui\/ux|researcher)/i, 'designer'],
  [/(sales|account executive|business development|\bbdr\b|\bsdr\b)/i, 'sales'],
  [/(account manager|customer success|partnerships)/i, 'account-manager'],
  [/(marketing|growth|seo|content|brand|social media)/i, 'marketing'],
  [/(support|helpdesk|service desk|customer care)/i, 'customer-support'],
  [/(operations|logistics|supply|warehouse|coordinator)/i, 'operations'],
  [/(finance|account|bookkeep|payroll|controller)/i, 'finance'],
  [/(admin|assistant|office manager|receptionist)/i, 'administration'],
];

function inferRoleFamily(roleInput) {
  const haystack = [roleInput.roleTitle, roleInput.department, roleInput.responsibilitiesHint, roleInput.mustHaveSkills]
    .filter(Boolean)
    .join(' ');
  return ROLE_FAMILY_PATTERNS.find(([pattern]) => pattern.test(haystack))?.[1] ?? 'all';
}

/**
 * The retrieval query is deliberately not the raw form input: it drops company
 * prose and adds the hiring-process vocabulary the corpus is written in, so a
 * two-line role description still reaches the rubric and interviewing guidance.
 */
function buildRetrievalQuery(roleInput, roleFamily) {
  return [
    roleInput.roleTitle,
    roleInput.seniority && `${roleInput.seniority} level expectations`,
    roleFamily !== 'all' && roleFamily.replace(/-/g, ' '),
    roleInput.mustHaveSkills,
    roleInput.responsibilitiesHint,
    'core competencies interview questions scoring rubric behavioural anchors evaluation criteria',
  ]
    .filter(Boolean)
    .join('. ');
}

function rankDense(queryVector, chunks) {
  return chunks
    .filter((chunk) => chunk.embedding)
    .map((chunk) => ({ id: chunk.id, score: cosineSimilarity(queryVector, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, CANDIDATE_DEPTH);
}

/**
 * Reciprocal Rank Fusion: each retriever contributes 1/(k + rank), so a chunk
 * ranked well by either channel survives without needing the two score scales to
 * be comparable. A small metadata prior favours role-family matches.
 */
function fuse(rankings, chunkById, roleFamily) {
  const fused = new Map();

  for (const { weight, results, channel } of rankings) {
    results.forEach((result, index) => {
      const entry = fused.get(result.id) ?? { id: result.id, score: 0, channels: [] };
      entry.score += weight / (RRF_K + index + 1);
      entry.channels.push({ channel, rank: index + 1, raw: result.score });
      fused.set(result.id, entry);
    });
  }

  for (const entry of fused.values()) {
    const chunk = chunkById.get(entry.id);
    const prior = chunk.roles.includes(roleFamily) ? 0.3 : chunk.roles.includes('all') ? 0.1 : 0;
    entry.score *= 1 + prior;
    entry.rolePrior = prior;
  }

  return [...fused.values()].sort((a, b) => b.score - a.score);
}

/**
 * Greedy selection under a per-source cap, then a guarantee that interviewing
 * guidance is represented. Without the cap a single long document can occupy
 * every slot and the generated kit loses breadth.
 */
function selectDiverse(ranked, chunkById, topK) {
  const perSource = new Map();
  const selected = [];

  for (const entry of ranked) {
    if (selected.length >= topK) break;
    const { source } = chunkById.get(entry.id);
    const used = perSource.get(source) ?? 0;
    if (used >= MAX_CHUNKS_PER_SOURCE) continue;
    perSource.set(source, used + 1);
    selected.push(entry);
  }

  const hasGuidance = selected.some((entry) => GUIDANCE_CATEGORIES.has(chunkById.get(entry.id).category));
  if (!hasGuidance) {
    const replacement = ranked.find(
      (entry) =>
        GUIDANCE_CATEGORIES.has(chunkById.get(entry.id).category) &&
        !selected.some((picked) => picked.id === entry.id),
    );
    if (replacement && selected.length) {
      selected[selected.length - 1] = { ...replacement, injectedForCoverage: true };
    }
  }

  return selected;
}

export async function retrieveRelevantChunks(roleInput, { topK = TOP_K } = {}) {
  const chunks = getChunks();
  const roleFamily = inferRoleFamily(roleInput);
  const query = buildRetrievalQuery(roleInput, roleFamily);
  const chunkById = new Map(chunks.map((chunk) => [chunk.id, chunk]));

  const rankings = [
    { channel: 'lexical', weight: LEXICAL_WEIGHT, results: getLexicalIndex().search(query, CANDIDATE_DEPTH) },
  ];

  let denseAvailable = false;
  if (isGeminiEnabled() && hasEmbeddings()) {
    try {
      const queryVector = await embedQuery(query);
      rankings.unshift({ channel: 'dense', weight: DENSE_WEIGHT, results: rankDense(queryVector, chunks) });
      denseAvailable = true;
    } catch (error) {
      console.warn(`[rag] dense retrieval unavailable, falling back to lexical: ${error.message}`);
    }
  }

  const ranked = fuse(rankings, chunkById, roleFamily);
  const selected = selectDiverse(ranked, chunkById, topK);

  return {
    query,
    roleFamily,
    mode: denseAvailable ? 'hybrid (Gemini embeddings + BM25, RRF fused)' : 'lexical (BM25)',
    chunks: selected.map((entry) => {
      const chunk = chunkById.get(entry.id);
      return {
        id: chunk.id,
        content: chunk.content,
        source: chunk.source,
        title: chunk.title,
        category: chunk.category,
        chunkIndex: chunk.chunkIndex,
        origin: chunk.origin,
        fusedScore: Number(entry.score.toFixed(5)),
        channels: entry.channels.map((channel) => channel.channel),
        rolePrior: entry.rolePrior ?? 0,
        injectedForCoverage: Boolean(entry.injectedForCoverage),
      };
    }),
    candidateCount: ranked.length,
  };
}
