import React, { useRef, useEffect } from "react";
import { css } from "@emotion/react";
import useResizeObserver from "use-resize-observer";

import { Chat, ChatActualStyle } from "./util";

export interface Props {
  className?: string;
  chats?: Chat[];
  frame?: number;
  styles: ChatActualStyle;
  opacity?: number;
  opacityDanmaku?: number;
  thinning?: [number, number];
  colorize?: boolean;
}

const Canvas2DRenderer: React.FC<Props> = ({
  className,
  chats = [],
  frame = 0,
  styles,
  opacity = 1,
  opacityDanmaku = 1,
  thinning,
  colorize
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width = 0, height = 0 } = useResizeObserver({
    ref: canvasRef
  });

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, w, h);
    
    // Early return if no chats to render
    if (chats.length === 0) return;
    
    // Set up context properties once
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
    ctx.lineWidth = 0.5;
    ctx.shadowColor = "rgba(0, 0, 0, 1)";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Filter visible chats first to reduce iterations
    const visibleChats = chats.filter(c => {
      if (c.hidden || frame <= c.vpos || frame >= c.vpos + c.duration) return false;
      if (thinning && c.id % thinning[1] !== thinning[0] - 1) return false;
      return true;
    });

    // Render visible chats
    for (const c of visibleChats) {
      ctx.font = `${styles.fontWeight || ""} ${c.fontSize}px ${styles.fontFamily || "sans-serif"}`;
      ctx.globalAlpha = c.danmaku ? opacityDanmaku : opacity;
      
      const x = c.ueshita
        ? (w - c.width) / 2
        : (w + c.width) * (1 - (frame - c.vpos) / c.duration) - c.width;

      // Highlight background for search results
      if (c.isHighlighted && c.searchQuery) {
        const bgColor = c.isCurrentResult ? "#ff6600" : "#cc4400"; // Orange highlight
        ctx.fillStyle = bgColor;
        ctx.fillRect(x - 2, c.y - 2, c.width + 4, c.height + 4);
      }

      // Text color
      if (c.isHighlighted) {
        ctx.fillStyle = "#fff"; // White text for highlighted comments
      } else {
        ctx.fillStyle = (colorize ? c.color2 : c.color) || "#fff";
      }
      
      ctx.fillText(c.text, x, c.y);
      ctx.strokeText(c.text, x, c.y);
    }
  }, [
    chats,
    frame,
    styles,
    opacity,
    opacityDanmaku,
    thinning,
    colorize,
    width,
    height
  ]);

  return (
    <canvas
      className={className}
      css={canvaStyles}
      width={width}
      height={height}
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
