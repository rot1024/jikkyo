/** @jsx jsx */
import React, { useRef } from "react";
import { css, jsx } from "@emotion/core";
import useComponentSize from "@rehooks/component-size";
import { useThrottle } from "react-use";

import ChatComponent from "./Chat";
import { Chat, ChatActualStyle } from "./util";

export interface Props {
  className?: string;
  chats?: Chat[];
  frame?: number;
  styles: ChatActualStyle;
  opacity?: number;
  opacityDanmaku?: number;
  thinning?: [number, number];
  colorize?: boolean;
  playing?: boolean;
}

const DOMRenderer: React.FC<Props> = ({
  className,
  chats = [],
  frame = 0,
  styles,
  opacity = 1,
  opacityDanmaku = 1,
  thinning,
  colorize,
  playing
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { width } = useComponentSize(ref);
  const screenWidth = useThrottle(width, 1000);

  return (
    <div ref={ref} className={className} css={wrapperStyles}>
      {chats.map(c => (
        <ChatComponent
          key={c.id}
          frame={frame}
          chat={c}
          playing={!!playing}
          styles={styles}
          screenWidth={screenWidth}
          opacity={opacity}
          opacityDanmaku={opacityDanmaku}
          hidden={
            !!c.hidden || (thinning && c.id % thinning[1] !== thinning[0] - 1)
          }
          colorize={!!colorize}
        />
      ))}
    </div>
  );
};

const wrapperStyles = css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

export default DOMRenderer;
