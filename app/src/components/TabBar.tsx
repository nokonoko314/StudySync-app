import { CalendarIcon, HomeIcon, SettingsIcon, StatsIcon, TimelineIcon } from './Icons';

export type ScreenKey = 'home' | 'calendar' | 'timeline' | 'stats' | 'settings';

const TABS: { key: ScreenKey; label: string; Icon: typeof HomeIcon }[] = [
  { key: 'home', label: 'ホーム', Icon: HomeIcon },
  { key: 'calendar', label: 'カレンダー', Icon: CalendarIcon },
  { key: 'timeline', label: 'タイムライン', Icon: TimelineIcon },
  { key: 'stats', label: '統計', Icon: StatsIcon },
  { key: 'settings', label: '設定', Icon: SettingsIcon },
];

export function TabBar({ active, onChange }: { active: ScreenKey; onChange: (key: ScreenKey) => void }) {
  return (
    <div className="tabbar-float">
      {TABS.map(({ key, label, Icon }) => (
        <button key={key} className={`tab${active === key ? ' active' : ''}`} onClick={() => onChange(key)}>
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
