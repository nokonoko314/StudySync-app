export type ThemeMode = 'light' | 'dark' | 'system';

export interface Subject {
  id: string;
  name: string;
  color: string; // hex
  archived: boolean;
  createdAt: number;
}

export interface GroupProject {
  id: string;
  name: string;
  color: string;
  icon: 'check' | 'book';
  startDate: string | null; // yyyy-mm-dd
  endDate: string | null;
  archived: boolean;
  createdAt: number;
}

export interface StudySession {
  id: string;
  taskId: string | null;
  subjectId: string | null;
  title: string;
  startedAt: number; // epoch ms
  endedAt: number; // epoch ms
  pausedMs: number; // total time spent paused between startedAt and endedAt, excluded from the studied duration
}

export interface Task {
  id: string;
  title: string;
  subjectId: string | null;
  projectId: string | null;
  dueAt: number | null; // epoch ms, null = no deadline
  completed: boolean;
  completedAt: number | null;
  createdAt: number;
  order: number; // manual sort key, lower = earlier in list
  isReview: boolean;
  reviewParentId: string | null;
  reviewStage: number; // index into review interval list, -1 for non-review tasks
  reviewEnabled: boolean; // whether completing this task auto-schedules the next review
  reviewIntervalsDays: number[] | null; // per-task override; null = use app default
  generatedReviewTaskId: string | null; // id of the review task auto-created by completing this task, if any

  // --- schema v2: timeline scheduling (mockup ホームのタイムライン) ---
  scheduledStart: number | null; // epoch ms on the day timeline; null = 未設定プール
  plannedMinutes: number;
  completedWithoutTracking: boolean; // スワイプ等で計測せずに完了
  carriedFrom: string | null; // yyyy-mm-dd, set when an unfinished task was carried over to the next day
  // --- schema v2: forgetting-curve pacing ---
  reviewPreset: ReviewPreset | null; // null = settings.defaultReviewPreset; ignored when reviewIntervalsDays is set
  reviewBaseAt: number | null; // completion time of the original task; review due dates are counted from here
}

export type ReviewPreset = 'standard' | 'cram' | 'long' | 'exam';
export type ReviewRating = 'again' | 'good' | 'easy';

export interface GoogleCalendarSettings {
  syncOn: boolean;
  calendarIds: string[]; // calendars to show; empty = all visible calendars
  exportOn: boolean; // write scheduled tasks to a "StudySync" calendar
  frequency: 'open' | '15min' | 'manual';
  lastSyncAt: number | null;
}

export type TimerStyle = 'ring' | 'digital' | 'minimal';

export type WallpaperMode = 'default' | 'color' | 'photo';
export interface WallpaperSettings {
  mode: WallpaperMode;
  color: string; // used when mode === 'color'
  photoDataUrl: string | null; // used when mode === 'photo'
}

export interface AppSettings {
  themeMode: ThemeMode;
  accentColor: string;
  weeklyGoalMinutes: number;
  notificationsEnabled: boolean;
  dueReminderHours: number; // notify this many hours before a task's due time (0 = at the due time)
  dailyReminderEnabled: boolean; // whether to send a daily study reminder
  dailyReminderTime: string; // "HH:mm", time of day for the daily study reminder
  reviewIntervalsDays: number[]; // e.g. [1,3,7,14,30]
  navOrder: string[];
  timerStyle: TimerStyle;
  defaultDueTime: string; // "HH:mm", applied to any due date picked without a custom time
  defaultReviewEnabled: boolean; // initial value for new tasks' auto-review toggle
  wallpaper: WallpaperSettings;
  customColors: string[]; // user-picked colors, shared across every color picker in the app
  hiddenColors: string[]; // built-in preset colors the user has removed (also shared globally)

  // --- schema v2 ---
  defaultPlannedMinutes: number;
  notifyLeadMinutes: number; // お知らせ before a scheduled task starts
  carryOverEnabled: boolean;
  timelineTickMinutes: 15 | 30 | 60;
  defaultReviewPreset: ReviewPreset;
  fontScale: 0.875 | 1 | 1.125 | 1.25;
  durationUseHourMinute: boolean; // true: 1時間10分 / false: 70分
  timerAmoledMode: boolean;
  calendarScale: 0.9 | 1 | 1.15;
  googleCalendar: GoogleCalendarSettings;
}

export const SCHEMA_VERSION = 2;

export interface AppData {
  schemaVersion?: number; // missing on data saved before v2
  subjects: Subject[];
  projects: GroupProject[];
  tasks: Task[];
  sessions: StudySession[];
  settings: AppSettings;
}

// A systematic 24-step hue wheel (15° apart, fixed saturation/lightness) — not a random pick,
// and no two entries can end up alike since every hue is evenly spaced from its neighbors.
export const DEFAULT_SUBJECT_COLORS = [
  '#C34B4B', '#C3694B', '#C3874B', '#C3A54B', '#C3C34B', '#A5C34B',
  '#87C34B', '#69C34B', '#4BC34B', '#4BC369', '#4BC387', '#4BC3A5',
  '#4BC3C3', '#4BA5C3', '#4B87C3', '#4B69C3', '#4B4BC3', '#694BC3',
  '#874BC3', '#A54BC3', '#C34BC3', '#C34BA5', '#C34B87', '#C34B69',
];

export const MAX_CUSTOM_COLORS = 16;

export const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'light',
  accentColor: '#2F6FED',
  weeklyGoalMinutes: 600,
  notificationsEnabled: true,
  dueReminderHours: 3,
  dailyReminderEnabled: false,
  dailyReminderTime: '20:00',
  reviewIntervalsDays: [1, 3, 7, 14, 30],
  navOrder: ['home', 'calendar', 'timeline', 'stats', 'settings'],
  timerStyle: 'ring',
  defaultDueTime: '18:00',
  defaultReviewEnabled: true,
  wallpaper: { mode: 'default', color: '#FBF6EF', photoDataUrl: null },
  customColors: [],
  hiddenColors: [],
  defaultPlannedMinutes: 50,
  notifyLeadMinutes: 5,
  carryOverEnabled: true,
  timelineTickMinutes: 60,
  defaultReviewPreset: 'standard',
  fontScale: 1,
  durationUseHourMinute: true,
  timerAmoledMode: false,
  calendarScale: 1,
  googleCalendar: { syncOn: false, calendarIds: [], exportOn: false, frequency: 'open', lastSyncAt: null },
};
