/** @jsx jsx */
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useImperativeHandle,
  forwardRef
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
  playing?: boolean;
  styles?: Partial<ChatStyle>;
  visibleCommentCount?: number;
  opacity?: number;
  opacityDanmaku?: number;
  thinning?: [number, number];
  timeCorrection?: number;
  colorize?: boolean;
  muteKeywords?: RegExp;
  filterKeywords?: RegExp;
  autoCommentsRemeasurement?: boolean;
  onCommentsRemeasurementRequire?: () => void;
}

const emptyComents: Comment[] = [];
const emptyChats: Chat[] = [];

const CommentArea: React.FC<Props> = (
  {
    className,
    playing,
    comments = emptyComents,
    currentTime = 0,
    styles,
    visibleCommentCount = Infinity,
    opacity,
    opacityDanmaku,
    thinning,
    timeCorrection = 0,
    colorize,
    muteKeywords,
    filterKeywords,
    autoCommentsRemeasurement,
    onCommentsRemeasurementRequire
  },
  ref
) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const size = useComponentSize(wrapperRef);
  const screenWidth = useThrottle(size.width, 1000);
  const screenHeight = useThrottle(size.height, 1000);
  const innerStyles = useMemo(() => getChatActualStyle(styles, screenHeight), [
    screenHeight,
    styles
  ]);

  const [chats, setChats] = useState(emptyChats);
  const bufferedCommentLength = useRef(0);
  const [bufferedComment, setBufferedComment] = useState({
    comments,
    screenWidth,
    screenHeight,
    innerStyles
  });

  useImperativeHandle(ref, () => ({
    updateComment: () => {
      setBufferedComment({
        comments,
        screenWidth,
        screenHeight,
        innerStyles
      });
    }
  }));

  useEffect(() => {
    if (
      comments.length > 0 &&
      bufferedCommentLength.current > 0 &&
      !autoCommentsRemeasurement
    ) {
      if (onCommentsRemeasurementRequire) {
        onCommentsRemeasurementRequire();
      }
      return;
    }

    setBufferedComment({
      comments,
      screenWidth,
      screenHeight,
      innerStyles
    });
    bufferedCommentLength.current = comments.length;
  }, [
    comments,
    screenWidth,
    screenHeight,
    innerStyles,
    autoCommentsRemeasurement,
    onCommentsRemeasurementRequire
  ]);

  useEffect(() => {
    if (bufferedComment.screenHeight === 0) return;
    if (!bufferedComment.comments || bufferedComment.comments.length === 0) {
      setChats([]);
      return;
    }
    setChats(
      commentsToChats(
        bufferedComment.comments,
        bufferedComment.screenWidth,
        bufferedComment.screenHeight,
        bufferedComment.innerStyles
      )
    );
  }, [
    bufferedComment.comments,
    bufferedComment.innerStyles,
    bufferedComment.screenHeight,
    bufferedComment.screenWidth
  ]);

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

  const correctedFrame = frame + timeCorrection;
  const visibleChats = useMemo(
    () =>
      getVisibleChats(
        chats,
        correctedFrame,
        Math.max(innerStyles.duration, innerStyles.ueshitaDuration)
      )
        .slice(-visibleCommentCount)
        .map(c => ({
          ...c,
          hidden:
            (muteKeywords && muteKeywords.test(c.text)) ||
            (filterKeywords && !filterKeywords.test(c.text))
        })),
    [
      chats,
      correctedFrame,
      filterKeywords,
      innerStyles.duration,
      innerStyles.ueshitaDuration,
      muteKeywords,
      visibleCommentCount
    ]
  );

  return (
    <div className={className} ref={wrapperRef} css={wrapperStyles}>
      {visibleChats.map(c => (
        <ChatComponent
          key={c.id}
          frame={correctedFrame}
          chat={c}
          playing={playing}
          styles={innerStyles}
          screenWidth={screenWidth}
          opacity={opacity}
          opacityDanmaku={opacityDanmaku}
          hidden={
            c.hidden || (thinning && c.id % thinning[1] !== thinning[0] - 1)
          }
          colorize={colorize}
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

export default forwardRef<
  {
    updateComment: () => void;
  },
  Props
>(CommentArea);
