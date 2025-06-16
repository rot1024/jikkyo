import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useInterval } from "react-use";

const round = (duration: number) => (t: number) =>
  Math.floor(Math.max(0, Math.min(duration, t)));

export default (
  playing: boolean,
  currentTime: number,
  duration: number,
  manual: boolean,
  onEnd?: () => void
): [number, (t: number, relative?: boolean) => void] => {
  const [seekTime, setSeekTime] = useState(0);
  const prevTime = useRef(0);
  const innerPlaying = useRef(false);

  const roundSeekTime = useMemo(() => round(duration), [duration]);
  const seek = useCallback<(t: number, relative?: boolean) => void>(
    (t, relative) => {
      prevTime.current = Date.now();
      setSeekTime(relative ? t2 => roundSeekTime(t + t2) : roundSeekTime(t));
    },
    [roundSeekTime]
  );

  const handleInterval = useCallback(() => {
    if (!innerPlaying.current || manual) return;
    seek(Date.now() - prevTime.current, true);
  }, [manual, seek]);
  useInterval(handleInterval, manual ? null : 100);

  useEffect(() => {
    innerPlaying.current = !!playing;
    if (playing) {
      prevTime.current = Date.now();
    }
  }, [playing]);

  useEffect(() => {
    if (manual) {
      setSeekTime(currentTime);
    } else {
      seek(currentTime);
    }
  }, [currentTime, manual, seek]);

  useEffect(() => {
    if (seekTime >= duration) {
      innerPlaying.current = false;
      if (onEnd) {
        onEnd();
      }
    }
  }, [duration, onEnd, seekTime]);

  return [seekTime, seek];
};
