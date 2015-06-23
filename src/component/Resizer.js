(() => {
  "use strict";

  var win = require("nw.gui").Window.get();
  var doc = document.currentScript.ownerDocument;

  var cursors = [
    {name: "ew-resize", c: ["w", "e"] },
    {name: "ns-resize", c: ["n", "s"] },
    {name: "nwse-resize", c: ["nw", "se"] },
    {name: "nesw-resize", c: ["ne", "sw"] }
  ];

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

      var drag = {
        dragging: false,
        x: 0,
        y: 0,
        oldX: 0,
        oldY: 0,
        horizontal: 0, // 0: west,  1: middle, 2: east
        vertical: 0    // 0: north, 1: middle, 2: south
      };

      var mousemove = e => {
        if (!drag.dragging) {
          window.removeEventListener("mousemove", mousemove);
          return;
        }

        drag.x = e.clientX;
        drag.y = e.clientY;
      };

      var mouseup = () => {
        drag.dragging = false;
        window.removeEventListener("mousemove", mousemove);
        window.removeEventListener("mouseup", mouseup);
        window.document.body.style.cursor = null;
        indicator.classList.remove("on");
      };

      var tick = () => {
        if (!drag.dragging) return;

        var diffX = drag.x - drag.oldX,
            diffY = drag.y - drag.oldY,
            width = 0, height = 0, x = 0, y = 0;

        if (drag.horizontal !== 1)
          width = diffX * (drag.horizontal === 0 ? -1 : 1);
        if (drag.vertical !== 1)
          height = diffY * (drag.vertical === 0 ? -1 : 1);

        if (drag.horizontal === 0)
          x = diffX;
        if (drag.vertical === 0)
          y = diffY;

        if (x || y)
          window.WindowWrapper.moveBy(x, y);
        if (width || height)
          window.WindowWrapper.resizeTo(
            window.WindowWrapper.width + width,
            window.WindowWrapper.height + height
          );

        drag.oldX = drag.x - (drag.horizontal === 0 && !window.WindowWrapper.clickthrough ? diffX : 0);
        drag.oldY = drag.y - (drag.vertical === 0 && !window.WindowWrapper.clickthrough ? diffY : 0);

        window.requestAnimationFrame(tick);
      };

      var on = (t, hor, ver, str) => {
        if (t === null) return;

        t.addEventListener("mousedown", e => {
          if (maximized) return;
          e.stopPropagation();

          drag.x = drag.oldX = e.clientX;
          drag.y = drag.oldY = e.clientY;
          drag.horizontal = hor;
          drag.vertical = ver;
          window.addEventListener("mousemove", mousemove);
          window.addEventListener("mouseup", mouseup);
          drag.dragging = true;

          var cursorName = "";
          cursors.some(c => {
            if (c.c.indexOf(str) >= 0) {
              cursorName = c.name;
              return true;
            }
          });

          if (cursorName)
            window.document.body.style.cursor = cursorName;

          indicator.classList.add("on");

          window.requestAnimationFrame(tick);
        });

        t.addEventListener("click", e => e.stopPropagation());
      };

      [["nw", "n", "ne"], ["w", null, "e"], ["sw", "s", "se"]]
        .forEach((e, i) => e.forEach((e, j) => on(root.getElementById(e), j, i, e)));
    }

  };

  window.jikkyo.Resizer = document.registerElement("jikkyo-resizer", {
    prototype: resizer.prototype
  });

})();
