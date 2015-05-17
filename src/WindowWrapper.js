(() => {
  "use strict";

  var gui = require("nw.gui"),
      win = gui.Window.get(),
      winp = document.getElementById("windowp"),
      clickthrough = false;

  if (gui.App.argv.indexOf("--disable-gpu") >= 0 &&
      gui.App.argv.indexOf("--force-cpu-draw") >= 0) {
    clickthrough = true;
  }

  var WindowWrapper = {
    defaultWidth: 800,
    defaultHeight: 520,
    minWidth: 450,
    minHeight: 100,
    clickthrough: clickthrough,
    beforeMaximize: false,
    xBeforeMaximize: 0,
    yBeforeMaximize: 0,
    wBeforeMaximize: 0,
    hBeforeMaximize: 0,
    maximized: false,
    get x() {
      return clickthrough ? parseInt(winp.style.left) : win.x;
    },
    get y() {
      return clickthrough ? parseInt(winp.style.top) : win.y;
    },
    get width() {
      return clickthrough ? parseInt(winp.style.width) : win.width;
    },
    get height() {
      return clickthrough ? parseInt(winp.style.height) : win.height;
    },
    set x(x) {
      if (clickthrough)
        winp.style.left = x + "px";
      else
        win.x = x;
    },
    set y(y) {
      if (clickthrough)
        winp.style.top = y + "px";
      else
        win.y = y;
    },
    set width(w) {
      if (clickthrough)
        winp.style.width = Math.max(this.minWidth, w) + "px";
      else
        win.width = w;
    },
    set height(h) {
      if (clickthrough)
        winp.style.height = Math.max(this.minHeight, h) + "px";
      else
        win.height = h;
    },
    moveTo(x, y) {
      if (clickthrough) {
        this.x = x;
        this.y = y;
      } else {
        win.moveTo(x, y);
      }
    },
    moveBy(x, y) {
      if (clickthrough) {
        this.x += x;
        this.y += y;
      } else {
        win.moveBy(x, y);
      }
    },
    resizeTo(w, h) {
      if (clickthrough) {
        this.width = w;
        this.height = h;
        win.emit("resize", w, h);
      } else {
        win.resizeTo(Math.max(this.minWidth, w), Math.max(this.minHeight, h));
      }
    },
    resizeBy(w, h) {
      if (clickthrough) {
        this.width += w;
        this.height += h;
        win.emit("resize", w, h);
      } else {
        win.resizeTo(
          Math.max(this.minWidth, w) + win.width,
          Math.max(this.minHeight, h) + win.height);
      }
    },
    resize(x, y, w, h) {
      this.moveTo(x, y);
      this.resizeTo(w, h);
    },
    maximize() {
      if (this.maximized) return;
      this.beforeMaximize = true;
      this.xBeforeMaximize = this.x;
      this.yBeforeMaximize = this.y;
      this.wBeforeMaximize = this.width;
      this.hBeforeMaximize = this.height;
      if (clickthrough) {
        this.resize(0, 0, window.screen.availWidth, window.screen.availHeight);
        win.emit("maximize");
      } else {
        win.maximize();
      }
    },
    unmaximize() {
      if (!this.maximized) return;
      if (clickthrough) {
        if (this.beforeMaximize) {
          this.resize(
            this.xBeforeMaximize,
            this.yBeforeMaximize,
            this.wBeforeMaximize,
            this.hBeforeMaximize
          );
        } else {
          this.reset();
        }
        win.emit("unmaximize");
      } else {
        win.unmaximize();
      }
    },
    toggleMaximized() {
      if (this.maximized) this.unmaximize();
      else this.maximize();
    },
    refresh() {
      win.emit("resize", this.width, this.height);
    },
    reset() {
      this.unmaximize();
      this.resize(
        (window.screen.availWidth - this.defaultWidth) / 2,
        (window.screen.availHeight - this.defaultHeight) / 2,
        this.defaultWidth,
        this.defaultHeight
      );
    },
    init(pref) {
      this.reset();
      if (typeof pref.x === "number") this.x = pref.x;
      if (typeof pref.y === "number") this.y = pref.y;
      if (typeof pref.width === "number") this.width = pref.width;
      if (typeof pref.height === "number") this.height = pref.height;
      if (pref.maximized && process.platform !== "darwin" /* workaround */) {
        this.maximize();
      }
    },
    save(pref) {
      pref.maximized = this.maximized;
      if (this.maximized && !this.beforeMaximize) {
        pref.x = null;
        pref.y = null;
        pref.width = null;
        pref.height = null;
      } else {
        pref.x = this.beforeMaximize ? this.xBeforeMaximize : this.x;
        pref.y = this.beforeMaximize ? this.yBeforeMaximize : this.y;
        pref.width = this.beforeMaximize ? this.wBeforeMaximize : this.width;
        pref.height = this.beforeMaximize ? this.hBeforeMaximize : this.height;
      }
      pref.save();
    }
  };

  win.on("maximize", () => {
    WindowWrapper.maximized = true;
  });
  win.on("unmaximize", () => {
    WindowWrapper.maximized = false;
    WindowWrapper.beforeMaximize = false;
  });

  window.WindowWrapper = WindowWrapper;
})();
