(() => {
  "use strict";

  var EventEmitter = require("events").EventEmitter;

  class Adapter {

    constructor() {
      this._viewer = null;
      this._controller = null;

      this._comment = [];
      this._rows = 0;
      this._limit = 100;

      this._playing = false;
      this._realtime = false;
      this._position = 0;
      this._length = 0;
      this._duration = 4000;
      this._durationAlt = 3000;

      this._event = new EventEmitter();

      this._renderComment = [];
      this._renderDate = 0;
      this._renderCb = (() => {
        if (this._viewer === null) return;
        if (!this._playing) return;

        var prev = this._renderDate;
        var current = this._renderDate = Date.now();

        this._position = Math.min(this._length, this._position + current - prev);
        this._event.emit("observe", "position", this._position);

        this.render();

        if (this._position === this._length) {
          this.stop();
        } else {
          window.requestAnimationFrame(this._renderCb);
        }
      }).bind(this);

      this._resizeCb = (() => {
        if (this._viewer === null) return;

        this.refresh();
        if (!this.praying) this.render();
      }).bind(this);

      window.addEventListener("resize", this._resizeCb);
    }

    get viewer() {
      return this._viewer;
    }

    set viewer(viewer) {
      if (viewer === this._viewer) return;

      if (viewer) this.stop();
      this._viewer = viewer;
    }

    get controller() {
      return this._controller;
    }

    set controller(controller) {
      if (controller === this._controller) return;

      if (controller) controller.adapter = this;
      this._controller = controller;
    }

    get rows() {
      return this._rows;
    }

    set rows(rows) {
      if (typeof rows !== "number")
        throw new TypeError("rows must be number: " + typeof rows);

      this._rows = rows;
    }

    get limit() {
      return this._limit;
    }

    set limit(limit) {
      if (typeof limit !== "number")
        throw new TypeError("limit must be number: " + typeof limit);
      if (limit < 1)
        throw new RangeError("limit must be > 0: " + typeof limit);

      this._limit = limit;
    }

    get playing() {
      return this._playing;
    }

    get position() {
      return this._position;
    }

    set position(position) {
      if (typeof position !== "number")
        throw new TypeError("position must be number: " + typeof position);
      if (this._position === position) return;

      this._position = Math.min(this._length, position);

      this._event.emit("observe", "position", this._position);
    }

    get length() {
      return this._length;
    }

    set length(length) {
      if (typeof length !== "number")
        throw new TypeError("length must be number: " + typeof length);
      if (this._length === length) return;

      this._length = length;
      this._position = Math.min(this._position, length);

      this._event.emit("observe", "length", this._length);
      this._event.emit("observe", "position", this._position);
    }

    on(listener) {
      this._event.on("observe", listener);
    }

    off(listener) {
      this._event.removeListener("observe", listener);
    }

    addChat(chat) {
      this.addComment([chat]);
    }

    addComment(comment) {
      if (!Array.isArray(comment))
        throw new TypeError("comment must be array: " + typeof comment);

      comment.forEach(obj => {
        var chat = {
          text: obj.text || "",
          color: obj.color || "white",
          size: obj.size || "medium",
          x: 0,
          y: 0,
          visibility: false,
          vpos: obj.vpos || 0,
          position: obj.position || 0,
          width: 0,
          height: 0,
          bullet: false
        };

        this._comment.splice(this._binarySearch(chat, this._comment), 0, chat);
      }, this);

      this.length = this._comment[this._comment.length - 1].vpos + Math.max(this._duration, this._durationAlt);
      this.refresh();
    }

    clearComment() {
      this._renderComment.forEach(chat => {
        this._viewer.removeChat(chat);
      }, this);

      this._comment = [];
      this._renderComment = [];
      this.length = 0;

      this.refresh();
    }

    start() {
      if (this._playing || this._position === this._length) return;

      setTimeout((() => {
        this._renderCb();
      }).bind(this), 1);

      this._playing = true;
      this._renderDate = Date.now();
    }

    stop() {
      this._playing = false;
    }

    render() {
      if (this._viewer === null) return;

      var rComment = this._renderComment;
      var viewer = this._viewer;

      this._comment.forEach(chat => {
        // renderComment内にchatが存在するか
        if (rComment.includes(chat)) {
          // 表示されるか
          if (this._isVisible(chat)) {
            chat.x = this._calcX(chat);
          } else {
            chat.visibility = false;
            viewer.removeChat(chat);
            rComment.splice(rComment.indexOf(chat), 1);
            if (this._realtime)
              this._comment.splice(this._comment.indexOf(chat), 1);
          }
        } else if (this._isVisible(chat)) {
          chat.x = this._calcX(chat);

          // コメントが上限に達しているか
          if (rComment.length === this._limit) {
            viewer.removeChat(rComment[0]);
            rComment.shift();
          }

          chat.visibility = true;
          viewer.createChat(chat);
          rComment.splice(this._binarySearch(chat, rComment), 0, chat);
        }
      }, this);
    }

    refresh() {
      this._comment.forEach(chat => {
        var size = this._calcSize(chat);
        chat.width = size.width;
        chat.height = size.height;
      }, this);

      this._comment.forEach(chat => {
        chat.y = this._calcY(chat);
      }, this);
    }

    _calcSize(chat) {
      var dummy = this._viewer.getDummyChat(chat);

      dummy.chat = {
        text:       chat.text,
        color:      chat.color,
        size:       chat.size,
        visibility: false
      };
      var size = {
        width: dummy.width,
        height: dummy.height
      };
      dummy.chat = {};

      return size;
    }

    _calcX(chat, position) {
      if (position === void(0))
        position = this._position;

      if (chat.position === "ue" || chat.position === "shita") {
        return parseInt((this._viewer.width - chat.width) / 2);
      } else {
        let rate = (position - chat.vpos) / this._duration;
        return parseInt(this._viewer.width - rate * (this._viewer.width + chat.width));
      }
    }

    _calcY(chat) {
      const isUe = chat.position === "ue",
            isShita = chat.position === "shita",
            duration = (isUe || isShita) ? this._durationAlt : this._duration,
            height = this._viewer.height;

      var y = 0,
          bullet = false;

      var loop = (() => {
        var flag = false;

        this._comment.some(current => {
          const currentY = (isShita ? height - current.y  : current.y);

          if (current === chat) return true;
          if (current.position !== chat.position) return false;
          if (chat.vpos - current.vpos > duration) return false;
          if (y >= currentY + current.height || currentY >= y + chat.height) return false;
          //if (current.bullet) return false;

          if (isUe || isShita) {
            y += current.height;

            if (y > height - chat.height) {
              y = Math.floor(Math.random() * (height - chat.height));
              bullet = true;

              return true;
            }

            flag = true;
            return true;
          } else {
            const vstart = Math.max(chat.vpos, current.vpos),
                  vend = Math.min(chat.vpos + duration, current.vpos + duration),
                  chatStartX = this._calcX(chat, vstart),
                  chatEndX = this._calcX(chat, vend),
                  currentStartX = this._calcX(current, vstart),
                  currentEndX = this._calcX(current, vend);

            if ((chatStartX >= currentStartX + current.width || currentStartX >= chatStartX + chat.width) &&
                (chatEndX >= currentEndX + current.width || currentEndX >= chatEndX + chat.width))
                return;

            y += current.height;

            if (y > height - chat.height) {
              y = Math.floor(Math.random() * (height - chat.height));
              bullet = true;

              return true;
            }

            flag = true;
            return true;
          }
        }, this);

        if (flag) loop();
      }).bind(this);

      loop();

      chat.bullet = bullet;
      return (isShita && !bullet) ? height - y : y;
    }

    _isVisible(chat, position) {
      const duration = (chat.position === "ue" || chat.position === "shita") ? this._durationAlt : this._duration;

      if (position === void(0))
        position = this._position;

      return chat.vpos <= position && position <= chat.vpos + duration;
    }

    _binarySearch(chat, array) {
      if (array.length === 0) return 0;
      if (array[array.length - 1].vpos <= chat.vpos) return array.length;

      var search = (start, end) => {
        var current = Math.floor((start + end) / 2);
        var currentChat = array[current];

        if (currentChat.vpos < chat.vpos) {
          start = current + 1;
        } else if (currentChat.vpos > chat.vpos) {
          end = current - 1;
        } else {
          return ++current === array.length ? current : search(current, current);
        }

        return start > end ? start : search(start, end);
      };

      return search(0, array.length - 1);
    }

  }

  window.JikkyoViewer.Adapter = Adapter;
})();
