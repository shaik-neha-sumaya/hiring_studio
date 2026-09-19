const TARGET_CHARS = 900;
const OVERLAP_CHARS = 140;
const MIN_CHARS = 120;

export function cleanText(raw) {
  return String(raw ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ ​]/g, ' ')
    .trim();
}

/**
 * Paragraph-aware chunking: paragraphs are packed up to the target size and only
 * split mid-paragraph when a single paragraph exceeds it. Consecutive chunks
 * carry a short overlap so a sentence spanning a boundary stays retrievable.
 */
export function chunkDocument(text, { targetChars = TARGET_CHARS, overlapChars = OVERLAP_CHARS } = {}) {
  const paragraphs = cleanText(text)
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const pieces = [];
  for (const paragraph of paragraphs) {
    if (paragraph.length <= targetChars) {
      pieces.push(paragraph);
      continue;
    }
    const sentences = paragraph.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [paragraph];
    let buffer = '';
    for (const sentence of sentences) {
      if (buffer && buffer.length + sentence.length > targetChars) {
        pieces.push(buffer.trim());
        buffer = buffer.slice(-overlapChars);
      }
      buffer += sentence;
    }
    if (buffer.trim()) pieces.push(buffer.trim());
  }

  const chunks = [];
  let current = '';
  for (const piece of pieces) {
    if (current && current.length + piece.length + 2 > targetChars) {
      chunks.push(current.trim());
      current = '';
    }
    current = current ? `${current}\n\n${piece}` : piece;
  }
  if (current.trim()) chunks.push(current.trim());

  // A trailing fragment carries almost no retrievable meaning on its own.
  if (chunks.length > 1 && chunks.at(-1).length < MIN_CHARS) {
    const tail = chunks.pop();
    chunks[chunks.length - 1] += `\n\n${tail}`;
  }

  return chunks;
}
