/** @jsx jsx */
import React, { useEffect, useRef, useState, useMemo } from "react";
import { css, jsx } from "@emotion/core";
import useComponentSize from "@rehooks/component-size";
import { useThrottle } from "react-use";

import useRequestAnimationFrame from "../../util/useRequestAnimationFrame";
import ChatComponent from "./Chat";
import { getVisibleChats, commentsToChats, Chat, Comment } from "./util";

export type Comment = Comment;

export interface Props {
  className?: string;
  comments?: Comment[];
  currentTime?: number;
  playing?: boolean;
  duration?: number;
  ueshitaDuration?: number;
  sizing?: "rows" | "fontSize";
  rows?: number;
  fontSize?: number;
  opacity?: number;
  opacityDanmaku?: number;
  visibleCommentCount?: number;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

const emptyComents: Comment[] = [];
const emptyChats: Chat[] = [];

const CommentArea: React.FC<Props> = ({
  className,
  playing,
  comments = emptyComents,
  currentTime = 0,
  duration = 5000,
  ueshitaDuration = 3000,
  sizing = "rows",
  rows = 10,
  fontSize = 36,
  opacity = 1,
  opacityDanmaku = 1,
  visibleCommentCount = Infinity,
  onClick,
  onDoubleClick
}) => {
  const [commentIdPrefix, setCommentIdPrefix] = useState(0);
  useEffect(() => {
    setCommentIdPrefix(i => i + 1);
  }, [comments]);
  const [chats, setChats] = useState(emptyChats);

  const ref = useRef<HTMLDivElement>(null);
  const height = useThrottle(useComponentSize(ref).height, 1000);
  const chatSize = sizing === "fontSize" ? fontSize : height / rows;

  useEffect(() => {
    if (height === 0) return;
    if (!comments || comments.length === 0) {
      setChats([]);
      return;
    }
    setChats(
      commentsToChats(comments, duration, ueshitaDuration, height, chatSize)
    );
  }, [chatSize, comments, duration, height, ueshitaDuration]);

  const prevTime = useRef(Date.now());
  const [frame, setFrame] = useState(currentTime);

  useEffect(() => {
    setFrame(currentTime);
    prevTime.current = Date.now();
  }, [currentTime]);

  useEffect(() => {
    if (playing) {
      prevTime.current = Date.now();
    }
  }, [playing]);

  useRequestAnimationFrame(() => {
    setFrame(f => f + Date.now() - prevTime.current);
    prevTime.current = Date.now();
  }, !!playing);

  const visibleChats = useMemo(
    () => getVisibleChats(chats, frame, duration).slice(-visibleCommentCount),
    [chats, duration, frame, visibleCommentCount]
  );

  return (
    <div
      className={className}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      ref={ref}
      css={css`
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      `}
    >
      {visibleChats.map(c => (
        <ChatComponent
          key={commentIdPrefix + "_" + c.id}
          frame={frame}
          chat={c}
          opacity={opacity}
          opacityDanmaku={opacityDanmaku}
          playing={playing}
        />
      ))}
    </div>
  );
};

export default CommentArea;
