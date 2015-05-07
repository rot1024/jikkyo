(() => {
  "use strict";

  var doc = document.currentScript.ownerDocument;

  var defaults = {
    color: "#FFFFFF",
    size: "100%"
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
        color:      defaults.color,
        size:       defaults.size,
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

    get computedFontSize() {
      return parseFloat(window.getComputedStyle(this)["font-size"].replace("px", ""));
    }

    _observer(changes) {
      changes.forEach(change => {
        switch(change.name) {
          case "text":
            this.setText(this._chat.text, true);
            break;
          case "color":
            this.setColor(this._chat.color, true);
            break;
          case "size":
            this.setSize(this._chat.size, true);
            break;
          case "x":
            this.setX(this._chat.x, true);
            break;
          case "y":
            this.setY(this._chat.y, true);
            break;
          case "visibility":
            this.setVisibility(this._chat.visibility, true);
            break;
        }
      }, this);
    }

    setText(text, update) {
      if (!update) this._chat.text = text;

      if (typeof text === "undefined") text = "";
      if (typeof text !== "string") {
        console.log("Warning: text must be string: " + typeof text);
        return;
      }

      text = text.toString().trim();

      this.innerHTML = escapeHTML(text);
    }

    setColor(color, update) {
      if (!update) this._chat.color = color;

      if (typeof color === "undefined") color = defaults.color;
      if (typeof color !== "string") {
        console.log("Warning: color must be string: " + typeof color);
        return;
      }

      if (/^#[\da-fA-F]{6}$/.test(color)) {
        this.style.color = color;
      } else {
        this.style.color = defaults.color;
      }
    }

    setSize(size, update) {
      if (!update) this._chat.size = size;

      if (typeof size === "undefined") size = defaults.size;
      if (typeof size !== "string") {
        console.log("Warning: color must be string: " + typeof size);
        return;
      }

      this.style.fontSize = size;
    }

    setX(x, update) {
      if (!update) this._chat.x = x;

      if (typeof x === "undefined") x = 0;
      if (typeof x !== "number") {
        console.log("Warning: x must be number: " + typeof x);
        return;
      }

      this.style.left = x + "px";
    }

    setY(y, update) {
      if (!update) this._chat.y = y;

      if (typeof y === "undefined") y = 0;
      if (typeof y !== "number") {
        console.log("Warning: y must be number: " + typeof y);
        return;
      }

      this.style.top = y + "px";
    }

    setVisibility(visibility, update) {
      if (!update) this._chat.visibility = visibility;

      if (typeof visibility === "undefined") visibility = false;
      if (typeof visibility !== "boolean") {
        console.log("Warning: visibility must be number: " + typeof visibility);
        return;
      }

      this.style.visibility = visibility ? "" : "hidden";
    }

    render() {
      this.setText(this._chat.text, true);
      this.setColor(this._chat.color, true);
      this.setSize(this._chat.size, true);
      this.setX(this._chat.x, true);
      this.setY(this._chat.y, true);
      this.setVisibility(this._chat.visibility, true);
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
      return this.clientWidth;
    }

    get height() {
      return this.clientHeight;
    }

    createChat(chat) {
      if (typeof chat !== "object")
        throw new TypeError("chat must be object: " + typeof chat);

      if (this._comment.has(chat))
        return this._comment.get(chat);

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

  window.jikkyo.Viewer = document.registerElement("jikkyo-viewer", {
    prototype: Viewer.prototype
  });
  window.jikkyo.Viewer.Chat = document.registerElement("jikkyo-chat", {
    prototype: Chat.prototype
  });

})();
