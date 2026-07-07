'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CountdownTimer } from '../../lib/timerService';

// Thin React wrapper around lib/timerService's CountdownTimer. Used for the
// verify-email resend cooldown; reusable anywhere a UI needs a "seconds
// left" countdown (OTP resend, expiring links/codes, etc.).
export function useCountdownTimer() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<CountdownTimer | null>(null);

  const start = useCallback((durationSeconds: number, onExpire?: () => void) => {
    timerRef.current?.stop();
    const timer = new CountdownTimer(durationSeconds);
    timerRef.current = timer;
    timer.start(setSecondsLeft, onExpire);
  }, []);

  const stop = useCallback(() => {
    timerRef.current?.stop();
  }, []);

  useEffect(() => () => timerRef.current?.stop(), []);

  return { secondsLeft, start, stop };
}
