import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppData, AppSettings, GroupProject, StudySession, Subject, Task } from './types';
import { DEFAULT_SETTINGS, MAX_CUSTOM_COLORS } from './types';
import { makeId } from '../lib/id';
import { buildSeedData } from '../lib/seed';

const STORAGE_KEY = 'studysync.data.v1';

function migrateTask(t: Task, index: number): Task {
  return {
    ...t,
    reviewEnabled: t.reviewEnabled ?? true,
    reviewIntervalsDays: t.reviewIntervalsDays ?? null,
    order: t.order ?? index,
    generatedReviewTaskId: t.generatedReviewTaskId ?? null,
  };
}

function migrateSession(s: StudySession): StudySession {
  return { ...s, pausedMs: s.pausedMs ?? 0 };
}

export function migrateAppData(parsed: AppData): AppData {
  // migration: ensure new settings fields exist
  parsed.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
  if (!parsed.settings.navOrder.includes('timeline')) {
    const statsIdx = parsed.settings.navOrder.indexOf('stats');
    parsed.settings.navOrder.splice(statsIdx >= 0 ? statsIdx : parsed.settings.navOrder.length, 0, 'timeline');
  }
  parsed.tasks = parsed.tasks.map((t, i) => migrateTask(t, i));
  parsed.sessions = parsed.sessions.map(migrateSession);
  return parsed;
}

function loadInitial(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return migrateAppData(JSON.parse(raw) as AppData);
    }
  } catch {
    // fall through to seed
  }
  return buildSeedData();
}

interface AppStateValue {
  data: AppData;
  addTask: (input: {
    title: string;
    subjectId: string | null;
    projectId: string | null;
    dueAt: number | null;
    reviewEnabled: boolean;
    reviewIntervalsDays: number[] | null;
  }) => void;
  updateTask: (taskId: string, patch: Partial<Task>) => void;
  toggleTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  restoreTask: (task: Task, sessions?: StudySession[]) => void;
  reorderTasks: (orderedIds: string[]) => void;
  addSubject: (name: string, color: string) => void;
  updateSubject: (subjectId: string, patch: { name?: string; color?: string }) => void;
  archiveSubject: (subjectId: string) => void;
  unarchiveSubject: (subjectId: string) => void;
  deleteSubject: (subjectId: string) => void;
  restoreSubject: (subject: Subject, taskIds: string[]) => void;
  addProject: (input: { name: string; color: string; startDate: string | null; endDate: string | null }) => void;
  updateProject: (projectId: string, patch: { name?: string; color?: string; startDate?: string | null; endDate?: string | null }) => void;
  archiveProject: (projectId: string) => void;
  unarchiveProject: (projectId: string) => void;
  deleteProject: (projectId: string) => void;
  restoreProject: (project: GroupProject, taskIds: string[]) => void;
  startSession: (input: { taskId: string | null; subjectId: string | null; title: string }) => string;
  endSession: (sessionId: string, endedAt: number, pausedMs?: number) => void;
  updateSession: (sessionId: string, patch: { startedAt?: number; endedAt?: number; title?: string; pausedMs?: number }) => void;
  deleteSession: (sessionId: string) => void;
  restoreSession: (session: StudySession) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  addCustomColor: (color: string) => void;
  removeCustomColor: (color: string) => void;
  hideColor: (color: string) => void;
  unhideColor: (color: string) => void;
  resetAll: () => void;
  importBundle: (bundle: { subjects?: Subject[]; projects?: GroupProject[]; tasks?: Task[]; sessions?: StudySession[] }) => void;
  replaceAll: (data: AppData) => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

function computeNextReviewDue(baseDueAt: number | null, stageDays: number): number {
  const base = baseDueAt ?? Date.now();
  const d = new Date(base);
  d.setDate(d.getDate() + stageDays);
  return d.getTime();
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    const root = document.documentElement;
    if (data.settings.themeMode === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', data.settings.themeMode);
    root.style.setProperty('--indigo', data.settings.accentColor);
  }, [data.settings.themeMode, data.settings.accentColor]);

  useEffect(() => {
    const root = document.documentElement;
    const wp = data.settings.wallpaper;
    root.setAttribute('data-wallpaper', wp.mode);
    if (wp.mode === 'color') {
      root.style.setProperty('--bg', wp.color);
    } else {
      root.style.removeProperty('--bg');
    }
    if (wp.mode === 'photo' && wp.photoDataUrl) {
      root.style.setProperty('--wallpaper-image', `url("${wp.photoDataUrl}")`);
    } else {
      root.style.removeProperty('--wallpaper-image');
    }
  }, [data.settings.wallpaper]);

  const value = useMemo<AppStateValue>(() => ({
    data,
    addTask: ({ title, subjectId, projectId, dueAt, reviewEnabled, reviewIntervalsDays }) => {
      setData((prev) => {
        const minOrder = prev.tasks.reduce((min, t) => Math.min(min, t.order), 0);
        const task: Task = {
          id: makeId(), title, subjectId, projectId, dueAt,
          completed: false, completedAt: null, createdAt: Date.now(), order: minOrder - 1,
          isReview: false, reviewParentId: null, reviewStage: -1,
          reviewEnabled, reviewIntervalsDays, generatedReviewTaskId: null,
        };
        return { ...prev, tasks: [task, ...prev.tasks] };
      });
    },
    updateTask: (taskId, patch) => {
      setData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
      }));
    },
    toggleTask: (taskId) => {
      setData((prev) => {
        const task = prev.tasks.find((t) => t.id === taskId);
        if (!task) return prev;
        const nowCompleted = !task.completed;

        // Un-completing: remove the review task this completion previously generated
        // (if any) so re-completing later doesn't leave a stray duplicate behind.
        if (!nowCompleted && task.generatedReviewTaskId) {
          const generatedId = task.generatedReviewTaskId;
          const updatedTasks = prev.tasks
            .filter((t) => t.id !== generatedId)
            .map((t) =>
              t.id === taskId
                ? { ...t, completed: false, completedAt: null, generatedReviewTaskId: null }
                : t
            );
          return { ...prev, tasks: updatedTasks };
        }

        const updatedTasks = prev.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: nowCompleted, completedAt: nowCompleted ? Date.now() : null } : t
        );
        // Forgetting-curve auto review: only when freshly completed, not un-completing,
        // only if this task has auto-review enabled, and only if a review hasn't
        // already been generated for this completion (avoids duplicates on re-toggle).
        if (nowCompleted && task.reviewEnabled && !task.generatedReviewTaskId) {
          const intervals = task.reviewIntervalsDays ?? prev.settings.reviewIntervalsDays;
          const nextStage = task.reviewStage + 1;
          if (nextStage < intervals.length) {
            const minOrder = prev.tasks.reduce((min, t) => Math.min(min, t.order), 0);
            const reviewTaskId = makeId();
            const reviewTask: Task = {
              id: reviewTaskId,
              title: task.title,
              subjectId: task.subjectId,
              projectId: task.projectId,
              dueAt: computeNextReviewDue(task.dueAt, intervals[nextStage]),
              completed: false,
              completedAt: null,
              createdAt: Date.now(),
              order: minOrder - 1,
              isReview: true,
              reviewParentId: task.reviewParentId ?? task.id,
              reviewStage: nextStage,
              reviewEnabled: task.reviewEnabled,
              reviewIntervalsDays: task.reviewIntervalsDays,
              generatedReviewTaskId: null,
            };
            const tasksWithLink = updatedTasks.map((t) =>
              t.id === taskId ? { ...t, generatedReviewTaskId: reviewTaskId } : t
            );
            return { ...prev, tasks: [reviewTask, ...tasksWithLink] };
          }
        }
        return { ...prev, tasks: updatedTasks };
      });
    },
    deleteTask: (taskId) => {
      setData((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== taskId),
        sessions: prev.sessions.filter((s) => s.taskId !== taskId),
      }));
    },
    restoreTask: (task, sessions) => {
      setData((prev) => {
        if (prev.tasks.some((t) => t.id === task.id)) return prev;
        const restoredSessions = (sessions ?? []).filter((s) => !prev.sessions.some((existing) => existing.id === s.id));
        return { ...prev, tasks: [task, ...prev.tasks], sessions: [...prev.sessions, ...restoredSessions] };
      });
    },
    reorderTasks: (orderedIds) => {
      setData((prev) => {
        const orderMap = new Map(orderedIds.map((id, i) => [id, i]));
        return {
          ...prev,
          tasks: prev.tasks.map((t) => (orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id)! } : t)),
        };
      });
    },
    addSubject: (name, color) => {
      const subject: Subject = { id: makeId(), name, color, archived: false, createdAt: Date.now() };
      setData((prev) => ({ ...prev, subjects: [...prev.subjects, subject] }));
    },
    updateSubject: (subjectId, patch) => {
      setData((prev) => ({
        ...prev,
        subjects: prev.subjects.map((s) => (s.id === subjectId ? { ...s, ...patch } : s)),
      }));
    },
    archiveSubject: (subjectId) => {
      setData((prev) => ({
        ...prev,
        subjects: prev.subjects.map((s) => (s.id === subjectId ? { ...s, archived: true } : s)),
      }));
    },
    unarchiveSubject: (subjectId) => {
      setData((prev) => ({
        ...prev,
        subjects: prev.subjects.map((s) => (s.id === subjectId ? { ...s, archived: false } : s)),
      }));
    },
    deleteSubject: (subjectId) => {
      setData((prev) => ({
        ...prev,
        subjects: prev.subjects.filter((s) => s.id !== subjectId),
        tasks: prev.tasks.map((t) => (t.subjectId === subjectId ? { ...t, subjectId: null } : t)),
      }));
    },
    restoreSubject: (subject, taskIds) => {
      setData((prev) => {
        if (prev.subjects.some((s) => s.id === subject.id)) return prev;
        const taskIdSet = new Set(taskIds);
        return {
          ...prev,
          subjects: [...prev.subjects, subject],
          tasks: prev.tasks.map((t) => (taskIdSet.has(t.id) ? { ...t, subjectId: subject.id } : t)),
        };
      });
    },
    addProject: ({ name, color, startDate, endDate }) => {
      const project: GroupProject = {
        id: makeId(), name, color, icon: 'check', startDate, endDate, archived: false, createdAt: Date.now(),
      };
      setData((prev) => ({ ...prev, projects: [...prev.projects, project] }));
    },
    updateProject: (projectId, patch) => {
      setData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => (p.id === projectId ? { ...p, ...patch } : p)),
      }));
    },
    archiveProject: (projectId) => {
      setData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => (p.id === projectId ? { ...p, archived: true } : p)),
      }));
    },
    unarchiveProject: (projectId) => {
      setData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => (p.id === projectId ? { ...p, archived: false } : p)),
      }));
    },
    deleteProject: (projectId) => {
      setData((prev) => ({
        ...prev,
        projects: prev.projects.filter((p) => p.id !== projectId),
        tasks: prev.tasks.map((t) => (t.projectId === projectId ? { ...t, projectId: null } : t)),
      }));
    },
    restoreProject: (project, taskIds) => {
      setData((prev) => {
        if (prev.projects.some((p) => p.id === project.id)) return prev;
        const taskIdSet = new Set(taskIds);
        return {
          ...prev,
          projects: [...prev.projects, project],
          tasks: prev.tasks.map((t) => (taskIdSet.has(t.id) ? { ...t, projectId: project.id } : t)),
        };
      });
    },
    startSession: ({ taskId, subjectId, title }) => {
      const id = makeId();
      const session: StudySession = { id, taskId, subjectId, title, startedAt: Date.now(), endedAt: Date.now(), pausedMs: 0 };
      setData((prev) => ({ ...prev, sessions: [...prev.sessions, session] }));
      return id;
    },
    endSession: (sessionId, endedAt, pausedMs = 0) => {
      setData((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) => (s.id === sessionId ? { ...s, endedAt, pausedMs } : s)),
      }));
    },
    updateSession: (sessionId, patch) => {
      setData((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) => (s.id === sessionId ? { ...s, ...patch } : s)),
      }));
    },
    deleteSession: (sessionId) => {
      setData((prev) => ({ ...prev, sessions: prev.sessions.filter((s) => s.id !== sessionId) }));
    },
    restoreSession: (session) => {
      setData((prev) => (prev.sessions.some((s) => s.id === session.id) ? prev : { ...prev, sessions: [...prev.sessions, session] }));
    },
    updateSettings: (patch) => {
      setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
    },
    addCustomColor: (color) => {
      setData((prev) => {
        if (prev.settings.customColors.some((c) => c.toLowerCase() === color.toLowerCase())) return prev;
        const next = [...prev.settings.customColors, color].slice(-MAX_CUSTOM_COLORS);
        return { ...prev, settings: { ...prev.settings, customColors: next } };
      });
    },
    removeCustomColor: (color) => {
      setData((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          customColors: prev.settings.customColors.filter((c) => c.toLowerCase() !== color.toLowerCase()),
        },
      }));
    },
    hideColor: (color) => {
      setData((prev) => {
        if (prev.settings.hiddenColors.some((c) => c.toLowerCase() === color.toLowerCase())) return prev;
        return { ...prev, settings: { ...prev.settings, hiddenColors: [...prev.settings.hiddenColors, color] } };
      });
    },
    unhideColor: (color) => {
      setData((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          hiddenColors: prev.settings.hiddenColors.filter((c) => c.toLowerCase() !== color.toLowerCase()),
        },
      }));
    },
    resetAll: () => {
      const fresh = buildSeedData();
      setData(fresh);
    },
    importBundle: (bundle) => {
      setData((prev) => ({
        ...prev,
        subjects: [...prev.subjects, ...(bundle.subjects ?? [])],
        projects: [...prev.projects, ...(bundle.projects ?? [])],
        tasks: [...prev.tasks, ...(bundle.tasks ?? [])],
        sessions: [...prev.sessions, ...(bundle.sessions ?? [])],
      }));
    },
    replaceAll: (next) => {
      setData(migrateAppData(next));
    },
  }), [data]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
