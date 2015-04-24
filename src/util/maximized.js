(() => {
  "use strict";

  var EventEmitter = require('events').EventEmitter;
  var store = new WeakMap();

  module.exports = win => {

    var load = () => {
      if (!store.has(win)) {
        store.set(win, {
          w: 0,
          h: 0,
          set maximized(v) {
            this._maximized = v;
            this.event.emit("maximized", v);
          },
          get maximized() {
            return this._maximized;
          },
          _maximized: false,
          event: new EventEmitter()
        });
      }
      return store.get(win);
    };

    var check = (w, h) => {
      var data = load();

      w = w || win.width;
      h = h || win.height;

      var aw = data.w || win.window.screen.availWidth,
          ah = data.h || win.window.screen.availHeight;

      data.maximized = w === aw && h === ah;
    };

    win.on("maximized", () => {
      var data = load();
      data.w = win.width;
      data.h = win.height;
      data.maximized = true;
    });

    win.on("unmaximized", () => {
      var data = load();
      data.maximized = false;
    });

    win.on("resize", (w, h) => {
      check(w, h);
    });

    win.window.addEventListener("resize", () => {
      check();
    });

    check();

    return {
      maximized() {
        return load().maximized;
      },
      inspect() {
        var data = load();
        win.maximize();
        data.w = win.width;
        data.h = win.height;
        win.unmaximize();
      },
      on(fn) {
        load().event.on("maximized", fn);
      },
      off(fn) {
        load().event.off("maximized", fn);
      },
      emit() {
        var data = load();
        data.event.emit("maximized", data.maximized);
      }
    };
  };
})();
