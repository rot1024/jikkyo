import { useEffect } from "react";

const useDebounce = <T>(value: T, delay: number, cb?: (value: T) => void) => {
  useEffect(() => {
    if (delay <= 0) {
      if (cb) {
        cb(value);
      }
      return;
    }

    const handler = setTimeout(() => {
      if (cb) {
        cb(value);
      }
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay, cb]);
};

export default useDebounce;
