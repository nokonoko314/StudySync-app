import { registerPlugin, Capacitor } from '@capacitor/core';
import type { AppData, Subject, Task } from '../state/types';
import { formatTimeHM, isSameDay, startOfDay } from './format';

interface WidgetBridgePlugin {
  updateWidget(options: {
    total: number;
    done: number;
    nextTitle: string;
    nextMeta: string;
    updatedLabel: string;
  }): Promise<void>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');

function subjectLabel(task: Task, subjects: Subject[]): string {
  const subject = subjects.find((s) => s.id === task.subjectId);
  if (!subject) return task.dueAt ? `${formatTimeHM(new Date(task.dueAt))} まで` : '';
  const time = task.dueAt ? `・${formatTimeHM(new Date(task.dueAt))} まで` : '';
  return `${subject.name}${time}`;
}

/** Pushes today's task summary to the Android home screen widget. No-op on web/other platforms. */
export function syncWidget(data: AppData): void {
  if (!Capacitor.isNativePlatform()) return;

  const today = startOfDay(new Date());
  const todayTasks = data.tasks.filter((t) => t.dueAt !== null && isSameDay(new Date(t.dueAt), today));
  const total = todayTasks.length;
  const done = todayTasks.filter((t) => t.completed).length;
  const next = todayTasks
    .filter((t) => !t.completed)
    .sort((a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity))[0];

  const now = new Date();
  const updatedLabel = `更新: ${formatTimeHM(now)}`;

  WidgetBridge.updateWidget({
    total,
    done,
    nextTitle: next ? next.title : '',
    nextMeta: next ? subjectLabel(next, data.subjects) : '',
    updatedLabel,
  }).catch(() => {
    // Widget not present / plugin unavailable — safe to ignore.
  });
}
