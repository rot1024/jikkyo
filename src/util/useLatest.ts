import { useState } from "react";

const useLatest = <S, T>(state: S, trigger: T) => {
  const [latest, setLatest] = useState({ state, trigger });
  if (latest.trigger !== trigger) {
    setLatest({ state, trigger });
    return state;
  }
  return latest.state;
};

export default useLatest;
