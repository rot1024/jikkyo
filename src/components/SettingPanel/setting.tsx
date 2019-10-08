import { SettingSchema } from "./Form";

export const settingSchema: SettingSchema = [
  {
    id: "sizeCalcMethod",
    type: "enum",
    enum: [["rows", "Rows"], ["fontSize", "Font Size"]],
    defaultValue: "rows"
  },
  {
    id: "rows",
    type: "number",
    min: 10,
    max: 50,
    when: ["sizeCalcMethod", "rows"],
    defaultValue: 10
  },
  {
    id: "fontSize",
    type: "number",
    min: 5,
    max: 50,
    when: ["sizeCalcMethod", "fontSize"],
    defaultValue: 32
  },
  {
    id: "commentDuration",
    type: "number",
    name: "Duration",
    suffix: "s",
    min: 500,
    max: 15000,
    step: 500,
    defaultValue: 5000
  },
  {
    id: "ueShitaCommentDuration",
    type: "number",
    name: "Duration (ue/shita)",
    suffix: "s",
    min: 500,
    max: 15000,
    step: 500,
    defaultValue: 3000
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
    min: -3600000,
    max: 3600000,
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
