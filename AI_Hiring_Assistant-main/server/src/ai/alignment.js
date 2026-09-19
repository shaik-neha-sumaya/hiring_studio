import { tokenize } from '../rag/lexical.js';
import { QUESTION_CATEGORIES } from './validation.js';

const DECLARED_MATCH_THRESHOLD = 0.45;
const INFERRED_MATCH_THRESHOLD = 0.2;

const tokenSet = (text) => new Set(tokenize(text));

function overlap(a, b) {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / Math.min(a.size, b.size);
}

function bestMatch(needle, haystack, threshold) {
  let best = null;
  for (const candidate of haystack) {
    const score = overlap(needle, candidate.tokens);
    if (score >= threshold && (!best || score > best.score)) best = { ...candidate, score };
  }
  return best;
}

/**
 * The spec's core promise is that the description, the questions and the rubric
 * describe the same job. That is checkable rather than assumed: resolve the links
 * the model declared, fall back to lexical overlap where it declared none, and
 * report what is left uncovered.
 *
 * Declared links are trusted when the name matches; inferred links are marked as
 * such so the UI can distinguish "the model connected these" from "we guessed".
 */
export function analyseAlignment(kit) {
  const dimensions = kit.rubric.dimensions.map((dimension) => ({
    id: dimension.id,
    name: dimension.name,
    tokens: tokenSet(`${dimension.name} ${dimension.description}`),
    nameTokens: tokenSet(dimension.name),
  }));

  const responsibilities = kit.jobDescription.keyResponsibilities.map((text, index) => ({
    id: `resp-${index + 1}`,
    text,
    tokens: tokenSet(text),
  }));

  const questions = QUESTION_CATEGORIES.flatMap((category) =>
    kit.interviewQuestions[category].map((question) => ({
      id: question.id,
      category,
      question: question.question,
      declared: question.dimensions,
      tokens: tokenSet(`${question.question} ${question.purpose} ${question.whatToLookFor.join(' ')}`),
    })),
  );

  const questionLinks = questions.map((question) => {
    const resolved = new Map();

    for (const declaredName of question.declared) {
      const declaredTokens = tokenSet(declaredName);
      const match = bestMatch(declaredTokens, dimensions.map((dimension) => ({ ...dimension, tokens: dimension.nameTokens })), DECLARED_MATCH_THRESHOLD);
      if (match) resolved.set(match.id, 'declared');
    }

    if (!resolved.size) {
      const inferred = bestMatch(question.tokens, dimensions, INFERRED_MATCH_THRESHOLD);
      if (inferred) resolved.set(inferred.id, 'inferred');
    }

    return {
      questionId: question.id,
      category: question.category,
      question: question.question,
      dimensionIds: [...resolved.keys()],
      linkType: resolved.size ? [...resolved.values()][0] : 'none',
    };
  });

  const coverage = kit.rubric.dimensions.map((dimension, index) => {
    const dimensionMeta = dimensions[index];
    const linkedQuestions = questionLinks.filter((link) => link.dimensionIds.includes(dimension.id));

    const declaredResponsibilities = dimension.linkedResponsibilities
      .map((text) => bestMatch(tokenSet(text), responsibilities, DECLARED_MATCH_THRESHOLD))
      .filter(Boolean);

    const responsibilityMatches = declaredResponsibilities.length
      ? declaredResponsibilities
      : [bestMatch(dimensionMeta.tokens, responsibilities, INFERRED_MATCH_THRESHOLD)].filter(Boolean);

    return {
      dimensionId: dimension.id,
      name: dimension.name,
      weight: dimension.weight,
      questionIds: linkedQuestions.map((link) => link.questionId),
      questionCount: linkedQuestions.length,
      responsibilityIds: [...new Set(responsibilityMatches.map((match) => match.id))],
      responsibilityLinkType: declaredResponsibilities.length ? 'declared' : responsibilityMatches.length ? 'inferred' : 'none',
    };
  });

  const warnings = [];
  for (const entry of coverage) {
    if (!entry.questionCount) {
      warnings.push(`No interview question tests "${entry.name}" — interviewers would score it without evidence.`);
    }
    if (!entry.responsibilityIds.length) {
      warnings.push(`"${entry.name}" does not map to any listed responsibility.`);
    }
  }
  const unmappedQuestions = questionLinks.filter((link) => link.linkType === 'none');
  for (const link of unmappedQuestions) {
    warnings.push(`Question "${link.question.slice(0, 60)}…" does not feed any rubric dimension.`);
  }

  const dimensionsCovered = coverage.filter((entry) => entry.questionCount > 0).length;
  const dimensionsGrounded = coverage.filter((entry) => entry.responsibilityIds.length > 0).length;
  const questionsMapped = questionLinks.length - unmappedQuestions.length;

  return {
    responsibilities: responsibilities.map(({ id, text }) => ({ id, text })),
    questionLinks,
    coverage,
    warnings,
    // Weighted toward the link that matters most: a dimension nobody asks about
    // is worse than a question that happens to test two things at once.
    score: Math.round(
      ((dimensionsCovered / Math.max(coverage.length, 1)) * 0.5 +
        (dimensionsGrounded / Math.max(coverage.length, 1)) * 0.3 +
        (questionsMapped / Math.max(questionLinks.length, 1)) * 0.2) *
        100,
    ),
  };
}
