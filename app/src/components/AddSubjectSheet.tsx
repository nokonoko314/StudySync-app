import { useEffect, useState } from 'react';
import { BottomSheet, useToast } from './Overlay';
import { useAppState } from '../state/AppStateContext';
import { DEFAULT_SUBJECT_COLORS } from '../state/types';
import { ColorPickerField } from './ColorPickerField';

export function AddSubjectSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addSubject } = useAppState();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_SUBJECT_COLORS[0]);

  useEffect(() => {
    if (open) {
      setName('');
      setColor(DEFAULT_SUBJECT_COLORS[0]);
    }
  }, [open]);

  const canSubmit = name.trim().length > 0;
  const submit = () => {
    if (!canSubmit) return;
    addSubject(name.trim(), color);
    showToast(`教科「${name.trim()}」を追加しました`);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="新しい教科" confirmLabel="完了" onConfirm={submit} confirmDisabled={!canSubmit}>
      <div className="field-label">教科名</div>
      <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="例: 生物" />

      <div className="field-label">カラー</div>
      <ColorPickerField value={color} onChange={setColor} presets={DEFAULT_SUBJECT_COLORS} />

      <button className="pillbtn" onClick={submit} disabled={!canSubmit}>教科を追加</button>
    </BottomSheet>
  );
}
