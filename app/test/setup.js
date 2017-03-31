// eslint-disable-next-line node/no-unpublished-import
import { jsdom } from "jsdom";

global.document = jsdom("<!doctype html><html><body></body></html>");
global.window = global.document.defaultView;
global.navigator = global.window.navigator;
global.window.localStorage = global.window.sessionStorage = {
  map: new Map(),
  getItem(key) {
    return this.map.get(key);
  },
  setItem(key, value) {
    this.map.set(key, value);
  },
  removeItem(key) {
    this.map.delete(key);
  },
};
