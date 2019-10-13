/** @jsx jsx */
import React, { useRef, useEffect } from "react";
import { css, jsx } from "@emotion/core";
import useComponentSize from "@rehooks/component-size";

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
  const { width, height } = useComponentSize(canvasRef);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
    ctx.lineWidth = 0.5;
    ctx.shadowColor = "rgba(0, 0, 0, 1)";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    for (const c of chats) {
      if (c.hidden || frame <= c.vpos || frame >= c.vpos + c.duration) continue;
      if (thinning && c.id % thinning[1] !== thinning[0] - 1) continue;
      ctx.font = `${styles.fontWeight || ""} ${
        c.fontSize
      }px ${styles.fontFamily || "sans-serif"}`;
      ctx.globalAlpha = c.danmaku ? opacityDanmaku : opacity;
      ctx.fillStyle = (colorize ? c.color2 : c.color) || "#fff";
      const x = (w + c.width) * (1 - (frame - c.vpos) / c.duration) - c.width;
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
