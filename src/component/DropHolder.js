(() => {
  "use strict";

  const EventEmitter = require("events").EventEmitter;
  const doc = document.currentScript.ownerDocument;

  class DropHolder extends HTMLElement {

    createdCallback() {
      this._enabled = false;
      const event = this._event = new EventEmitter();
      const template = document.importNode(doc.querySelector("template").content, true);
      const container = template.querySelector("#container");

      window.addEventListener("dragover", (() => {
        if (this._enabled)
          container.classList.add("hovered");
        return false;
      }).bind(this));

      window.addEventListener("dragleave", () => {
        container.classList.remove("hovered");
        return false;
      });

      window.addEventListener("drop", e => {
        e.preventDefault();
        container.classList.remove("hovered");
        if (e.dataTransfer.files.length === 0) return false;
        event.emit("drop", e.dataTransfer.files[0].path);
        return false;
      });

      this.createShadowRoot().appendChild(template);
    }

    on(type, listener) {
      this._event.on(type, listener);
    }

    off(type, listener) {
      this._event.removeListener(type, listener);
    }

    get enabled() {
      return this._enabled;
    }

    set enabled(enabled) {
      this._enabled = enabled;
    }

  }

  window.jikkyo.DropHolder = document.registerElement("jikkyo-drop-holder", {
    prototype: DropHolder.prototype
  });

})();
