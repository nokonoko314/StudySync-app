import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Task } from './types';
import { useAppState } from './AppStateContext';
import { useToast } from '../components/Overlay';

interface ActiveTimer {
  sessionId: string;
  task: Task;
  startedAt: number;
  pausedAccumMs: number;
  pauseStartedAt: number | null;
  minimized: boolean;
}

interface TimerContextValue {
  active: ActiveTimer | null;
  elapsedMs: number;
  isPaused: boolean;
  start: (task: Task) => void;
  toggleRunning: () => void;
  finish: () => void;
  cancel: () => void;
  minimize: () => void;
  expand: () => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

// A session left running by mistake still has to stop somewhere; 24h comfortably covers even an
// all-nighter while keeping the recorded duration bounded and the digital/ring display sane.
export const MAX_TIMER_MS = 24 * 60 * 60 * 1000;

function pausedTotalAt(active: ActiveTimer, nowMs: number): number {
  return active.pausedAccumMs + (active.pauseStartedAt ? nowMs - active.pauseStartedAt : 0);
}

function computeElapsed(active: ActiveTimer, nowMs: number): number {
  const raw = nowMs - active.startedAt - pausedTotalAt(active, nowMs);
  return Math.min(MAX_TIMER_MS, Math.max(0, raw));
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const { startSession, endSession, deleteSession } = useAppState();
  const { showToast } = useToast();
  const [active, setActive] = useState<ActiveTimer | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    if (!active || active.pauseStartedAt) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active?.sessionId, active?.pauseStartedAt]);

  const value = useMemo<TimerContextValue>(() => {
    const finishInternal = (save: boolean) => {
      setActive((cur) => {
        if (!cur) return cur;
        const endedAt = Date.now();
        const elapsed = computeElapsed(cur, endedAt);
        if (save && elapsed >= 1000) {
          endSession(cur.sessionId, endedAt, pausedTotalAt(cur, endedAt));
        } else {
          deleteSession(cur.sessionId);
        }
        return null;
      });
    };

    return {
      active,
      elapsedMs: active ? computeElapsed(active, nowMs) : 0,
      isPaused: !!active?.pauseStartedAt,
      start: (task) => {
        if (active) {
          if (active.task.id === task.id) {
            setActive({ ...active, minimized: false });
            return;
          }
          finishInternal(true);
        }
        const sessionId = startSession({ taskId: task.id, subjectId: task.subjectId, title: task.title });
        const startedAt = Date.now();
        setNowMs(startedAt);
        setActive({ sessionId, task, startedAt, pausedAccumMs: 0, pauseStartedAt: null, minimized: false });
      },
      toggleRunning: () => {
        setActive((prev) => {
          if (!prev) return prev;
          if (prev.pauseStartedAt) {
            // Resume: fold the time spent paused into the accumulator so the running
            // total picks back up from exactly where it left off, instead of counting
            // the paused interval as active study time.
            return { ...prev, pausedAccumMs: prev.pausedAccumMs + (Date.now() - prev.pauseStartedAt), pauseStartedAt: null };
          }
          return { ...prev, pauseStartedAt: Date.now() };
        });
      },
      finish: () => finishInternal(true),
      cancel: () => finishInternal(false),
      minimize: () => setActive((prev) => (prev ? { ...prev, minimized: true } : prev)),
      expand: () => setActive((prev) => (prev ? { ...prev, minimized: false } : prev)),
    };
  }, [active, nowMs, startSession, endSession, deleteSession]);

  // Auto-stop and save once a session hits the measurable maximum, so a timer left
  // running unattended doesn't keep accumulating indefinitely.
  useEffect(() => {
    if (!active || active.pauseStartedAt) return;
    if (computeElapsed(active, nowMs) < MAX_TIMER_MS) return;
    value.finish();
    showToast('計測できる上限（24時間）に達したため、自動的に保存しました');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, nowMs]);

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within TimerProvider');
  return ctx;
}
