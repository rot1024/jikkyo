/** @jsx jsx */
import React, { useCallback } from "react";
import { css, jsx } from "@emotion/core";
import { useHotkeys } from "react-hotkeys-hook";

import Button from "./Button";
import SeekBar from "./Seekbar";

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
}

const Controller: React.FC<Props> = ({
  className,
  currentTime,
  duration,
  playing,
  hidden,
  onSeek,
  canPlay,
  onPlayButtonClick,
  onVideoButtonClick,
  onCommentButtonClick,
  onMenuButtonClick
}) => {
  const disabled =
    typeof currentTime !== "number" || typeof duration !== "number";
  const handleSeek = useCallback((t: number) => onSeek && onSeek(t), [onSeek]);
  const handleSeekPlus10 = useCallback(
    () => onSeek && onSeek(10 * 1000, true),
    [onSeek]
  );
  const handleSeekMinus10 = useCallback(
    () => onSeek && onSeek(-10 * 1000, true),
    [onSeek]
  );
  const handleSeekPlus1 = useCallback(() => onSeek && onSeek(1000, true), [
    onSeek
  ]);
  const handleSeekMinus1 = useCallback(() => onSeek && onSeek(-1000, true), [
    onSeek
  ]);

  useHotkeys("left", handleSeekMinus10);
  useHotkeys("right", handleSeekPlus10);
  useHotkeys("shift + left", handleSeekMinus1);
  useHotkeys("shift + right", handleSeekPlus1);

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
        value={currentTime}
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
        {humanReadableTime(currentTime)}
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
