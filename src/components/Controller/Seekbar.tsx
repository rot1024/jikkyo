/** @jsx jsx */
import React, { useCallback } from "react";
import { css, jsx } from "@emotion/core";

export interface Props {
  className?: string;
  value?: number;
  max?: number;
  disabled?: boolean;
  onChange?: (value: number) => void;
}

const SeekBar: React.FC<Props> = ({
  className,
  value = 0,
  max = 0,
  disabled,
  onChange
}) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(parseFloat(e.currentTarget.value));
      }
    },
    [onChange]
  );

  return (
    <div
      className={className}
      css={css`
        position: relative;
      `}
    >
      <input
        type="range"
        value={value}
        max={max}
        min={0}
        disabled={disabled}
        onChange={handleChange}
        css={css`
          width: 100%;
          position: absolute;
          top: 50%;
          margin-top: -5px;
          height: 10px;
          appearance: none;
          outline: none;
          background: #ffffff20;

          &::-webkit-slider-thumb {
            width: 18px;
            height: 18px;
            background: #aaa;
            border: 1px solid #333;
            border-radius: 50%;
            cursor: pointer;
            transition: background 0.2s ease-in-out;
            appearance: none;

            &:hover {
              background: #bbb;
            }

            &:active {
              background: #ccc;
            }
          }

          &:disabled::-webkit-slider-thumb {
            background: #666;
            cursor: default;
          }
        `}
      />
    </div>
  );
};

export default SeekBar;
