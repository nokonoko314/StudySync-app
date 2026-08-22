import type { StudySession } from '../state/types';
import { addDays, isSameDay, startOfDay } from './format';

export function sessionDurationMs(s: StudySession): number {
  return Math.max(0, s.endedAt - s.startedAt - (s.pausedMs ?? 0));
}

export function startOfWeek(d: Date): Date {
  // Monday-start week
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day;
  return startOfDay(addDays(d, diff));
}

export function sessionsOnDay(sessions: StudySession[], day: Date): StudySession[] {
  return sessions.filter((s) => isSameDay(new Date(s.startedAt), day));
}

export function totalMs(sessions: StudySession[]): number {
  return sessions.reduce((sum, s) => sum + sessionDurationMs(s), 0);
}

export function weeklyTotals(sessions: StudySession[], weekStart: Date): number[] {
  const totals: number[] = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i);
    totals.push(totalMs(sessionsOnDay(sessions, day)));
  }
  return totals;
}

export function currentStreakDays(sessions: StudySession[], today: Date): number {
  let streak = 0;
  let cursor = startOfDay(today);
  while (true) {
    const dayTotal = totalMs(sessionsOnDay(sessions, cursor));
    if (dayTotal <= 0) {
      // allow today to be empty so far without breaking the streak display
      if (streak === 0 && isSameDay(cursor, today)) {
        cursor = addDays(cursor, -1);
        continue;
      }
      break;
    }
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function subjectBreakdown(
  sessions: StudySession[],
  subjects: { id: string; name: string; color: string }[]
): { id: string; name: string; color: string; ms: number }[] {
  const map = new Map<string, number>();
  for (const s of sessions) {
    if (!s.subjectId) continue;
    map.set(s.subjectId, (map.get(s.subjectId) ?? 0) + sessionDurationMs(s));
  }
  return subjects
    .map((sub) => ({ ...sub, ms: map.get(sub.id) ?? 0 }))
    .filter((s) => s.ms > 0)
    .sort((a, b) => b.ms - a.ms);
}
