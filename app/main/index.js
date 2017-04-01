import { app, BrowserWindow } from "electron";
import createStore from "./store";

const PORT = 3000;

// eslint-disable-next-line no-unused-vars
const store = createStore();

let win;

function createWindow() {
  win = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    transparent: true,
    hasShadow: false,
    frame: false
  });

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line node/no-unpublished-require
    require("electron-debug")();
    win.loadURL(`http://localhost:${PORT}/build/index.html`);
  } else {
    win.loadURL(`file://${__dirname}/index.html`);
  }

  win.webContents.on("did-finish-load", () => {
    win.show();
    win.focus();
  });

  win.on("closed", () => {
    win = null;
  });
}

app.on("ready", async () => {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line node/no-unpublished-require
    const installer = require("electron-devtools-installer");
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    const extensions = [
      "REACT_DEVELOPER_TOOLS",
      "REDUX_DEVTOOLS"
    ];
    await Promise.all(
      extensions.map(e => installer.default(installer[e], forceDownload))
    );
  }
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (win === null) {
    createWindow();
  }
});
