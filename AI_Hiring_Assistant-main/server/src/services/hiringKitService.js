import { config } from '../config/env.js';
import { upstreamFailure } from '../lib/errors.js';
import { generateJson, isGeminiEnabled } from '../ai/gemini.js';
import { buildKitPrompt, buildRepairPrompt } from '../ai/prompts.js';
import { normalizeKit } from '../ai/validation.js';
import { analyseAlignment } from '../ai/alignment.js';
import { buildOfflineKit } from '../ai/demoKit.js';
import { retrieveRelevantChunks, TOP_K } from '../rag/retriever.js';

const EXCERPT_CHARS = 320;

/** A kit missing a little substance is still worth showing; a shell is not. */
const isUsable = (kit) =>
  kit.rubric.dimensions.length >= 3 &&
  Object.values(kit.interviewQuestions).flat().length >= 6 &&
  kit.jobDescription.keyResponsibilities.length >= 3;

function summariseRetrieval(retrieval) {
  return {
    mode: retrieval.mode,
    roleFamily: retrieval.roleFamily,
    query: retrieval.query,
    topK: TOP_K,
    candidateCount: retrieval.candidateCount,
    chunks: retrieval.chunks.map((chunk) => ({
      id: chunk.id,
      title: chunk.title,
      source: chunk.source,
      category: chunk.category,
      chunkIndex: chunk.chunkIndex,
      origin: chunk.origin,
      fusedScore: chunk.fusedScore,
      channels: chunk.channels,
      injectedForCoverage: chunk.injectedForCoverage,
      excerpt:
        chunk.content.length > EXCERPT_CHARS
          ? `${chunk.content.slice(0, EXCERPT_CHARS).trimEnd()}…`
          : chunk.content,
    })),
  };
}

async function generateWithGemini(roleInput, retrieval) {
  const prompt = buildKitPrompt(roleInput, retrieval.chunks);
  const first = normalizeKit(await generateJson(prompt));

  if (!first.problems.length) {
    return { kit: first.kit, attempts: 1, repaired: false, warnings: [] };
  }

  // One targeted repair pass: cheaper and more reliable than regenerating, and it
  // keeps the parts that were already correct.
  try {
    const second = normalizeKit(await generateJson(buildRepairPrompt(first.kit, first.problems), { temperature: 0.35 }));
    if (!second.problems.length) {
      return { kit: second.kit, attempts: 2, repaired: true, warnings: [] };
    }
    if (isUsable(second.kit)) {
      return { kit: second.kit, attempts: 2, repaired: true, warnings: second.problems };
    }
  } catch (error) {
    if (!isUsable(first.kit)) throw error;
  }

  if (isUsable(first.kit)) {
    return { kit: first.kit, attempts: 2, repaired: true, warnings: first.problems };
  }

  throw upstreamFailure(
    'Gemini returned an incomplete hiring kit twice. Add a little more detail to the role description and try again.',
    first.problems,
  );
}

export async function generateHiringKit(roleInput) {
  const retrieval = await retrieveRelevantChunks(roleInput);

  const generation = isGeminiEnabled()
    ? { ...(await generateWithGemini(roleInput, retrieval)), source: 'gemini', model: config.gemini.model }
    : { kit: buildOfflineKit(roleInput, retrieval), attempts: 0, repaired: false, warnings: [], source: 'offline', model: null };

  const { kit, ...meta } = generation;

  return {
    kit,
    alignment: analyseAlignment(kit),
    retrieval: summariseRetrieval(retrieval),
    generation: {
      source: meta.source,
      model: meta.model,
      attempts: meta.attempts,
      repaired: meta.repaired,
      warnings: meta.warnings,
      generatedAt: new Date().toISOString(),
    },
  };
}
