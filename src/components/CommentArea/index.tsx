/** @jsx jsx */
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback
} from "react";
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
export type CommentStyle = Partial<ChatStyle>;

export interface Props {
  className?: string;
  comments?: Comment[];
  currentTime?: number; // ms
  seekTime?: number;
  duration?: number;
  playing?: boolean;
  styles?: Partial<ChatStyle>;
  visibleCommentCount?: number;
  seekable?: boolean;
  opacity?: number;
  opacityDanmaku?: number;
  thinning?: [number, number];
  timeCorrection?: number;
  onSeek?: (t: number, relative?: boolean) => void;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

const emptyComents: Comment[] = [];
const emptyChats: Chat[] = [];
const scrollWidth = 1000000;

const CommentArea: React.FC<Props> = ({
  className,
  playing,
  comments = emptyComents,
  currentTime = 0,
  duration = 0,
  styles,
  visibleCommentCount = Infinity,
  seekable,
  opacity,
  opacityDanmaku,
  thinning,
  timeCorrection = 0,
  onClick,
  onDoubleClick,
  onSeek
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const seeker = useRef<HTMLDivElement>(null);
  const seekerPrevScroll = useRef(scrollWidth / 2);

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
    if (!seeker.current) return;
    seeker.current.scrollLeft = scrollWidth / 2;
  }, [duration]);

  useEffect(() => {
    if (playing) {
      prevTime.current = Date.now();
    }
  }, [playing]);

  useRequestAnimationFrame(() => {
    setFrame(f => f + Date.now() - prevTime.current);
    prevTime.current = Date.now();
  }, !!playing);

  const correctedFrame = frame + timeCorrection;
  const visibleChats = useMemo(
    () =>
      getVisibleChats(
        chats,
        correctedFrame,
        Math.max(innerStyles.duration, innerStyles.ueshitaDuration)
      ).slice(-visibleCommentCount),
    [
      chats,
      correctedFrame,
      innerStyles.duration,
      innerStyles.ueshitaDuration,
      visibleCommentCount
    ]
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!onSeek) return;
      onSeek(
        (e.currentTarget.scrollLeft - seekerPrevScroll.current) / 10,
        true
      );
      seekerPrevScroll.current = e.currentTarget.scrollLeft;
      const seekerTimeout = window.setTimeout(() => {
        if (!seeker.current) return;
        seekerPrevScroll.current = scrollWidth / 2;
        seeker.current.scrollLeft = scrollWidth / 2;
      }, 1000);
      return () => window.clearTimeout(seekerTimeout);
    },
    [onSeek]
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
          frame={correctedFrame}
          chat={c}
          playing={playing}
          styles={innerStyles}
          screenWidth={screenWidth}
          opacity={opacity}
          opacityDanmaku={opacityDanmaku}
          thinning={thinning}
        />
      ))}
      {seekable && (
        <div
          ref={seeker}
          onScroll={handleScroll}
          css={css`
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;

            &::-webkit-scrollbar {
              display: none;
            }
          `}
        >
          <div
            css={css`
              width: ${scrollWidth}px;
              height: 100%;
            `}
          />
        </div>
      )}
    </div>
  );
};

export default CommentArea;
