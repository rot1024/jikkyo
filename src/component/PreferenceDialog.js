
(() => {
  "use strict";

  var doc = document.currentScript.ownerDocument;

  var draggable = class extends HTMLElement {

    createdCallback() {
      var root = this.createShadowRoot();
      var template = doc.querySelector("template");
      root.appendChild(document.importNode(template.content, true));

      this.addEventListener("click", e => e.stopPropagation());

      var tabs = root.getElementById("tabs"),
          prefs = root.getElementById("prefs"),
          prefc = prefs.querySelectorAll(":scope > div");

      var i = false;
      [].forEach.call(prefc, (c, i) => {
        var tab = document.createElement("li");
        tab.textContent = c.dataset.title;
        if (i === 0) {
          c.classList.add("active");
          tab.classList.add("active");
        }
        tab.addEventListener("click", () => {
          prefs.querySelector(".active").classList.remove("active");
          c.classList.add("active");
          tabs.querySelector(".active").classList.remove("active");
          tab.classList.add("active");
        });
        tabs.appendChild(tab);
      });

      root.querySelector("#ok").addEventListener("click", (() => this.hide()).bind(this));
    }

    show() {
      this.classList.add("shown");
    }

    hide() {
      this.classList.remove("shown");
    }

  };

  window.JikkyoResizer = document.registerElement("jikkyo-preference-dialog", {
    prototype: draggable.prototype
  });

})();
