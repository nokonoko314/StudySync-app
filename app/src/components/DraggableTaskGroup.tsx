import { useEffect, useRef, useState } from 'react';
import type { Task } from '../state/types';
import { useAppState } from '../state/AppStateContext';
import { TaskCard } from './TaskCard';
import { useToast } from './Overlay';

export function DraggableTaskGroup({
  tasks, reorderable, onOpenTimer, onOpenDetail,
  selectionMode = false, selectedIds, onToggleSelect,
}: {
  tasks: Task[];
  reorderable: boolean;
  onOpenTimer: (task: Task) => void;
  onOpenDetail: (task: Task) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}) {
  const { data, toggleTask, deleteTask, restoreTask, reorderTasks } = useAppState();
  const { showToast } = useToast();
  const [order, setOrder] = useState<string[]>(tasks.map((t) => t.id));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string } | null>(null);

  useEffect(() => {
    setOrder(tasks.map((t) => t.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.map((t) => t.id).join(',')]);

  const taskById = new Map(tasks.map((t) => [t.id, t]));

  const cleanupListeners = () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerUp);
  };

  const handlePointerMove = (e: PointerEvent) => {
    const ds = dragRef.current;
    if (!ds) return;
    const container = containerRef.current;
    if (!container) return;
    const children = Array.from(container.querySelectorAll<HTMLElement>('[data-task-row]'));
    const idx = order.indexOf(ds.id);
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (e.clientY < mid && i < idx) {
        const next = order.slice();
        next.splice(idx, 1);
        next.splice(i, 0, ds.id);
        setOrder(next);
        break;
      }
      if (e.clientY > mid && i > idx) {
        const next = order.slice();
        next.splice(idx, 1);
        next.splice(i, 0, ds.id);
        setOrder(next);
        break;
      }
    }
  };

  const handlePointerUp = () => {
    const ds = dragRef.current;
    if (ds) {
      reorderTasks(order);
    }
    dragRef.current = null;
    setDraggingId(null);
    cleanupListeners();
  };

  const moveByKeyboard = (id: string, direction: -1 | 1) => {
    const idx = order.indexOf(id);
    const target = idx + direction;
    if (target < 0 || target >= order.length) return;
    const next = order.slice();
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrder(next);
    reorderTasks(next);
  };

  const handleKeyDown = (id: string, e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); moveByKeyboard(id, -1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); moveByKeyboard(id, 1); }
  };

  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    if (!reorderable) return;
    e.preventDefault();
    dragRef.current = { id };
    setDraggingId(id);
    if (navigator.vibrate) navigator.vibrate(10);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  return (
    <div ref={containerRef}>
      {order.map((id) => {
        const t = taskById.get(id);
        if (!t) return null;
        return (
          <div
            key={id}
            data-task-row
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              opacity: draggingId === id ? 0.6 : 1,
              transform: draggingId === id ? 'scale(1.02)' : undefined,
              transition: draggingId === id ? 'none' : 'opacity .15s ease',
              touchAction: reorderable ? 'none' : undefined,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <TaskCard
                task={t}
                subject={data.subjects.find((s) => s.id === t.subjectId)}
                onToggle={() => toggleTask(t.id)}
                onOpenTimer={() => onOpenTimer(t)}
                onOpenDetail={() => onOpenDetail(t)}
                onDelete={() => {
                  const removedSessions = data.sessions.filter((s) => s.taskId === t.id);
                  deleteTask(t.id);
                  showToast('タスクを削除しました', () => restoreTask(t, removedSessions));
                }}
                selectionMode={selectionMode}
                selected={selectedIds?.has(t.id) ?? false}
                onSelectToggle={() => onToggleSelect?.(t.id)}
              />
            </div>
            {reorderable && (
              <button
                className="drag-handle"
                aria-label={`「${t.title}」を並び替え。つかんでドラッグ、またはフォーカス中に上下キーで移動`}
                onPointerDown={(e) => handlePointerDown(id, e)}
                onKeyDown={(e) => handleKeyDown(id, e)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="8" cy="6" r="1.6" /><circle cx="16" cy="6" r="1.6" />
                  <circle cx="8" cy="12" r="1.6" /><circle cx="16" cy="12" r="1.6" />
                  <circle cx="8" cy="18" r="1.6" /><circle cx="16" cy="18" r="1.6" />
                </svg>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
