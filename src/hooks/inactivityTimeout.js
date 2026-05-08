import { useEffect, useRef, useState } from 'react';

export const useInactivityTimeout = (minutes = 5, onTimeout, enabled = true) => {
  const [showWarning, setShowWarning] = useState(false);
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);

  const reset = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    setShowWarning(false);

    if (!enabled) return;

    const totalMs = minutes * 60 * 1000;
    const warningMs = totalMs - 60 * 1000; // avviso 1 minuto prima

    warningRef.current = setTimeout(() => setShowWarning(true), warningMs > 0 ? warningMs : totalMs);
    timeoutRef.current = setTimeout(() => {
      setShowWarning(false);
      onTimeout();
    }, totalMs);
  };

  const dismissWarning = () => {
    setShowWarning(false);
    reset();
  };

  useEffect(() => {
    if (!enabled) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      setShowWarning(false);
      return;
    }

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [enabled, minutes]);

  return { showWarning, dismissWarning };
};
