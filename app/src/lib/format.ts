export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土'];

export function formatDateJa(d: Date): string {
  return `${d.getMonth() + 1}月${d.getDate()}日(${WEEKDAYS_JA[d.getDay()]})`;
}

export function formatMonthJa(d: Date): string {
  return `${d.getMonth() + 1}月`;
}

export function formatWeekRangeJa(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === end.getMonth();
  const startLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
  const endLabel = sameMonth ? `${end.getDate()}` : `${end.getMonth() + 1}/${end.getDate()}`;
  return `${startLabel} 〜 ${endLabel}`;
}

export function formatTimeHM(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

export function formatHoursShort(ms: number): string {
  const hours = ms / 3600000;
  return `${hours.toFixed(1)}h`;
}

export function relativeDueLabel(dueAt: number | null, now: number): { text: string; urgent: boolean } {
  if (dueAt === null) return { text: '期限なし', urgent: false };
  const diff = dueAt - now;
  const d = new Date(dueAt);
  const timeStr = formatTimeHM(d);
  if (diff < 0) return { text: `${timeStr} 期限切れ`, urgent: true };
  const hours = diff / 3600000;
  if (hours < 3) {
    const mins = Math.round(diff / 60000);
    const hh = Math.floor(mins / 60);
    const label = hh >= 1 ? `あと${hh}時間・${timeStr}まで` : `あと${mins}分・${timeStr}まで`;
    return { text: label, urgent: true };
  }
  return { text: `${timeStr} まで`, urgent: false };
}
