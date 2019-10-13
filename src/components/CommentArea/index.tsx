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

import useRequestAnimationFrame from "../../util/useRequestAnimationFrame";
import Canvas2dRenderer from "./canvas2d";
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
  manual?: boolean;
  getCurrentTime?: () => number;
  onCommentsRemeasurementRequire?: () => void;
}

export interface Ref {
  updateComment: () => void;
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
    onCommentsRemeasurementRequire,
    manual,
    getCurrentTime
  },
  ref
) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { width: screenWidth, height: screenHeight } = useComponentSize(
    wrapperRef
  );
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

  useImperativeHandle<any, Ref>(
    ref,
    () => ({
      updateComment: () => {
        setBufferedComment({
          comments,
          screenWidth,
          screenHeight,
          innerStyles
        });
      }
    }),
    [comments, screenWidth, screenHeight, innerStyles]
  );

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

  const timeDelayCorrection = useRef(1);
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
    nextVpos.current = -1;
  }, [playing]);

  useRequestAnimationFrame(() => {
    if (getCurrentTime) {
      setFrame(getCurrentTime());
      return;
    }
    setFrame(
      f => f + (Date.now() - prevTime.current) * timeDelayCorrection.current
    );
    prevTime.current = Date.now();
  }, !!playing && !manual);

  const correctedFrame = frame + timeCorrection;
  const nextVpos = useRef(-1);
  const [visibleChats, setVisibleChats] = useState<Chat[]>([]);
  useEffect(() => {
    if (playing && nextVpos.current >= 0 && correctedFrame < nextVpos.current) {
      return;
    }

    const [newVisibleChats, end] = getVisibleChats(
      chats,
      correctedFrame,
      Math.max(innerStyles.duration, innerStyles.ueshitaDuration)
    );

    setVisibleChats(
      newVisibleChats.slice(-visibleCommentCount).map(c => ({
        ...c,
        hidden:
          (muteKeywords && muteKeywords.test(c.text)) ||
          (filterKeywords && !filterKeywords.test(c.text))
      }))
    );

    const next = chats[end];
    nextVpos.current = next ? next.vpos : -1;
  }, [
    chats,
    correctedFrame,
    filterKeywords,
    frame,
    innerStyles.duration,
    innerStyles.ueshitaDuration,
    muteKeywords,
    playing,
    visibleCommentCount
  ]);

  return (
    <div className={className} ref={wrapperRef} css={wrapperStyles}>
      <Canvas2dRenderer
        frame={correctedFrame}
        chats={visibleChats}
        styles={innerStyles}
        opacity={opacity}
        opacityDanmaku={opacityDanmaku}
        thinning={thinning}
        colorize={colorize}
      />
      {/* <DOMRenderer
        frame={correctedFrame}
        chats={visibleChats}
        playing={playing}
        styles={innerStyles}
        opacity={opacity}
        opacityDanmaku={opacityDanmaku}
        thinning={thinning}
        colorize={colorize}
      /> */}
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

export default forwardRef<Ref, Props>(CommentArea);
