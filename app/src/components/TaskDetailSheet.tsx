import { useEffect, useMemo, useState } from 'react';
import { BottomSheet, AppAlert, useToast } from './Overlay';
import { useAppState } from '../state/AppStateContext';
import type { Task } from '../state/types';
import { ReviewIntervalEditor } from './ReviewIntervalEditor';
import { sessionDurationMs } from '../lib/stats';
import { formatDuration } from '../lib/format';

function toDateInput(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function toTimeInput(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function TaskDetailSheet({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const { data, deleteTask, restoreTask, toggleTask, updateTask } = useAppState();
  const { showToast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [intervalsOpen, setIntervalsOpen] = useState(false);
  const activeSubjects = data.subjects.filter((s) => !s.archived);
  const activeProjects = data.projects.filter((p) => !p.archived);

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [hasDue, setHasDue] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [reviewEnabled, setReviewEnabled] = useState(true);
  const [customIntervals, setCustomIntervals] = useState<number[] | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setSubjectId(task.subjectId);
      setProjectId(task.projectId);
      setHasDue(task.dueAt !== null);
      setDueDate(task.dueAt ? toDateInput(task.dueAt) : toDateInput(Date.now()));
      setReviewEnabled(task.reviewEnabled);
      setCustomIntervals(task.reviewIntervalsDays);
    }
  }, [task]);

  const totalMs = useMemo(() => {
    if (!task) return 0;
    return data.sessions
      .filter((s) => s.taskId === task.id)
      .reduce((sum, s) => sum + sessionDurationMs(s), 0);
  }, [task, data.sessions]);

  if (!task) return null;
  const effectiveIntervals = customIntervals ?? data.settings.reviewIntervalsDays;
  const existingTime = task.dueAt ? toTimeInput(task.dueAt) : null;
  const dueDateUnchanged = task.dueAt !== null && dueDate === toDateInput(task.dueAt);
  const appliedTime = dueDateUnchanged && existingTime ? existingTime : data.settings.defaultDueTime;

  const save = () => {
    let dueAt: number | null = null;
    if (hasDue && dueDate) {
      const [h, m] = appliedTime.split(':').map(Number);
      const d = new Date(dueDate);
      d.setHours(h || 0, m || 0, 0, 0);
      dueAt = d.getTime();
    }
    updateTask(task.id, {
      title: title.trim() || task.title,
      subjectId,
      projectId,
      dueAt,
      reviewEnabled,
      reviewIntervalsDays: customIntervals,
    });
    showToast('タスクを更新しました');
    onClose();
  };

  return (
    <>
      <BottomSheet open={!!task} onClose={onClose} title="タスクを編集" confirmLabel="保存" onConfirm={save}>
        <div className="field-label">タイトル</div>
        <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} />

        {totalMs > 0 && (
          <p style={{ fontSize: 12.5, color: 'var(--ink-faint)', margin: '10px 2px 0' }}>
            計測した合計時間: {formatDuration(totalMs)}
          </p>
        )}

        <div className="field-label">教科</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {activeSubjects.map((s) => (
            <button
              key={s.id}
              className={`filter-chip${subjectId === s.id ? ' active' : ''}`}
              style={subjectId === s.id ? { background: s.color, color: '#fff' } : undefined}
              onClick={() => setSubjectId(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>

        {activeProjects.length > 0 && (
          <>
            <div className="field-label">プロジェクト</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                className={`filter-chip${projectId === null ? ' active' : ''}`}
                onClick={() => setProjectId(null)}
              >
                なし
              </button>
              {activeProjects.map((p) => (
                <button
                  key={p.id}
                  className={`filter-chip${projectId === p.id ? ' active' : ''}`}
                  style={projectId === p.id ? { background: p.color, color: '#fff' } : undefined}
                  onClick={() => setProjectId(p.id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="field-label">期限</div>
        <button className="row" style={{ borderRadius: 14, background: 'var(--surface2)', border: 'none' }} onClick={() => setHasDue((v) => !v)}>
          <span className="row-label">期限を設定する</span>
          <div className={`switch${hasDue ? ' on' : ''}`} />
        </button>
        {hasDue && (
          <div style={{ marginTop: 8 }}>
            <input type="date" className="field" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <p style={{ fontSize: 11, color: 'var(--ink-faint)', margin: '8px 2px 0' }}>
              時刻は{dueDateUnchanged && existingTime ? `この予定の時刻(${existingTime})` : `設定の既定値(${data.settings.defaultDueTime})`}が使われます
            </p>
          </div>
        )}

        <div className="field-label">忘却曲線での自動復習</div>
        <button className="row" style={{ borderRadius: 14, background: 'var(--surface2)', border: 'none' }} onClick={() => setReviewEnabled((v) => !v)}>
          <span className="row-label">完了時に復習タスクを自動追加</span>
          <div className={`switch${reviewEnabled ? ' on' : ''}`} />
        </button>
        {reviewEnabled && (
          <button
            className="row"
            style={{ borderRadius: 14, background: 'var(--surface2)', border: 'none', marginTop: 8 }}
            onClick={() => setIntervalsOpen(true)}
          >
            <span className="row-label">復習間隔</span>
            <span className="row-value" style={{ maxWidth: 160 }}>{effectiveIntervals.join(', ')}日{customIntervals ? '(このタスクのみ)' : ''}</span>
            <div className="chevron" />
          </button>
        )}
        {task.isReview && (
          <p style={{ fontSize: 11.5, color: 'var(--ink-faint)', margin: '10px 2px 0', lineHeight: 1.7 }}>
            忘却曲線にもとづく復習タスクです（第{task.reviewStage + 1}段階）。
          </p>
        )}

        <button
          className="pillbtn"
          style={{ background: task.completed ? 'var(--surface2)' : undefined, color: task.completed ? 'var(--ink)' : undefined }}
          onClick={() => { toggleTask(task.id); onClose(); }}
        >
          {task.completed ? '未完了に戻す' : '完了にする'}
        </button>
        <button
          className="pillbtn"
          style={{ background: 'var(--coral-soft)', color: 'var(--coral)', boxShadow: 'none', marginTop: 10 }}
          onClick={() => setConfirmDelete(true)}
        >
          削除する
        </button>
      </BottomSheet>

      <BottomSheet
        open={intervalsOpen}
        onClose={() => setIntervalsOpen(false)}
        title="復習間隔"
        confirmLabel="完了"
        onConfirm={() => setIntervalsOpen(false)}
      >
        <div className="field-label">このタスクの復習間隔</div>
        <ReviewIntervalEditor days={effectiveIntervals} onChange={(days) => setCustomIntervals(days)} />
        {customIntervals && (
          <button
            className="pillbtn"
            style={{ background: 'var(--surface2)', color: 'var(--ink)', boxShadow: 'none', marginTop: 10 }}
            onClick={() => setCustomIntervals(null)}
          >
            既定の間隔に戻す
          </button>
        )}
      </BottomSheet>

      <AppAlert
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="このタスクを削除しますか？"
        message="タスクとその学習記録（タイムライン・統計の記録）も削除されます。この操作は取り消せません。"
        confirmLabel="削除する"
        onConfirm={() => {
          const removed = task;
          const removedSessions = data.sessions.filter((s) => s.taskId === task.id);
          deleteTask(task.id);
          showToast('タスクを削除しました', () => restoreTask(removed, removedSessions));
          onClose();
        }}
      />
    </>
  );
}
