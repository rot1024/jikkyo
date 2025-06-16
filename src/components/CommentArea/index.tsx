import {
  useEffect,
  useRef,
  useState,
  useMemo,
  useImperativeHandle,
  forwardRef
} from "react";
import { css } from "@emotion/react";
import useResizeObserver from "use-resize-observer";

import useRequestAnimationFrame from "../../util/useRequestAnimationFrame";
import Canvas2dRenderer from "./canvas2d";
import {
  getVisibleChats,
  commentsToChats,
  Chat,
  Comment as CommentType,
  ChatStyle,
  getChatActualStyle
} from "./util";

export type Comment = CommentType;
export type CommentStyle = Partial<ChatStyle>;

export interface Props {
  className?: string;
  comments?: CommentType[];
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
  searchResults?: number[];
  currentSearchIndex?: number;
  searchQuery?: string;
}

export interface Ref {
  updateComment: () => void;
}

const emptyComents: CommentType[] = [];
const emptyChats: Chat[] = [];

const CommentArea = forwardRef<Ref, Props>((
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
    getCurrentTime,
    searchResults = [],
    currentSearchIndex = -1,
    searchQuery = ""
  },
  ref
) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { width: screenWidth = 0, height: screenHeight = 0 } = useResizeObserver({
    ref: wrapperRef
  });
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

  useImperativeHandle(
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
    // Reset buffer when comments are cleared
    if (comments.length === 0) {
      bufferedCommentLength.current = 0;
      return;
    }
    
    const isNewCommentFile = bufferedCommentLength.current === 0 && comments.length > 0;
    
    if (
      comments.length > 0 &&
      bufferedCommentLength.current > 0 &&
      !autoCommentsRemeasurement &&
      !isNewCommentFile
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
  const lastRenderTime = useRef(Date.now());
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
    const now = Date.now();
    
    if (getCurrentTime) {
      // For video playback, limit comment frame updates to 60fps to maintain video performance
      if (now - lastRenderTime.current >= 16) { // ~60fps
        setFrame(getCurrentTime());
        lastRenderTime.current = now;
      }
      return;
    }
    
    setFrame(
      f => f + (now - prevTime.current) * timeDelayCorrection.current
    );
    prevTime.current = now;
  }, !!playing && !manual);

  const correctedFrame = frame + timeCorrection;
  const [visibleChats, setVisibleChats] = useState<Chat[]>([]);
  useEffect(() => {
    const [newVisibleChats] = getVisibleChats(
      chats,
      correctedFrame,
      Math.max(innerStyles.duration, innerStyles.ueshitaDuration)
    );

    setVisibleChats(
      newVisibleChats.slice(-visibleCommentCount).map((c) => {
        let isHighlighted = false;
        let isCurrentResult = false;
        let searchQueryForComment = "";
        
        // Only perform search-related calculations if there are search results
        if (searchResults.length > 0) {
          const originalIndex = comments.findIndex(comment => comment.id === c.id);
          isHighlighted = searchResults.includes(originalIndex);
          isCurrentResult = searchResults[currentSearchIndex] === originalIndex;
          searchQueryForComment = isHighlighted ? searchQuery : "";
        }
        
        return {
          ...c,
          hidden:
            (muteKeywords && muteKeywords.test(c.text)) ||
            (filterKeywords && !filterKeywords.test(c.text)),
          isHighlighted,
          isCurrentResult,
          searchQuery: searchQueryForComment
        };
      })
    );
  }, [
    chats,
    correctedFrame,
    filterKeywords,
    innerStyles.duration,
    innerStyles.ueshitaDuration,
    muteKeywords,
    visibleCommentCount,
    searchResults,
    currentSearchIndex,
    searchQuery,
    comments
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
});

const wrapperStyles = css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

export default CommentArea;
