(() => {
  "use strict";

  var win = require("nw.gui").Window.get();
  var doc = document.currentScript.ownerDocument;

  var titlebar = class extends HTMLElement {

    show() {
      this.shadowRoot.getElementById("container").classList.remove("hidden");
    }

    hide() {
      this.shadowRoot.getElementById("container").classList.add("hidden");
    }

    toggle() {
      if (this.isShown) this.hide();
      else this.show();
    }

    get isShown() {
      return !this.shadowRoot.getElementById("container").classList.contains("hidden");
    }

    createdCallback() {
      var root = this.createShadowRoot();
      var template = doc.querySelector("template");
      root.appendChild(document.importNode(template.content, true));

      var container = root.getElementById("container");
      container.classList.add(process.platform);

      win.on("maximize", () => container.classList.add("maximized"));
      win.on("unmaximize", () => container.classList.remove("maximized"));

      root.getElementById("minimize").addEventListener("click", e => {
        if (process.platform === "darwin")
          window.WindowWrapper.toggleMaximized();
        else
          win.minimize();
        e.stopPropagation();
      });

      root.getElementById("maximize").addEventListener("click", e => {
        if (process.platform === "darwin") win.minimize();
        else window.WindowWrapper.toggleMaximized();
        e.stopPropagation();
      });

      root.getElementById("close").addEventListener("click", e => {
        win.close();
        e.stopPropagation();
      });

      {
        let x = 0, y = 0, dragging = false, mm;

        let mu = e => {
          dragging = false;
          window.removeEventListener("mousemove", mm, true);
          window.removeEventListener("mouseup", mu, true);

          if (e.screenY < 10) {
            window.WindowWrapper.maximize();
          }
        };

        mm = e => {
          if (!dragging) mu();

          if (window.WindowWrapper.maximized) {
            window.WindowWrapper.unmaximize();
            window.WindowWrapper.moveTo(
              e.screenX - window.WindowWrapper.width / 2,
              e.screenY - 10);
          } else {
            let diffX = e.screenX - x,
                diffY = e.screenY - y;
            window.WindowWrapper.moveBy(diffX, diffY);
          }

          x = e.screenX;
          y = e.screenY;
        };

        root.addEventListener("mousedown", e => {
          if (!window.WindowWrapper.clickthrough) return;
          x = e.screenX;
          y = e.screenY;
          dragging = true;
          window.addEventListener("mousemove", mm, true);
          window.addEventListener("mouseup", mu, true);
        });

        root.addEventListener("dblclick", e => {
          window.WindowWrapper.toggleMaximized();
        }, true);

      }
    }

  };

  window.jikkyo.Titlebar = document.registerElement("jikkyo-titlebar", {
    prototype: titlebar.prototype
  });

})();
