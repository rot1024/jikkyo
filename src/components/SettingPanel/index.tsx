/** @jsx jsx */
import React, { useCallback, useRef } from "react";
import { css, jsx } from "@emotion/core";
import useTransition from "@rot1024/use-transition";
import { useHotkeys } from "react-hotkeys-hook";

import Form from "./Form";
import { settingSchema, Settings } from "./setting";
import useDebounce from "../../util/useDebounce";

export type Settings = Settings;

export interface Props {
  className?: string;
  shown?: boolean;
  initialSettings?: Settings;
  onChange?: (s: Settings) => void;
  onClose?: () => void;
  debounce?: boolean;
}

const SettingPanel: React.FC<Props> = ({
  className,
  shown,
  onClose,
  initialSettings,
  onChange,
  debounce
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

  const changedValue = useRef<Settings>({});
  const handleChange = useCallback((v: Settings) => {
    changedValue.current = v;
  }, []);
  useDebounce(changedValue.current, debounce ? 3000 : 0, onChange);

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
        font-size: 1.2rem;
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
          bottom: 4em;
          right: 1em;
          width: calc(100vw - 2em);
          max-width: 300px;
          height: calc(100vh - 5em);
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
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default SettingPanel;
