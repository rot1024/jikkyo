/** @jsx jsx */
import React from "react";
import { css, jsx } from "@emotion/core";

export interface Props {
  className?: string;
  onClick?: () => void;
}

const Button: React.FC<Props> = ({ className, onClick, children }) => {
  return (
    <div
      className={className}
      onClick={onClick}
      css={css`
        border: 1px solid #ffffff30;
        border-radius: 0.3em;
        color: #aaa;
        text-align: center;
        padding: 0.5em;
        font-size: 0.8rem;
        user-select: none;
        cursor: pointer;
        transition: background-color 0.1s ease-in-out;

        &:hover {
          background-color: #ffffff30;
        }
      `}
    >
      {children}
    </div>
  );
};

export default Button;
