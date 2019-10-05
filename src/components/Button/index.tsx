/** @jsx jsx */
import React from "react";
import { css, jsx } from "@emotion/core";
import { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";

export type Icon = "play" | "pause";

const icons: Record<Icon, IconDefinition> = {
  play: faPlay,
  pause: faPause
};

export interface Props {
  className?: string;
  disable?: boolean;
  icon?: Icon;
  highlightOnHover?: boolean;
  checked?: boolean;
}

const Button: React.FC<Props> = ({
  className,
  children,
  disable,
  icon,
  highlightOnHover,
  checked
}) => {
  return (
    <button
      className={className}
      css={css`
        border: none;
        border-radius: 0.5em;
        padding: 0.8em 2em;
        font-size: 1rem;
        background: transparent;
        outline: none;
        color: ${checked ? "#ff9d00" : "#aaa"};
        cursor: pointer;
        transition: all ease-in-out 0.2s;

        ${disable
          ? null
          : css`
              &:hover {
                ${highlightOnHover
                  ? css`
                      background: #ffffff55;
                    `
                  : null}
                color: #fff;
              }

              &:active {
                ${highlightOnHover
                  ? css`
                      background: #ffffff22;
                    `
                  : null}
                color: #fff;
              }
            `}
      `}
    >
      {icon ? <FontAwesomeIcon icon={icons[icon]} /> : children}
    </button>
  );
};

export default Button;
