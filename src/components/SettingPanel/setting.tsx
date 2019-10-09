import { SettingSchema } from "./Form";

export const settingSchema: SettingSchema = [
  {
    id: "sizeCalcMethod",
    type: "enum",
    enum: [["rows", "Rows"], ["fontSize", "Font Size"]],
    defaultValue: "rows",
    debounce: true
  },
  {
    id: "rows",
    type: "number",
    min: 10,
    max: 50,
    when: ["sizeCalcMethod", "rows"],
    defaultValue: 10,
    debounce: true
  },
  {
    id: "fontSize",
    type: "number",
    min: 5,
    max: 50,
    when: ["sizeCalcMethod", "fontSize"],
    defaultValue: 32,
    debounce: true
  },
  {
    id: "commentDuration",
    type: "number",
    name: "Duration",
    suffix: "s",
    min: 500,
    max: 15000,
    step: 500,
    defaultValue: 5000,
    debounce: true
  },
  {
    id: "ueShitaCommentDuration",
    type: "number",
    name: "Duration (ue/shita)",
    suffix: "s",
    min: 500,
    max: 15000,
    step: 500,
    defaultValue: 3000,
    debounce: true
  },
  {
    id: "commentOpacity",
    type: "number",
    name: "Opacity",
    suffix: "%",
    min: 0,
    max: 100,
    step: 5,
    defaultValue: 100
  },
  {
    id: "danmakuCommentOpacity",
    type: "number",
    name: "Opacity (danmaku)",
    suffix: "%",
    min: 0,
    max: 100,
    step: 5,
    defaultValue: 80
  },
  {
    id: "commentTimeCorrection",
    type: "number",
    name: "Comment Time Correction",
    suffix: "s",
    min: -60 * 60 * 1000,
    max: 60 * 60 * 1000,
    step: 1000,
    defaultValue: 0
  },
  {
    id: "cleanComment",
    name: "Remove hashtags and URLs",
    type: "check",
    defaultValue: false
  },
  {
    id: "coloriseComments",
    name: "Colorize comments",
    type: "check",
    defaultValue: false
  },
  {
    id: "devision",
    name: "Devision",
    type: "enum",
    enum: ["1", "2", "3", "5"],
    defaultValue: "1"
  },
  {
    id: "devision2",
    type: "enum",
    enum: ["1", "2"],
    defaultValue: "1",
    when: ["devision", "2"]
  },
  {
    id: "devision3",
    type: "enum",
    enum: ["1", "2", "3"],
    defaultValue: "1",
    when: ["devision", "3"]
  },
  {
    id: "devision5",
    type: "enum",
    enum: ["1", "2", "3", "4", "5"],
    defaultValue: "1",
    when: ["devision", "5"]
  },
  {
    id: "muteKeywords",
    type: "text",
    name: "Mute keywords",
    defaultValue: ""
  }
];

export const defaultSettings = settingSchema.reduce(
  (a, b) => ({ ...a, [b.id]: b.defaultValue }),
  {} as Settings
);

export const defaultDebouncedSettings = settingSchema.reduce(
  (a, b) => (b.debounce ? { ...a, [b.id]: b.defaultValue } : a),
  {} as Pick<Settings, SettingsDebounced>
);

export const getSettings = (s?: Settings) =>
  settingSchema.reduce<
    [Exclude<Settings, SettingsDebounced>, Pick<Settings, SettingsDebounced>]
  >(
    (a, b) =>
      b.debounce
        ? [
            a[0],
            {
              ...a[1],
              [b.id]:
                typeof (s as any)[b.id] !== "undefined"
                  ? (s as any)[b.id]
                  : (defaultSettings as any)[b.id]
            }
          ]
        : [
            {
              ...a[0],
              [b.id]:
                typeof (s as any)[b.id] !== "undefined"
                  ? (s as any)[b.id]
                  : (defaultSettings as any)[b.id]
            },
            a[1]
          ],
    [{}, {}] as [
      Exclude<Settings, SettingsDebounced>,
      Pick<Settings, SettingsDebounced>
    ]
  );

export type Settings = {
  sizeCalcMethod: "rows" | "fontSize";
  rows: number;
  fontSize: number;
  commentDuration: number;
  ueShitaCommentDuration: number;
  commentOpacity: number;
  danmakuCommentOpacity: number;
  commentTimeCorrection: number;
  cleanComment: boolean;
  coloriseComments: boolean;
  devision: "1" | "2" | "3" | "5";
  devision2: "1" | "2";
  devision3: "1" | "2" | "3";
  devision5: "1" | "2" | "3" | "5";
};

export type SettingsDebounced =
  | "sizeCalcMethod"
  | "rows"
  | "fontSize"
  | "commentDuration"
  | "ueShitaCommentDuration";
