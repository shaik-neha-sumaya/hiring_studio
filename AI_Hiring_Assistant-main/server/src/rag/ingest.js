import path from 'node:path';
import { badRequest } from '../lib/errors.js';
import { cleanText } from './chunk.js';

const SUPPORTED = new Set(['.txt', '.md', '.markdown', '.json', '.pdf', '.docx']);

export const supportedExtensions = [...SUPPORTED];

/** Pulls every string leaf out of arbitrary JSON so exported hiring data is usable. */
function flattenJsonText(value, depth = 0) {
  if (depth > 6) return [];
  if (typeof value === 'string') return [value];
  if (typeof value === 'number' || typeof value === 'boolean') return [String(value)];
  if (Array.isArray(value)) return value.flatMap((item) => flattenJsonText(item, depth + 1));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => {
      const nested = flattenJsonText(item, depth + 1);
      return nested.length ? [`${key}: ${nested.join(' ')}`] : [];
    });
  }
  return [];
}

export async function extractText(buffer, filename) {
  const extension = path.extname(filename).toLowerCase();
  if (!SUPPORTED.has(extension)) {
    throw badRequest(`Unsupported file type "${extension || filename}". Upload ${supportedExtensions.join(', ')}.`);
  }

  if (extension === '.pdf') {
    // Imported lazily, and from the library entry rather than the package root,
    // whose index.js runs a debug branch that reads a bundled sample file.
    const { default: parsePdf } = await import('pdf-parse/lib/pdf-parse.js');
    const { text } = await parsePdf(buffer);
    return cleanText(text);
  }

  if (extension === '.docx') {
    const { value } = await import('mammoth').then(({ default: mammoth }) =>
      mammoth.extractRawText({ buffer }),
    );
    return cleanText(value);
  }

  const raw = buffer.toString('utf8');

  if (extension === '.json') {
    try {
      return cleanText(flattenJsonText(JSON.parse(raw)).join('\n\n'));
    } catch {
      throw badRequest('That .json file could not be parsed.');
    }
  }

  return cleanText(raw);
}
