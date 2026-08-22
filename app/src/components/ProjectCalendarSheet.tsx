import { useMemo } from 'react';
import { useOverlayBehavior } from './Overlay';
import { CloseIcon } from './Icons';
import { addDays, formatDuration, startOfDay } from '../lib/format';

interface DayCell {
  date: Date;
  inMonth: boolean;
}

function sundayFirstMonthMatrix(monthDate: Date): DayCell[][] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = firstOfMonth.getDay(); // 0 = Sunday
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
  }
  while (weeks.length > 1 && weeks[weeks.length - 1].every((c) => !c.inMonth)) weeks.pop();
  return weeks;
}

function formatYearMonthJa(d: Date): string {
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

export function ProjectCalendarSheet({
  open, onClose, projectName, msByDay, startDate, endDate,
}: {
  open: boolean;
  onClose: () => void;
  projectName: string;
  msByDay: Map<string, number>;
  startDate: string | null;
  endDate: string | null;
}) {
  const panelRef = useOverlayBehavior(open, onClose);

  const maxMs = Math.max(1, ...Array.from(msByDay.values()));

  const months = useMemo(() => {
    const dayKeys = Array.from(msByDay.keys()).map((k) => new Date(k).getTime());
    const from = startDate ? new Date(startDate) : new Date(dayKeys.length ? Math.min(...dayKeys) : Date.now());
    const to = endDate ? new Date(endDate) : new Date(dayKeys.length ? Math.max(...dayKeys) : Date.now());
    const list: Date[] = [];
    let cur = new Date(from.getFullYear(), from.getMonth(), 1);
    const last = new Date(to.getFullYear(), to.getMonth(), 1);
    while (cur <= last) {
      list.push(new Date(cur));
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
    return list;
  }, [startDate, endDate, msByDay]);

  return (
    <div className={`overlay${open ? ' show' : ''}`} aria-hidden={!open}>
      <div className="scrim" onClick={onClose} />
      <div className="sheet project-cal-sheet" role="dialog" aria-modal="true" ref={panelRef} tabIndex={-1}>
        <div className="sheet-grip" />
        <div className="sheet-head">
          <span className="project-cal-title">{projectName}</span>
          <button className="sheet-close-btn" aria-label="閉じる" onClick={onClose}><CloseIcon size={16} /></button>
        </div>
        <div className="sheet-body">
          <div className="field-label" style={{ marginTop: 0 }}>1日ごとの学習時間</div>
          <p style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '0 0 16px' }}>
            色が濃いほど、その日に長く勉強したことを表します
          </p>
          {months.length === 0 && (
            <p style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>学習記録がまだありません</p>
          )}
          {months.map((m) => (
            <div className="project-cal-month" key={m.toISOString()}>
              <p className="project-cal-month-title">{formatYearMonthJa(m)}</p>
              <div className="project-cal-weekdays">
                {['日', '月', '火', '水', '木', '金', '土'].map((d) => <span key={d}>{d}</span>)}
              </div>
              {sundayFirstMonthMatrix(m).map((week, wi) => (
                <div className="project-cal-row" key={wi}>
                  {week.map((cell, ci) => {
                    if (!cell.inMonth) return <div className="project-cal-cell empty" key={ci} />;
                    const ms = msByDay.get(cell.date.toDateString()) ?? 0;
                    const alpha = ms > 0 ? 0.16 + 0.84 * Math.min(1, ms / maxMs) : 0;
                    const useWhiteText = alpha > 0.45;
                    return (
                      <div
                        key={ci}
                        className={`project-cal-cell${ms > 0 ? ' has-time' : ''}`}
                        style={ms > 0 ? { background: `rgba(226,104,74,${alpha})`, color: useWhiteText ? '#fff' : 'var(--ink)' } : undefined}
                      >
                        <span className="pc-daynum">{cell.date.getDate()}</span>
                        {ms > 0 && <span className="pc-time">{formatDuration(ms)}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
