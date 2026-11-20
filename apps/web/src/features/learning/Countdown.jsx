// Exam timer; submits when time runs out.
import {useEffect, useState} from 'react';
import {Timer} from 'lucide-react';

export function Countdown({endsAt, onEnd}) {
  const [left, setLeft] = useState(() => new Date(endsAt) - Date.now());
  useEffect(() => {
    const t = setInterval(() => {
      const ms = new Date(endsAt) - Date.now();
      setLeft(ms);
      if (ms <= 0) {
        clearInterval(t);
        onEnd();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [endsAt, onEnd]);
  const s = Math.max(0, Math.floor(left / 1000));
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-rule px-3 py-1 text-sm tabular-nums"
      role="timer"
    >
      <Timer aria-hidden className="size-4" />
      {String(Math.floor(s / 60)).padStart(2, '0')}:{String(s % 60).padStart(2, '0')} left
    </span>
  );
}
