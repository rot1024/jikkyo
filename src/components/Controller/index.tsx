import React, { useCallback, useMemo } from "react";
import { css } from "@emotion/react";
import { useHotkeys } from "react-hotkeys-hook";

import Button from "./Button";
import SeekBar from "./Seekbar";
import { TimeStore, useTime } from "../../util/timeStore";
import { humanReadableTime } from "../../util/time";
import { Highlight } from "../../util/highlights";

export interface Props {
  className?: string;
  time: TimeStore; // ms
  duration?: number;
  playing?: boolean;
  hidden?: boolean;
  buffered?: [number, number][];
  influence?: number[];
  highlights?: Highlight[];
  onSeek?: (time: number, relative?: boolean) => void;
  onPlayButtonClick?: () => void;
  onVideoButtonClick?: () => void;
  onCommentButtonClick?: () => void;
  onMenuButtonClick?: () => void;
}

const Controller: React.FC<Props> = ({
  className,
  time,
  duration = 0,
  playing,
  hidden,
  buffered,
  influence,
  highlights,
  onSeek,
  onPlayButtonClick,
  onVideoButtonClick,
  onCommentButtonClick,
  onMenuButtonClick
}) => {
  const currentTime = useTime(time);
  const disabled = duration === 0;

  const handleSeek = useCallback((t: number) => onSeek && onSeek(t), [onSeek]);
  const handleSeekRelative = useCallback(
    (second: number) => () => {
      if (onSeek) {
        onSeek(second * 1000, true);
      }
    },
    [onSeek]
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
  useHotkeys(
    "space",
    () => {
      if (onPlayButtonClick && duration > 0) {
        onPlayButtonClick();
      }
    },
    [onPlayButtonClick, duration]
  );

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
        disabled={disabled || duration === 0}
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
        value={Math.min(currentTime, duration)}
        max={duration}
        disabled={disabled}
        buffered={buffered}
        influence={influence}
        highlights={highlights}
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
        {humanReadableTime(Math.min(currentTime, duration))}
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


export default Controller;
