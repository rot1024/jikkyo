/** @jsx jsx */
import React from "react";
import { css, jsx } from "@emotion/core";

import Button from "./Button";
import SeekBar from "./Seekbar";

export interface Props {
  className?: string;
  currentTime?: number;
  duration?: number;
  playing?: boolean;
  hidden?: boolean;
  canPlay?: boolean;
  onSeek?: (time: number) => void;
  onPlayButtonClick?: () => void;
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
  onMenuButtonClick
}) => {
  const disabled =
    typeof currentTime !== "number" || typeof duration !== "number";
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
      <SeekBar
        value={currentTime}
        max={duration}
        disabled={disabled}
        onChange={onSeek}
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
      <Button icon="bars" onClick={onMenuButtonClick} />
    </div>
  );
};

const humanReadableTime = (t?: number) => {
  if (typeof t !== "number") {
    return "00:00:00";
  }
  const s = ~~(t % 60);
  const m = ~~(t / 60);
  const h = ~~(m / 60);
  return `${h >= 100 ? h : ("0" + h).slice(-2)}:${("0" + m).slice(-2)}:${(
    "0" + s
  ).slice(-2)}`;
};

export default Controller;
