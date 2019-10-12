/** @jsx jsx */
import React, { useMemo } from "react";
import { css, jsx, keyframes } from "@emotion/core";

import { Chat, ChatActualStyle } from "./util";
import useLatest from "../../util/useLatest";

export interface Props {
  className?: string;
  frame?: number;
  chat?: Chat;
  styles: ChatActualStyle;
  playing?: boolean;
  screenWidth: number;
  opacity?: number;
  opacityDanmaku?: number;
  colorize?: boolean;
  hidden?: boolean;
}

const commonStyles = css`
  display: inline-block;
  position: absolute;
  white-space: nowrap;
  box-sizing: content-box;
  font-weight: bold;
  user-select: none;
  -webkit-text-stroke: 1px #000;
  /* text-stroke: 1px #000; */
`;

const ChatComponent: React.FC<Props> = ({
  className,
  frame = 0,
  chat,
  playing,
  styles,
  screenWidth,
  opacity = 1,
  opacityDanmaku = 0.4,
  colorize,
  hidden
}) => {
  const innerFrame = useLatest(frame, playing);

  const text = useMemo(
    () =>
      chat
        ? (chat.text || "")
            .split("\n")
            .map((s, i) => (i === 0 ? [s] : [<br key={i} />, s]))
            .reduce((a, b) => [...a, ...b], [])
        : null,
    [chat]
  );

  const chatStyles = useMemo(
    () =>
      chat
        ? css`
            line-height: ${styles.lineHeight};
            color: ${colorize ? chat.color2 : chat.color};
            font-size: ${chat.fontSize}px;
            opacity: ${chat.danmaku ? opacityDanmaku : opacity};
            top: ${chat.y}px;
            ${chat.ueshita
              ? css`
                  left: 50%;
                  transform: translateX(-50%);
                `
              : css`
                  left: 100%;
                `}
          `
        : undefined,
    [chat, colorize, opacity, opacityDanmaku, styles.lineHeight]
  );

  const chatW = chat ? chat.width : 0;
  const animation = useMemo(
    () => keyframes`
    from {
      transform: translate3d(0, 0, 0);
    }

    to {
      transform: translate3d(-${
        chatW === 0 ? 0 : ((screenWidth + chatW) / chatW) * 100
      }%, 0, 0);
    }
    `,
    [chatW, screenWidth]
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
  }, [animation, chat, innerFrame, playing]);

  return (
    <div
      className={className}
      css={[commonStyles, chatStyles, animatonStyles]}
      style={{ visibility: hidden ? "hidden" : "visible" }}
    >
      {text}
    </div>
  );
};

export default React.memo(ChatComponent);
