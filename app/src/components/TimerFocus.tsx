import { useAppState } from '../state/AppStateContext';
import { useTimer } from '../state/TimerContext';
import { ChevronLeftIcon, PauseIcon, PlayIcon, StopIcon } from './Icons';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function timeParts(elapsedMs: number) {
  const totalSec = Math.max(0, Math.floor(elapsedMs / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return { h, m, s, label: h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}` };
}

export function TimerFocus() {
  const { data } = useAppState();
  const timer = useTimer();
  const active = timer.active;
  if (!active || active.minimized) return null;

  const subject = data.subjects.find((s) => s.id === active.task.subjectId);
  const color = subject?.color ?? '#2F6FED';
  const { label } = timeParts(timer.elapsedMs);
  const style = data.settings.timerStyle;

  return (
    <div className={`timer-focus timer-style-${style}`}>
      <div className="timer-focus-top">
        <button className="timer-focus-close" onClick={timer.minimize} aria-label="ミニ表示に戻す">
          <ChevronLeftIcon size={16} />
        </button>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--ink-faint)' }}>
          {timer.isPaused ? '一時停止中' : '計測中'}
        </span>
        <button
          onClick={timer.cancel}
          style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--coral)', padding: '8px 4px' }}
        >
          破棄
        </button>
      </div>

      <div className="timer-focus-body">
        {style === 'ring' && (
          <div
            className="timer-ring"
            style={{ boxShadow: `0 0 0 6px ${color}22, 0 20px 40px -20px ${color}55`, background: 'var(--surface)' }}
          >
            <span className="timer-ring-time">{label}</span>
          </div>
        )}
        {style === 'digital' && (
          <div className="timer-digital" style={{ color }}>
            <span className="timer-digital-time">{label}</span>
          </div>
        )}
        {style === 'minimal' && (
          <div className="timer-minimal">
            <span className="timer-minimal-dot" style={{ background: color }} />
            <span className="timer-minimal-time">{label}</span>
          </div>
        )}
        <div>
          <p className="timer-focus-title">{active.task.title}</p>
          {subject && <p className="timer-focus-sub">{subject.name}</p>}
        </div>
      </div>

      <div className="timer-controls">
        <button className="timer-btn-round secondary" onClick={timer.toggleRunning}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            {timer.isPaused ? <PlayIcon size={16} color="var(--ink)" /> : <PauseIcon size={16} color="var(--ink)" />}
            {timer.isPaused ? '再開' : '一時停止'}
          </span>
        </button>
        <button className="timer-btn-round primary" onClick={timer.finish}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <StopIcon size={16} />
            終了して保存
          </span>
        </button>
      </div>
    </div>
  );
}
