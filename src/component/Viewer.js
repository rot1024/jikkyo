(() => {
  "use strict";

  var doc = document.currentScript.ownerDocument;

  var colorList = {
    white:          "#FFFFFF",
    red:            "#FF0000",
    pink:           "#FF8080",
    orange:         "#FFC000",
    yellow:         "#FFFF00",
    green:          "#00FF00",
    cyan:           "#00FFFF",
    blue:           "#0000FF",
    purple:         "#C000FF",
    black:          "#000000",
    white2:         "#CCCC99",
    niconicowhite:  "#CCCC99",
    red2:           "#CC0033",
    truered:        "#CC0033",
    pink2:          "#FF33CC",
    orange2:        "#FF6600",
    passionorange:  "#FF6600",
    yellow2:        "#999900",
    madyellow:      "#999900",
    green2:         "#00CC66",
    elementalgreen: "#00CC66",
    cyan2:          "#00CCCC",
    blue2:          "#3399FF",
    marineblue:     "#3399FF",
    purple2:        "#6633CC",
    nobleviolet:    "#6633CC",
    black2:         "#666666",
  };

  var sizeList = {
    medium: "100%",
    big:    "150%",
    small:  "50%"
  };

  function escapeHTML(content) {
    const table = {
      '&': '&amp;',
      '"': '&quot;',
      '<': '&lt;',
      '>': '&gt;',
      '\n': '<br />'
    };
    return content.replace(/[&"<>\n]/g, m => table[m]);
  }

  class Comment extends HTMLElement {

    createdCallback() {
      this._observer = this._observer.bind(this);

      this.comment = {
        text:       "",
        color:      "white",
        size:       "medium",
        x:          0,
        y:          0,
        visibility: false
      };
    }

    attachedCallback() {

    }

    detachedCallback() {
      Object.unobserve(this._comment, this._observer);
    }

    get comment() {
      return this._comment;
    }

    set comment(comment) {
      if (typeof comment !== "object")
        throw new TypeError("comment must be object: " + typeof comment);

      if (this._comment !== void(0)) {
        Object.unobserve(this._comment, this._observer);
      }

      Object.observe(comment, this._observer);

      this._comment = comment;
    }

    _observer(changes) {
      changes.forEach(change => {
        switch(change.name) {
          case "text":
            this._observerText();
            break;
          case "color":
            this._observerColor();
            break;
          case "size":
            this._observerSize();
            break;
          case "x":
            this._observerX();
            break;
          case "y":
            this._observerY();
            break;
          case "visibility":
            this._observerVisibility();
            break;
        }
      }, this);
    }

    _observerText() {
      var text = this._comment.text;

      if (typeof text !== "string") {
        console.log("Warning: text must be string: " + typeof text);
        return;
      }

      text = text.toString().trim();

      this.innerHTML = escapeHTML(text);
    }

    _observerColor() {
      var color = this._comment.color;

      if (typeof color !== "string") {
        console.log("Warning: color must be string: " + typeof color);
        return;
      }

      if (/^#[\dA-F]{6}$/.test(color)) {
        this.style.color = color;
      } else if (color in colorList) {
        this.style.color = colorList[color];
      } else {
        this.style.color = colorList.white;
      }
    }

    _observerSize() {
      var size = this._comment.size;

      if (typeof size !== "string") {
        console.log("Warning: color must be string: " + typeof size);
        return;
      }

      if (size in sizeList) {
        this.style.fontSize = sizeList[size];
      } else {
        this.style.fontSize = sizeList.medium;
      }
    }

    _observerX() {
      var x = this._comment.x;

      if (typeof x !== "number") {
        console.log("Warning: x must be number: " + typeof x);
        return;
      }

      this.style.left = x + "px";
    }

    _observerY() {
      var y = this._comment.y;

      if (typeof y !== "number") {
        console.log("Warning: y must be number: " + typeof y);
        return;
      }

      this.style.top = y + "px";
    }

    _observerVisible() {
      var visibility = this._comment.visibility;

      if (typeof visibility !== "boolean") {
        console.log("Warning: visibility must be number: " + typeof visibility);
        return;
      }

      this.style.visibility = visibility ? "" : "hidden";
    }

    render() {
      this._observerText();
      this._observerColor();
      this._observerSize();
      this._observerX();
      this._observerY();
      this._observerVisibility();
    }

  }

  class Viewer extends HTMLElement {

    createdCallback() {
      this._comments = new Map();

      // Shadow DOMのRoot
      var root = this.createShadowRoot();

      // コンテナ
      var container = root.querySelector(".container");
      this._container = container;

      // ダミーコメント(サイズ取得等)
      var dummy = document.createElement("jikkyo-comment");
      dummy.visibility = false;
      container.appendChild(dummy);
      this._dummy = dummy;

      // インポート
      var template = doc.getElementById("viewer");
      var node = document.importNode(template.content, true);
      root.appendChild(node);
    }

    createComment(comment) {
      if (typeof comment !== "object")
        throw new TypeError("comment must be object: " + typeof comment);

      if (this._comments.has(comment))
        return this.comments.get(comment);

      var elem = document.createElement("jikkyo-comment");
      elem.comment = comment;
      this._container.appendChild(elem);
      this._comments.push(elem);

      return elem;
    }

    getComment(comment) {
      if (!this._comments.has(comment)) return null;

      return this.comments.get(comment);
    }

    removeComment(comment) {
      if (!this._comments.has(comment)) return false;

      var elem = this.comments.get(comment);
      this._container.removeChild(elem);

      return true;
    }

    getDummyComment() {
      return this._dummy;
    }

  }

  window.JikkyoComment = document.registerElement("jikkyo-comment", {
    prototype: Comment.prototype
  });
  window.JikkyoViewer = document.registerElement("jikkyo-viewer", {
    prototype: Viewer.prototype
  });

})();
