import { useEffect, useState } from 'react';
import { BottomSheet, AppAlert, useToast } from './Overlay';
import { useAppState } from '../state/AppStateContext';
import { DEFAULT_SUBJECT_COLORS } from '../state/types';
import type { Subject } from '../state/types';
import { ColorPickerField } from './ColorPickerField';

export function SubjectDetailSheet({ subject, onClose }: { subject: Subject | null; onClose: () => void }) {
  const { data, updateSubject, archiveSubject, unarchiveSubject, deleteSubject, restoreSubject } = useAppState();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_SUBJECT_COLORS[0]);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (subject) {
      setName(subject.name);
      setColor(subject.color);
    }
  }, [subject]);

  if (!subject) return null;

  const taskCount = data.tasks.filter((t) => t.subjectId === subject.id).length;
  const canSave = name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    updateSubject(subject.id, { name: name.trim(), color });
    showToast('教科を更新しました');
    onClose();
  };

  return (
    <>
      <BottomSheet open={!!subject} onClose={onClose} title="教科を編集" confirmLabel="保存" onConfirm={save} confirmDisabled={!canSave}>
        <div className="field-label">教科名</div>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} />

        <div className="field-label">カラー</div>
        <ColorPickerField value={color} onChange={setColor} presets={DEFAULT_SUBJECT_COLORS} />

        <p style={{ fontSize: 11.5, color: 'var(--ink-faint)', margin: '14px 2px 0', lineHeight: 1.7 }}>
          紐づくタスク {taskCount}件
        </p>

        {subject.archived ? (
          <button
            className="pillbtn"
            style={{ background: 'var(--surface2)', color: 'var(--ink)', boxShadow: 'none', marginTop: 16 }}
            onClick={() => { unarchiveSubject(subject.id); showToast('教科を一覧に戻しました'); onClose(); }}
          >
            アーカイブから戻す
          </button>
        ) : (
          <button
            className="pillbtn"
            style={{ background: 'var(--coral-soft)', color: 'var(--coral)', boxShadow: 'none', marginTop: 16 }}
            onClick={() => setConfirmArchive(true)}
          >
            教科をアーカイブ
          </button>
        )}
        <button
          className="pillbtn"
          style={{ background: 'var(--coral-soft)', color: 'var(--coral)', boxShadow: 'none', marginTop: 10 }}
          onClick={() => setConfirmDelete(true)}
        >
          教科を削除する
        </button>
      </BottomSheet>
      <AppAlert
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        title="この教科をアーカイブしますか？"
        message="一覧や新規タスクの候補から外れますが、紐づくタスク・学習記録はすべて保持されます。"
        confirmLabel="アーカイブする"
        onConfirm={() => { archiveSubject(subject.id); showToast('教科をアーカイブしました'); onClose(); }}
      />
      <AppAlert
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="この教科を削除しますか？"
        message="紐づくタスクは削除されず「教科なし」になります。学習記録も保持されます。この操作は取り消せません。"
        confirmLabel="削除する"
        onConfirm={() => {
          const removed = subject;
          const taskIds = data.tasks.filter((t) => t.subjectId === subject.id).map((t) => t.id);
          deleteSubject(subject.id);
          showToast('教科を削除しました', () => restoreSubject(removed, taskIds));
          onClose();
        }}
      />
    </>
  );
}
