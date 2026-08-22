type IconProps = { size?: number; className?: string };

export const HomeIcon = ({ size = 22 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M3 11l9-7 9 7" /><path d="M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9" />
  </svg>
);
export const CalendarIcon = ({ size = 22 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);
export const TimelineIcon = ({ size = 22 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /><path d="M4.2 4.2l1.2 1.2M19.8 4.2l-1.2 1.2" />
  </svg>
);
export const StatsIcon = ({ size = 22 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M4 20V10M12 20V4M20 20v-7" />
  </svg>
);
export const SettingsIcon = ({ size = 22 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.55-1H3a2 2 0 110-4h.09a1.7 1.7 0 001.55-1 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.34H9a1.7 1.7 0 001-1.55V3a2 2 0 114 0v.09a1.7 1.7 0 001 1.55 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87V9a1.7 1.7 0 001.55 1H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.55 1z" />
  </svg>
);
export const MenuIcon = ({ size = 16 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const RepeatIcon = ({ size = 12, color = 'currentColor' }: IconProps & { color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12a8 8 0 0113.66-5.66L20 8" /><path d="M20 4v4h-4" />
    <path d="M20 12a8 8 0 01-13.66 5.66L4 16" /><path d="M4 20v-4h4" />
  </svg>
);
export const FlameIcon = ({ size = 13 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2c1 4-3 5-3 9a3 3 0 006 0c0-1-.5-2-1-2 2 1 3 3 3 5a5 5 0 01-10 0c0-5 4-6 5-12z" />
  </svg>
);
export const CloseIcon = ({ size = 10 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const TimerIcon = ({ size = 16, color = 'currentColor' }: IconProps & { color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2M9 2h6" />
  </svg>
);
export const CheckIcon = ({ size = 14 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13l4 4L19 7" />
  </svg>
);
export const PlusIcon = ({ size = 24 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const ChevronLeftIcon = ({ size = 13 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2.4}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);
export const ChevronRightIcon = ({ size = 13 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2.4}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);
export const SyncIcon = ({ size = 11 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M21 12a9 9 0 11-2.6-6.4M21 4v5h-5" />
  </svg>
);
export const MonthGridIcon = ({ size = 13 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);
export const WeekListIcon = ({ size = 13 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M4 6h16M4 12h10M4 18h13" />
  </svg>
);
export const ClockIcon = ({ size = 14, color = '#fff' }: IconProps & { color?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={2}>
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" /><path d="M12 6v6l4 2" />
  </svg>
);
export const WarnIcon = ({ size = 18 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L2.6 17a2 2 0 001.7 3h15.4a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
  </svg>
);
export const PaletteIcon = ({ size = 16 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#fff" strokeWidth={2}>
    <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
export const MoonIcon = ({ size = 16 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#fff" strokeWidth={2}>
    <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" />
  </svg>
);
export const ImageIcon = ({ size = 16 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#fff" strokeWidth={2}>
    <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 15l5-5 4 4 5-6 4 5" />
  </svg>
);
export const TargetIcon = ({ size = 16 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#fff" strokeWidth={2}>
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" /><path d="M12 6v6l4 2" />
  </svg>
);
export const BellIcon = ({ size = 16 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#fff" strokeWidth={2}>
    <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" />
  </svg>
);
export const LinkIcon = ({ size = 16 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#fff" strokeWidth={2}>
    <path d="M10 13a5 5 0 007.5.5l2-2a5 5 0 00-7-7l-1.5 1.5" /><path d="M14 11a5 5 0 00-7.5-.5l-2 2a5 5 0 007 7l1.5-1.5" />
  </svg>
);
export const MessageIcon = ({ size = 16 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#fff" strokeWidth={2}>
    <path d="M21 12a8 8 0 01-8 8H6l-3 2 1-4.5A8 8 0 1121 12z" />
  </svg>
);
export const HistoryIcon = ({ size = 16 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#fff" strokeWidth={2}>
    <path d="M3 12a9 9 0 109-9 9 9 0 00-7.5 4" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
  </svg>
);
export const UploadIcon = ({ size = 16 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#fff" strokeWidth={2}>
    <path d="M12 16V4M12 4l-4 4M12 4l4 4" /><path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
  </svg>
);
export const TrashIcon = ({ size = 15, color = 'currentColor' }: IconProps & { color?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={2}>
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6" />
  </svg>
);
export const PlayIcon = ({ size = 20, color = '#fff' }: IconProps & { color?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} stroke="none">
    <path d="M8 5v14l11-7z" />
  </svg>
);
export const PauseIcon = ({ size = 20, color = '#fff' }: IconProps & { color?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} stroke="none">
    <rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" />
  </svg>
);
export const StopIcon = ({ size = 20, color = '#fff' }: IconProps & { color?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} stroke="none">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);
export const PencilIcon = ({ size = 14 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
  </svg>
);
