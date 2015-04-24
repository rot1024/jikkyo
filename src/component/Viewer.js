(() => {
  "use strict";

  var ViewerAdapter = require("./component/ViewerAdapter")(window);
  var doc = document.currentScript.ownerDocument;

  var colorList = [
    "red", "pink", "orange", "yellow", "green", "cyan", "blue", "purple", "black",
    "white2", "niconicowhite", "red2", "truered", "pink2", "orange2",
    "passionorange", "yellow2", "madyellow", "green2", "elementalgreen",
    "cyan2", "blue2", "marineblue", "purple2", "nobleviolet", "black2"
  ];
  // var positionList = ["ue", "shita"];
  var sizeList = ["big", "small"];

  var Comment = class {

    constructor(view, el) {
      this._view = view;
      this._el = el;
      this.clear();
    }

    get text() {
      return this._text;
    }

    set text(v) {
      if (typeof v !== "string") v = "";
      this._el.textContent = v;
      this._text = v;
    }

    get color() {
      return this._color;
    }

    set color(v) {
      if (typeof v !== "string") return;
      if (v[0] === "#" && v.length === 7) {
        this.clearColor();
        this._el.style.color = v;
        this._colorType = 2;
        this._color = v;
      } else if (colorList.indexOf(v) >= 0) {
        this.clearColor();
        this._el.classList.add(v);
        this._colorType = 1;
        this._color = v;
      }
    }

    get size() {
      return sizeList[this._size];
    }

    set size(v) {
      this._size = sizeList.indexOf(v) + 1;
    }

    get x() {
      return this._x;
    }

    set x(v) {
      this._x = v;
      this._el.style.left = v + "px";
    }

    get y() {
      return this._y;
    }

    set y(v) {
      this._y = v;
      this._el.style.top = v + "px";
    }

    get visible() {
      return this._visible;
    }

    set visible(v) {
      this._visible = !!v;
      this._el.style.visibility = v ? null : "hidden";
    }

    get width() {
      return this._el.clientWidth;
    }

    get height() {
      return this._el.clientHeight;
    }

    clear() {
      this.clearColor();
      this.clearSize();
      this.text = "";
      this.x = this.y = 0;
      this.visible = false;
    }

    clearColor() {
      if (this._colorType === 2)
        this._el.style.color = null;
      else if (this._colorType === 1)
        this._el.classList.remove(this._color);
      this._colorType = 0;
      this._color = "";
    }

    clearSize() {
      if (this._size <= 0) return;
      this._el.classList.remove(sizeList[this._size - 1]);
      this._size = 0;
    }

  };

  var viewer = class extends HTMLElement {

    get comments() {
      return this._comments;
    }

    clear() {
      this._comments.forEach(c => c.clear());
    }

    createdCallback() {
      this._comments = [];

      var root = this.createShadowRoot();
      var template = doc.getElementById("viewer");
      root.appendChild(document.importNode(template.content, true));

      for (let i = 0; i < 50; ++i) {
        let el = document.createElement("div");
        el.classList.add("comment");
        root.appendChild(el);

        this._comments.push(new Comment(this, el));
      }
    }

  };

  window.JikkyoViewer = document.registerElement("jikkyo-viewer", {
    prototype: viewer.prototype
  });

  window.JikkyoViewerAdapter = ViewerAdapter;

})();
