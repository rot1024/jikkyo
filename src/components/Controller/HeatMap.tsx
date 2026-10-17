import React, { useRef, useEffect } from "react";
import { css } from "@emotion/react";

import binarySearch from "../../util/binarySearch";

export interface Props {
  className?: string;
  influence?: number[];
}

const colors: [number, [number, number, number, number]][] = [
  [0, [0, 0, 0, 255]],
  [0.5, [0, 255, 0, 255]],
  [1, [255, 0, 0, 255]]
];

const getColor = (value: number, max: number, min: number) => {
  if (isNaN(value)) {
    return colors[0][1];
  }

  if (colors.length < 2) return colors[0][1];
  const v = Math.min(max, Math.max(min, value)) / (max - min);
  const i = binarySearch(colors, v, c => c[0]);
  if (i === 0) return colors[0][1];
  if (i >= colors.length) return colors[colors.length - 1][1];

  const prev = colors[i - 1];
  const color = colors[i];
  if (v === color[0]) return color[1];
  const r = (v - prev[0]) / (color[0] - prev[0]);

  return [
    Math.floor(color[1][0] * r + prev[1][0] * (1 - r)),
    Math.floor(color[1][1] * r + prev[1][1] * (1 - r)),
    Math.floor(color[1][2] * r + prev[1][2] * (1 - r)),
    Math.floor(color[1][3] * r + prev[1][3] * (1 - r))
  ] as [number, number, number, number];
};

// Draws one pixel per division; the canvas is stretched by CSS, and the
// browser's image smoothing interpolates colors between divisions.
const HeatMap: React.FC<Props> = ({ className, influence }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = Math.max(1, influence?.length ?? 0);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!influence || influence.length === 0) return;
    const max = influence.reduce((a, b) => (a < b ? b : a), 0);
    if (max === 0) return;

    const img = ctx.createImageData(influence.length, 1);
    // square root scale so that normal sections are still visible next to bursts
    const sqrtMax = Math.sqrt(max);
    influence.forEach((v, i) => {
      img.data.set(getColor(Math.sqrt(v), sqrtMax, 0), i * 4);
    });
    ctx.putImageData(img, 0, 0);
  }, [influence]);

  return (
    <div
      className={className}
      css={css`
        width: 100%;
        height: 100%;
      `}
    >
      <canvas
        ref={canvasRef}
        height={1}
        css={css`
          display: block;
          width: 100%;
          height: 100%;
        `}
      />
    </div>
  );
};

export default HeatMap;
