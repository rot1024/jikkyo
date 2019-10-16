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
    id: "seekable",
    name: "Enable to seek with scroll",
    type: "check",
    defaultValue: true
  },
  {
    id: "limitComments",
    name: "Comment limtiation",
    type: "check",
    defaultValue: false
  },
  {
    id: "visibleCommentCount",
    type: "number",
    min: 0,
    max: 100,
    defaultValue: 30,
    when: ["limitComments", true]
  },
  {
    id: "devision",
    name: "Devision",
    type: "enum",
    enum: ["1", "2", "3", "5", "10"],
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
    id: "devision10",
    type: "enum",
    enum: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    defaultValue: "1",
    when: ["devision", "10"]
  },
  {
    id: "muteKeywords",
    type: "text",
    name: "Mute keywords",
    defaultValue: "",
    placeholder: "Regexp"
  },
  {
    id: "filterKeywords",
    type: "text",
    name: "Filter keywords",
    defaultValue: "",
    placeholder: "Regexp"
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
  cleanComment: boolean;
  coloriseComments: boolean;
  devision: "1" | "2" | "3" | "5" | "10";
  devision2: "1" | "2";
  devision3: "1" | "2" | "3";
  devision5: "1" | "2" | "3" | "4" | "5";
  devision10: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";
  muteKeywords: string;
  filterKeywords: string;
  limitComments: boolean;
  visibleCommentCount: number;
  seekable: boolean;
};

export type SettingsDebounced =
  | "sizeCalcMethod"
  | "rows"
  | "fontSize"
  | "commentDuration"
  | "ueShitaCommentDuration";
