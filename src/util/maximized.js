(() => {
  "use strict";

  var EventEmitter = require('events').EventEmitter;
  var store = new WeakMap();

  module.exports = win => {

    var load = () => {
      if (!store.has(win)) {
        store.set(win, {
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

    win.on("maximize", () => {
      var data = load();
      data.maximized = true;
    });

    win.on("unmaximize", () => {
      var data = load();
      data.maximized = false;
    });

    return {
      maximized() {
        return load().maximized;
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
