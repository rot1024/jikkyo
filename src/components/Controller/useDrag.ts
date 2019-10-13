import { useRef, useState, useCallback, useEffect } from "react";

const getOffset = (
  e: MouseEvent | TouchEvent,
  element: Element | null
): [number, number] | undefined => {
  if (!element) return undefined;
  const rect = element.getBoundingClientRect();
  if (e instanceof TouchEvent) {
    const offsetX = e.targetTouches[0].pageX - rect.left;
    const offsetY = e.targetTouches[0].pageY - rect.top;
    return [offsetX / rect.width, offsetY / rect.height];
  } else if (e instanceof MouseEvent) {
    const offsetX = e.pageX - rect.left;
    const offsetY = e.pageY - rect.top;
    return [offsetX / rect.width, offsetY / rect.height];
  }
};

export function useHover(ref: React.RefObject<Element>, disabled?: boolean) {
  const [value, setValue] = useState(false);
  const [x, setX] = useState(0);
  const handleMouseOver = useCallback(() => setValue(true), []);
  const handleMouseOut = useCallback(() => setValue(false), []);

  useEffect(() => {
    if (!value || disabled) return;
    const node = ref.current;
    if (!node) return;

    const handleMove = (e: MouseEvent) => {
      const offset = getOffset(e, ref.current);
      if (offset) {
        setX(offset[0]);
      }
    };

    document.addEventListener("mousemove", handleMove);
    return () => document.removeEventListener("mousemove", handleMove);
  }, [disabled, handleMouseOut, handleMouseOver, ref, value]);

  useEffect(() => {
    if (disabled) return;
    const node = ref.current;
    if (!node) return;

    node.addEventListener("mouseover", handleMouseOver);
    node.addEventListener("mouseout", handleMouseOut);

    return () => {
      node.removeEventListener("mouseover", handleMouseOver);
      node.removeEventListener("mouseout", handleMouseOut);
    };
  }, [disabled, handleMouseOut, handleMouseOver, ref]);

  useEffect(() => {
    setValue(false);
  }, [disabled]);

  return [value, x] as const;
}

export const useDrag = (
  ref: React.RefObject<Element>,
  onMove?: (state: {
    x: number;
    y: number;
    dx: number;
    dy: number;
    initX: number;
    initY: number;
  }) => void,
  disabled?: boolean
) => {
  const [isDragging, setDragging] = useState(false);
  const initX = useRef(0);
  const initY = useRef(0);
  const prevX = useRef(0);
  const prevY = useRef(0);

  useEffect(() => {
    if (disabled) {
      setDragging(false);
    }
  }, [disabled]);

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;
      const offset = getOffset(e.nativeEvent, ref.current);
      if (!offset) return;
      if (
        onMove &&
        (prevX.current !== offset[0] || prevY.current !== offset[1])
      ) {
        onMove({
          x: offset[0],
          y: offset[1],
          dx: 0,
          dy: 0,
          initX: offset[0],
          initY: offset[1]
        });
      }
      initX.current = prevX.current = offset[0];
      initY.current = prevY.current = offset[1];
      setDragging(true);
    },
    [disabled, onMove, ref]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const offset = getOffset(e, ref.current);
      if (!offset) return;
      const dx = prevX.current - offset[0];
      const dy = prevY.current - offset[1];
      if (onMove && (dx !== 0 || dy !== 0)) {
        onMove({
          x: offset[0],
          y: offset[1],
          dx,
          dy,
          initX: initX.current,
          initY: initY.current
        });
      }
      prevX.current = offset[0];
      prevY.current = offset[1];
    };

    const handleDragEnd = () => {
      setDragging(false);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("touchmove", handleMove);
    document.addEventListener("mouseup", handleDragEnd);
    document.addEventListener("touchend", handleDragEnd);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("mouseup", handleDragEnd);
      document.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, onMove, ref]);

  return [isDragging, handleDragStart] as const;
};
