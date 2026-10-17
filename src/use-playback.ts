import { useRef, useState, useCallback, useEffect, RefObject } from "react";

import { EventType, Ref as VideoRef } from "./components/Video";

// Interval for syncing `currentTime` state (used by UI such as the seekbar).
// Comments are not rendered with this value; they read `getTime` every animation frame.
const uiUpdateInterval = 100;

const clamp = (t: number, max: number) => Math.max(0, Math.min(max, t));

// Single source of truth for the playback time (ms).
// With a video, the time is the video's currentTime.
// Without a video, the time is derived from the wall clock so that it does not
// depend on how often (or how late) frames are rendered.
export default function usePlayback(
  videoRef: RefObject<VideoRef | null>,
  hasVideo: boolean,
  duration: number
) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  // `startedAt` is defined only while the clock is running (without a video)
  const clock = useRef<{ base: number; startedAt?: number }>({ base: 0 });

  const getTime = useCallback(() => {
    if (hasVideo) {
      return videoRef.current ? videoRef.current.currentTime() * 1000 : 0;
    }
    const { base, startedAt } = clock.current;
    return clamp(
      startedAt === undefined ? base : base + performance.now() - startedAt,
      duration
    );
  }, [duration, hasVideo, videoRef]);

  // Reset when switching between video and no-video mode
  const [prevHasVideo, setPrevHasVideo] = useState(hasVideo);
  if (prevHasVideo !== hasVideo) {
    setPrevHasVideo(hasVideo);
    setPlaying(false);
    setCurrentTime(0);
  }
  useEffect(() => {
    clock.current = { base: 0 };
  }, [hasVideo]);

  const pause = useCallback(() => {
    clock.current = { base: getTime() };
    setPlaying(false);
    setCurrentTime(clock.current.base);
  }, [getTime]);

  const toggle = useCallback(() => {
    if (hasVideo) {
      if (videoRef.current) setPlaying(videoRef.current.toggle());
      return;
    }
    if (clock.current.startedAt !== undefined) {
      pause();
      return;
    }
    if (duration === 0) return;
    const t = getTime();
    clock.current = {
      base: t >= duration ? 0 : t,
      startedAt: performance.now()
    };
    setPlaying(true);
    setCurrentTime(clock.current.base);
  }, [duration, getTime, hasVideo, pause, videoRef]);

  const seek = useCallback(
    (t: number, relative?: boolean) => {
      const target = clamp(relative ? getTime() + t : t, duration);
      if (hasVideo) {
        if (videoRef.current) videoRef.current.seek(target / 1000);
      } else {
        clock.current = {
          base: target,
          startedAt:
            clock.current.startedAt === undefined
              ? undefined
              : performance.now()
        };
      }
      setCurrentTime(target);
    },
    [duration, getTime, hasVideo, videoRef]
  );

  const handleVideoEvent = useCallback(
    (e: EventType, ct: number) => {
      if (e === "load" || e === "pause") {
        setPlaying(false);
      } else if (e === "play") {
        setPlaying(true);
      }
      if (e !== "progress") {
        setCurrentTime(ct * 1000);
      }
    },
    []
  );

  // Sync UI time while playing and stop at the end (without a video)
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      const t = getTime();
      setCurrentTime(t);
      if (!hasVideo && t >= duration) {
        pause();
      }
    }, uiUpdateInterval);
    return () => window.clearInterval(timer);
  }, [duration, getTime, hasVideo, pause, playing]);

  return {
    playing,
    currentTime,
    getTime,
    toggle,
    seek,
    handleVideoEvent
  };
}
