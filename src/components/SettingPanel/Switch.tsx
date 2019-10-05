/** @jsx jsx */
import React from "react";
import { css, jsx } from "@emotion/core";

export interface Props {
  className?: string;
  enum?: (string | [string, string])[];
  value?: string;
  onChange?: (key?: string) => void;
  canToggle?: boolean;
}

const Switch: React.FC<Props> = ({
  className,
  enum: enums,
  value,
  onChange,
  canToggle
}) => {
  if (!enums) return null;
  return (
    <div
      className={className}
      css={css`
        display: flex;
      `}
    >
      {enums.map(e => {
        const id = Array.isArray(e) ? e[0] : e;
        const label = Array.isArray(e) ? e[1] : e;
        const selected = value === id;
        return (
          <div
            key={id}
            onClick={() =>
              onChange &&
              (canToggle || !selected) &&
              onChange(canToggle && selected ? undefined : id)
            }
            css={css`
              flex: 1 0;
              background-color: ${selected ? "#ff9d00" : "transparent"};
              border: 1px solid ${selected ? "#ff9d00" : "#ffffff30"};
              border-left-style: none;
              color: ${selected ? "#333" : "#aaa"};
              padding: 0.5em;
              text-align: center;
              font-size: 0.8rem;
              user-select: none;
              cursor: pointer;
              transition: background-color 0.1s ease-in-out;

              &:first-of-type {
                border-radius: 0.3em 0 0 0.3em;
                border-left-style: solid;
              }

              &:last-of-type {
                border-radius: 0 0.3em 0.3em 0;
              }

              &:hover {
                ${!selected &&
                  css`
                    background-color: #ffffff30;
                  `}
              }
            `}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
};

export default Switch;
