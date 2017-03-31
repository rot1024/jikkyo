import { ipcRenderer } from "electron";
import { createStore, compose as reduxCompose } from "redux";
import { electronEnhancer } from "redux-electron-store";

import reducer from "../reducers";

// eslint-disable-next-line no-underscore-dangle
const compose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || reduxCompose;
const enhancer = compose(
  electronEnhancer()
);

export default initialState => {
  const store = createStore(reducer, initialState, enhancer);

  if (module.hot) {
    module.hot.accept("../reducers", () => {
      ipcRenderer.sendSync("reload-reducer");
      store.replaceReducer(reducer);
    });
  }

  return store;
};
