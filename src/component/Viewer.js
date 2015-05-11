(() => {
  "use strict";

  var doc = document.currentScript.ownerDocument;

  var defaults = {
    color: "",
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
        visibility: false,
        bullet:     false
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

    get text() {
      return this._chat.text;
    }

    set text(text) {
      if (typeof text === "undefined") text = "";
      if (typeof text !== "string") {
        console.log("Warning: text must be string: " + typeof text);
        return;
      }

      text = text.toString().trim();

      this.innerHTML = escapeHTML(text);

      this._update("text", text);
    }

    get color() {
      return this._chat.color;
    }

    set color(color) {
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

      this._update("color", color);
    }

    get size() {
      return this._chat.size;
    }

    set size(size) {
      if (typeof size === "undefined") size = defaults.size;
      if (typeof size !== "string") {
        console.log("Warning: color must be string: " + typeof size);
        return;
      }

      this.style.fontSize = size;

      this._update("size", size);
    }

    get x() {
      return this._chat.x;
    }

    set x(x) {
      if (typeof x === "undefined") x = 0;
      if (typeof x !== "number") {
        console.log("Warning: x must be number: " + typeof x);
        return;
      }

      this.style.left = x + "px";

      this._update("x", x);
    }

    get y() {
      return this._chat.y;
    }

    set y(y) {
      if (typeof y === "undefined") y = 0;
      if (typeof y !== "number") {
        console.log("Warning: y must be number: " + typeof y);
        return;
      }

      this.style.top = y + "px";

      this._update("y", y);
    }

    get visibility() {
      return this._chat.visibility;
    }

    set visibility(visibility) {
      if (typeof visibility === "undefined") visibility = false;
      if (typeof visibility !== "boolean") {
        console.log("Warning: visibility must be number: " + typeof visibility);
        return;
      }

      this.style.visibility = visibility ? "" : "hidden";

      this._update("visibility", visibility);
    }

    get bullet() {
      return this.classList.contains("bullet");
    }

    set bullet(bullet) {
      if (bullet) this.classList.add("bullet");
      else this.classList.remove("bullet");
    }

    get computedFontSize() {
      return parseFloat(window.getComputedStyle(this)["font-size"].replace("px", ""));
    }

    render() {
      this.text = this._chat.text;
      this.color = this._chat.color;
      this.size = this._chat.size;
      this.x = this._chat.x;
      this.y = this._chat.y;
      this.visibility = this._chat.visibility;
      this.bullet = this._chat.bullet;
    }

    _observer(changes) {
      changes.forEach(change => {
        switch(change.name) {
          case "text":
            this.text = this._chat.text;
            break;
          case "color":
            this.color = this._chat.color;
            break;
          case "size":
            this.size = this._chat.size;
            break;
          case "x":
            this.x = this._chat.x;
            break;
          case "y":
            this.y = this._chat.y;
            break;
          case "visibility":
            this.visibility = this._chat.visibility;
            break;
          case "bullet":
            this.bullet = this._chat.bullet;
            break;
        }
      }, this);
    }

    _update(name, value) {
      var chat = this._chat;
      var notifier = Object.getNotifier(chat);
      notifier.performChange(name in chat ? "update" : "add", () => {
        chat[name] = value;
      });
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

    setBaseFontSize(fontSize) {
      var style = this.shadowRoot.querySelector("style#base");
      style.sheet.cssRules[0].style.fontSize = fontSize;
    }

    setChatStyle(css) {
      var style = this.shadowRoot.querySelector("style#chat");
      style.sheet.cssRules[0].style.cssText = css;
    }

    setBulletChatStyle(css) {
      var style = this.shadowRoot.querySelector("style#chat-bullet");
      style.sheet.cssRules[0].style.cssText = css;
    }

  }

  window.jikkyo.Viewer = document.registerElement("jikkyo-viewer", {
    prototype: Viewer.prototype
  });
  window.jikkyo.Viewer.Chat = document.registerElement("jikkyo-chat", {
    prototype: Chat.prototype
  });

})();
