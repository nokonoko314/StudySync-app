import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppStateProvider, useAppState } from './state/AppStateContext';
import { AuthProvider } from './state/AuthContext';
import { syncNotifications } from './lib/notifications';
import { TimerProvider } from './state/TimerContext';
import { ToastProvider } from './components/Overlay';
import { TabBar, type ScreenKey } from './components/TabBar';
import { HomeScreen } from './screens/HomeScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { TimelineScreen } from './screens/TimelineScreen';
import { StatsScreen } from './screens/StatsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { TimerFocus } from './components/TimerFocus';
import { MiniTimerBar } from './components/MiniTimerBar';
import { IntroSplash } from './components/IntroSplash';
import { CloudSyncManager } from './components/CloudSyncManager';

const INTRO_SHOWN_KEY = 'studysync.introShown';

const SCREEN_KEYS: ScreenKey[] = ['home', 'calendar', 'timeline', 'stats', 'settings'];

function screenFromHash(): ScreenKey {
  const key = window.location.hash.replace('#', '');
  return (SCREEN_KEYS as string[]).includes(key) ? (key as ScreenKey) : 'home';
}

/**
 * The enter animation (and its will-change hint) creates a CSS stacking context for as long as
 * the "screen-transition-*" class is applied. If left on permanently, any sheet/dialog rendered
 * inside a screen gets trapped below the fixed tab bar regardless of its own z-index. So the
 * animation class is dropped once the transition finishes, returning the screen to normal stacking.
 */
function ScreenTransition({ direction, children }: { direction: 'forward' | 'backward'; children: ReactNode }) {
  const [settled, setSettled] = useState(false);
  return (
    <div
      className={settled ? 'screen-transition' : `screen-transition screen-transition-${direction}`}
      onAnimationEnd={() => setSettled(true)}
    >
      {children}
    </div>
  );
}

function Shell() {
  const { data } = useAppState();
  const [screen, setScreen] = useState<ScreenKey>(screenFromHash);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const screenRef = useRef(screen);
  const prevIndexRef = useRef(SCREEN_KEYS.indexOf(screen));

  useEffect(() => {
    syncNotifications(data.tasks, data.settings);
  }, [
    data.tasks, data.settings.notificationsEnabled, data.settings.dueReminderHours,
    data.settings.dailyReminderEnabled, data.settings.dailyReminderTime,
  ]);

  const applyScreen = useCallback((next: ScreenKey) => {
    if (next === screenRef.current) return;
    const nextIndex = SCREEN_KEYS.indexOf(next);
    setDirection(nextIndex >= prevIndexRef.current ? 'forward' : 'backward');
    prevIndexRef.current = nextIndex;
    screenRef.current = next;
    setScreen(next);
  }, []);

  useEffect(() => {
    const onHashChange = () => applyScreen(screenFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [applyScreen]);

  const changeScreen = useCallback((next: ScreenKey) => {
    applyScreen(next);
    if (window.location.hash !== `#${next}`) {
      window.location.hash = next;
    }
  }, [applyScreen]);

  return (
    <div className="app-frame">
      <a href="#main-content" className="skip-link">メインコンテンツにスキップ</a>
      <main id="main-content" tabIndex={-1}>
        <ScreenTransition key={screen} direction={direction}>
          {screen === 'home' && <HomeScreen />}
          {screen === 'calendar' && <CalendarScreen />}
          {screen === 'timeline' && <TimelineScreen />}
          {screen === 'stats' && <StatsScreen />}
          {screen === 'settings' && <SettingsScreen />}
        </ScreenTransition>
      </main>
      <MiniTimerBar />
      <TabBar active={screen} onChange={changeScreen} />
      <TimerFocus />
      <CloudSyncManager />
    </div>
  );
}

export default function App() {
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return sessionStorage.getItem(INTRO_SHOWN_KEY) !== '1';
    } catch {
      return true;
    }
  });

  const dismissIntro = useCallback(() => {
    setShowIntro(false);
    try {
      sessionStorage.setItem(INTRO_SHOWN_KEY, '1');
    } catch {
      // ignore (e.g. private browsing storage restrictions)
    }
  }, []);

  return (
    <AppStateProvider>
      <AuthProvider>
        <ToastProvider>
          <TimerProvider>
            <Shell />
            {showIntro && <IntroSplash onDone={dismissIntro} />}
          </TimerProvider>
        </ToastProvider>
      </AuthProvider>
    </AppStateProvider>
  );
}
