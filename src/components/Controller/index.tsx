/** @jsx jsx */
import React, { useCallback, useMemo } from "react";
import { css, jsx } from "@emotion/core";
import { useHotkeys } from "react-hotkeys-hook";

import Button from "./Button";
import SeekBar from "./Seekbar";
import usePlayer from "./usePlayer";

export interface Props {
  className?: string;
  currentTime?: number; // seconds
  duration?: number;
  playing?: boolean;
  hidden?: boolean;
  canPlay?: boolean;
  onSeek?: (time: number, relative?: boolean) => void;
  onPlayButtonClick?: () => void;
  onVideoButtonClick?: () => void;
  onCommentButtonClick?: () => void;
  onMenuButtonClick?: () => void;
  onEnd?: () => void;
}

const Controller: React.FC<Props> = ({
  className,
  currentTime = 0,
  duration = 0,
  playing,
  hidden,
  onSeek,
  canPlay,
  onPlayButtonClick,
  onVideoButtonClick,
  onCommentButtonClick,
  onMenuButtonClick,
  onEnd
}) => {
  const disabled = duration === 0;
  const [seekTime, seek] = usePlayer(!!playing, currentTime, duration, onEnd);

  const handleSeek = useCallback((t: number) => onSeek && onSeek(t), [onSeek]);
  const handleSeekRelative = useCallback(
    (second: number) => () => {
      const st = second * 1000;
      seek(st, true);
      if (onSeek) {
        onSeek(st, true);
      }
    },
    [onSeek, seek]
  );
  const handleSeekMinus10 = useMemo(() => handleSeekRelative(-10), [
    handleSeekRelative
  ]);
  const handleSeekPlus10 = useMemo(() => handleSeekRelative(10), [
    handleSeekRelative
  ]);
  const handleSeekMinus1 = useMemo(() => handleSeekRelative(-1), [
    handleSeekRelative
  ]);
  const handleSeekPlus1 = useMemo(() => handleSeekRelative(1), [
    handleSeekRelative
  ]);

  useHotkeys("left", handleSeekMinus10, [handleSeekMinus10]);
  useHotkeys("right", handleSeekPlus10, [handleSeekPlus10]);
  useHotkeys("shift + left", handleSeekMinus1, [handleSeekMinus1]);
  useHotkeys("shift + right", handleSeekPlus1, [handleSeekPlus1]);

  return (
    <div
      className={className}
      css={css`
        box-sizing: border-box;
        width: 100%;
        display: flex;
        align-items: center;
        padding: 0.5em 1em;
        background-color: rgba(30, 30, 30, 0.75);
        color: #aaa;
        transition: transform 0.2s ease-in-out;

        ${hidden &&
          css`
            pointer-events: none;
            transform: translateY(100%);
          `}
      `}
    >
      <Button
        icon={playing ? "pause" : "play"}
        disabled={disabled || !canPlay}
        highlightOnHover
        large
        onClick={onPlayButtonClick}
      />
      <Button
        icon="undo"
        title="Go back 10s"
        disabled={disabled}
        onClick={handleSeekMinus10}
      />
      <Button
        icon="redo"
        title="Advance 10s"
        disabled={disabled}
        onClick={handleSeekPlus10}
      />
      <SeekBar
        value={seekTime}
        max={duration}
        disabled={disabled}
        onChange={handleSeek}
        css={css`
          flex: auto;
          margin-left: 1em;
        `}
      />
      <div
        css={css`
          font-size: 0.9em;
          padding: 1em;
          width: 4em;
          text-align: center;
        `}
      >
        {humanReadableTime(seekTime)}
      </div>
      <Button
        icon="video"
        title="Open video file"
        onClick={onVideoButtonClick}
      />
      <Button
        icon="comment"
        title="Open comment file"
        onClick={onCommentButtonClick}
      />
      <Button icon="bars" onClick={onMenuButtonClick} />
    </div>
  );
};

const humanReadableTime = (t?: number) => {
  if (typeof t !== "number") {
    return "00:00:00";
  }
  const second = t / 1000;
  const s = ~~(second % 60);
  const m = ~~(second / 60);
  const h = ~~(m / 60);
  return `${h >= 100 ? h : ("0" + h).slice(-2)}:${("0" + m).slice(-2)}:${(
    "0" + s
  ).slice(-2)}`;
};

export default Controller;
