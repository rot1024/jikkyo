(() => {
  "use strict";

  const gui = require("nw.gui");

  const win = gui.Window.get();
  const winContainer = document.getElementById("windowContainer");

  class WindowWrapper {
    constructor() {
      this.clickthrough = (() => {
        if (gui.App.argv.indexOf("--disable-gpu") === -1) return false;
        if (gui.App.argv.indexOf("--force-cpu-draw") === -1) return false;

        return true;
      });

      this.maximized = false;

      this.defaultSize = {
        x: (window.screen.availWidth - 800) / 2,
        y: (window.screen.availHeight - 520) / 2,
        width: 800,
        height: 520
      };

      this.minSize = {
        width: 450,
        height: 100
      };

      this.maxSize = {
        x: 0,
        y: 0,
        width: window.screen.availWidth,
        height: window.screen.availHeight
      };

      this.origSize = {
        x: -1,
        y: -1,
        width: -1,
        height: -1
      };

      win.on("maximize", (() => {
        this.maximized = true;
      }).bind(this));

      win.on("unmaximize", (() => {
        this.maximized = false;

        this.origSize.x = -1;
        this.origSize.y = -1;
        this.origSize.width = -1;
        this.origSize.height = -1;
      }).bind(this));
    }

    get x() {
      if (this.clickthrough) {
        return parseInt(winContainer.style.left, 10);
      } else {
        return win.x;
      }
    }

    get y() {
      if (this.clickthrough) {
        return parseInt(winContainer.style.top, 10);
      } else {
        return win.y;
      }
    }

    get width() {
      if (this.clickthrough) {
        return parseInt(winContainer.style.width, 10);
      } else {
        return win.width;
      }
    }

    get height() {
      if (this.clickthrough) {
        return parseInt(winContainer.style.height, 10);
      } else {
        return win.height;
      }
    }

    set x(x) {
      if (this.clickthrough) {
        winContainer.style.left = `${x}px`;
      } else {
        win.x = x;
      }
    }

    set y(y) {
      if (this.clickthrough) {
        winContainer.style.top = `${y}px`;
      } else {
        win.y = y;
      }
    }

    set width(width) {
      if (this.clickthrough) {
        winContainer.style.width = `${Math.max(this.minSize.width, width)}px`;
      } else {
        win.width = width;
      }
    }

    set height(height) {
      if (this.clickthrough) {
        winContainer.style.height = `${Math.max(this.minSize.height, height)}px`;
      } else {
        win.height = height;
      }
    }

    get right() {
      return this.x + this.width;
    }

    get bottom() {
      return this.y + this.height;
    }

    init(pref) {
      this.reset();

      if (pref.x !== -1) this.x = pref.x;
      if (pref.y !== -1) this.y = pref.y;
      if (pref.height !== -1) this.width = pref.width;
      if (pref.width !== -1) this.height = pref.height;
      if (pref.maximized && process.platform !== "darwin" /* workaround */) {
        this.maximize();
      }
    }

    save(pref) {
      pref.maximized = this.maximized;

      pref.x = this.maximized ? this.origSize.x : this.x;
      pref.y = this.maximized ? this.origSize.y : this.y;
      pref.width = this.maximized ? this.origSize.width : this.width;
      pref.height = this.maximized ? this.origSize.height : this.height;

      pref.save();
    }

    refresh() {
      win.emit("resize", this.width, this.height);
    }

    reset() {
      this.unmaximize();

      this.resize(
        this.defaultSize.x,
        this.defaultSize.y,
        this.defaultSize.width,
        this.defaultSize.height
      );
    }

    moveTo(x, y) {
      if (this.clickthrough) {
        this.x = x;
        this.y = y;
      } else {
        win.moveTo(x, y);
      }
    }

    moveBy(x, y) {
      if (this.clickthrough) {
        this.x += x;
        this.y += y;
      } else {
        win.moveBy(x, y);
      }
    }

    resizeTo(width, height) {
      if (this.clickthrough) {
        this.width = width;
        this.height = height;

        win.emit("resize", width, height);
      } else {
        win.resizeTo(
          Math.max(this.minSize.width, width),
          Math.max(this.minSize.height, height)
        );
      }
    }

    resizeBy(width, height) {
      if (this.clickthrough) {
        this.width += width;
        this.height += height;

        win.emit("resize", this.width, this.height);
      } else {
        win.resizeTo(
          Math.max(this.minSize.width, win.width + width),
          Math.max(this.minSize.height, win.height + height)
        );
      }
    }

    resize(x, y, width, height) {
      this.moveTo(x, y);
      this.resizeTo(width, height);
    }

    maximize() {
      if (this.maximized) return;

      this.origSize.x = this.x;
      this.origSize.y = this.y;
      this.origSize.width = this.width;
      this.origSize.height = this.height;

      if (this.clickthrough) {
        this.resize(
          this.maxSize.x,
          this.maxSize.y,
          this.maxSize.width,
          this.maxSize.height
        );

        win.emit("maximize");
      } else {
        win.maximize();
      }
    }

    unmaximize() {
      if (!this.maximized) return;

      if (this.clickthrough) {
        this.resize(
          this.origSize.x !== -1 ? this.origSize.x : this.defaultSize.x,
          this.origSize.y !== -1 ? this.origSize.y : this.defaultSize.y,
          this.origSize.width !== -1 ? this.origSize.width : this.defaultSize.width,
          this.origSize.height !== -1 ? this.origSize.height : this.defaultSize.height
        );

        win.emit("unmaximize");
      } else {
        win.unmaximize();
      }

      this.origSize.x = -1;
      this.origSize.y = -1;
      this.origSize.width = -1;
      this.origSize.height = -1;
    }

    toggleMaximized() {
      if (this.maximized) {
        this.unmaximize();
      } else {
        this.maximize();
      }
    }
  }

  window.windowWrapper = new WindowWrapper();
})();
