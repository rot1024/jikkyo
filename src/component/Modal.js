(() => {
  "use strict";

  var doc = document.currentScript.ownerDocument;

  class Modal extends HTMLElement {

    createdCallback() {
      var template = document.importNode(doc.getElementById("main").content, true);

      this._styles = [];

      this._modalBg = template.querySelector("#modal-bg");
      this.content = template.querySelector("#modal");

      var innerHTML = this.innerHTML;
      this.innerHTML = "";
      template.innerHTML = innerHTML;
      this.createShadowRoot().appendChild(template);

      this.attributeChangedCallback("width", null, this.getAttribute("width"));
      this.attributeChangedCallback("height", null, this.getAttribute("height"));
      this.attributeChangedCallback("visible", null, this.getAttribute("visible"));

      this._stopCb = e => e.stopPropagation();
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
      if (attrName === "width") {
        if (!newVal) newVal = 400;
        this.content.style.width = Math.floor(newVal) + "px";
        this.content.style.marginLeft = Math.floor(-newVal / 2) + "px";
      }
      else if (attrName === "height") {
        if (!newVal) newVal = 300;
        this.content.style.height = Math.floor(newVal) + "px";
        this.content.style.marginTop = Math.floor(-newVal / 2) + "px";
      }
      else if (attrName === "visible") {
        if (newVal !== null) {
          this._modalBg.classList.remove("hidden");
          this.addEventListener("mousemove", this._stopCb, true);
        } else {
          this._modalBg.classList.add("hidden");
          this.removeEventListener("mousemove", this._stopCb, true);
        }
      }
    }

    appendStyle(style) {
      var s;
      if (typeof style === "string") {
        s = document.createElement("style");
        s.textContent = style;
      } else {
        s = style;
      }

      this._styles.push(s);
      this.shadowRoot.insertBefore(s, this._modalBg);
    }

    emptyStyle() {
      this._styles.forEach(s => {
        this.shadowRoot.removeChild(s);
      }, this);
      this._styles = [];
    }

    appendContent(content) {
      if (typeof content === "string")
        this.content.innerHTML += content;
      else
        this.content.appendChild(content);
    }

    emptyContent() {
      this.content.innerHTML = "";
    }

    use(name, content, listener1, listener2) {
      if (name === "main") return;
      var template = doc.querySelector("template#" + name);
      if (!template) return;
      var root = document.importNode(template.content, true);

      this.width = parseInt(template.dataset.width);
      this.height = parseInt(template.dataset.height);

      if (name !== "loading")
        root.querySelector(".modal-content").innerHTML = content;
      if (name === "yesno") {
        root.querySelector("#modal-btn-no").addEventListener(
          "click", listener1 || (() => this.hide()).bind(this));
        root.querySelector("#modal-btn-yes").addEventListener(
          "click", listener2 || (() => this.hide()).bind(this));
      } else if (name === "alert") {
        root.querySelector("#modal-btn-ok").addEventListener(
          "click", listener1 || (() => this.hide()).bind(this));
      }

      this.emptyStyle();
      this.emptyContent();
      this.appendContent(root);
    }

    show() {
      this.setAttribute("visible", "visible");
    }

    hide() {
      this.removeAttribute("visible");
    }

    get width() {
      return this.getAttribute("width") || 0;
    }

    set width(v) {
      return this.setAttribute("width", v);
    }

    get height() {
      return this.getAttribute("height") || 0;
    }

    set height(v) {
      return this.setAttribute("height", v);
    }

  }

  window.jikkyo.Modal = document.registerElement("jikkyo-modal", {
    prototype: Modal.prototype
  });

})();
