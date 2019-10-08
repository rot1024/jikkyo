/** @jsx jsx */
import React from "react";
import { css, jsx } from "@emotion/core";

export interface Props {
  className?: string;
  value?: string;
  suffix?: string;
  onChange?: (v: string) => void;
}

const Text: React.FC<Props> = ({ className, value, onChange, suffix }) => {
  return (
    <div
      className={className}
      css={css`
        display: flex;
        align-items: center;
      `}
    >
      <input
        type="text"
        value={value}
        onChange={e => onChange && onChange(e.currentTarget.value)}
        css={css`
          flex: auto;
          width: 100%;
          box-sizing: border-box;
          line-height: inherit;
          background-color: transparent;
          color: inherit;
          font-size: 0.9em;
          border-radius: 0.3em;
          border: 1px solid #aaa;
          padding: 0.3em;
        `}
      />
      {suffix}
    </div>
  );
};

export default Text;
