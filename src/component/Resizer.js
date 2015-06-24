/* global Kefir */
(() => {
  "use strict";

  var win = require("nw.gui").Window.get();
  var doc = document.currentScript.ownerDocument;

  var cursors = [
    ["ew-resize", ["w", "e"]],
    ["ns-resize", ["n", "s"]],
    ["nwse-resize", ["nw", "se"]],
    ["nesw-resize", ["ne", "sw"]]
  ];

  var getCursorName = function(id) {
    var name = null;
    cursors.some(c => {
      if (c[1].indexOf(id) >= 0) {
        name = c[0];
        return true;
      }
    });
    return name;
  };

  var resizer = class extends HTMLElement {

    createdCallback() {
      var root = this.createShadowRoot();
      var template = doc.querySelector("template");
      root.appendChild(document.importNode(template.content, true));

      var indicator = root.getElementById("indicator");

      var maximized = false;
      win.on("maximize", (() => {
        this.classList.add("maximized");
        maximized = true;
      }).bind(this));
      win.on("unmaximize", (() => {
        this.classList.remove("maximized");
        maximized = false;
      }).bind(this));

      [
        ["nw", "n", "ne"],
        ["w", null, "e"],
        ["sw", "s", "se"]
      ]
      .forEach((el, ver) => el.forEach((el, hor) => {
        if (!el) return;

        Kefir.fromEvents(root.getElementById(el), "mousedown")
        .filter(() => !maximized)
        .map(e => {
          e.preventDefault();
          e.stopPropagation();
          return e;
        })
        .flatMap(() =>
          Kefir.fromEvents(window, "mousemove")
          .takeUntilBy(Kefir.fromEvents(window, "mouseup"))
          .map(e => ({ type: "mousemove", x: e.screenX, y: e.screenY }))
          .merge(Kefir.constant({ type: "mousedown" }))
          .beforeEnd(() => ({ type: "mouseup" })))
        .onValue(v => {
          if (v.type === "mousedown") {
            window.document.body.style.cursor = getCursorName(el);
            indicator.classList.add("on");
            return;
          }

          if (v.type === "mouseup") {
            window.document.body.style.cursor = null;
            indicator.classList.remove("on");
            return;
          }

          var win = window.WindowWrapper,
              x = 0, y = 0, w = 0, h = 0;

          if (hor === 0) {
            x = v.x - win.x;
            w = -x;
            if (win.width + w < win.minWidth)
              x = w = 0;
          }

          if (ver === 0) {
            y = v.y - win.y;
            h = -y;
            if (win.height + h < win.minHeight)
              y = h = 0;
          }

          if (hor === 2) w = v.x - win.right;
          if (ver === 2) h = v.y - win.bottom;

          if (x || y) win.moveBy(x, y);
          if (w || h) win.resizeBy(w, h);
        });

      }));
    }

  };

  window.jikkyo.Resizer = document.registerElement("jikkyo-resizer", {
    prototype: resizer.prototype
  });

})();
