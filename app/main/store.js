import { ipcMain } from "electron";
import { createStore, compose } from "redux";
import { electronEnhancer } from "redux-electron-store";

import reducer from "../reducers";

const enhancer = compose(
  electronEnhancer()
);

export default initialState => {
  const store = createStore(reducer, initialState, enhancer);

  ipcMain.on("reload-reducer", event => {
    delete require.cache[require.resolve("../reducers")];
    store.replaceReducer(require("../reducers").default);
    event.returnValue = true;
  });

  return store;
};
