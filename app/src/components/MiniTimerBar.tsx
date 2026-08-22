import { useAppState } from '../state/AppStateContext';
import { useTimer } from '../state/TimerContext';
import { timeParts } from './TimerFocus';
import { PauseIcon, PlayIcon, StopIcon } from './Icons';

export function MiniTimerBar() {
  const { data } = useAppState();
  const timer = useTimer();
  const active = timer.active;
  if (!active || !active.minimized) return null;

  const subject = data.subjects.find((s) => s.id === active.task.subjectId);
  const color = subject?.color ?? '#2F6FED';
  const { label } = timeParts(timer.elapsedMs);

  return (
    <div
      className="mini-timer-bar"
      role="button"
      tabIndex={0}
      aria-label={`計測中のタイマーを開く: ${active.task.title}・${label}`}
      onClick={timer.expand}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); timer.expand(); } }}
      style={{ borderColor: color }}
    >
      <span className="mini-timer-dot" style={{ background: color }} aria-hidden="true" />
      <span className="mini-timer-title">{active.task.title}</span>
      <span className="mini-timer-time">{label}</span>
      <button
        className="mini-timer-btn"
        aria-label={timer.isPaused ? '再開' : '一時停止'}
        onClick={(e) => { e.stopPropagation(); timer.toggleRunning(); }}
      >
        {timer.isPaused ? <PlayIcon size={14} color="var(--ink)" /> : <PauseIcon size={14} color="var(--ink)" />}
      </button>
      <button
        className="mini-timer-btn"
        aria-label="終了して保存"
        onClick={(e) => { e.stopPropagation(); timer.finish(); }}
      >
        <StopIcon size={14} color="var(--ink)" />
      </button>
    </div>
  );
}
