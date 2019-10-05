/** @jsx jsx */
import React, { useRef, useMemo, useEffect, useCallback } from "react";
import { css, jsx } from "@emotion/core";

export type EventType = "load" | "play" | "pause" | "seeking" | "seeked";

export interface Props {
  className?: string;
  src?: string;
  playing?: boolean;
  currentTime?: number;
  onEvent?: (type: EventType, currentTime: number, duration: number) => void;
  onClick?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}

const event = (
  type: EventType,
  handler?: (type: EventType, currentTime: number, duration: number) => void
) => (e: React.SyntheticEvent<HTMLVideoElement>) => {
  if (!handler) return;
  const { currentTime, duration } = e.currentTarget;
  handler(type, currentTime, duration);
};

const Video: React.FC<Props> = ({
  className,
  src,
  playing,
  currentTime,
  onEvent,
  onTimeUpdate,
  onClick
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handleLoad = useMemo(() => event("load", onEvent), [onEvent]);
  const handlePlay = useMemo(() => event("play", onEvent), [onEvent]);
  const handlePause = useMemo(() => event("pause", onEvent), [onEvent]);
  const handleSeeking = useMemo(() => event("seeking", onEvent), [onEvent]);
  const handleSeeked = useMemo(() => event("seeked", onEvent), [onEvent]);
  const handleTimeUpdate = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      if (!onTimeUpdate) return;
      onTimeUpdate(e.currentTarget.currentTime);
    },
    [onTimeUpdate]
  );

  useEffect(() => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [playing]);

  useEffect(() => {
    if (!videoRef.current || typeof currentTime !== "number") return;
    if ((videoRef.current as any).fastSeek) {
      (videoRef.current as any).fastSeek(currentTime);
    } else {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  return !src ? (
    <div
      onClick={onClick}
      css={css`
        width: 100%;
        height: 100%;
        object-fit: contain;
      `}
    />
  ) : (
    <video
      ref={videoRef}
      className={className}
      src={src}
      playsInline
      controls={false}
      onPlay={handlePlay}
      onPause={handlePause}
      onSeeking={handleSeeking}
      onSeeked={handleSeeked}
      onLoadedMetadata={handleLoad}
      onTimeUpdate={handleTimeUpdate}
      onClick={onClick}
      css={css`
        width: 100%;
        height: 100%;
        object-fit: contain;
      `}
    />
  );
};

export default Video;
