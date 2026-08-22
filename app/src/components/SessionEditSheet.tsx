import { useEffect, useState } from 'react';
import { BottomSheet, AppAlert, useToast } from './Overlay';
import { useAppState } from '../state/AppStateContext';
import type { StudySession } from '../state/types';

function toTimeInput(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function SessionEditSheet({ session, onClose }: { session: StudySession | null; onClose: () => void }) {
  const { data, updateSession, deleteSession, restoreSession } = useAppState();
  const { showToast } = useToast();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (session) {
      setStartTime(toTimeInput(session.startedAt));
      setEndTime(toTimeInput(session.endedAt));
    }
  }, [session]);

  if (!session) return null;
  const subject = data.subjects.find((s) => s.id === session.subjectId);

  const withTime = (base: number, time: string): number => {
    const [h, m] = time.split(':').map(Number);
    const d = new Date(base);
    d.setHours(h || 0, m || 0, 0, 0);
    return d.getTime();
  };

  const save = () => {
    let newStart = withTime(session.startedAt, startTime);
    let newEnd = withTime(session.endedAt, endTime);
    if (newEnd <= newStart) newEnd = newStart + 60000;
    updateSession(session.id, { startedAt: newStart, endedAt: newEnd, pausedMs: 0 });
    showToast('学習時間を修正しました');
    onClose();
  };

  return (
    <>
      <BottomSheet open={!!session} onClose={onClose} title="学習時間の修正" confirmLabel="保存" onConfirm={save}>
        <div className="field-label">内容</div>
        <div className="field">{session.title}{subject ? `・${subject.name}` : ''}</div>

        <div className="field-label">開始</div>
        <input type="time" className="field" value={startTime} onChange={(e) => setStartTime(e.target.value)} />

        <div className="field-label">終了</div>
        <input type="time" className="field" value={endTime} onChange={(e) => setEndTime(e.target.value)} />

        <button
          className="pillbtn"
          style={{ background: 'var(--coral-soft)', color: 'var(--coral)', boxShadow: 'none', marginTop: 16 }}
          onClick={() => setConfirmDelete(true)}
        >
          この記録を削除する
        </button>
      </BottomSheet>
      <AppAlert
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="この学習記録を削除しますか？"
        message="タイムライン・統計から、この記録が削除されます。"
        confirmLabel="削除する"
        onConfirm={() => {
          const removed = session;
          deleteSession(session.id);
          showToast('学習記録を削除しました', () => restoreSession(removed));
          onClose();
        }}
      />
    </>
  );
}
