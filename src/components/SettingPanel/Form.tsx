/** @jsx jsx */
import React, { useState, useCallback } from "react";
import { css, jsx } from "@emotion/core";

import Switch from "./Switch";
import Range from "./Range";

export type SettingSchema = ({
  id: string;
  name?: string;
  when?: [string, any];
} & (
  | {
      type: "number";
      min: number;
      max: number;
      step?: number;
      suffix?: string;
      defaultValue: number;
    }
  | {
      type: "enum";
      enum: ([string, string] | string)[];
      defaultValue: string;
    }
  | {
      type: "check";
      defaultValue?: boolean;
    }))[];

export type SettingValues = {
  [id: string]: number | boolean | string | undefined;
};

export interface Props {
  className?: string;
  schema?: SettingSchema;
  initialValues?: SettingValues;
  onChange?: (values: SettingValues) => void;
}

const Form: React.FC<Props> = ({
  className,
  schema,
  initialValues,
  onChange
}) => {
  const [values, setValues] = useState(initialValues);
  const handleChange = useCallback(
    (newValues: SettingValues) => {
      const nextValues = { ...values, ...newValues };
      setValues(nextValues);
      if (onChange) onChange(nextValues);
    },
    [onChange, values]
  );

  if (!schema) return null;
  return (
    <div className={className}>
      {schema.map(s => {
        if (s.when) {
          if (values && s.when[0] in values) {
            if (values[s.when[0]] !== s.when[1]) {
              return null;
            }
          } else {
            const whenId = s.when[0];
            const s2 = schema.find(s3 => s3.id === whenId);
            if (
              !s2 ||
              ((s2.type === "number" || s2.type === "enum") &&
                s2.defaultValue !== s.when[1])
            ) {
              return null;
            }
          }
        }

        return (
          <div
            key={s.id}
            css={css`
              margin-bottom: 1em;

              &:last-of-type {
                margin-bottom: 0;
              }
            `}
          >
            {s.type !== "check" && s.name && (
              <div
                css={css`
                  color: #aaa;
                  font-size: 0.8rem;
                  margin-bottom: 0.5em;
                `}
              >
                {s.name}
              </div>
            )}
            {s.type === "number" && (
              <Range
                value={
                  values && typeof values[s.id] === "number"
                    ? (values[s.id] as number)
                    : s.defaultValue
                }
                max={s.max}
                min={s.min}
                onChange={v => handleChange({ [s.id]: v })}
                onValueClick={() => handleChange({ [s.id]: s.defaultValue })}
                suffix={s.suffix}
              />
            )}
            {s.type === "enum" && (
              <Switch
                value={
                  values && typeof values[s.id] === "string"
                    ? (values[s.id] as string)
                    : s.defaultValue
                }
                enum={s.enum}
                onChange={v => handleChange({ [s.id]: v })}
              />
            )}
            {s.type === "check" && (
              <Switch
                value={
                  (values &&
                    typeof values[s.id] === "boolean" &&
                    !!values[s.id]) ||
                  s.defaultValue
                    ? s.id
                    : undefined
                }
                enum={[[s.id, s.name || s.id]]}
                canToggle
                onChange={v => handleChange({ [s.id]: !!v })}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Form;
