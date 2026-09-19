const STOPWORDS = new Set(
  `a an and are as at be but by for from has have how if in into is it its of on or that the their them then there these they this to was were what when which who will with would you your`.split(
    ' ',
  ),
);

const K1 = 1.4;
const B = 0.72;

/**
 * Splits camelCase and snake_case on both indexing and query sides so a search
 * for "order status" matches an identifier like `getOrderStatus`, then trims a
 * few English suffixes to fold plurals and gerunds together.
 */
export function tokenize(text) {
  return String(text ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token))
    .map(stem);
}

function stem(token) {
  if (token.length <= 4) return token;
  for (const suffix of ['ations', 'ation', 'ingly', 'ings', 'ing', 'ies', 'ers', 'er', 'es', 's']) {
    if (token.endsWith(suffix) && token.length - suffix.length >= 3) {
      return token.slice(0, -suffix.length) + (suffix === 'ies' ? 'y' : '');
    }
  }
  return token;
}

/** Okapi BM25. Small corpus, so the whole index lives in memory. */
export function buildLexicalIndex(chunks) {
  const documents = chunks.map((chunk) => {
    const tokens = tokenize(`${chunk.title ?? ''} ${chunk.category ?? ''} ${chunk.content}`);
    const frequencies = new Map();
    for (const token of tokens) frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
    return { id: chunk.id, frequencies, length: tokens.length };
  });

  const documentFrequency = new Map();
  for (const doc of documents) {
    for (const token of doc.frequencies.keys()) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }

  const averageLength =
    documents.reduce((sum, doc) => sum + doc.length, 0) / Math.max(documents.length, 1);

  return {
    search(query, limit = 20) {
      const queryTokens = tokenize(query);
      if (!queryTokens.length) return [];

      const scores = new Map();
      for (const token of queryTokens) {
        const df = documentFrequency.get(token);
        if (!df) continue;
        const idf = Math.log(1 + (documents.length - df + 0.5) / (df + 0.5));

        for (const doc of documents) {
          const tf = doc.frequencies.get(token);
          if (!tf) continue;
          const norm = tf * (K1 + 1) / (tf + K1 * (1 - B + B * (doc.length / averageLength)));
          scores.set(doc.id, (scores.get(doc.id) ?? 0) + idf * norm);
        }
      }

      return [...scores.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id, score]) => ({ id, score }));
    },
  };
}
