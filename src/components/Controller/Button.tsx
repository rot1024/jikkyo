/** @jsx jsx */
import React from "react";
import { css, jsx } from "@emotion/core";
import { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause, faBars } from "@fortawesome/free-solid-svg-icons";

export type Icon = "play" | "pause" | "bars";

const icons: Record<Icon, IconDefinition> = {
  play: faPlay,
  pause: faPause,
  bars: faBars
};

export interface Props {
  className?: string;
  disabled?: boolean;
  icon?: Icon;
  highlightOnHover?: boolean;
  checked?: boolean;
  large?: boolean;
  onClick?: () => void;
}

const Button: React.FC<Props> = ({
  className,
  children,
  disabled,
  icon,
  highlightOnHover,
  checked,
  large,
  onClick
}) => {
  return (
    <button
      className={className}
      onClick={onClick}
      css={css`
        border: none;
        border-radius: 0.5em;
        padding: ${large ? "0.5em 1.5em" : "0.5em 0.7em"};
        font-size: 1.1rem;
        background: transparent;
        outline: none;
        color: ${checked ? "#ff9d00" : "#aaaaaaaa"};
        cursor: pointer;
        transition: color ease-in-out 0.2s;

        ${disabled
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
