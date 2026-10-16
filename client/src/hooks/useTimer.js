import { useState, useEffect, useRef, useCallback } from 'react';

export function useTimer(initialSeconds, onComplete) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedElapsedRef = useRef(0);

  useEffect(() => {
    setRemaining(initialSeconds);
  }, [initialSeconds]);

  const start = useCallback(() => {
    if (running || remaining <= 0) return;
    setRunning(true);
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const passed = pausedElapsedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(passed);
      const newRemaining = Math.max(0, initialSeconds - passed);
      setRemaining(newRemaining);
      if (newRemaining <= 0) {
        clearInterval(intervalRef.current);
        setRunning(false);
        if (onComplete) onComplete(passed);
      }
    }, 1000);
  }, [running, remaining, initialSeconds, onComplete]);

  const pause = useCallback(() => {
    if (!running) return;
    clearInterval(intervalRef.current);
    pausedElapsedRef.current = elapsed;
    setRunning(false);
  }, [running, elapsed]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    pausedElapsedRef.current = 0;
    startTimeRef.current = null;
    setRunning(false);
    return elapsed;
  }, [elapsed]);

  // 从持久化会话恢复进度：清零 interval，把已累计秒数写入 pausedElapsedRef
  const restore = useCallback((seconds) => {
    clearInterval(intervalRef.current);
    const safeSeconds = Math.max(0, Math.floor(seconds));
    pausedElapsedRef.current = safeSeconds;
    startTimeRef.current = null;
    setElapsed(safeSeconds);
    setRemaining(Math.max(0, initialSeconds - safeSeconds));
    setRunning(false);
  }, [initialSeconds]);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  return { remaining, elapsed, running, start, pause, stop, restore };
}
