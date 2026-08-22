import { useRef } from 'react';
import { useAppState } from '../state/AppStateContext';
import { useToast } from './Overlay';
import { PlusIcon } from './Icons';

const LONG_PRESS_MS = 500;
const ADD_DEBOUNCE_MS = 400;

export function ColorPickerField({
  value, onChange, presets, ariaLabelPrefix = 'カラーを',
}: {
  value: string;
  onChange: (color: string) => void;
  presets: string[];
  ariaLabelPrefix?: string;
}) {
  const { data, addCustomColor, removeCustomColor, hideColor, unhideColor } = useAppState();
  const { showToast } = useToast();
  const pressTimer = useRef<number | null>(null);
  const pressedColor = useRef<string | null>(null);
  const addDebounce = useRef<number | null>(null);

  const hidden = data.settings.hiddenColors;
  const isHidden = (c: string) => hidden.some((h) => h.toLowerCase() === c.toLowerCase());

  const basePresets = presets.filter((c) => !isHidden(c));
  const customColors = data.settings.customColors.filter(
    (c) => !presets.some((p) => p.toLowerCase() === c.toLowerCase()) && !isHidden(c)
  );
  const allColors = [...basePresets, ...customColors];
  const isCustomValue = !allColors.some((p) => p.toLowerCase() === value.toLowerCase());

  const clearPress = () => {
    if (pressTimer.current) { window.clearTimeout(pressTimer.current); pressTimer.current = null; }
    pressedColor.current = null;
  };

  const handleLongPressStart = (c: string, isBase: boolean) => {
    pressedColor.current = c;
    pressTimer.current = window.setTimeout(() => {
      if (pressedColor.current !== c) return;
      if (isBase) {
        hideColor(c);
        showToast('色を削除しました', () => unhideColor(c));
      } else {
        removeCustomColor(c);
        showToast('色を削除しました', () => addCustomColor(c));
      }
      if (navigator.vibrate) navigator.vibrate(12);
      pressTimer.current = null;
    }, LONG_PRESS_MS);
  };

  const swatchStyle = (c: string) => ({
    width: 28, height: 28, borderRadius: '50%', background: c, flex: 'none' as const,
    boxShadow: !isCustomValue && value.toLowerCase() === c.toLowerCase() ? `0 0 0 2.5px ${c}66` : undefined,
  });

  return (
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
      {basePresets.map((c) => (
        <button
          key={c}
          aria-label={`${ariaLabelPrefix}${c}にする。長押しでこの色を削除`}
          aria-pressed={!isCustomValue && value.toLowerCase() === c.toLowerCase()}
          onClick={() => onChange(c)}
          onPointerDown={() => handleLongPressStart(c, true)}
          onPointerUp={clearPress}
          onPointerLeave={clearPress}
          onPointerCancel={clearPress}
          style={swatchStyle(c)}
        />
      ))}
      {customColors.map((c) => (
        <button
          key={c}
          aria-label={`${ariaLabelPrefix}${c}にする。長押しでこの色を削除`}
          aria-pressed={!isCustomValue && value.toLowerCase() === c.toLowerCase()}
          onClick={() => onChange(c)}
          onPointerDown={() => handleLongPressStart(c, false)}
          onPointerUp={clearPress}
          onPointerLeave={clearPress}
          onPointerCancel={clearPress}
          style={swatchStyle(c)}
        />
      ))}
      <div
        className="color-picker-custom"
        style={isCustomValue ? { background: value, boxShadow: `0 0 0 2.5px ${value}66` } : undefined}
      >
        {!isCustomValue && <PlusIcon size={13} />}
        <input
          type="color"
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            onChange(next);
            if (addDebounce.current) window.clearTimeout(addDebounce.current);
            addDebounce.current = window.setTimeout(() => {
              if (!allColors.some((p) => p.toLowerCase() === next.toLowerCase())) {
                addCustomColor(next);
              }
            }, ADD_DEBOUNCE_MS);
          }}
          aria-label="カスタムカラーを選択"
        />
      </div>
      {isCustomValue && (
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)', fontVariantNumeric: 'tabular-nums' }}>
          {value.toUpperCase()}
        </span>
      )}
    </div>
  );
}
