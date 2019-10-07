/** @jsx jsx */
import React, { useMemo } from "react";
import { css, jsx, keyframes } from "@emotion/core";

import { Chat, ChatActualStyle } from "./util";
import useLatest from "../../util/useLatest";

export interface Props {
  className?: string;
  frame: number;
  chat?: Chat;
  styles: ChatActualStyle;
  playing?: boolean;
}

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
  display: inline-block;
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
  styles
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

  const chatStyles = useMemo(
    () =>
      chat
        ? css`
            line-height: ${styles.lineHeight};
            color: ${chat.color};
            font-size: ${(chat.size === "big"
              ? styles.bigSizeScale
              : chat.size === "small"
              ? styles.smallSizeScale
              : 1) * 100}%;
            opacity: ${chat.danmaku ? styles.opacityDanmaku : styles.opacity};
            top: ${chat.y}px;
            ${chat.ueshita &&
              css`
                left: 50%;
                transform: translateX(-50%);
              `}
          `
        : undefined,
    [chat, styles]
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
    <div
      className={className}
      css={[commonStyles, chatStyles, animatonStyles]}
      data-width={chat && chat.width}
      data-height={chat && chat.height}
    >
      {text}
    </div>
  );
};

export default ChatComponent;
