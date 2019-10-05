/** @jsx jsx */
import React, { useCallback } from "react";
import { css, jsx } from "@emotion/core";
import useTransition from "@rot1024/use-transition";
import { useHotkeys } from "react-hotkeys-hook";

import Form from "./Form";
import { settingSchema, Settings } from "./setting";

export type Settings = Settings;

export interface Props {
  className?: string;
  shown?: boolean;
  initialSettings?: Settings;
  onChange?: (s: Settings) => void;
  onClose?: () => void;
}

const SettingPanel: React.FC<Props> = ({
  className,
  shown,
  onClose,
  initialSettings,
  onChange
}) => {
  const state = useTransition(!!shown, 100, {
    mountOnEnter: true,
    unmountOnExit: true
  });

  const handleOutsideClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onClose || e.target !== e.currentTarget) return;
      onClose();
    },
    [onClose]
  );
  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);
  useHotkeys("esc", handleClose);

  return state === "unmounted" ? null : (
    <div
      className={className}
      onClick={handleOutsideClick}
      css={css`
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: ${state === "entering" || state === "exiting"
          ? "all 0.1s ease-in-out"
          : ""};
        opacity: ${state === "entering" || state === "entered" ? 1 : 0};
      `}
    >
      <div
        className={className}
        css={css`
          position: absolute;
          bottom: 5em;
          right: 1em;
          width: calc(100vw - 2em);
          max-width: 250px;
          height: calc(100vh - 6em);
          max-height: 450px;
          background-color: #333;
          border-radius: 0.3em;
          overflow-y: auto;
          padding: 1em;
          box-shadow: 0 3px 20px #000000aa;
        `}
      >
        <Form
          schema={settingSchema}
          initialValues={initialSettings}
          onChange={onChange}
        />
      </div>
    </div>
  );
};

export default SettingPanel;
