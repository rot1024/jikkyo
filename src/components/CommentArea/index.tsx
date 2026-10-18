import React, { useEffect, useCallback, useRef, useState, useMemo } from "react";
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
  // returns the precise current time (ms); called every animation frame while playing
  getCurrentTime: () => number;
  searchResults?: number[];
  currentSearchIndex?: number;
  searchQuery?: string;
}

const emptyComents: CommentType[] = [];
const emptyChats: Chat[] = [];

// comments are laid out again when resizing stops for this time (ms)
const resizeDebounce = 200;

const CommentArea: React.FC<Props> = ({
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
    getCurrentTime,
    searchResults = [],
    currentSearchIndex = -1,
    searchQuery = ""
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { width: screenWidth = 0, height: screenHeight = 0 } = useResizeObserver({
    ref: wrapperRef
  });
  // The screen size used for the layout follows the actual size after resizing
  // stops, as laying out all comments on every resize event would be wasteful.
  // The first size is applied immediately.
  const [size, setSize] = useState({ width: screenWidth, height: screenHeight });
  if (size.height === 0 && screenHeight > 0) {
    setSize({ width: screenWidth, height: screenHeight });
  }
  useEffect(() => {
    if (size.width === screenWidth && size.height === screenHeight) return;
    const timer = window.setTimeout(
      () => setSize({ width: screenWidth, height: screenHeight }),
      resizeDebounce
    );
    return () => window.clearTimeout(timer);
  }, [screenWidth, screenHeight, size]);

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
      size.width,
      size.height,
      s.lineHeight,
      s.minRows,
      s.maxRows
    );
  }, [density, size, styles]);
  const innerStyles = useMemo(
    () => getChatActualStyle(styles, size.height, autoRows),
    [autoRows, size.height, styles]
  );

  // Laid out again whenever comments, the screen size or styles change.
  // Settings that affect styles are already debounced in the setting panel.
  const [chats, setChats] = useState(emptyChats);
  useEffect(() => {
    let cancelled = false;
    layoutChats(comments, size.width, size.height, innerStyles).then(c => {
      if (!cancelled) setChats(c);
    });
    return () => {
      cancelled = true;
    };
  }, [comments, size, innerStyles]);

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
};

const wrapperStyles = css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

export default CommentArea;
