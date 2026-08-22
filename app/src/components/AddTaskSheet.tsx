import { useEffect, useState } from 'react';
import { BottomSheet } from './Overlay';
import { useAppState } from '../state/AppStateContext';
import { ReviewIntervalEditor } from './ReviewIntervalEditor';

export function AddTaskSheet({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const { data, addTask } = useAppState();
  const activeSubjects = data.subjects.filter((s) => !s.archived);
  const activeProjects = data.projects.filter((p) => !p.archived);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [hasDue, setHasDue] = useState(true);
  const [dueDate, setDueDate] = useState('');
  const [reviewEnabled, setReviewEnabled] = useState(true);
  const [intervalsOpen, setIntervalsOpen] = useState(false);
  const [customIntervals, setCustomIntervals] = useState<number[] | null>(null);

  useEffect(() => {
    if (open) {
      setTitle('');
      setSubjectId(activeSubjects[0]?.id ?? null);
      setProjectId(null);
      const d = new Date();
      setDueDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      setHasDue(true);
      setReviewEnabled(data.settings.defaultReviewEnabled);
      setCustomIntervals(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const canSubmit = title.trim().length > 0;
  const effectiveIntervals = customIntervals ?? data.settings.reviewIntervalsDays;

  const submit = () => {
    if (!canSubmit) return;
    let dueAt: number | null = null;
    if (hasDue && dueDate) {
      const [h, m] = data.settings.defaultDueTime.split(':').map(Number);
      const d = new Date(dueDate);
      d.setHours(h || 0, m || 0, 0, 0);
      dueAt = d.getTime();
    }
    addTask({ title: title.trim(), subjectId, projectId, dueAt, reviewEnabled, reviewIntervalsDays: customIntervals });
    onDone();
  };

  return (
    <>
      <BottomSheet open={open} onClose={onClose} title="新しいタスク" confirmLabel="完了" onConfirm={submit} confirmDisabled={!canSubmit}>
        <div className="field-label">タイトル</div>
        <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タスク名を入力" />

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
          {activeSubjects.length === 0 && <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>設定→教科ドロワーから追加できます</span>}
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
              時刻は設定の既定値({data.settings.defaultDueTime})が使われます
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

        <button className="pillbtn" onClick={submit} disabled={!canSubmit}>タスクを追加</button>
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
    </>
  );
}
