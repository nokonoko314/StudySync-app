import { useMemo, useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import { bandsForWeek, getMonthMatrix } from '../lib/calendar';
import { addDays, formatDateJa, formatDuration, formatHoursShort, formatMonthJa, formatWeekRangeJa, hexToRgba, isSameDay, startOfDay } from '../lib/format';
import { sessionDurationMs, sessionsOnDay, startOfWeek, totalMs, weeklyTotals } from '../lib/stats';
import { ChevronLeftIcon, ChevronRightIcon, MonthGridIcon, WeekListIcon, CheckIcon } from '../components/Icons';
import { TaskCard } from '../components/TaskCard';
import { TaskDetailSheet } from '../components/TaskDetailSheet';
import { useToast } from '../components/Overlay';
import type { Task } from '../state/types';
import { useTimer } from '../state/TimerContext';

export function CalendarScreen() {
  const { data, toggleTask, deleteTask, restoreTask } = useAppState();
  const { showToast } = useToast();
  const timer = useTimer();
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [mode, setMode] = useState<'month' | 'week'>('month');
  const [selectedDay, setSelectedDay] = useState<Date>(() => startOfDay(new Date()));
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const today = startOfDay(new Date());

  const weeks = useMemo(() => getMonthMatrix(cursor), [cursor]);
  // Archived projects keep their calendar band — archiving hides them from pickers/lists but never erases the record.
  const bandProjects = useMemo(() => data.projects.filter((p) => p.startDate && p.endDate), [data.projects]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of data.tasks) {
      if (t.dueAt === null) continue;
      const key = startOfDay(new Date(t.dueAt)).toDateString();
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return map;
  }, [data.tasks]);

  const studyMsByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of data.sessions) {
      const key = startOfDay(new Date(s.startedAt)).toDateString();
      map.set(key, (map.get(key) ?? 0) + sessionDurationMs(s));
    }
    return map;
  }, [data.sessions]);

  const realCurrentWeekStart = startOfWeek(new Date());
  const weekStart = mode === 'week' ? startOfWeek(cursor) : realCurrentWeekStart;
  const isRealCurrentWeek = isSameDay(weekStart, realCurrentWeekStart);
  const weekTotals = weeklyTotals(data.sessions, weekStart);
  const weekMs = weekTotals.reduce((a, b) => a + b, 0);
  const weeklyGoalMs = data.settings.weeklyGoalMinutes * 60000;
  const breakdownPeriodLabel = isRealCurrentWeek ? '今週' : formatWeekRangeJa(weekStart);

  const goPrev = () => setCursor(mode === 'month' ? new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1) : addDays(cursor, -7));
  const goNext = () => setCursor(mode === 'month' ? new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1) : addDays(cursor, 7));

  const selectedDayTasks = tasksByDay.get(selectedDay.toDateString()) ?? [];
  const selectedDayMs = totalMs(sessionsOnDay(data.sessions, selectedDay));

  return (
    <div className="content">
      <div className="scroll" style={{ paddingBottom: 120 }}>
        <div className="cal-header">
          <div className="cal-header-top">
            <div className="cal-header-left">
              <p className="cal-header-title">{mode === 'week' ? formatWeekRangeJa(weekStart) : formatMonthJa(cursor)}</p>
              <span className="cal-sync-pill">外部カレンダー未連携</span>
            </div>
            <div className="cal-header-actions">
              <button className="ct-nav" aria-label={mode === 'week' ? '前の週' : '前の月'} onClick={goPrev}><ChevronLeftIcon /></button>
              <button className="ct-nav" aria-label={mode === 'week' ? '次の週' : '次の月'} onClick={goNext}><ChevronRightIcon /></button>
              <div className="ct-mode">
                <button className={`cal-mode-btn${mode === 'month' ? ' active' : ''}`} onClick={() => setMode('month')} aria-label="月表示"><MonthGridIcon /></button>
                <button className={`cal-mode-btn${mode === 'week' ? ' active' : ''}`} onClick={() => setMode('week')} aria-label="週表示"><WeekListIcon /></button>
              </div>
            </div>
          </div>
        </div>

        {mode === 'month' ? (
          <div>
            <div className="cal-legend">
              <span className="cal-legend-item"><i className="cal-legend-swatch task"><CheckIcon size={8} /></i>タスク</span>
              <span className="cal-legend-item"><i className="cal-legend-swatch event" />予定</span>
              <span className="cal-legend-item"><i className="cal-legend-swatch project" />プロジェクト</span>
            </div>
            <div className="cal-full">
              <div className="cal-weekdays-full">
                {['月', '火', '水', '木', '金', '土', '日'].map((d) => <span key={d}>{d}</span>)}
              </div>
              {weeks.map((week, wi) => {
                const bands = bandsForWeek(week, bandProjects);
                return (
                  <div className="cal-week-row" key={wi}>
                    {week.map((cell, ci) => {
                      const isSelected = isSameDay(cell.date, selectedDay);
                      return (
                        <button
                          key={ci}
                          className="cal-cell-hit"
                          style={{ '--col-start': ci + 1, '--col-span': 1 } as React.CSSProperties}
                          aria-label={`${cell.date.getMonth() + 1}月${cell.date.getDate()}日を選択`}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedDay(cell.date)}
                        />
                      );
                    })}
                    {week.map((cell, ci) => {
                      const isToday = isSameDay(cell.date, today);
                      const isSelected = isSameDay(cell.date, selectedDay);
                      return (
                        <span
                          key={ci}
                          className={`cal-daynum${!cell.inMonth ? ' muted' : ''}${isToday ? ' today' : ''}${isSelected && !isToday ? ' selected' : ''}`}
                          style={{ gridColumn: ci + 1 }}
                        >
                          {cell.date.getDate()}
                        </span>
                      );
                    })}
                    {week.map((cell, ci) => {
                      const ms = studyMsByDay.get(cell.date.toDateString()) ?? 0;
                      if (ms <= 0) return null;
                      return (
                        <span key={`ms-${ci}`} className="cal-day-time" style={{ gridColumn: ci + 1 }}>
                          {formatHoursShort(ms)}
                        </span>
                      );
                    })}
                    {bands.map((b) => {
                      const project = data.projects.find((p) => p.id === b.projectId)!;
                      return (
                        <div key={b.projectId}>
                          <div
                            className={`cal-project-band${project.archived ? ' archived' : ''}`}
                            style={{ '--col-start': b.colStart, '--col-span': b.colSpan, background: project.color } as React.CSSProperties}
                          />
                          <span
                            className="cal-project-label"
                            style={{ '--col-start': b.colStart, '--col-span': b.colSpan, color: project.archived ? 'var(--ink-faint)' : project.color } as React.CSSProperties}
                          >
                            {project.name}
                          </span>
                        </div>
                      );
                    })}
                    {week.map((cell, ci) => {
                      const tasks = tasksByDay.get(cell.date.toDateString()) ?? [];
                      const shown = tasks.slice(0, 2);
                      const extra = tasks.length - shown.length;
                      return (
                        <div key={`t-${ci}`} style={{ display: 'contents' }}>
                          {shown.map((t, ti) => {
                            const subj = data.subjects.find((s) => s.id === t.subjectId);
                            const color = subj?.color ?? '#2F6FED';
                            return (
                              <div
                                key={t.id}
                                className="cal-bar native"
                                style={{ gridColumn: `${ci + 1} / ${ci + 2}`, gridRow: 2 + ti, background: hexToRgba(color, 0.16), color }}
                              >
                                {t.title}
                              </div>
                            );
                          })}
                          {extra > 0 && (
                            <div
                              className="cal-more"
                              style={{ gridColumn: `${ci + 1} / ${ci + 2}`, gridRow: 2 + shown.length }}
                            >
                              +{extra} 件
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <p className="cal-hint" style={{ padding: '10px 20px 0' }}>
              塗りつぶし+チェックはタスク、輪郭のみは同期した予定、うすい色の帯はプロジェクトの期間です。日付右上の時間はその日の学習時間です。日付をタップすると下に一覧が表示されます
            </p>
          </div>
        ) : (
          <div className="week-strip">
            <p className="cal-hint" style={{ margin: '0 0 10px' }}>{breakdownPeriodLabel}の学習時間・タップで下に一覧が表示されます</p>
            <div className="week-days">
              {Array.from({ length: 7 }, (_, i) => {
                const day = addDays(weekStart, i);
                const ms = weekTotals[i];
                const maxWeekMs = Math.max(1, ...weekTotals);
                const pct = Math.round((ms / maxWeekMs) * 100);
                const isToday = isSameDay(day, today);
                const isSelected = isSameDay(day, selectedDay);
                const dayTaskCount = (tasksByDay.get(day.toDateString()) ?? []).length;
                return (
                  <button
                    key={i}
                    className={`week-day-row${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedDay(day)}
                  >
                    <div className="wd">
                      <span className="dow">{['月', '火', '水', '木', '金', '土', '日'][i]}</span>
                      <span className="dnum">{day.getDate()}</span>
                    </div>
                    <div className="track"><i style={{ width: `${pct}%`, background: isToday ? 'var(--grad-accent)' : 'var(--indigo)' }} /></div>
                    <span className="val">{ms > 0 ? `${(ms / 3600000).toFixed(1)}h` : '—'}</span>
                    {dayTaskCount > 0 && <span className="week-day-badge">{dayTaskCount}</span>}
                  </button>
                );
              })}
            </div>
            <div className="week-strip-foot">
              {isRealCurrentWeek ? (
                <>
                  <span className="lbl">今週の目標まで残り <b>{Math.max(0, ((weeklyGoalMs - weekMs) / 3600000)).toFixed(1)}h</b></span>
                  <span className="pill accent" style={{ padding: '5px 11px', fontSize: 10.5 }}>{Math.min(100, Math.round((weekMs / weeklyGoalMs) * 100) || 0)}%</span>
                </>
              ) : (
                <>
                  <span className="lbl">この週の合計 <b>{(weekMs / 3600000).toFixed(1)}h</b></span>
                  <span className="pill" style={{ padding: '5px 11px', fontSize: 10.5 }}>目標比 {Math.round((weekMs / weeklyGoalMs) * 100) || 0}%</span>
                </>
              )}
            </div>
          </div>
        )}

        <div className="chart-card day-panel">
          <div className="chart-card-head">
            <span className="t">{formatDateJa(selectedDay)}{isSameDay(selectedDay, today) ? '（今日）' : ''}</span>
            <span className="v">学習時間 {selectedDayMs > 0 ? formatDuration(selectedDayMs) : 'なし'}</span>
          </div>
          <div className="list" style={{ padding: 0, gap: 8 }}>
            {selectedDayTasks.length === 0 && <p style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>この日のタスクはありません</p>}
            {selectedDayTasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                subject={data.subjects.find((s) => s.id === t.subjectId)}
                onToggle={() => toggleTask(t.id)}
                onOpenTimer={() => timer.start(t)}
                onOpenDetail={() => setDetailTask(t)}
                onDelete={() => {
                  const removedSessions = data.sessions.filter((s) => s.taskId === t.id);
                  deleteTask(t.id);
                  showToast('タスクを削除しました', () => restoreTask(t, removedSessions));
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <TaskDetailSheet task={detailTask} onClose={() => setDetailTask(null)} />
    </div>
  );
}
