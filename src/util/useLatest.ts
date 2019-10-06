import { useRef } from "react";

const useLatest = <S, T>(state: S, trigger: T) => {
  const stateRef = useRef<S>(state);
  const triggerRef = useRef<T>(trigger);
  if (triggerRef.current !== trigger) {
    stateRef.current = state;
    triggerRef.current = trigger;
  }
  return stateRef.current;
};

export default useLatest;
