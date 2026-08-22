import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { CheckIcon, WarnIcon } from './Icons';

/* ---- Toast ---- */
interface ToastState { text: string; show: boolean; undo?: () => void; }
interface ToastContextValue {
  showToast: (text: string, undo?: () => void) => void;
}
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({ text: '', show: false });
  const timerRef = useRef<number | undefined>(undefined);

  const showToast = (text: string, undo?: () => void) => {
    setToast({ text, show: true, undo });
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setToast((t) => ({ ...t, show: false })), undo ? 4000 : 2200);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className={`toast${toast.undo ? ' undo' : ''}${toast.show ? ' show' : ''}`}
        role="status"
        aria-live="polite"
      >
        <CheckIcon size={14} />
        <span>{toast.text}</span>
        {toast.undo && (
          <button
            className="toast-undo-btn"
            onClick={() => { toast.undo?.(); setToast((t) => ({ ...t, show: false })); }}
          >
            元に戻す
          </button>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/** Closes an open overlay on Escape, and returns the open overlay's element ref for autofocus. */
export function useOverlayBehavior(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  return panelRef;
}

/* ---- Bottom Sheet (input / create / detail list) ---- */
export function BottomSheet({
  open, onClose, title, cancelLabel = 'キャンセル', confirmLabel, onConfirm, confirmDisabled, children,
}: {
  open: boolean; onClose: () => void; title: string;
  cancelLabel?: string; confirmLabel?: string; onConfirm?: () => void; confirmDisabled?: boolean;
  children: ReactNode;
}) {
  const titleId = useId();
  const panelRef = useOverlayBehavior(open, onClose);
  return (
    <div className={`overlay${open ? ' show' : ''}`} aria-hidden={!open}>
      <div className="scrim" onClick={onClose} />
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="sheet-grip" />
        <div className="sheet-head">
          <button className="sheet-action cancel" onClick={onClose}>{cancelLabel}</button>
          <span className="sheet-title" id={titleId}>{title}</span>
          {confirmLabel ? (
            <button className="sheet-action" onClick={onConfirm} disabled={confirmDisabled} style={confirmDisabled ? { opacity: .4 } : undefined}>
              {confirmLabel}
            </button>
          ) : <span style={{ width: 46 }} />}
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

/* ---- Action Sheet (2-4 choices) ---- */
export interface ActionSheetOption {
  label: string;
  destructive?: boolean;
  onSelect: () => void;
}
export function ActionSheet({
  open, onClose, title, subtitle, options,
}: {
  open: boolean; onClose: () => void; title?: string; subtitle?: string; options: ActionSheetOption[];
}) {
  const titleId = useId();
  const panelRef = useOverlayBehavior(open, onClose);
  return (
    <div className={`overlay${open ? ' show' : ''}`} aria-hidden={!open}>
      <div className="scrim" onClick={onClose} />
      <div
        className="action-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : '選択肢'}
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="as-group">
          {(title || subtitle) && (
            <div className="as-title-block">
              {title && <div className="t" id={titleId}>{title}</div>}
              {subtitle && <div className="s">{subtitle}</div>}
            </div>
          )}
          {options.map((opt) => (
            <button
              key={opt.label}
              className={`as-btn${opt.destructive ? ' destructive' : ''}`}
              onClick={() => { opt.onSelect(); onClose(); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button className="as-cancel" onClick={onClose}>キャンセル</button>
      </div>
    </div>
  );
}

/* ---- Alert (destructive confirmation) ---- */
export function AppAlert({
  open, onClose, title, message, confirmLabel = '削除する', onConfirm,
}: {
  open: boolean; onClose: () => void; title: string; message: string; confirmLabel?: string; onConfirm: () => void;
}) {
  const titleId = useId();
  const panelRef = useOverlayBehavior(open, onClose);
  return (
    <div className={`overlay${open ? ' show' : ''}`} aria-hidden={!open}>
      <div className="scrim" onClick={onClose} />
      <div className="alert-wrap">
        <div
          className="alert"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          ref={panelRef}
          tabIndex={-1}
        >
          <div className="alert-body">
            <div className="alert-icon"><WarnIcon size={18} /></div>
            <p className="alert-title" id={titleId}>{title}</p>
            <p className="alert-msg">{message}</p>
          </div>
          <div className="alert-actions">
            <button className="alert-btn" onClick={onClose}>キャンセル</button>
            <button className="alert-btn destructive" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
