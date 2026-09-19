import { MAX_SCORE } from './evaluate.js';

const NON_DIFFERENTIATING_SD = 0.45;
const MIN_CANDIDATES_PER_INTERVIEWER = 2;
const LOW_EVIDENCE_THRESHOLD = 60;

const mean = (values) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);

const stdDev = (values) => {
  if (values.length < 2) return 0;
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
};

const round = (value, places = 1) => Number(value.toFixed(places));

/**
 * Per-dimension spread across the cohort. A dimension every candidate scores the
 * same on contributed nothing to the decision — it is either badly written or
 * does not belong in this rubric — and saying so is more useful than showing a
 * column of identical threes.
 */
function dimensionStatistics(dimensions, candidates) {
  return dimensions.map((dimension) => {
    const scores = candidates
      .map((candidate) => candidate.scoreMap.get(dimension.id))
      .filter((score) => typeof score === 'number');

    const sd = stdDev(scores);
    return {
      dimensionId: dimension.id,
      name: dimension.name,
      weight: dimension.weight,
      mean: scores.length ? round(mean(scores), 2) : null,
      sd: round(sd, 2),
      min: scores.length ? Math.min(...scores) : null,
      max: scores.length ? Math.max(...scores) : null,
      spread: scores.length ? Math.max(...scores) - Math.min(...scores) : null,
      differentiating: scores.length > 1 && sd >= NON_DIFFERENTIATING_SD,
    };
  });
}

/**
 * Interviewer leniency: each interviewer's average candidate result against the
 * cohort average. Only computed where an interviewer assessed enough candidates
 * for the offset to describe the interviewer rather than the candidate.
 */
function interviewerEffects(candidates) {
  const byInterviewer = new Map();
  for (const candidate of candidates) {
    if (candidate.weightedPercentage === null) continue;
    const name = candidate.interviewer?.trim() || 'Unattributed';
    byInterviewer.set(name, [...(byInterviewer.get(name) ?? []), candidate.weightedPercentage]);
  }

  const cohortMean = mean(candidates.map((c) => c.weightedPercentage).filter((value) => value !== null));
  const entries = [...byInterviewer.entries()].map(([interviewer, values]) => ({
    interviewer,
    candidateCount: values.length,
    mean: round(mean(values)),
    offset: round(mean(values) - cohortMean),
  }));

  const comparable =
    entries.length > 1 && entries.every((entry) => entry.candidateCount >= MIN_CANDIDATES_PER_INTERVIEWER);

  return {
    cohortMean: round(cohortMean),
    interviewers: entries.sort((a, b) => b.mean - a.mean),
    comparable,
    note: comparable
      ? 'Adjusted scores remove each interviewer’s average offset from the cohort mean.'
      : entries.length > 1
        ? `Not enough overlap to separate interviewer effects from candidate differences — each interviewer needs at least ${MIN_CANDIDATES_PER_INTERVIEWER} candidates.`
        : 'All candidates were scored by the same interviewer, so no adjustment is needed.',
  };
}

/**
 * Borda count over per-dimension rankings, used as a robustness check rather than
 * a second opinion to average in: when it disagrees with the weighted total, the
 * lead depends on the weighting rather than on broad superiority, which is
 * exactly the case a hiring manager should look at by hand.
 */
function bordaRanking(dimensions, candidates) {
  const points = new Map(candidates.map((candidate) => [candidate.id, 0]));

  for (const dimension of dimensions) {
    const ranked = candidates
      .map((candidate) => ({ id: candidate.id, score: candidate.scoreMap.get(dimension.id) }))
      .filter((entry) => typeof entry.score === 'number')
      .sort((a, b) => b.score - a.score);

    for (const entry of ranked) {
      // Ties share the higher position, so equal scores earn equal points.
      const position = ranked.findIndex((other) => other.score === entry.score);
      points.set(entry.id, points.get(entry.id) + (ranked.length - position - 1));
    }
  }

  const ordered = [...points.entries()].sort((a, b) => b[1] - a[1]);
  return new Map(ordered.map(([id, score], index) => [id, { bordaPoints: score, bordaRank: index + 1 }]));
}

function confidenceOf(sortedCandidates) {
  const complete = sortedCandidates.filter((candidate) => candidate.weightedPercentage !== null);
  if (complete.length < 2) {
    return { level: 'insufficient', gap: null, message: 'Score at least two candidates to compare.' };
  }

  const gap = complete[0].weightedPercentage - complete[1].weightedPercentage;
  const spread = stdDev(complete.map((candidate) => candidate.weightedPercentage));
  const noiseFloor = Math.max(3, spread * 0.5);

  if (gap < noiseFloor) {
    return {
      level: 'too-close',
      gap: round(gap),
      message: `${complete[0].name} and ${complete[1].name} are within scoring noise (${round(gap)} points). Decide on the dimensions that matter most for the first 90 days, and record why.`,
    };
  }
  if (gap < Math.max(spread, noiseFloor * 2)) {
    return {
      level: 'moderate',
      gap: round(gap),
      message: `${complete[0].name} leads by ${round(gap)} points. A real but not decisive gap — check the dimension breakdown before deciding.`,
    };
  }
  return {
    level: 'clear',
    gap: round(gap),
    message: `${complete[0].name} leads by ${round(gap)} points, which is beyond the spread of this cohort.`,
  };
}

export function compareCandidates(dimensions, candidateRecords) {
  const candidates = candidateRecords.map((record) => ({
    id: record._id,
    name: record.name,
    interviewer: record.interviewer,
    interviewDate: record.interviewDate,
    weightedPercentage: record.evaluation.totals.weightedPercentage,
    percentage: record.evaluation.totals.percentage,
    rawTotal: record.evaluation.totals.rawTotal,
    rawMax: record.evaluation.totals.rawMax,
    complete: record.evaluation.totals.complete,
    evidenceCompleteness: record.evaluation.totals.evidenceCompleteness,
    scoreMap: new Map(
      record.evaluation.breakdown
        .filter((entry) => entry.score !== null)
        .map((entry) => [entry.dimensionId, entry.score]),
    ),
  }));

  const stats = dimensionStatistics(dimensions, candidates);
  const effects = interviewerEffects(candidates);
  const borda = bordaRanking(dimensions, candidates);

  const statsById = new Map(stats.map((entry) => [entry.dimensionId, entry]));

  const orderedRows = candidates
    .map(({ scoreMap, ...candidate }) => {
      const offset = effects.comparable
        ? (effects.interviewers.find((entry) => (candidate.interviewer?.trim() || 'Unattributed') === entry.interviewer)
            ?.offset ?? 0)
        : 0;

      // Relative standing per dimension, so "strong" means strong against the
      // people actually applying rather than against the abstract scale.
      const relative = [...scoreMap.entries()]
        .map(([dimensionId, score]) => {
          const stat = statsById.get(dimensionId);
          if (!stat || stat.mean === null || stat.sd === 0) return null;
          return { dimensionId, name: stat.name, z: round((score - stat.mean) / stat.sd, 2), score };
        })
        .filter(Boolean)
        .sort((a, b) => b.z - a.z);

      return {
        ...candidate,
        scores: Object.fromEntries(scoreMap),
        ...(borda.get(candidate.id) ?? { bordaPoints: 0, bordaRank: null }),
        adjustedWeightedPercentage:
          candidate.weightedPercentage === null ? null : round(candidate.weightedPercentage - offset),
        interviewerOffset: offset,
        strengths: relative.filter((entry) => entry.z > 0).slice(0, 2),
        gaps: relative.filter((entry) => entry.z < 0).slice(-2).reverse(),
      };
    })
    .sort((a, b) => (b.weightedPercentage ?? -1) - (a.weightedPercentage ?? -1));

  const rows = orderedRows.map((row, index) => ({
    ...row,
    rank:
      row.weightedPercentage === null
        ? null
        : orderedRows.findIndex((candidate) => candidate.weightedPercentage === row.weightedPercentage) + 1,
  }));

  const insights = [];

  const flat = stats.filter((stat) => stat.differentiating === false && stat.mean !== null);
  if (candidates.length > 1 && flat.length) {
    insights.push({
      type: 'non-differentiating',
      severity: 'info',
      message: `${flat.map((stat) => `"${stat.name}"`).join(', ')} separated no candidates. ${flat.length > 1 ? 'These dimensions' : 'This dimension'} did not contribute to the ranking — check whether the level descriptions are distinguishable.`,
    });
  }

  const disagreement = rows.filter((row) => row.rank && row.bordaRank && row.rank !== row.bordaRank);
  if (disagreement.length) {
    insights.push({
      type: 'ranking-disagreement',
      severity: 'warning',
      message: `Weighted totals and per-dimension wins disagree on the order (${disagreement
        .slice(0, 2)
        .map((row) => `${row.name}: #${row.rank} by score, #${row.bordaRank} by dimensions won`)
        .join('; ')}). The lead depends on the rubric weighting rather than broad superiority.`,
    });
  }

  const thinEvidence = rows.filter((row) => row.evidenceCompleteness < LOW_EVIDENCE_THRESHOLD);
  if (thinEvidence.length) {
    insights.push({
      type: 'thin-evidence',
      severity: 'warning',
      message: `${thinEvidence.map((row) => row.name).join(', ')} ${thinEvidence.length === 1 ? 'has' : 'have'} scores without written evidence. Scores that cannot be explained are hard to defend and easy to revise after the fact.`,
    });
  }

  const incomplete = rows.filter((row) => !row.complete);
  if (incomplete.length) {
    insights.push({
      type: 'incomplete',
      severity: 'info',
      message: `${incomplete.map((row) => row.name).join(', ')} ${incomplete.length === 1 ? 'is' : 'are'} not scored on every dimension, so the comparison is partial.`,
    });
  }

  if (effects.comparable) {
    const strongest = effects.interviewers[0];
    const weakest = effects.interviewers.at(-1);
    if (Math.abs(strongest.offset - weakest.offset) >= 8) {
      insights.push({
        type: 'interviewer-effect',
        severity: 'warning',
        message: `${strongest.interviewer} scores ${round(strongest.offset - weakest.offset)} points higher on average than ${weakest.interviewer}. Part of the difference between candidates is the interviewer — see the adjusted column.`,
      });
    }
  }

  return {
    rows,
    dimensionStats: stats,
    interviewerEffects: effects,
    confidence: confidenceOf(rows),
    insights,
    scale: { min: 1, max: MAX_SCORE },
  };
}
