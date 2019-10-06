import { useEffect, useRef } from "react";

export default (callback: () => void, enabled: boolean) => {
  const e = useRef(enabled);
  useEffect(() => {
    e.current = enabled;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let handler: number;
    const cb = () => {
      if (!e.current) return;
      callback();
      handler = window.requestAnimationFrame(cb);
    };
    callback();
    handler = window.requestAnimationFrame(cb);
    return () => window.cancelAnimationFrame(handler);
  }, [callback, enabled]);
};
