(() => {
  "use strict";

  var doc = document.currentScript.ownerDocument;

  var colorList = [
    "red", "pink", "orange", "yellow", "green", "cyan", "blue", "purple", "black",
    "white2", "niconicowhite", "red2", "truered", "pink2", "orange2",
    "passionorange", "yellow2", "madyellow", "green2", "elementalgreen",
    "cyan2", "blue2", "marineblue", "purple2", "nobleviolet", "black2"
  ];
  // var positionList = ["ue", "shita"];
  var sizeList = ["big", "small"];

  var escape = (content) => {
    const t = {
      "&": "&amp;",
      "\"": "&quot;",
      "<": "&lt;",
      ">": "&gt;",
      "\n": "<br>"
    };
    return content.replace(/[&"<>\n]/g, m => t[m]);
  };

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
      if (this._text === v) return;
      if (typeof v !== "string") v = v + "";
      this._el.innerHTML = escape(v.trim());
      this._text = v;
      this._width = this._el.clientWidth;
      this._height = this._el.clientHeight;
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
      if (this._size > 0)
        this._el.classList.remove(sizeList[this._size - 1]);
      this._size = sizeList.indexOf(v) + 1;
      if (this._size > 0)
        this._el.classList.add(sizeList[this._size - 1]);
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
      return this._width;
    }

    get height() {
      return this._height;
    }

    get right() {
      return this._el.clientWidth + this._x;
    }

    get bottom() {
      return this._el.clientHeight + this._y;
    }

    clear() {
      this.tag = null;
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

    get width() {
      return window.innerWidth;
    }

    get height() {
      return window.innerHeight;
    }

    get number() {
      return this._number;
    }

    set number(v) {
      const d = v - this._number;

      if (d === 0) return;

      if (d < 0) {

        this._comments.splice(d);
        for (let i = 0; i < -d; ++i) {
          this._container.removeChild(this._container.lastChild);
        }

      } else {

        for (let i = 0; i < d; ++i) {
          let el = document.createElement("div");
          el.classList.add("comment");
          this._container.appendChild(el);
          this._comments.push(new Comment(this, el));
        }

      }

      this._number = v;
    }

    createdCallback() {
      this._comments = [];
      this._number = 0;

      var root = this.createShadowRoot();
      var template = doc.getElementById("viewer");
      root.appendChild(document.importNode(template.content, true));

      this._dummy = new Comment(this, root.getElementById("dummy"));
      this._container = root.querySelector(".container");
      this.number = 50;
    }

    calcCommentSize(comment) {
      this._dummy.color = comment.color;
      this._dummy.size = comment.size;
      this._dummy.text = comment.text;
      var w = this._dummy.width;
      var h = this._dummy.height;
      this._dummy.clear();
      return { width: w, height: h };
    }

  };

  window.JikkyoViewer = document.registerElement("jikkyo-viewer", {
    prototype: viewer.prototype
  });

})();
