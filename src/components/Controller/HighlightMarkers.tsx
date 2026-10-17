import React from "react";
import { css } from "@emotion/react";

import { Highlight } from "../../util/highlights";
import { humanReadableTime } from "../../util/time";

export interface Props {
  highlights?: Highlight[];
  max: number;
  onJump?: (time: number) => void;
}

// Markers of comment surges on the seekbar
const HighlightMarkers: React.FC<Props> = ({ highlights, max, onJump }) => {
  if (!highlights || max === 0) return null;
  return (
    <>
      {highlights.map(h => (
        <div
          key={h.time}
          css={markerStyles}
          style={{ left: (h.time / max) * 100 + "%" }}
          // do not start dragging the seekbar
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          onClick={() => onJump && onJump(h.jumpTime)}
        >
          <div css={tooltipStyles} style={tooltipPosition(h.time / max)}>
            <span css={timeStyles}>{humanReadableTime(h.time)}</span>
            {h.texts.join(" / ")}
            <span css={ratioStyles}>×{h.ratio.toFixed(1)}</span>
          </div>
        </div>
      ))}
    </>
  );
};

// keep tooltips near the edges inside the seekbar
const tooltipPosition = (x: number): React.CSSProperties =>
  x < 0.2
    ? { left: 0, transform: "none" }
    : x > 0.8
    ? { left: "auto", right: 0, transform: "none" }
    : {};

const markerStyles = css`
  position: absolute;
  bottom: 100%;
  width: 14px;
  height: 12px;
  margin-left: -7px;
  cursor: pointer;
  z-index: 1;

  &::before {
    content: "";
    position: absolute;
    left: 3px;
    bottom: 2px;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 6px solid #ff9d00;
    transition: transform 0.1s ease;
  }

  &:hover::before {
    transform: scale(1.5) translateY(-1px);
  }

  &:hover > div {
    opacity: 1;
    visibility: visible;
  }
`;

const tooltipStyles = css`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 4px;
  padding: 0.3em 0.6em;
  background-color: #222;
  color: #eee;
  border-radius: 0.3em;
  font-size: 0.8rem;
  white-space: nowrap;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.1s ease;
  box-shadow: 0 2px 8px #000000aa;
`;

const timeStyles = css`
  color: #ff9d00;
  margin-right: 0.5em;
`;

const ratioStyles = css`
  color: #aaa;
  margin-left: 0.5em;
`;

export default HighlightMarkers;
