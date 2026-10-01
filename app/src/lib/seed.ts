import type { AppData } from '../state/types';
import { DEFAULT_SETTINGS, SCHEMA_VERSION } from '../state/types';
import { makeId } from './id';

function daysFromNow(days: number, hour = 18, minute = 0): number {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

function todayAt(hour: number, minute: number, dayOffset = 0): number {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

export function buildSeedData(): AppData {
  const mathId = makeId();
  const engId = makeId();
  const chemId = makeId();
  const physId = makeId();

  const examProjectId = makeId();
  const testProjectId = makeId();

  const now = Date.now();
  const v2 = {
    plannedMinutes: 50, completedWithoutTracking: false, carriedFrom: null,
    reviewPreset: null, reviewBaseAt: null,
  } as const;

  return {
    schemaVersion: SCHEMA_VERSION,
    subjects: [
      { id: mathId, name: '数学', color: '#2F6FED', archived: false, createdAt: now },
      { id: engId, name: '英語', color: '#E2684A', archived: false, createdAt: now },
      { id: chemId, name: '化学', color: '#5C9376', archived: false, createdAt: now },
      { id: physId, name: '物理', color: '#D2A24C', archived: false, createdAt: now },
    ],
    projects: [
      {
        id: examProjectId, name: '期末試験', color: '#2E7D9A', icon: 'check',
        startDate: null, endDate: null, archived: false, createdAt: now,
      },
      {
        id: testProjectId, name: '定期テスト', color: '#9A4F8C', icon: 'book',
        startDate: null, endDate: null, archived: false, createdAt: now,
      },
    ],
    tasks: [
      {
        id: makeId(), title: '積分の演習問題 第3章', subjectId: mathId, projectId: examProjectId,
        dueAt: todayAt(18, 0), completed: false, completedAt: null, createdAt: now, order: 0,
        isReview: false, reviewParentId: null, reviewStage: -1, reviewEnabled: true, reviewIntervalsDays: null, generatedReviewTaskId: null,
        ...v2, scheduledStart: todayAt(14, 0),
      },
      {
        id: makeId(), title: '英単語 Unit 12 暗記', subjectId: engId, projectId: null,
        dueAt: todayAt(20, 0), completed: false, completedAt: null, createdAt: now, order: 1,
        isReview: false, reviewParentId: null, reviewStage: -1, reviewEnabled: true, reviewIntervalsDays: null, generatedReviewTaskId: null,
        ...v2, scheduledStart: todayAt(15, 10), plannedMinutes: 40,
      },
      {
        id: makeId(), title: '化学 レポート提出', subjectId: chemId, projectId: null,
        dueAt: todayAt(17, 0), completed: true, completedAt: now, createdAt: now, order: 2,
        isReview: false, reviewParentId: null, reviewStage: -1, reviewEnabled: true, reviewIntervalsDays: null, generatedReviewTaskId: null,
        ...v2, scheduledStart: null, plannedMinutes: 30,
      },
    ],
    sessions: [
      { id: makeId(), taskId: null, subjectId: mathId, title: '数学・積分演習', startedAt: todayAt(9, 40), endedAt: todayAt(10, 25), pausedMs: 0 },
      { id: makeId(), taskId: null, subjectId: engId, title: '英語・Unit12', startedAt: todayAt(13, 20), endedAt: todayAt(13, 48), pausedMs: 0 },
      { id: makeId(), taskId: null, subjectId: chemId, title: '化学・レポート', startedAt: todayAt(19, 10), endedAt: todayAt(20, 42), pausedMs: 0 },
      { id: makeId(), taskId: null, subjectId: mathId, title: '数学', startedAt: todayAt(9, 0, -1), endedAt: todayAt(10, 30, -1), pausedMs: 0 },
      { id: makeId(), taskId: null, subjectId: engId, title: '英語', startedAt: todayAt(14, 0, -2), endedAt: todayAt(15, 0, -2), pausedMs: 0 },
    ],
    settings: { ...DEFAULT_SETTINGS },
  };
}

export { daysFromNow };
