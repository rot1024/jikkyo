import React, { useRef, useEffect, useCallback } from "react";
import { css } from "@emotion/react";
import { useResizeObserver } from "use-resize-observer";

import { Chat, ChatActualStyle, getVisibleChats } from "./util";

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

// space around the text for the shadow and stroke
const spritePadding = 4;

type Sprite = HTMLCanvasElement;

// Draws a chat once into an offscreen canvas. Drawing text with shadow and
// stroke is expensive, so each frame only blits these sprites.
const renderSprite = (
  c: Chat,
  styles: ChatActualStyle,
  colorize: boolean | undefined,
  dpr: number
): Sprite => {
  const sprite = document.createElement("canvas");
  sprite.width = Math.ceil((c.width + spritePadding * 2) * dpr);
  sprite.height = Math.ceil((c.height + spritePadding * 2) * dpr);
  const ctx = sprite.getContext("2d");
  if (!ctx) return sprite;

  ctx.scale(dpr, dpr);
  ctx.font = `${styles.fontWeight || ""} ${c.fontSize}px ${styles.fontFamily ||
    "sans-serif"}`.trim();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
  ctx.lineWidth = 0.5;
  ctx.shadowColor = "rgba(0, 0, 0, 1)";
  ctx.shadowBlur = 2;
  ctx.fillStyle = c.isHighlighted
    ? "#fff"
    : (colorize ? c.color2 : c.color) || "#fff";

  const lines = c.text.split("\n");
  const lineHeight = c.height / lines.length;
  lines.forEach((line, i) => {
    const y = spritePadding + i * lineHeight;
    ctx.fillText(line, spritePadding, y);
    ctx.strokeText(line, spritePadding, y);
  });
  return sprite;
};

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
  const sprites = useRef(new Map<Chat, Sprite>());

  // sprites depend on the appearance of chats
  useEffect(() => {
    sprites.current = new Map();
  }, [chats, styles, colorize, dpr]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (chats.length === 0) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const frame = getFrame();
    const [visible] = getVisibleChats(
      chats,
      frame,
      Math.max(styles.duration, styles.ueshitaDuration)
    );
    const targets = visible
      .filter(
        c =>
          !c.hidden &&
          frame > c.vpos &&
          (!thinning || c.id % thinning[1] === thinning[0] - 1)
      )
      .slice(-visibleCommentCount);

    const prevSprites = sprites.current;
    const nextSprites = new Map<Chat, Sprite>();

    for (const c of targets) {
      const x = c.ueshita
        ? (width - c.width) / 2
        : (width + c.width) * (1 - (frame - c.vpos) / c.duration) - c.width;

      if (c.isHighlighted && c.searchQuery) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = c.isCurrentResult ? "#ff6600" : "#cc4400";
        ctx.fillRect(x - 2, c.y - 2, c.width + 4, c.height + 4);
      }

      let sprite = prevSprites.get(c);
      if (!sprite) sprite = renderSprite(c, styles, colorize, dpr);
      nextSprites.set(c, sprite);

      ctx.globalAlpha = c.danmaku ? opacityDanmaku : opacity;
      ctx.drawImage(
        sprite,
        x - spritePadding,
        c.y - spritePadding,
        sprite.width / dpr,
        sprite.height / dpr
      );
    }

    // keep only sprites of chats on the screen
    sprites.current = nextSprites;
  }, [
    chats,
    colorize,
    dpr,
    getFrame,
    opacity,
    opacityDanmaku,
    styles,
    thinning,
    visibleCommentCount,
    width
  ]);

  useEffect(() => {
    if (!playing) {
      draw();
      return;
    }
    let handle = window.requestAnimationFrame(function loop() {
      draw();
      handle = window.requestAnimationFrame(loop);
    });
    return () => window.cancelAnimationFrame(handle);
    // redraw when the canvas is resized (canvas is cleared) or the time is changed while paused
  }, [draw, playing, frameHint, height]);

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
