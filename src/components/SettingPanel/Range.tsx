/** @jsx jsx */
import React from "react";
import { css, jsx } from "@emotion/core";

export interface Props {
  className?: string;
  value?: number;
  min?: number;
  max?: number;
  suffix?: string;
  step?: number;
  onValueClick?: () => void;
  onChange?: (v: number) => void;
}

const Range: React.FC<Props> = ({
  className,
  min,
  max,
  value,
  onChange,
  onValueClick,
  suffix,
  step
}) => {
  return (
    <div
      className={className}
      css={css`
        display: flex;
        align-items: center;
      `}
    >
      <input
        type="range"
        value={value}
        max={max}
        min={min}
        step={step}
        onChange={e => onChange && onChange(parseFloat(e.currentTarget.value))}
        css={css`
          flex: auto;
          width: 100%;
          box-sizing: border-box;
        `}
      />
      <div
        title={onValueClick ? "Click to reset value" : undefined}
        css={css`
          flex: 0 0;
          flex-basis: 3em;
          text-align: right;
          font-size: 0.8rem;
          color: #aaa;
          margin-left: 1em;
          transition: color 0.1s ease-in-out;
          user-select: none;
          ${onValueClick &&
            css`
              cursor: pointer;
            `}

          &:hover {
            ${onValueClick &&
              css`
                color: #fff;
              `}
          }
        `}
        onClick={onValueClick}
      >
        {value && suffix === "s" ? ~~(value / 1000) : value}
        {suffix}
      </div>
    </div>
  );
};

export default Range;
