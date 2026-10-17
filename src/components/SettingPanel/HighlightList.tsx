import React, { useMemo, useState } from "react";
import { css } from "@emotion/react";

import { Highlight } from "../../util/highlights";
import { humanReadableTime } from "../../util/time";
import { TimeStore, useTime } from "../../util/timeStore";

export interface Props {
  highlights: Highlight[];
  time: TimeStore;
  onJump?: (time: number) => void;
}

type Order = "time" | "intensity";

// how long after the start of a surge it is treated as the current one
const activeDuration = 10000;

const HighlightList: React.FC<Props> = ({ highlights, time, onJump }) => {
  const [order, setOrder] = useState<Order>("time");
  const currentTime = useTime(time);
  const maxCount = useMemo(
    () => highlights.reduce((a, h) => Math.max(a, h.count), 0),
    [highlights]
  );
  const sorted = useMemo(
    () =>
      order === "time"
        ? highlights
        : [...highlights].sort((a, b) => b.ratio - a.ratio),
    [highlights, order]
  );

  if (highlights.length === 0) {
    return <div css={emptyStyles}>No highlights</div>;
  }

  return (
    <div>
      <div css={orderStyles}>
        {(["time", "intensity"] as const).map(o => (
          <div
            key={o}
            css={orderButtonStyles(order === o)}
            onClick={() => setOrder(o)}
          >
            {o === "time" ? "By time" : "By intensity"}
          </div>
        ))}
      </div>
      {sorted.map(h => {
        const active =
          currentTime >= h.jumpTime && currentTime < h.time + activeDuration;
        return (
          <div
            key={h.time}
            css={itemStyles(active)}
            onClick={() => onJump && onJump(h.jumpTime)}
          >
            <div css={headerStyles}>
              <span css={timeStyles}>{humanReadableTime(h.time)}</span>
              <span css={barWrapperStyles}>
                <span
                  css={barStyles}
                  style={{ width: (maxCount ? h.count / maxCount : 0) * 100 + "%" }}
                />
              </span>
              <span css={ratioStyles}>×{h.ratio.toFixed(1)}</span>
            </div>
            <div css={textStyles}>{h.texts.join(" / ")}</div>
          </div>
        );
      })}
    </div>
  );
};

const emptyStyles = css`
  color: #888;
  font-size: 0.8rem;
  text-align: center;
  padding: 2em 0;
`;

const orderStyles = css`
  display: flex;
  justify-content: flex-end;
  gap: 0.8em;
  margin-bottom: 0.5em;
`;

const orderButtonStyles = (active: boolean) => css`
  font-size: 0.7rem;
  color: ${active ? "#ff9d00" : "#888"};
  cursor: pointer;
  user-select: none;
`;

const itemStyles = (active: boolean) => css`
  padding: 0.5em;
  border-radius: 0.3em;
  cursor: pointer;
  user-select: none;
  background-color: ${active ? "#ff9d0030" : "transparent"};
  transition: background-color 0.1s ease-in-out;

  &:hover {
    background-color: ${active ? "#ff9d0040" : "#ffffff20"};
  }
`;

const headerStyles = css`
  display: flex;
  align-items: center;
  gap: 0.5em;
  font-size: 0.8rem;
`;

const timeStyles = css`
  color: #ff9d00;
  font-variant-numeric: tabular-nums;
`;

const barWrapperStyles = css`
  flex: auto;
  height: 6px;
  background-color: #ffffff15;
  border-radius: 3px;
  overflow: hidden;
`;

const barStyles = css`
  display: block;
  height: 100%;
  background: linear-gradient(to right, #0c0, #f00);
`;

const ratioStyles = css`
  color: #888;
  font-size: 0.7rem;
  min-width: 3em;
  text-align: right;
`;

const textStyles = css`
  color: #ccc;
  font-size: 0.8rem;
  margin-top: 0.2em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export default HighlightList;
