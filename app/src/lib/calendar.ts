import { addDays, startOfDay } from './format';

export interface DayCell {
  date: Date;
  inMonth: boolean;
}

export function getMonthMatrix(monthDate: Date): DayCell[][] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday=0
  const gridStart = addDays(firstOfMonth, -firstWeekday);

  const weeks: DayCell[][] = [];
  let cursor = startOfDay(gridStart);
  for (let w = 0; w < 6; w++) {
    const week: DayCell[] = [];
    for (let d = 0; d < 7; d++) {
      week.push({ date: cursor, inMonth: cursor.getMonth() === month });
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
    if (cursor > addDays(firstOfMonth, 40) && week[6].date.getMonth() !== month) break;
  }
  // trim trailing all-next-month weeks beyond the one needed
  while (weeks.length > 1 && weeks[weeks.length - 1].every((c) => !c.inMonth)) weeks.pop();
  return weeks;
}

export interface ProjectBand {
  projectId: string;
  colStart: number; // 1-7
  colSpan: number;
}

export function bandsForWeek(
  week: DayCell[],
  projects: { id: string; startDate: string | null; endDate: string | null }[]
): ProjectBand[] {
  const weekStart = startOfDay(week[0].date).getTime();
  const weekEnd = startOfDay(week[6].date).getTime();
  const bands: ProjectBand[] = [];
  for (const p of projects) {
    if (!p.startDate || !p.endDate) continue;
    const s = startOfDay(new Date(p.startDate)).getTime();
    const e = startOfDay(new Date(p.endDate)).getTime();
    if (e < weekStart || s > weekEnd) continue;
    const dayMs = 86400000;
    const startCol = Math.max(0, Math.round((s - weekStart) / dayMs));
    const endCol = Math.min(6, Math.round((e - weekStart) / dayMs));
    bands.push({ projectId: p.id, colStart: startCol + 1, colSpan: endCol - startCol + 1 });
  }
  return bands;
}
