import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import { upstreamFailure } from '../lib/errors.js';
import { KIT_RESPONSE_SCHEMA } from './validation.js';

const TRANSIENT_PATTERN = /\b(500|502|503|504)\b|overload|timeout|fetch failed/i;
const MAX_ATTEMPTS = 3;
const EMBED_BATCH_SIZE = 90;

const client = config.gemini.enabled ? new GoogleGenerativeAI(config.gemini.apiKey) : null;

export const isGeminiEnabled = () => Boolean(client);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Retries only on transient upstream failures; a bad prompt fails immediately. */
async function withRetry(label, operation) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === MAX_ATTEMPTS || !TRANSIENT_PATTERN.test(error.message ?? '')) break;
      await sleep(2 ** (attempt - 1) * 700 + Math.random() * 300);
    }
  }
  throw upstreamFailure(`Gemini ${label} failed: ${lastError?.message ?? 'unknown error'}`);
}

function requireClient() {
  if (!client) {
    throw upstreamFailure('GEMINI_API_KEY is not configured on the server.');
  }
  return client;
}

function parseJsonResponse(raw) {
  const text = String(raw ?? '').trim();
  const withoutFence = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const attempts = [withoutFence];
  const start = withoutFence.indexOf('{');
  const end = withoutFence.lastIndexOf('}');
  if (start > -1 && end > start) attempts.push(withoutFence.slice(start, end + 1));

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch {
      // try the next, narrower slice
    }
  }
  throw upstreamFailure('Gemini returned structured output that could not be parsed as JSON.');
}

export async function generateJson(
  prompt,
  { temperature = 0.65, maxOutputTokens = 8192, responseSchema = KIT_RESPONSE_SCHEMA } = {},
) {
  const model = requireClient().getGenerativeModel({
    model: config.gemini.model,
    generationConfig: {
      temperature,
      maxOutputTokens,
      responseMimeType: 'application/json',
      responseSchema,
    },
  });

  const text = await withRetry('generation', async () => {
    const result = await model.generateContent(prompt);
    return result.response.text();
  });

  return parseJsonResponse(text);
}

export async function embedTexts(texts, { taskType = 'RETRIEVAL_DOCUMENT' } = {}) {
  if (!texts.length) return [];
  const model = requireClient().getGenerativeModel({ model: config.gemini.embeddingModel });
  const vectors = [];

  for (let offset = 0; offset < texts.length; offset += EMBED_BATCH_SIZE) {
    const batch = texts.slice(offset, offset + EMBED_BATCH_SIZE);
    const response = await withRetry('embedding', () =>
      model.batchEmbedContents({
        requests: batch.map((text) => ({
          content: { role: 'user', parts: [{ text }] },
          taskType,
        })),
      }),
    );
    vectors.push(...response.embeddings.map((item) => item.values));
  }

  return vectors;
}

export async function embedQuery(text) {
  const [vector] = await embedTexts([text], { taskType: 'RETRIEVAL_QUERY' });
  return vector;
}
