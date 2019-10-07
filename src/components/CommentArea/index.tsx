/** @jsx jsx */
import React, { useEffect, useRef, useState, useMemo } from "react";
import { css, jsx } from "@emotion/core";
import useComponentSize from "@rehooks/component-size";
import { useThrottle } from "react-use";

import useRequestAnimationFrame from "../../util/useRequestAnimationFrame";
import ChatComponent from "./Chat";
import {
  getVisibleChats,
  commentsToChats,
  Chat,
  Comment,
  ChatStyle,
  getChatActualStyle
} from "./util";

export type Comment = Comment;

export interface Props {
  className?: string;
  comments?: Comment[];
  currentTime?: number;
  playing?: boolean;
  styles?: Partial<ChatStyle>;
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
  styles,
  visibleCommentCount = Infinity,
  onClick,
  onDoubleClick
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const size = useComponentSize(ref);
  const screenWidth = useThrottle(size.width, 1000);
  const screenHeight = useThrottle(size.height, 1000);
  const innerStyles = useMemo(() => getChatActualStyle(styles, screenHeight), [
    screenHeight,
    styles
  ]);

  const [commentIdPrefix, setCommentIdPrefix] = useState(0);
  useEffect(() => {
    setCommentIdPrefix(i => i + 1);
  }, [comments]);
  const [chats, setChats] = useState(emptyChats);

  useEffect(() => {
    if (screenHeight === 0) return;
    if (!comments || comments.length === 0) {
      setChats([]);
      return;
    }
    setChats(commentsToChats(comments, screenWidth, screenHeight, innerStyles));
  }, [comments, screenWidth, screenHeight, innerStyles]);

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
    () =>
      getVisibleChats(
        chats,
        frame,
        Math.max(innerStyles.duration, innerStyles.ueshitaDuration)
      ).slice(-visibleCommentCount),
    [
      chats,
      frame,
      innerStyles.duration,
      innerStyles.ueshitaDuration,
      visibleCommentCount
    ]
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
          playing={playing}
          styles={innerStyles}
        />
      ))}
    </div>
  );
};

export default CommentArea;
