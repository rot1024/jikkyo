import { createAction } from "redux-actions";

const prefix = "test";
const p = n => `${prefix}_${n}`;

export const a = createAction(p("a"));
