import { useState, useEffect } from "react";

export default function useWindowError() {
  const [error, setError] = useState<string>();

  useEffect(() => {
    const onerror = (e: ErrorEvent | PromiseRejectionEvent) => {
      if (e instanceof PromiseRejectionEvent) {
        setError(e.reason);
      } else {
        setError(e.message);
      }
    };

    window.addEventListener("error", onerror);
    window.addEventListener("unhandledrejection", onerror);

    return () => {
      window.removeEventListener("error", onerror);
      window.removeEventListener("unhandledrejection", onerror);
    };
  }, []);

  return error;
}
