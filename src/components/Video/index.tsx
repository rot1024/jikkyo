/** @jsx jsx */
import React, {
  useRef,
  useMemo,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle
} from "react";
import { css, jsx } from "@emotion/core";

export type EventType =
  | "load"
  | "canplay"
  | "play"
  | "pause"
  | "seeking"
  | "seeked"
  | "progress";

export interface Props {
  className?: string;
  src?: string;
  onEvent?: (
    type: EventType,
    currentTime: number,
    duration: number,
    buffered: TimeRanges
  ) => void;
  onTimeUpdate?: (currentTime: number) => void;
}

export interface Methods {
  play: () => void;
  stop: () => void;
  toggle: () => boolean;
  seek: (t: number) => void;
  seekRelative: (t: number) => void;
}

const event = (
  type: EventType,
  handler?: (
    type: EventType,
    currentTime: number,
    duration: number,
    buffered: TimeRanges
  ) => void
) => (e: React.SyntheticEvent<HTMLVideoElement>) => {
  if (!handler) return;
  const currentTime = type === "load" ? 0 : e.currentTarget.currentTime;
  const duration = type === "load" ? 0 : e.currentTarget.duration;
  handler(type, currentTime, duration, e.currentTarget.buffered);
};

const Video: React.FC<Props> = (
  { className, src, onEvent, onTimeUpdate },
  ref
) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playing = useRef(false);
  const handleLoad = useMemo(() => event("load", onEvent), [onEvent]);
  const handleCanPlay = useMemo(() => event("canplay", onEvent), [onEvent]);
  const handlePlay = useMemo(() => event("play", onEvent), [onEvent]);
  const handlePause = useMemo(() => event("pause", onEvent), [onEvent]);
  const handleSeeking = useMemo(() => event("seeking", onEvent), [onEvent]);
  const handleSeeked = useMemo(() => event("seeked", onEvent), [onEvent]);
  const handleProgress = useMemo(() => event("progress", onEvent), [onEvent]);
  const handleTimeUpdate = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      if (!onTimeUpdate) return;
      onTimeUpdate(e.currentTarget.currentTime);
    },
    [onTimeUpdate]
  );

  // In iOS safari, the video cannnot be started playing without a user interaction
  // such as a mouse event, so we have to expose some methods to outside via ref.
  useImperativeHandle<any, Methods>(ref, () => ({
    play: () => {
      if (!videoRef.current) return;
      playing.current = true;
      videoRef.current.play();
    },
    stop: () => {
      if (!videoRef.current) return;
      playing.current = false;
      videoRef.current.pause();
    },
    toggle: () => {
      if (!videoRef.current) return false;
      const next = !playing.current;
      playing.current = next;
      if (next) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
      return next;
    },
    seek: t => {
      if (!videoRef.current) return;
      videoRef.current.currentTime = t;
    },
    seekRelative: t => {
      if (!videoRef.current) return;
      videoRef.current.currentTime = videoRef.current.currentTime + t;
    }
  }));

  useEffect(() => {
    playing.current = false;
  }, [src]);

  return !src ? null : (
    <video
      ref={videoRef}
      className={className}
      src={src}
      playsInline
      controls={false}
      onCanPlay={handleCanPlay}
      onPlay={handlePlay}
      onPause={handlePause}
      onSeeking={handleSeeking}
      onSeeked={handleSeeked}
      onLoadedMetadata={handleLoad}
      onTimeUpdate={handleTimeUpdate}
      onProgress={handleProgress}
      css={css`
        width: 100%;
        height: 100%;
        object-fit: contain;
      `}
    />
  );
};

export default forwardRef<Methods, Props>(Video);
