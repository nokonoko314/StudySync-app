import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppState } from '../state/AppStateContext';
import { addDays, formatDateJa, formatDuration, isSameDay, startOfDay } from '../lib/format';
import { sessionDurationMs, sessionsOnDay, totalMs } from '../lib/stats';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/Icons';
import { SessionEditSheet } from '../components/SessionEditSheet';
import type { StudySession } from '../state/types';

const DT_HOUR_PX = 40;

export function TimelineScreen() {
  const { data } = useAppState();
  const [day, setDay] = useState(() => startOfDay(new Date()));
  const [editSession, setEditSession] = useState<StudySession | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef(false);

  useEffect(() => {
    const delay = 60000 - (Date.now() % 60000);
    let interval: number;
    const timeout = window.setTimeout(() => {
      setNowMs(Date.now());
      interval = window.setInterval(() => setNowMs(Date.now()), 60000);
    }, delay);
    return () => { window.clearTimeout(timeout); window.clearInterval(interval); };
  }, []);

  const today = startOfDay(new Date());
  const isToday = isSameDay(day, today);

  useEffect(() => {
    if (scrolledRef.current) return;
    if (!isToday) return;
    const scroller = scrollRef.current;
    const el = timelineRef.current;
    if (!scroller || !el) return;
    const now = new Date();
    const targetTop = (now.getHours() * 60 + now.getMinutes()) / 60 * DT_HOUR_PX;
    requestAnimationFrame(() => {
      scroller.scrollTo({ top: Math.max(el.offsetTop + targetTop - 220, 0), behavior: 'smooth' });
    });
    scrolledRef.current = true;
  }, [isToday]);

  const sessions = useMemo(() => sessionsOnDay(data.sessions, day), [data.sessions, day]);
  const dayTotalMs = totalMs(sessions);
  const firstStart = sessions.length > 0 ? new Date(Math.min(...sessions.map((s) => s.startedAt))) : null;

  const now = new Date(nowMs);
  const nowTop = (now.getHours() * 60 + now.getMinutes()) / 60 * DT_HOUR_PX;
  const nowLabel = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <div className="content">
      <div className="scroll" style={{ paddingBottom: 120 }} ref={scrollRef}>
        <div className="subhero">
          <div className="hero-glow"><span className="g1" /><span className="g2" /><span className="g3" /></div>
          <div className="subhero-row">
            <div>
              <p className="eyebrow" style={{ position: 'relative', zIndex: 1 }}>1日の記録</p>
              <p className="subhero-title">タイムライン</p>
            </div>
          </div>
          <div className="month-switch">
            <button aria-label="前の日" onClick={() => setDay(addDays(day, -1))}><ChevronLeftIcon /></button>
            <span className="m-label">{formatDateJa(day)}{isToday ? '・今日' : ''}</span>
            <button aria-label="次の日" onClick={() => setDay(addDays(day, 1))}><ChevronRightIcon /></button>
          </div>
        </div>

        <div className="stat-strip">
          <span className="ss-item"><b>{formatDuration(dayTotalMs)}</b>合計</span>
          <span className="ss-sep" />
          <span className="ss-item"><b>{sessions.length}件</b>セッション</span>
          <span className="ss-sep" />
          <span className="ss-item"><b>{firstStart ? `${String(firstStart.getHours()).padStart(2, '0')}:${String(firstStart.getMinutes()).padStart(2, '0')}` : '--:--'}</b>開始</span>
        </div>

        <div className="chart-card day-timeline-card">
          <div className="chart-card-head" style={{ padding: '0 4px' }}>
            <span className="t">タイムライン</span>
            {isToday && <span className="v"><span className="live-dot" />現在 {nowLabel}</span>}
          </div>
          <div className="day-timeline" ref={timelineRef}>
            <div className="dt-hours">
              {Array.from({ length: 24 }, (_, h) => (
                <div className="dt-hour-row" key={h} style={{ top: h * DT_HOUR_PX }}>
                  <span className="dt-hour-label">{String(h).padStart(2, '0')}:00</span>
                </div>
              ))}
            </div>
            <div className="dt-sessions">
              {sessions.map((s) => {
                const subj = data.subjects.find((sub) => sub.id === s.subjectId);
                const dayStartMs = startOfDay(new Date(s.startedAt)).getTime();
                const dayEndMs = dayStartMs + 86400000;
                const clampedStart = Math.max(s.startedAt, dayStartMs);
                const clampedEnd = Math.min(s.endedAt, dayEndMs);
                // Fractional minutes (not just getHours()/getMinutes()) so the bar's position and
                // length reflect the actual second-level start/end instead of snapping to the minute.
                const startMinF = (clampedStart - dayStartMs) / 60000;
                const endMinF = (clampedEnd - dayStartMs) / 60000;
                const top = (startMinF / 60) * DT_HOUR_PX;
                const height = Math.max(((endMinF - startMinF) / 60) * DT_HOUR_PX, 8);
                // The bar's on-clock span (start to end) can include paused time, so the label
                // shows the actual studied duration — the same number used in stats/totals.
                const studiedMs = sessionDurationMs(s);
                const showContent = height >= 16;
                return (
                  <button
                    key={s.id}
                    className="dt-session"
                    style={{ top, height, background: subj?.color ?? '#2F6FED' }}
                    onClick={() => setEditSession(s)}
                    aria-label={`${s.title}・${formatDuration(studiedMs)}`}
                  >
                    {showContent && (
                      <>
                        <span className="dt-s-title">{s.title}</span>
                        <span className="dt-s-time">{formatDuration(studiedMs)}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
            {isToday && (
              <div className="dt-now-line" style={{ top: nowTop }}>
                <span className="dt-now-dot" />
                <span className="dt-now-time">{nowLabel}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <SessionEditSheet session={editSession} onClose={() => setEditSession(null)} />
    </div>
  );
}
