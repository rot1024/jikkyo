/** @jsx jsx */
import React from "react";
import { css, jsx } from "@emotion/core";
import useTransition from "@rot1024/use-transition";

export interface Props {
  className?: string;
  shown?: boolean;
  onClose?: () => void;
}

const SettingPanel: React.FC<Props> = ({ className, shown, onClose }) => {
  const state = useTransition(!!shown, 1000, {
    mountOnEnter: true,
    unmountOnExit: true
  });

  return state === "unmounted" ? null : (
    <div
      className={className}
      onClick={onClose}
      css={css`
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: #000000aa;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: ${state === "entering" || state === "exiting"
          ? "all 1s ease-in-out"
          : ""};
        opacity: ${state === "entering" || state === "entered" ? 1 : 0};
      `}
    >
      <div css={css``}></div>
    </div>
  );
};

export default SettingPanel;
