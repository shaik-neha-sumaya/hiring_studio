import { createHash } from 'node:crypto';
import { knowledgeDocs } from '../store/index.js';
import { isGeminiEnabled } from '../ai/gemini.js';
import { SEED_DOCUMENTS } from './corpus.js';
import { chunkDocument } from './chunk.js';
import { buildLexicalIndex } from './lexical.js';
import { embedWithCache } from './vector.js';

let chunks = [];
let lexicalIndex = buildLexicalIndex([]);
let embeddedCount = 0;

const chunkId = (source, index) =>
  `${createHash('sha1').update(source).digest('hex').slice(0, 10)}-${index}`;

function toChunks(document) {
  return chunkDocument(document.text).map((content, chunkIndex) => ({
    id: chunkId(document.source, chunkIndex),
    content,
    source: document.source,
    title: document.title ?? document.source,
    category: document.category ?? 'general',
    roles: document.roles?.length ? document.roles : ['all'],
    chunkIndex,
    origin: document.origin ?? 'seed',
    embedding: null,
  }));
}

async function attachEmbeddings(target) {
  if (!isGeminiEnabled()) return;
  const vectors = await embedWithCache(
    target.map((chunk) => `${chunk.title}\n${chunk.category}\n${chunk.content}`),
  );
  target.forEach((chunk, index) => {
    chunk.embedding = vectors[index] ?? null;
  });
  embeddedCount = chunks.filter((chunk) => chunk.embedding).length;
}

function rebuildIndex() {
  lexicalIndex = buildLexicalIndex(chunks);
}

export async function initKnowledgeBase() {
  const uploaded = await knowledgeDocs.find({});
  const documents = [
    ...SEED_DOCUMENTS.map((document) => ({ ...document, origin: 'seed' })),
    ...uploaded.map((document) => ({
      source: document.source,
      title: document.title,
      category: document.category,
      roles: document.roles,
      text: document.text,
      origin: 'upload',
    })),
  ];

  chunks = documents.flatMap(toChunks);
  rebuildIndex();

  // Embedding the corpus is the slow part of boot, and the app is fully usable on
  // lexical retrieval alone, so it runs in the background and upgrades retrieval
  // to hybrid as soon as it lands.
  attachEmbeddings(chunks).catch((error) =>
    console.warn(`[rag] embedding pass failed, staying on lexical retrieval: ${error.message}`),
  );

  return knowledgeStats();
}

export async function addDocument({ source, title, category, roles, text, ownerId }) {
  const record = await knowledgeDocs.insert({
    source,
    title: title ?? source,
    category: category ?? 'general',
    roles: roles?.length ? roles : ['all'],
    text,
    ownerId: ownerId ?? null,
    characters: text.length,
    createdAt: new Date().toISOString(),
  });

  const added = toChunks({ ...record, origin: 'upload' });
  chunks = [...chunks.filter((chunk) => chunk.source !== source), ...added];
  rebuildIndex();
  await attachEmbeddings(added);

  return { document: record, chunkCount: added.length };
}

export async function removeDocument(id) {
  const document = await knowledgeDocs.findById(id);
  if (!document) return false;
  await knowledgeDocs.deleteById(id);
  chunks = chunks.filter((chunk) => chunk.source !== document.source);
  rebuildIndex();
  return true;
}

export const getChunks = () => chunks;
export const getLexicalIndex = () => lexicalIndex;
export const hasEmbeddings = () => embeddedCount > 0;

export function knowledgeStats() {
  const bySource = new Map();
  for (const chunk of chunks) {
    const entry = bySource.get(chunk.source) ?? {
      source: chunk.source,
      title: chunk.title,
      category: chunk.category,
      origin: chunk.origin,
      chunkCount: 0,
    };
    entry.chunkCount += 1;
    bySource.set(chunk.source, entry);
  }

  return {
    documentCount: bySource.size,
    chunkCount: chunks.length,
    embeddedChunkCount: embeddedCount,
    retrievalMode: embeddedCount > 0 ? 'hybrid' : 'lexical',
    sources: [...bySource.values()].sort((a, b) => a.title.localeCompare(b.title)),
  };
}

export async function listUploadedDocuments() {
  const documents = await knowledgeDocs.find({}, { sort: { createdAt: -1 } });
  return documents.map(({ text, _id, ...rest }) => ({
    id: _id,
    ...rest,
    characters: text?.length ?? rest.characters,
  }));
}
