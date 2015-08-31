(() => {
  "use strict";

  var win = require("nw.gui").Window.get(),
      doc = document.currentScript.ownerDocument;

  var viewer = class extends HTMLElement {

    get width() {
      return this._canvas.getAttribute("width") || 0;
    }

    set width(v) {
      this._canvas.setAttribute("width", v);
    }

    get height() {
      return this._canvas.getAttribute("height") || 0;
    }

    set height(v) {
      this._canvas.setAttribute("height", v);
    }

    resize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    }

    createdCallback() {
      this._resizeCallback = this.resize.bind(this);

      var root = this.createShadowRoot();
      var template = doc.querySelector("template");
      root.appendChild(document.importNode(template.content, true));

      this.canvas = root.querySelector("canvas");
      this.hiddenCanvas = document.createElement("canvas");
      this.hiddenCanvas.setAttribute("width", 1920);
      this.hiddenCanvas.setAttribute("height", 500);
    }

    attachedCallback() {
      this._canvas = this.shadowRoot.querySelector("canvas");
      this._ctx = this._canvas.getContext("2d");
      win.on("resize", this._resizeCallback);
      this._resizeCallback();
    }

    detachedCallback() {
      this._running = false;
      window.removeEventListener("resize", this._resizeCallback);
      this._canvas = this._ctx = null;
    }

  };

  window.jikkyo.CanvasViewer = document.registerElement("jikkyo-canvas-viewer", {
    prototype: viewer.prototype
  });

})();
