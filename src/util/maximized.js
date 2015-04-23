(() => {
  "use strict";

  var store = new WeakMap();

  module.exports = win => {

    var load = () => {
      if (!store.has(win)) {
        store.set(win, {
          w: 0,
          h: 0,
          set maximized(v) {
            this._maximized = v;
            this.callback.forEach(cb => cb(v));
          },
          get maximized() {
            return this._maximized;
          },
          _maximized: false,
          callback: []
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
        var data = load();
        data.callback.push(fn);
        fn(data.maximized);
      },
      off(fn) {
        var callback = load().Callback,
            i = callback.indexOf(fn);
        if (i >= 0) callback.splice(i, 1);
      }
    };
  };
})();
