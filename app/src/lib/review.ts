import type { GroupProject, ReviewPreset, ReviewRating, Task } from '../state/types';

const DAY_MS = 86_400_000;

export const REVIEW_PRESETS: Record<ReviewPreset, { name: string; sub: string; days: number[] | null }> = {
  standard: { name: '標準', sub: '1・3・7・14・30日後', days: [1, 3, 7, 14, 30] },
  cram: { name: 'テスト前集中', sub: '1・2・4・7日後', days: [1, 2, 4, 7] },
  long: { name: '長期記憶', sub: '1・7・30・90日後', days: [1, 7, 30, 90] },
  exam: { name: '試験日に合わせる', sub: '次のプログラムの最終日までに終える', days: null },
};

export function startOfDayMs(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dateStringToDayMs(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

/** The nearest non-archived program whose end date is after `fromMs`. */
export function nextProgram(projects: GroupProject[], fromMs: number): GroupProject | null {
  const from = startOfDayMs(fromMs);
  return projects
    .filter((p) => !p.archived && p.endDate && dateStringToDayMs(p.endDate) > from)
    .sort((a, b) => dateStringToDayMs(a.endDate!) - dateStringToDayMs(b.endDate!))[0] ?? null;
}

/** Days after the base date on which reviews happen, for a preset. */
export function presetDays(preset: ReviewPreset, baseMs: number, projects: GroupProject[]): number[] {
  const fixed = REVIEW_PRESETS[preset].days;
  if (fixed) return fixed;
  const program = nextProgram(projects, baseMs);
  if (!program) return REVIEW_PRESETS.standard.days!;
  const n = Math.round((dateStringToDayMs(program.endDate!) - startOfDayMs(baseMs)) / DAY_MS);
  return [...new Set([1, Math.round(n * 0.3), Math.round(n * 0.6), n].filter((d) => d >= 1 && d <= n))].sort((a, b) => a - b);
}

/** Effective review intervals for a task: per-task custom days win, then its preset, then the app default. */
export function reviewDaysFor(
  task: Pick<Task, 'reviewIntervalsDays' | 'reviewPreset'>,
  defaultPreset: ReviewPreset,
  baseMs: number,
  projects: GroupProject[],
): number[] {
  if (task.reviewIntervalsDays && task.reviewIntervalsDays.length) return task.reviewIntervalsDays;
  return presetDays(task.reviewPreset ?? defaultPreset, baseMs, projects);
}

export interface NextReview {
  stage: number; // index into the interval list this review represents
  dueAt: number; // epoch ms (start of the due day, plus the original time of day when known)
  total: number;
}

/**
 * Where the next review lands after completing `task` at `completedAt`.
 * again = tomorrow without advancing, good = next step, easy = skip one step.
 * Returns null when the schedule is finished or auto-review is off.
 */
export function computeNextReview(
  task: Task,
  completedAt: number,
  rating: ReviewRating,
  defaultPreset: ReviewPreset,
  projects: GroupProject[],
): NextReview | null {
  if (!task.reviewEnabled) return null;
  const baseAt = task.reviewBaseAt ?? completedAt;
  const days = reviewDaysFor(task, defaultPreset, baseAt, projects);
  const current = task.isReview ? task.reviewStage + 1 : 0;
  const nextIdx = rating === 'easy' ? current + 1 : current;
  if (nextIdx >= days.length) return null;

  const doneDay = startOfDayMs(completedAt);
  let dueDay = rating === 'again' ? doneDay + DAY_MS : startOfDayMs(baseAt) + days[nextIdx] * DAY_MS;
  if (dueDay <= doneDay) dueDay = doneDay + DAY_MS;

  const timeOfDay = task.scheduledStart !== null ? task.scheduledStart - startOfDayMs(task.scheduledStart) : null;
  return { stage: nextIdx, dueAt: timeOfDay !== null ? dueDay + timeOfDay : dueDay, total: days.length };
}

/** Review sessions are half the original length, rounded to 5 minutes, at least 15. */
export function reviewPlannedMinutes(originalMinutes: number): number {
  return Math.max(15, Math.round(originalMinutes / 2 / 5) * 5);
}
