import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { config } from '../config/env.js';
import { embedTexts, isGeminiEnabled } from '../ai/gemini.js';

const CACHE_FILE = path.join(config.dataDir, 'embedding-cache.json');

let cache = null;
let dirty = false;

const keyFor = (text) =>
  `${config.gemini.embeddingModel}:${createHash('sha1').update(text).digest('hex')}`;

async function loadCache() {
  if (cache) return cache;
  try {
    cache = new Map(Object.entries(JSON.parse(await fs.readFile(CACHE_FILE, 'utf8'))));
  } catch {
    cache = new Map();
  }
  return cache;
}

async function flushCache() {
  if (!dirty || !cache) return;
  await fs.mkdir(config.dataDir, { recursive: true });
  await fs.writeFile(CACHE_FILE, JSON.stringify(Object.fromEntries(cache)), 'utf8');
  dirty = false;
}

/**
 * Embeds only the texts that are not already cached on disk, so restarts and
 * re-ingestion of unchanged documents cost no API quota.
 */
export async function embedWithCache(texts) {
  if (!isGeminiEnabled()) return texts.map(() => null);

  const store = await loadCache();
  const missing = [...new Set(texts.filter((text) => !store.has(keyFor(text))))];

  if (missing.length) {
    const vectors = await embedTexts(missing);
    missing.forEach((text, index) => {
      if (vectors[index]) store.set(keyFor(text), vectors[index]);
    });
    dirty = true;
    await flushCache();
  }

  return texts.map((text) => store.get(keyFor(text)) ?? null);
}

export function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dot / magnitude;
}
