import React from "react";
import { css } from "@emotion/react";

export interface Props {
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  disabled?: boolean;
}

const Button: React.FC<Props> = ({ className, onClick, children, disabled }) => {
  return (
    <div
      className={className}
      onClick={disabled ? undefined : onClick}
      css={css`
        border: 1px solid #ffffff30;
        border-radius: 0.3em;
        color: ${disabled ? '#666' : '#aaa'};
        text-align: center;
        padding: 0.5em;
        font-size: 0.8rem;
        user-select: none;
        cursor: ${disabled ? 'not-allowed' : 'pointer'};
        transition: background-color 0.1s ease-in-out;
        opacity: ${disabled ? 0.5 : 1};

        &:hover {
          background-color: ${disabled ? 'transparent' : '#ffffff30'};
        }
      `}
    >
      {children}
    </div>
  );
};

export default Button;
