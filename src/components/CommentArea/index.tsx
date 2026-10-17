import {
  useEffect,
  useCallback,
  useRef,
  useState,
  useMemo,
  useImperativeHandle,
  forwardRef
} from "react";
import { css } from "@emotion/react";
import { useResizeObserver } from "use-resize-observer";

import Canvas2dRenderer from "./canvas2d";
import {
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
  // time (ms) synced on seek/pause; only used to trigger a redraw while paused
  currentTime?: number;
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
  // returns the precise current time (ms); called every animation frame while playing
  getCurrentTime: () => number;
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

  const getFrame = useCallback(
    () => getCurrentTime() + timeCorrection,
    [getCurrentTime, timeCorrection]
  );

  // Attributes that do not change with time are computed once here, not every frame
  const decoratedChats = useMemo(() => {
    if (!muteKeywords && !filterKeywords && searchResults.length === 0) {
      return chats;
    }
    // search results are indexes of `comments`
    const indexById = new Map(comments.map((c, i) => [c.id, i]));
    const results = new Set(searchResults);
    const current = searchResults[currentSearchIndex];
    return chats.map(c => {
      const index = indexById.get(c.id);
      const isHighlighted = index !== undefined && results.has(index);
      return {
        ...c,
        hidden:
          (muteKeywords && muteKeywords.test(c.text)) ||
          (filterKeywords && !filterKeywords.test(c.text)),
        isHighlighted,
        isCurrentResult: isHighlighted && index === current,
        searchQuery: isHighlighted ? searchQuery : ""
      };
    });
  }, [
    chats,
    comments,
    currentSearchIndex,
    filterKeywords,
    muteKeywords,
    searchQuery,
    searchResults
  ]);

  return (
    <div className={className} ref={wrapperRef} css={wrapperStyles}>
      <Canvas2dRenderer
        chats={decoratedChats}
        getFrame={getFrame}
        frameHint={currentTime + timeCorrection}
        playing={playing}
        visibleCommentCount={visibleCommentCount}
        styles={innerStyles}
        opacity={opacity}
        opacityDanmaku={opacityDanmaku}
        thinning={thinning}
        colorize={colorize}
      />
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
