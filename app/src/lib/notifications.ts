import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { AppSettings, Task } from '../state/types';

const DAILY_REMINDER_ID = 999999;

// Local notification ids must be plain integers, so task ids (random base36 strings) are
// folded down to a small deterministic number instead of being used directly.
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return (h % 900000) + 1;
}

let permissionDenied = false;

async function ensurePermission(): Promise<boolean> {
  const status = await LocalNotifications.checkPermissions();
  if (status.display === 'granted') return true;
  if (permissionDenied) return false;
  const req = await LocalNotifications.requestPermissions();
  if (req.display !== 'granted') permissionDenied = true;
  return req.display === 'granted';
}

/** Cancels every pending StudySync notification and reschedules from the current tasks/settings. */
export async function syncNotifications(tasks: Task[], settings: AppSettings): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
  }

  if (!settings.notificationsEnabled) return;
  const granted = await ensurePermission();
  if (!granted) return;

  const now = Date.now();
  const toSchedule: Parameters<typeof LocalNotifications.schedule>[0]['notifications'] = [];

  for (const t of tasks) {
    if (t.completed || t.dueAt === null) continue;
    const triggerAt = t.dueAt - settings.dueReminderHours * 3600000;
    if (triggerAt <= now) continue;
    toSchedule.push({
      id: hashId(t.id),
      title: 'もうすぐ期限です',
      body: settings.dueReminderHours > 0
        ? `「${t.title}」の期限まであと${settings.dueReminderHours}時間です`
        : `「${t.title}」の期限になりました`,
      schedule: { at: new Date(triggerAt) },
    });
  }

  if (settings.dailyReminderEnabled) {
    const [h, m] = settings.dailyReminderTime.split(':').map(Number);
    toSchedule.push({
      id: DAILY_REMINDER_ID,
      title: '今日の学習はいかがですか？',
      body: '今日のタスクを確認して、学習を始めましょう',
      schedule: { on: { hour: h, minute: m }, repeats: true, allowWhileIdle: true },
    });
  }

  if (toSchedule.length) {
    await LocalNotifications.schedule({ notifications: toSchedule });
  }
}
