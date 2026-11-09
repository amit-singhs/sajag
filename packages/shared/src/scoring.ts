import type { Question } from './campaign';

export interface ScoredAnswer {
  /** null for unscored (open-text) questions */
  isCorrect: boolean | null;
  pointsAwarded: number;
  maxPoints: number;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Pure scoring rules, shared so the builder can explain scoring exactly as the server applies it.
 * - single / true_false: full points only when the one correct option is the only selection.
 * - multi, all_or_nothing: full points only when the selection equals the correct set.
 * - multi, partial: each correct pick earns points/correctCount, each wrong pick deducts the same; floor 0.
 */
export function scoreAnswer(question: Question, selectedOptionIds: readonly string[]): ScoredAnswer {
  if (question.type === 'text') return { isCorrect: null, pointsAwarded: 0, maxPoints: 0 };

  const selected = new Set(selectedOptionIds);
  const correctIds = new Set(question.options.filter((o) => o.correct).map((o) => o.id));
  const exactMatch = selected.size === correctIds.size && [...selected].every((id) => correctIds.has(id));
  const maxPoints = question.points;

  if (question.type === 'multi' && question.scoring === 'partial') {
    const weight = correctIds.size === 0 ? 0 : maxPoints / correctIds.size;
    let earned = 0;
    for (const id of selected) earned += correctIds.has(id) ? weight : -weight;
    return { isCorrect: exactMatch, pointsAwarded: round2(Math.max(0, Math.min(maxPoints, earned))), maxPoints };
  }

  return { isCorrect: exactMatch, pointsAwarded: exactMatch ? maxPoints : 0, maxPoints };
}
