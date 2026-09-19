import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

dotenv.config({ path: path.join(serverRoot, '.env') });

const PLACEHOLDERS = [
  'change-me-to-a-long-random-string',
  'your_gemini_api_key_here',
  'your-gemini-api-key-here',
];

function clean(value) {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return '';
  return PLACEHOLDERS.includes(trimmed.toLowerCase()) ? '' : trimmed;
}

const geminiApiKey = clean(process.env.GEMINI_API_KEY);
const mongoUri = clean(process.env.MONGODB_URI);
const jwtSecret = clean(process.env.JWT_SECRET);

export const config = {
  serverRoot,
  dataDir: path.join(serverRoot, 'data'),
  port: Number(process.env.PORT) || 5000,
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:4173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  gemini: {
    apiKey: geminiApiKey,
    model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
    enabled: Boolean(geminiApiKey),
  },

  mongo: {
    uri: mongoUri,
    dbName: process.env.MONGODB_DB || 'hiring_studio',
    enabled: Boolean(mongoUri),
  },

  // A missing secret must not silently disable auth, so fall back to a random
  // per-boot value: tokens stop working across restarts, which is loud enough
  // to be noticed without blocking a first run.
  auth: {
    secret: jwtSecret || `ephemeral-${Math.random().toString(36).slice(2)}`,
    usingEphemeralSecret: !jwtSecret,
    tokenTtl: '7d',
  },
};

export function describeStartupConfig() {
  return [
    `storage      : ${config.mongo.enabled ? `MongoDB (${config.mongo.dbName})` : 'local file store (server/data)'}`,
    `gemini       : ${config.gemini.enabled ? config.gemini.model : 'NOT CONFIGURED — offline demo mode'}`,
    `jwt secret   : ${config.auth.usingEphemeralSecret ? 'ephemeral (set JWT_SECRET to persist logins)' : 'configured'}`,
  ];
}
