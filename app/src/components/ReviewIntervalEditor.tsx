import { useState } from 'react';
import { PlusIcon, CloseIcon } from './Icons';

export function ReviewIntervalEditor({
  days, onChange,
}: {
  days: number[];
  onChange: (days: number[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const addDay = () => {
    const n = Number(draft);
    if (!Number.isFinite(n) || n <= 0 || days.includes(n)) { setDraft(''); return; }
    onChange([...days, n].sort((a, b) => a - b));
    setDraft('');
  };

  const removeDay = (n: number) => {
    onChange(days.filter((d) => d !== n));
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {days.length === 0 && <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>間隔が設定されていません</span>}
        {days.map((d) => (
          <button
            key={d}
            className="filter-chip active"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => removeDay(d)}
          >
            {d}日後 <CloseIcon size={9} />
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <input
          type="number"
          min={1}
          className="field"
          placeholder="日数を追加(例: 21)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDay(); } }}
        />
        <button
          className="timer-btn"
          style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--indigo-soft)', color: 'var(--indigo)' }}
          onClick={addDay}
          aria-label="間隔を追加"
        >
          <PlusIcon size={18} />
        </button>
      </div>
      <p style={{ fontSize: 11, color: 'var(--ink-faint)', margin: '10px 2px 0', lineHeight: 1.7 }}>
        タスクを完了するたびに、この順番で次の復習タスクが自動的に追加されます。すべて消化すると復習は止まります。
      </p>
    </div>
  );
}
