import { useCallback, useRef, useMemo } from "react";
import { css } from "@emotion/react";
import { useHotkeys } from "react-hotkeys-hook";

import Form, { SettingValues } from "./Form";
import Button from "./Button";
import {
  settingSchema,
  Settings as SettingsType,
  defaultSettings,
  getSettings
} from "./setting";
import useDebounce from "../../util/useDebounce";

export type Settings = SettingsType;
export { defaultSettings };

export interface Props {
  className?: string;
  shown?: boolean;
  initialSettings?: SettingsType;
  debounce?: boolean;
  onChange?: (s: SettingsType) => void;
  onClose?: () => void;
  onVideoClose?: () => void;
  onCommentsClose?: () => void;
}

const SettingPanel: React.FC<Props> = ({
  className,
  shown,
  onClose,
  initialSettings,
  debounce,
  onChange,
  onVideoClose,
  onCommentsClose
}) => {
  // Animation state management removed for simplicity

  const handleOutsideClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onClose || e.target !== e.currentTarget) return;
      onClose();
    },
    [onClose]
  );

  const initialSettings2 = useMemo(() => getSettings(initialSettings), [
    initialSettings
  ]);
  const changedValue = useRef(initialSettings2[0]);
  const changedValueDebounced = useRef(initialSettings2[1]);
  const handleChange = useCallback(
    (v: SettingValues) => {
      const newSettings = getSettings(v as SettingsType);
      if (onChange) {
        onChange({
          ...newSettings[0],
          ...changedValueDebounced.current
        });
      }
      changedValue.current = newSettings[0];
      changedValueDebounced.current = newSettings[1];
    },
    [onChange]
  );
  const handleDebounce = useCallback(
    () =>
      onChange &&
      onChange({
        ...changedValue.current,
        ...changedValueDebounced.current
      }),
    [onChange]
  );
  useDebounce(
    changedValueDebounced.current,
    debounce ? 1000 : 0,
    handleDebounce
  );

  useHotkeys("esc", () => onClose && shown && onClose(), [
    onClose, shown
  ]);

  return (
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
        pointer-events: ${shown ? "auto" : "none"};
        transition: all 0.1s ease-in-out;
        opacity: ${shown ? 1 : 0};
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
          -webkit-overflow-scrolling: touch;
        `}
      >
        <Form
          schema={settingSchema}
          initialValues={initialSettings}
          onChange={handleChange}
        />
        <Button
          onClick={onVideoClose}
          css={css`
            margin-top: 1em;
          `}
        >
          Close video
        </Button>
        <Button
          onClick={onCommentsClose}
          css={css`
            margin-top: 1em;
          `}
        >
          Close comments
        </Button>
      </div>
    </div>
  );
};

export default SettingPanel;
