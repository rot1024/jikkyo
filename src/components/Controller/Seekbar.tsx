/** @jsx jsx */
import React, { useCallback, useRef } from "react";
import { css, jsx } from "@emotion/core";

import { useDrag, useHover } from "./useDrag";
import HeatMap from "./HeatMap";

export interface Props {
  className?: string;
  value?: number;
  max?: number;
  buffered?: [number, number][];
  disabled?: boolean;
  influence?: number[];
  onChange?: (value: number) => void;
}

const SeekBar: React.FC<Props> = ({
  className,
  value = 0,
  max = 0,
  buffered,
  disabled,
  influence,
  onChange
}) => {
  const ref = useRef<HTMLInputElement>(null);

  const [isDragging, handleDragStart] = useDrag(
    ref,
    useCallback(
      ({ x }: { x: number }) => {
        if (onChange) {
          onChange(Math.min(1, Math.max(0, x)) * max);
        }
      },
      [max, onChange]
    ),
    disabled
  );

  const [hovered, hoveredX] = useHover(ref, disabled);

  return (
    <div className={className} css={wrapperStyles}>
      <div
        ref={ref}
        css={rangeStyles(!!disabled)}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <div css={backgroundStyles}>
          <HeatMap influence={influence} />
          {buffered &&
            buffered.map(([s, e], i) => {
              return (
                <div
                  key={i}
                  css={bufferedBarStyles}
                  style={{
                    left: (max === 0 ? 0 : (s / max) * 100) + "%",
                    width: (max === 0 ? 0 : ((e - s) / max) * 100) + "%"
                  }}
                />
              );
            })}
          <div
            css={hoverBarStyles(hovered)}
            style={{ width: (max === 0 ? 0 : hoveredX * 100) + "%" }}
          />
          <div
            css={barStyles}
            style={{
              width: (max === 0 ? 0 : (value / max) * 100) + "%"
            }}
          />
        </div>
        <div
          css={thumbStyles(hovered || isDragging, !!disabled)}
          style={{
            left: (max === 0 ? 0 : (value / max) * 100) + "%"
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        />
      </div>
    </div>
  );
};

export default SeekBar;

const wrapperStyles = css`
  user-select: none;
  position: relative;
`;

const rangeStyles = (disabled: boolean) => css`
  user-select: none;
  width: 100%;
  height: 10px;
  position: absolute;
  top: 50%;
  margin-top: -5px;
  border-radius: 3px;
  cursor: ${disabled ? "default" : "pointer"};
`;

const backgroundStyles = css`
  user-select: none;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #ffffff20;
  border-radius: 3px 0 0 3px;
  overflow: hidden;
`;

const barStyles = css`
  user-select: none;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: #cccccc70;
  border-right: 3px solid #fff;
  box-sizing: border-box;
`;

const bufferedBarStyles = css`
  user-select: none;
  position: absolute;
  left: 0;
  height: 100%;
  background-color: #cccccc70;
  transition: background-color 0.2s ease;
`;

const hoverBarStyles = (hovered: boolean) => css`
  user-select: none;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: ${hovered ? "#cccccc80" : "transparent"};
  transition: background-color 0.2s ease;
`;

const thumbStyles = (hovered: boolean, disabled: boolean) => css`
  user-select: none;
  position: absolute;
  top: 50%;
  width: 18px;
  height: 18px;
  background-color: #ff9d00;
  border-radius: 50%;
  cursor: ${disabled ? "default" : "pointer"};
  transition: transform 0.2s ease, background-color 0.2s ease, opacity 0.2s ease;
  transform: translate(-50%, -50%) scale(${hovered ? "1" : "0"});
  opacity: ${hovered ? "100%" : "0%"};
`;
