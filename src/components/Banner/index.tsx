/** @jsx jsx */
import React, { useState, useEffect, useCallback } from "react";
import { css, jsx } from "@emotion/core";

export interface Props {
  className?: string;
  text?: string;
  error?: boolean;
  buttonText?: string;
  onButtonClick?: () => void;
}

const Banner: React.FC<Props> = ({
  className,
  children,
  buttonText,
  error,
  onButtonClick
}) => {
  const [visible, setVisible] = useState(!!children);

  useEffect(() => {
    setVisible(!!children);
  }, [children]);

  const handleClose = useCallback(() => setVisible(false), []);

  return (
    <div
      className={className}
      css={bannerStyles}
      style={{
        display: visible ? "" : "none",
        backgroundColor: error ? "#e06c75" : "#5495b0"
      }}
    >
      <div css={textStyles}>{children}</div>
      {buttonText && (
        <button css={buttonStyles} onClick={onButtonClick}>
          {buttonText}
        </button>
      )}
      <button css={closeButtonStyles} onClick={handleClose}>
        &times;
      </button>
    </div>
  );
};

const bannerStyles = css`
  display: flex;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 0.5em 1em;
  color: #fff;
`;

const textStyles = css`
  flex: auto;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;

const buttonStyles = css`
  padding: 0.2em 1em;
  cursor: pointer;
  background: transparent;
  color: inherit;
  font-size: inherit;
  border-radius: 0.3em;
  margin-left: 1em;
  border: 1px solid #fff;
  transition: background-color 0.1s ease;

  &:hover {
    background-color: #fff2;
  }
`;

const closeButtonStyles = css`
  padding: 0.2em 0.5em;
  cursor: pointer;
  background: transparent;
  color: inherit;
  font-size: inherit;
  border-radius: 0.3em;
  margin-left: 1em;
  border: none;
`;

export default Banner;
