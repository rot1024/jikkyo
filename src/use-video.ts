import { useRef, useState, useCallback } from "react";

import { EventType, Ref } from "./components/Video";

const convertTimeRanges = (buffered: TimeRanges): [number, number][] =>
  new Array(buffered.length)
    .fill(0)
    .map((_, i) => [buffered.start(i) * 1000, buffered.end(i) * 1000]);

// Manages the video element itself (source, duration, buffered ranges).
// Playback time and play/pause state are handled by usePlayback.
export default function useVideo() {
  const videoRef = useRef<Ref>(null);
  const [src, setSrc] = useState<string>();
  const [duration, setDuration] = useState(0);
  const [timeRanges, setTimeRanges] = useState<[number, number][]>();

  const loadVideo = useCallback((file: File) => {
    setSrc(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }, []);

  const handleVideoEvent = useCallback(
    (_e: EventType, _ct: number, d: number, buffered: TimeRanges) => {
      setTimeRanges(convertTimeRanges(buffered));
      setDuration(isFinite(d) ? d * 1000 : 0);
    },
    []
  );

  const unloadVideo = useCallback(() => {
    setSrc(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return undefined;
    });
    setDuration(0);
    setTimeRanges(undefined);
  }, []);

  return {
    videoRef,
    loadVideo,
    src,
    duration,
    timeRanges,
    handleVideoEvent,
    unloadVideo
  };
}
