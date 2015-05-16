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

  window.WindowWrapper = {
    defaultWidth: 800,
    defaultHeight: 520,
    minWidth: 450,
    minHeight: 100,
    clickthrough: clickthrough,
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
        win.x = w;
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
      } else {
        win.resizeTo(Math.max(this.minWidth, w), Math.max(this.minHeight, h));
      }
    },
    resizeBy(w, h) {
      if (clickthrough) {
        this.width += w;
        this.height += h;
      } else {
        win.resizeTo(
          Math.max(this.minWidth, w) + win.width,
          Math.max(this.minHeight, h) + win.height);
      }
    },
    refresh() {
      win.emit("resize", this.width, this.height);
    },
    reset() {
      win.unmaximize();
      this.moveTo(
        (window.screen.availWidth - this.defaultWidth) / 2,
        (window.screen.availHeight - this.defaultHeight) / 2
      );
      this.resizeTo(this.defaultWidth, this.defaultHeight);
    }
  };

})();
