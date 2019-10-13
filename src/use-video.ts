import { useRef, useState, useCallback } from "react";

import { EventType, Ref } from "./components/Video";

const convertTimeRanges = (buffered: TimeRanges): [number, number][] =>
  new Array(buffered.length)
    .fill(0)
    .map((e, i) => [buffered.start(i) * 1000, buffered.end(i) * 1000]);

export default function useViode() {
  const videoRef = useRef<Ref>(null);
  const [src, setSrc] = useState<string>();
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [timeRanges, setTimeRanges] = useState<[number, number][]>();

  const loadVideo = useCallback((file: File) => {
    setSrc(URL.createObjectURL(file));
    setPlaying(false);
    setCurrentTime(0);
  }, []);

  const handleVideoEvent = useCallback(
    (e: EventType, ct: number, d: number, buffered: TimeRanges) => {
      if (e === "load") {
        setPlaying(false);
      } else if (e === "pause") {
        setPlaying(false);
      } else if (e === "play") {
        setPlaying(true);
      }
      setTimeRanges(convertTimeRanges(buffered));
      setCurrentTime(ct * 1000);
      setDuration(d * 1000);
    },
    []
  );

  return {
    videoRef,
    loadVideo,
    src,
    playing,
    setPlaying,
    currentTime,
    setCurrentTime,
    duration,
    timeRanges,
    handleVideoEvent
  };
}
