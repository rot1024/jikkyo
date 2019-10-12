/** @jsx jsx */
import React, { useRef, useEffect } from "react";
import { css, jsx } from "@emotion/core";

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

const HeatMap: React.FC<Props> = ({ className, influence }) => {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const w = canvasRef.current.width;
    ctx.clearRect(0, 0, w, canvasRef.current.height);
    if (!influence || influence.length === 0 || w === 0) return;
    const max = influence.reduce((a, b) => (a < b ? b : a), 0);
    if (max === 0) return;
    const img = ctx.getImageData(0, 0, w, canvasRef.current.height);

    let prev = -1;
    const band = w / influence.length;
    for (let i = 0; i < w; i++) {
      const k = Math.floor((i / w) * (influence.length - 1));
      let r = prev === k ? (band * (k + 1) - i) / band : 0;
      const currentColor = getColor(influence[k], max, 0);
      const nextColor = getColor(influence[k + 1], max, 0);
      const color = currentColor.map((c, i) => c * r + nextColor[i] * (1 - r));
      img.data.set(color, i * 4);
      prev = k;
    }

    ctx.putImageData(img, 0, 0);
  }, [influence]);

  return (
    <div
      ref={ref}
      className={className}
      css={css`
        width: 100%;
        height: 100%;
      `}
    >
      <canvas
        ref={canvasRef}
        width={100}
        height={1}
        css={css`
          display: block;
          width: 100%;
          height: 100%;
        `}
      />
      ;
    </div>
  );
};

export default HeatMap;
