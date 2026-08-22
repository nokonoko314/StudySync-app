import { useMemo, useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import { addDays, formatWeekRangeJa, isSameDay, startOfDay } from '../lib/format';
import { currentStreakDays, startOfWeek, subjectBreakdown, weeklyTotals } from '../lib/stats';
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, FlameIcon } from '../components/Icons';

export function StatsScreen() {
  const { data } = useAppState();
  const now = new Date();
  const today = startOfDay(now);
  const [cursor, setCursor] = useState(today);

  const realCurrentWeekStart = startOfWeek(now);
  const weekStart = startOfWeek(cursor);
  const isCurrentWeek = isSameDay(weekStart, realCurrentWeekStart);
  const prevWeekStart = addDays(weekStart, -7);

  const totals = weeklyTotals(data.sessions, weekStart);
  const weekMs = totals.reduce((a, b) => a + b, 0);
  const prevTotals = weeklyTotals(data.sessions, prevWeekStart);
  const prevWeekMs = prevTotals.reduce((a, b) => a + b, 0);
  const deltaPct = prevWeekMs > 0 ? Math.round(((weekMs - prevWeekMs) / prevWeekMs) * 100) : null;

  const streak = currentStreakDays(data.sessions, now);
  const daysWithData = totals.filter((t) => t > 0).length || 1;
  const avgMs = weekMs / daysWithData;

  const maxTotal = Math.max(1, ...totals);
  const breakdown = useMemo(
    () => subjectBreakdown(
      data.sessions.filter((s) => new Date(s.startedAt) >= weekStart && new Date(s.startedAt) < addDays(weekStart, 7)),
      data.subjects.filter((s) => !s.archived)
    ),
    [data.sessions, data.subjects, weekStart]
  );
  const maxBreakdown = Math.max(1, ...breakdown.map((b) => b.ms));
  const topSubject = breakdown[0];

  const weekdayLabels = ['月', '火', '水', '木', '金', '土', '日'];
  const periodLabel = isCurrentWeek ? '今週' : formatWeekRangeJa(weekStart);

  return (
    <div className="content">
      <div className="scroll" style={{ paddingBottom: 120 }}>
        <div className="subhero">
          <div className="hero-glow"><span className="g1" /><span className="g2" /><span className="g3" /></div>
          <div className="subhero-row">
            <div>
              <p className="eyebrow" style={{ position: 'relative', zIndex: 1 }}>{periodLabel}のサマリー</p>
              <p className="subhero-title">統計</p>
            </div>
          </div>
          <div className="month-switch">
            <button aria-label="前の週" onClick={() => setCursor(addDays(cursor, -7))}><ChevronLeftIcon /></button>
            <span className="m-label">{formatWeekRangeJa(weekStart)}{isCurrentWeek ? '・今週' : ''}</span>
            <button aria-label="次の週" onClick={() => setCursor(addDays(cursor, 7))} disabled={isCurrentWeek} style={isCurrentWeek ? { opacity: .35 } : undefined}>
              <ChevronRightIcon />
            </button>
          </div>
        </div>

        <div className="stat-row">
          <div className="stat-tile">
            <div className="s-icon" style={{ background: 'var(--indigo)' }}><ClockIcon /></div>
            <span className="s-val">{(weekMs / 3600000).toFixed(1)}h</span>
            <span className="s-label">{isCurrentWeek ? '今週の合計' : 'この週の合計'}</span>
            {deltaPct !== null && (
              <span className="s-delta" style={deltaPct < 0 ? { color: 'var(--coral)' } : undefined}>
                {deltaPct >= 0 ? '▲' : '▼'} {Math.abs(deltaPct)}%(前週比)
              </span>
            )}
          </div>
          <div className="stat-tile">
            <div className="s-icon" style={{ background: 'var(--gold)' }}><FlameIcon size={14} /></div>
            <span className="s-val">{streak}日</span>
            <span className="s-label">連続学習</span>
          </div>
          <div className="stat-tile">
            <div className="s-icon" style={{ background: 'var(--sage)' }}><ClockIcon /></div>
            <span className="s-val">{Math.round(avgMs / 60000)}分</span>
            <span className="s-label">1日平均</span>
          </div>
        </div>

        {topSubject && (
          <p className="cal-hint" style={{ padding: '10px 20px 0', textAlign: 'center' }}>
            この期間いちばん学習したのは<b style={{ color: topSubject.color }}>{topSubject.name}</b>でした({(topSubject.ms / 3600000).toFixed(1)}h)
          </p>
        )}

        <div className="chart-card">
          <div className="chart-card-head"><span className="t">週間の学習時間</span><span className="v">目標 {(data.settings.weeklyGoalMinutes / 60).toFixed(0)}h/週</span></div>
          <div className="bar-chart">
            {totals.map((ms, i) => {
              const day = addDays(weekStart, i);
              const isToday = isSameDay(day, today);
              const heightPct = Math.max(2, Math.round((ms / maxTotal) * 100));
              return (
                <div className="bar-col" key={i}>
                  <div
                    className={`bar${isToday ? ' today' : ''}`}
                    style={{ height: `${heightPct}%` }}
                    title={`${day.getMonth() + 1}/${day.getDate()}(${weekdayLabels[i]})・${(ms / 3600000).toFixed(1)}h`}
                    role="img"
                    aria-label={`${day.getMonth() + 1}月${day.getDate()}日・${(ms / 3600000).toFixed(1)}時間`}
                  >
                    <i style={{ height: '100%' }} />
                  </div>
                  <span className="lbl">{weekdayLabels[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card-head"><span className="t">教科別の内訳</span><span className="v">{periodLabel}</span></div>
          <div className="subject-bars">
            {breakdown.length === 0 && <p style={{ fontSize: 12, color: 'var(--ink-faint)' }}>この期間の記録はまだありません</p>}
            {breakdown.map((b) => (
              <div className="subject-bar-row" key={b.id}>
                <span className="dot" style={{ background: b.color }} />
                <span className="name">{b.name}</span>
                <span className="track"><i style={{ width: `${(b.ms / maxBreakdown) * 100}%`, background: b.color }} /></span>
                <span className="val">{(b.ms / 3600000).toFixed(1)}h</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
