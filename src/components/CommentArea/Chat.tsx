/** @jsx jsx */
import React, { useMemo } from "react";
import { css, jsx, keyframes } from "@emotion/core";

import { Chat } from "./util";
import useLatest from "../../util/useLatest";

export interface Props {
  className?: string;
  frame: number;
  chat?: Chat;
  opacity?: number;
  opacityDanmaku?: number;
  playing?: boolean;
}

const lh = 1.4;

const animation = keyframes`
  from {
    left: 100%;
    transform: translate(0%);
  }

  to {
    left: 0%;
    transform: translate(-100%);
  }
`;

const commonStyles = css`
  position: absolute;
  white-space: nowrap;
  box-sizing: content-box;
  font-weight: bold;
  -webkit-text-stroke: 1px #000;
  /* text-stroke: 1px #000; */
`;

const ChatComponent: React.FC<Props> = ({
  className,
  frame,
  chat,
  playing,
  opacity = 1,
  opacityDanmaku = 1
}) => {
  const innerFrame = useLatest(frame, playing);

  const text = useMemo(
    () =>
      chat
        ? (chat.text || "")
            .split("\n")
            .map((s, i) => (i === 0 ? [s] : [<br />, s]))
            .reduce((a, b) => [...a, ...b], [])
        : null,
    [chat]
  );

  const styles = useMemo(
    () =>
      chat
        ? css`
            line-height: ${lh};
            color: ${chat.color};
            font-size: ${chat.fontSize / lh}px;
            opacity: ${chat.danmaku ? opacityDanmaku : opacity};
            top: ${chat.y}px;
            ${chat.ueshita &&
              css`
                left: 50%;
                transform: translateX(-50%);
              `}
          `
        : undefined,
    [chat, opacity, opacityDanmaku]
  );

  const animatonStyles = useMemo(() => {
    if (!chat || chat.ueshita) return undefined;
    const x = (innerFrame - chat.vpos) / chat.duration;
    return playing
      ? css`
          animation: ${animation} ${chat.duration}ms linear 1 forwards;
          animation-delay: -${innerFrame - chat.vpos}ms;
        `
      : css`
          left: ${(1 - x) * 100}%;
          transform: translateX(${x * -100}%);
        `;
  }, [chat, innerFrame, playing]);

  return (
    <div className={className} css={[commonStyles, styles, animatonStyles]}>
      {text}
    </div>
  );
};

export default ChatComponent;
