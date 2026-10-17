import React, { useRef, useEffect, useCallback } from "react";
import { css } from "@emotion/react";
import { useResizeObserver } from "use-resize-observer";

import { Chat, ChatActualStyle } from "./util";
import { ChatRenderer } from "./chatRenderer";

export interface Props {
  className?: string;
  // all laid-out chats sorted by vpos
  chats?: Chat[];
  // returns the current comment time (ms); read every animation frame while playing
  getFrame: () => number;
  // changes when the time is changed while paused (e.g. seek) to trigger a redraw
  frameHint?: number;
  playing?: boolean;
  styles: ChatActualStyle;
  opacity?: number;
  opacityDanmaku?: number;
  thinning?: [number, number];
  colorize?: boolean;
  visibleCommentCount?: number;
}

const Canvas2DRenderer: React.FC<Props> = ({
  className,
  chats = [],
  getFrame,
  frameHint,
  playing,
  styles,
  opacity = 1,
  opacityDanmaku = 1,
  thinning,
  colorize,
  visibleCommentCount = Infinity
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width = 0, height = 0 } = useResizeObserver({
    ref: canvasRef
  });
  const dpr = window.devicePixelRatio || 1;
  const renderer = useRef<ChatRenderer>(null);

  const draw = useCallback((complete: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!renderer.current) renderer.current = new ChatRenderer();
    renderer.current.draw(ctx, getFrame(), {
      chats,
      styles,
      width,
      height,
      dpr,
      opacity,
      opacityDanmaku,
      thinning,
      colorize,
      visibleCommentCount
    }, complete);
  }, [
    chats,
    colorize,
    dpr,
    getFrame,
    height,
    opacity,
    opacityDanmaku,
    styles,
    thinning,
    visibleCommentCount,
    width
  ]);

  useEffect(() => {
    if (!playing) {
      draw(true);
      return;
    }
    let handle = window.requestAnimationFrame(function loop() {
      draw(false);
      handle = window.requestAnimationFrame(loop);
    });
    return () => window.cancelAnimationFrame(handle);
    // redraw when the canvas is resized (canvas is cleared) or the time is changed while paused
  }, [draw, playing, frameHint]);

  return (
    <canvas
      className={className}
      css={canvaStyles}
      width={Math.round(width * dpr)}
      height={Math.round(height * dpr)}
      ref={canvasRef}
    />
  );
};

const canvaStyles = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
`;

export default Canvas2DRenderer;
