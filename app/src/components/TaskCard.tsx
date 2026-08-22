import { useRef, useState } from 'react';
import type { Subject, Task } from '../state/types';
import { hexToRgba, relativeDueLabel } from '../lib/format';
import { CheckIcon, RepeatIcon, TimerIcon, TrashIcon } from './Icons';

const SWIPE_THRESHOLD = 84;
const SWIPE_MAX = 132;
const MOVE_INTENT_PX = 8;

export function TaskCard({
  task, subject, onToggle, onOpenTimer, onOpenDetail, onDelete,
  selectionMode = false, selected = false, onSelectToggle,
}: {
  task: Task;
  subject: Subject | undefined;
  onToggle: () => void;
  onOpenTimer: () => void;
  onOpenDetail: () => void;
  onDelete?: () => void;
  selectionMode?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
}) {
  const color = subject?.color ?? '#2F6FED';
  const due = relativeDueLabel(task.dueAt, Date.now());

  const [dx, setDx] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const gestureRef = useRef<{ x: number; y: number; active: boolean; captured: number | null } | null>(null);

  const resolveGesture = (committed: 'complete' | 'delete' | null) => {
    setSwiping(false);
    setDx(0);
    if (committed === 'complete') onToggle();
    if (committed === 'delete' && onDelete) onDelete();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (selectionMode) return;
    if (e.button !== undefined && e.button !== 0) return;
    gestureRef.current = { x: e.clientX, y: e.clientY, active: false, captured: null };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (selectionMode) return;
    const g = gestureRef.current;
    if (!g) return;
    const deltaX = e.clientX - g.x;
    const deltaY = e.clientY - g.y;
    if (!g.active) {
      if (Math.abs(deltaY) > MOVE_INTENT_PX && Math.abs(deltaY) > Math.abs(deltaX)) {
        gestureRef.current = null;
        return;
      }
      if (Math.abs(deltaX) < MOVE_INTENT_PX) return;
      g.active = true;
      setSwiping(true);
      g.captured = e.pointerId;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    }
    e.preventDefault();
    const max = onDelete ? SWIPE_MAX : 0;
    const clamped = deltaX >= 0 ? Math.min(SWIPE_MAX, deltaX) : Math.max(-max, deltaX);
    setDx(clamped);
  };

  const endGesture = () => {
    if (selectionMode) return;
    const g = gestureRef.current;
    gestureRef.current = null;
    if (!g?.active) {
      setSwiping(false);
      setDx(0);
      return;
    }
    if (dx >= SWIPE_THRESHOLD) resolveGesture('complete');
    else if (onDelete && dx <= -SWIPE_THRESHOLD) resolveGesture('delete');
    else resolveGesture(null);
  };

  const swipeProgress = Math.min(1, Math.abs(dx) / SWIPE_THRESHOLD);

  return (
    <div className="task-swipe">
      {!selectionMode && dx !== 0 && (
        <div
          className={`task-swipe-bg${dx > 0 ? ' complete' : ' delete'}`}
          style={{ opacity: 0.35 + swipeProgress * 0.65, justifyContent: dx > 0 ? 'flex-start' : 'flex-end' }}
        >
          {dx > 0 ? (
            <span className="task-swipe-label"><CheckIcon size={15} /> {task.completed ? '未完了に戻す' : '完了にする'}</span>
          ) : (
            <span className="task-swipe-label"><TrashIcon size={15} color="#fff" /> 削除</span>
          )}
        </div>
      )}
      <div
        className={`card${task.completed ? ' done' : ''}${selected ? ' selected' : ''}`}
        style={{
          '--accent': color, '--accent-soft': hexToRgba(color, 0.14),
          transform: dx !== 0 ? `translateX(${dx}px)` : undefined,
          transition: swiping ? 'none' : 'transform .25s cubic-bezier(.2,.8,.3,1)',
          touchAction: 'pan-y',
        } as React.CSSProperties}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
      >
        <button
          className={`check${(selectionMode ? selected : task.completed) ? ' on' : ''}${selectionMode ? ' select' : ''}`}
          onClick={(e) => { e.stopPropagation(); selectionMode ? onSelectToggle?.() : onToggle(); }}
          aria-label={selectionMode ? (selected ? '選択を解除' : '選択する') : '完了にする'}
        >
          {(selectionMode ? selected : task.completed) && <CheckIcon />}
        </button>
        <button
          className="card-body"
          style={{ background: 'none', textAlign: 'left', padding: 0 }}
          onClick={selectionMode ? onSelectToggle : onOpenDetail}
        >
          <p className={`card-title${task.completed ? ' strike' : ''}`}>{task.title}{task.isReview ? '（復習）' : ''}</p>
          <div className="card-meta">
            {task.reviewEnabled && (
              <span className="review-badge" aria-label="忘却曲線での自動復習が有効なタスク" title="自動復習 ON">
                <RepeatIcon size={11} />
              </span>
            )}
            {subject && <span className="tag">{subject.name}</span>}
            {task.completed ? <span>完了</span> : (
              <span className={due.urgent ? 'due-soon' : undefined}>{due.text}</span>
            )}
          </div>
        </button>
        {!selectionMode && !task.completed && (
          <button className="timer-btn" onClick={(e) => { e.stopPropagation(); onOpenTimer(); }} aria-label="タイマーを開始">
            <TimerIcon color={color} />
          </button>
        )}
      </div>
    </div>
  );
}
