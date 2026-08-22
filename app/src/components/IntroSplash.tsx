import { useEffect, useRef, useState } from 'react';

const CURVE_PATH =
  'M 150 320 C 230 400, 300 500, 322 632 C 336 528, 372 398, 428 340 ' +
  'C 494 308, 552 428, 566 520 C 582 470, 616 336, 656 306 ' +
  'C 708 284, 748 380, 764 442 C 782 410, 808 300, 866 282';

const REVIEW_POINTS: [number, number][] = [[428, 340], [656, 306], [866, 282]];

export function IntroSplash({ onDone }: { onDone: () => void }) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState<number | null>(null);
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (pathRef.current) setPathLength(pathRef.current.getTotalLength());
  }, []);

  useEffect(() => {
    if (pathLength === null) return;
    const drawMs = reducedMotion ? 1 : 1200;
    const dotsMs = reducedMotion ? 1 : 650;
    const holdMs = reducedMotion ? 1 : 500;
    const fadeMs = reducedMotion ? 1 : 380;

    const fadeTimer = window.setTimeout(() => setFadingOut(true), drawMs + dotsMs + holdMs);
    const doneTimer = window.setTimeout(() => setVisible(false), drawMs + dotsMs + holdMs + fadeMs);
    return () => { window.clearTimeout(fadeTimer); window.clearTimeout(doneTimer); };
  }, [pathLength, reducedMotion]);

  useEffect(() => {
    if (!visible) onDone();
  }, [visible, onDone]);

  if (!visible) return null;

  return (
    <div className={`intro-splash${fadingOut ? ' intro-splash-out' : ''}`}>
      <svg viewBox="0 0 1024 700" className="intro-splash-svg" aria-hidden="true">
        <defs>
          <linearGradient id="intro-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5B8FF6" />
            <stop offset="60%" stopColor="#8FB4FF" />
            <stop offset="100%" stopColor="#6FA0FF" />
          </linearGradient>
        </defs>
        <path
          ref={pathRef}
          d={CURVE_PATH}
          fill="none"
          stroke="url(#intro-grad)"
          strokeWidth={22}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={pathLength !== null ? {
            strokeDasharray: pathLength,
            strokeDashoffset: reducedMotion ? 0 : pathLength,
            animation: reducedMotion ? 'none' : 'intro-draw 1.2s cubic-bezier(.4,0,.2,1) forwards',
          } : undefined}
        />
        {REVIEW_POINTS.map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={16}
            fill="#8FB4FF"
            className="intro-dot"
            style={{ animationDelay: `${reducedMotion ? 0 : 1.15 + i * 0.16}s` }}
          />
        ))}
      </svg>
      <p className="intro-splash-title">StudySync</p>
      <p className="intro-splash-tag">忘れる前に、ちょうどいいタイミングで。</p>
    </div>
  );
}
