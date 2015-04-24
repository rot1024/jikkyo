(() => {
  "use strict";

  var doc = document.currentScript.ownerDocument;

  var colorList = [
    "red", "pink", "orange", "yellow", "green", "cyan", "blue", "purple", "black",
    "white2", "niconicowhite", "red2", "truered", "pink2", "orange2",
    "passionorange", "yellow2", "madyellow", "green2", "elementalgreen",
    "cyan2", "blue2", "marineblue", "purple2", "nobleviolet", "black2"
  ];
  var positionList = ["ue", "shita"];
  var sizeList = ["big", "small"];
  var typeList = ["admin", "enquete", "result"];

  var viewer = class extends HTMLElement {

    createdCallback() {
      var root = this.createShadowRoot();
      var template = doc.getElementById("viewer");
      root.appendChild(document.importNode(template.content, true));

      var admin = root.getElementById("admin");

      for (let i = 0; i < 20; ++i) {
        let e = document.createElement("div");
        e.classList.add("comment");
        this._elements.push(e);
        root.insertBefore(e, admin);
      }

      this.attributeChangedCallback("rows", "", this.getAttribute("lines") || 10);
      this.attributeChangedCallback("speed", "", this.getAttribute("speed") || 1);
    }

    attributeChangedCallback(attrName, oldVal, newVal) {

    }

  };

  window.JikkyoViewerDom = document.registerElement("jikkyo-viewer", {
    prototype: viewer.prototype
  });

})();
