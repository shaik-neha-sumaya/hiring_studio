const MIN_SCORE = 1;
export const MAX_SCORE = 5;
const MEANINGFUL_EVIDENCE_CHARS = 25;

export function clampScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return null;
  return Math.min(Math.max(Math.round(score), MIN_SCORE), MAX_SCORE);
}

/**
 * Turns raw per-dimension input into the numbers the rest of the app reads.
 * Weights come from the rubric, so a role where craft drives most of the outcome
 * is not decided by an evenly-weighted communication score.
 *
 * Evidence completeness is tracked as a first-class number because a rubric score
 * with no written evidence is an impression, and the comparison view should be
 * able to say so.
 */
export function evaluateCandidate(dimensions, rawScores = {}) {
  const breakdown = dimensions.map((dimension) => {
    const entry = rawScores[dimension.id] ?? {};
    const score = clampScore(entry.score);
    const evidence = String(entry.evidence ?? '').trim();
    return {
      dimensionId: dimension.id,
      name: dimension.name,
      weight: dimension.weight,
      score,
      evidence,
      hasEvidence: evidence.length >= MEANINGFUL_EVIDENCE_CHARS,
    };
  });

  const scored = breakdown.filter((entry) => entry.score !== null);

  const rawTotal = scored.reduce((sum, entry) => sum + entry.score, 0);
  const rawMax = scored.length * MAX_SCORE;
  const weightedTotal = scored.reduce((sum, entry) => sum + entry.score * entry.weight, 0);
  const weightedMax = scored.reduce((sum, entry) => sum + MAX_SCORE * entry.weight, 0);

  return {
    breakdown,
    totals: {
      scoredDimensions: scored.length,
      totalDimensions: dimensions.length,
      complete: scored.length === dimensions.length && dimensions.length > 0,
      rawTotal,
      rawMax,
      percentage: rawMax ? Number(((rawTotal / rawMax) * 100).toFixed(1)) : null,
      weightedTotal: Number(weightedTotal.toFixed(2)),
      weightedMax,
      weightedPercentage: weightedMax ? Number(((weightedTotal / weightedMax) * 100).toFixed(1)) : null,
      evidenceCompleteness: scored.length
        ? Number(((scored.filter((entry) => entry.hasEvidence).length / scored.length) * 100).toFixed(0))
        : 0,
    },
  };
}
