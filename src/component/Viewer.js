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

  class Chat extends HTMLElement {

    createdCallback() {
      this._observer = this._observer.bind(this);

      this.chat = {
        text:       "",
        color:      "white",
        size:       "medium",
        x:          0,
        y:          0,
        visibility: false
      };
    }

    detachedCallback() {
      Object.unobserve(this._chat, this._observer);
    }

    get chat() {
      return this._chat;
    }

    set chat(chat) {
      if (typeof chat !== "object")
        throw new TypeError("chat must be object: " + typeof chat);

      if (this._chat !== void(0)) {
        Object.unobserve(this._chat, this._observer);
      }
      Object.observe(chat, this._observer);

      this._chat = chat;

      this.render();
    }

    get width() {
      return this.clientWidth;
    }

    get height() {
      return this.clientHeight;
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
      var text = this._chat.text;

      if (typeof text === "undefined") text = "";
      if (typeof text !== "string") {
        console.log("Warning: text must be string: " + typeof text);
        return;
      }

      text = text.toString().trim();

      this.innerHTML = escapeHTML(text);
    }

    _observerColor() {
      var color = this._chat.color;

      if (typeof color === "undefined") color = colorList.white;
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
      var size = this._chat.size;

      if (typeof size === "undefined") size = sizeList.medium;
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
      var x = this._chat.x;

      if (typeof x === "undefined") x = 0;
      if (typeof x !== "number") {
        console.log("Warning: x must be number: " + typeof x);
        return;
      }

      this.style.left = x + "px";
    }

    _observerY() {
      var y = this._chat.y;

      if (typeof y === "undefined") y = 0;
      if (typeof y !== "number") {
        console.log("Warning: y must be number: " + typeof y);
        return;
      }

      this.style.top = y + "px";
    }

    _observerVisibility() {
      var visibility = this._chat.visibility;

      if (typeof visibility === "undefined") visibility = false;
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
      this._comment = new Map();

      // Shadow DOMのRoot
      var root = this.createShadowRoot();

      // インポート
      var template = doc.getElementById("viewer");
      var node = document.importNode(template.content, true);
      root.appendChild(node);

      // コンテナ
      var container = root.querySelector(".container");
      this._container = container;

      // ダミーコメント(サイズ取得等)
      var dummy = document.createElement("jikkyo-chat");
      dummy.visibility = false;
      container.appendChild(dummy);
      this._dummy = dummy;
    }

    get width() {
      return window.innerWidth;
    }

    get height() {
      return window.innerHeight;
    }

    createChat(chat) {
      if (typeof chat !== "object")
        throw new TypeError("chat must be object: " + typeof chat);

      if (this._comment.has(chat))
        return this.comment.get(chat);

      var elem = document.createElement("jikkyo-chat");
      elem.chat = chat;
      this._container.appendChild(elem);
      this._comment.set(chat, elem);

      return elem;
    }

    getChat(chat) {
      if (!this._comment.has(chat)) return null;

      return this.comment.get(chat);
    }

    removeChat(chat) {
      if (!this._comment.has(chat)) return false;

      var elem = this._comment.get(chat);
      this._comment.delete(chat);
      this._container.removeChild(elem);

      return true;
    }

    getDummyChat() {
      return this._dummy;
    }

  }

  window.JikkyoChat = document.registerElement("jikkyo-chat", {
    prototype: Chat.prototype
  });
  window.JikkyoViewer = document.registerElement("jikkyo-viewer", {
    prototype: Viewer.prototype
  });

})();
