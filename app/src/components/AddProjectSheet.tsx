import { useEffect, useState } from 'react';
import { BottomSheet, useToast } from './Overlay';
import { useAppState } from '../state/AppStateContext';
import { ColorPickerField } from './ColorPickerField';
import { DEFAULT_SUBJECT_COLORS } from '../state/types';

function todayInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function AddProjectSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addProject } = useAppState();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2E7D9A');
  const [hasPeriod, setHasPeriod] = useState(true);
  const [startDate, setStartDate] = useState(todayInput());
  const [endDate, setEndDate] = useState(todayInput());

  useEffect(() => {
    if (open) {
      setName('');
      setColor('#2E7D9A');
      setHasPeriod(true);
      setStartDate(todayInput());
      setEndDate(todayInput());
    }
  }, [open]);

  const canSubmit = name.trim().length > 0 && (!hasPeriod || (startDate && endDate && startDate <= endDate));

  const submit = () => {
    if (!canSubmit) return;
    addProject({
      name: name.trim(),
      color,
      startDate: hasPeriod ? startDate : null,
      endDate: hasPeriod ? endDate : null,
    });
    showToast(`プロジェクト「${name.trim()}」を追加しました`);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="新しいプロジェクト" confirmLabel="完了" onConfirm={submit} confirmDisabled={!canSubmit}>
      <div className="field-label">プロジェクト名</div>
      <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="例: 期末試験" />

      <div className="field-label">カラー</div>
      <ColorPickerField value={color} onChange={setColor} presets={DEFAULT_SUBJECT_COLORS} />

      <div className="field-label">期間</div>
      <button className="row" style={{ borderRadius: 14, background: 'var(--surface2)', border: 'none' }} onClick={() => setHasPeriod((v) => !v)}>
        <span className="row-label">開始日・終了日を設定する</span>
        <div className={`switch${hasPeriod ? ' on' : ''}`} />
      </button>
      {hasPeriod ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input type="date" className="field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" className="field" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      ) : (
        <p style={{ fontSize: 11, color: 'var(--ink-faint)', margin: '8px 2px 0', lineHeight: 1.7 }}>
          期間を設定すると、カレンダーにその範囲が半透明の帯で表示されます。無期限のプロジェクトは帯を表示しません。
        </p>
      )}

      <button className="pillbtn" onClick={submit} disabled={!canSubmit}>プロジェクトを追加</button>
    </BottomSheet>
  );
}
