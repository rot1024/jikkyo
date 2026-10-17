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
import { layoutChats } from "./layout";
import { TimeStore } from "../../util/timeStore";
import {
  Chat,
  Comment as CommentType,
  ChatStyle,
  getChatActualStyle,
  defaultChatStyle
} from "./util";
import { getCommentDensity, estimateRows } from "./autoRows";

export type Comment = CommentType;
export type CommentStyle = Partial<ChatStyle>;

export interface Props {
  className?: string;
  comments?: CommentType[];
  // time (ms) synced on seek/pause; only used to trigger a redraw while paused
  time: TimeStore;
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
    time,
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
  // the comment density is measured once when comments are loaded
  const density = useMemo(
    () =>
      getCommentDensity(comments, styles?.duration ?? defaultChatStyle.duration),
    [comments, styles?.duration]
  );
  const autoRows = useMemo(() => {
    const s = { ...defaultChatStyle, ...styles };
    return estimateRows(
      density,
      screenWidth,
      screenHeight,
      s.lineHeight,
      s.minRows,
      s.maxRows
    );
  }, [density, screenHeight, screenWidth, styles]);
  const innerStyles = useMemo(
    () => getChatActualStyle(styles, screenHeight, autoRows),
    [autoRows, screenHeight, styles]
  );

  // Layout input. Relayout of all comments is expensive, so when only the screen
  // size or styles change, it waits for the user's request unless auto remeasurement is on.
  const [layout, setLayout] = useState({
    comments,
    screenWidth,
    screenHeight,
    innerStyles
  });
  const layoutChanged =
    layout.screenWidth !== screenWidth ||
    layout.screenHeight !== screenHeight ||
    layout.innerStyles !== innerStyles;
  if (
    layout.comments !== comments ||
    (layoutChanged &&
      (autoCommentsRemeasurement ||
        layout.screenHeight === 0 ||
        comments.length === 0))
  ) {
    setLayout({ comments, screenWidth, screenHeight, innerStyles });
  }

  const remeasurementRequired = layoutChanged && comments.length > 0;
  useEffect(() => {
    if (remeasurementRequired && onCommentsRemeasurementRequire) {
      onCommentsRemeasurementRequire();
    }
  }, [remeasurementRequired, onCommentsRemeasurementRequire]);

  useImperativeHandle(
    ref,
    () => ({
      updateComment: () => {
        setLayout({ comments, screenWidth, screenHeight, innerStyles });
      }
    }),
    [comments, screenWidth, screenHeight, innerStyles]
  );

  const [chats, setChats] = useState(emptyChats);
  useEffect(() => {
    let cancelled = false;
    layoutChats(
      layout.comments,
      layout.screenWidth,
      layout.screenHeight,
      layout.innerStyles
    ).then(c => {
      if (!cancelled) setChats(c);
    });
    return () => {
      cancelled = true;
    };
  }, [layout]);

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
        time={time}
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
