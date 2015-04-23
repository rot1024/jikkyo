(() => {
  "use strict";

  var store = new WeakMap();

  module.exports = win => {

    var load = () => {
      var data;
      if (!store.has(win)) {
        data = {
          w: 0, h: 0, maximized: false
        };
      } else {
        data = store.get(win);
      }
      return data;
    };

    var check = (w, h) => {
      var data = load();

      w = w || win.width;
      h = h || win.height;

      var aw = data.w || win.window.screen.availWidth,
          ah = data.h || win.window.screen.availHeight;

      data.maximized = w === aw && h === ah;
      store.set(win, data);
    };

    win.on("maximized", () => {
      var data = load();
      data.maximized = true;
      store.set(win, data);
    });

    win.on("unmaximized", () => {
      var data = load();
      data.maximized = false;
      store.set(win, data);
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
        store.set(win, data);
      }
    };
  };
})();
