(() => {
  "use strict";

  const win = require("nw.gui").Window.get();
  const doc = document.currentScript.ownerDocument;

  const titlebar = class extends HTMLElement {

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
      const root = this.createShadowRoot();
      const template = doc.querySelector("template");
      root.appendChild(document.importNode(template.content, true));

      const container = root.getElementById("container");
      container.classList.add(process.platform);

      win.on("maximize", () => container.classList.add("maximized"));
      win.on("unmaximize", () => container.classList.remove("maximized"));

      root.getElementById("minimize").addEventListener("click", e => {
        if (process.platform === "darwin")
          window.windowWrapper.toggleMaximized();
        else
          win.minimize();
        e.stopPropagation();
      });

      root.getElementById("maximize").addEventListener("click", e => {
        if (process.platform === "darwin") win.minimize();
        else window.windowWrapper.toggleMaximized();
        e.stopPropagation();
      });

      root.getElementById("close").addEventListener("click", e => {
        win.close();
        e.stopPropagation();
      });

      {
        let x = 0, y = 0, dragging = false;

        const mu = e => { // eslint-disable-line func-style
          dragging = false;
          window.removeEventListener("mousemove", mm, true);
          window.removeEventListener("mouseup", mu, true);

          if (e.screenY < 10) {
            window.windowWrapper.maximize();
          }
        };

        const mm = e => { // eslint-disable-line func-style
          if (!dragging) mu();

          if (window.windowWrapper.maximized) {
            window.windowWrapper.unmaximize();
            window.windowWrapper.moveTo(
              e.screenX - window.windowWrapper.width / 2,
              e.screenY - 10);
          } else {
            const diffX = e.screenX - x,
                  diffY = e.screenY - y;
            window.windowWrapper.moveBy(diffX, diffY);
          }

          x = e.screenX;
          y = e.screenY;
        };

        root.addEventListener("mousedown", e => {
          if (!window.windowWrapper.clickthrough) return;
          x = e.screenX;
          y = e.screenY;
          dragging = true;
          window.addEventListener("mousemove", mm, true);
          window.addEventListener("mouseup", mu, true);
        });

        root.addEventListener("dblclick", () => {
          window.windowWrapper.toggleMaximized();
        }, true);

      }
    }

  };

  window.jikkyo.Titlebar = document.registerElement("jikkyo-titlebar", {
    prototype: titlebar.prototype
  });

})();
