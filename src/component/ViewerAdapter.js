(() => {
  "use strict";

  var EventEmitter = require('events').EventEmitter;

  class Adapter {

    constructor() {
      this._viewer = null;
      this._controller = null;

      this._comments = [];
      this._rows = 0;
      this._limit = 100;

      this._playing = false;
      this._position = 0;
      this._length = 0;
      this._duration = 4000;
      this._durationAlt = 3000;

      this._event = new EventEmitter();

      this._renderComments = [];
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
        if (this.praying) return;

        this.render();
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

    addComment(comment) {
      this.addComments([comment]);
    }

    addComments(comments) {
      if (!Array.isArray(comments))
        throw new TypeError("comments must be array: " + typeof comments);

      comments = comments.map(comment => {
        return {
          text: comment.text || "",
          color: comment.color || "white",
          size: comment.size || "medium",
          x: 0,
          y: 0,
          visibility: false,
          vpos: comment.vpos || 0,
          position: comment.position || 0,
          width: 0,
          height: 0,
          bullet: false
        };
      }, this);

      // todo: ソート済みの配列を破壊してソートし直すのは気がひけるのでバイナリサーチで挿入すべき
      this._comments = this._comments.concat(comments);
      this._comments.sort((a, b) => a.vpos - b.vpos);

      this.refresh();
    }

    start() {
      if (this._playing || this._position === this._length) return;

      // コールバックは非同期で呼ぶ
      setTimeout((() => {
        this._renderCb();
      }).bind(this));

      this._playing = true;
      this._renderDate = Date.now();
    }

    stop() {
      this._playing = false;
    }

    render() {
      if (this._viewer === null) return;

      var rComments = this._renderComments;
      var viewer = this._viewer;

      this._comments.forEach(comment => {
        // renderComments内にcommentが存在するか
        if (rComments.includes(comment)) {
          // 表示されるか
          if (this._isVisible(comment)) {
            comment.x = this._calcX(comment);
          } else {
            comment.visibility = false;
            viewer.removeComment(comment);
            rComments.splice(rComments.indexOf(comment), 1);
          }
        } else if (this._isVisible(comment)) {
          comment.x = this._calcX(comment);

          // コメントが上限に達しているか
          if (rComments.length === this._limit) {
            viewer.removeComment(rComments[0]);
            rComments.shift();
          }

          comment.visibility = true;
          viewer.createComment(comment);
          rComments.push(comment);
        }
      }, this);
    }

    refresh() {
      this._comments.forEach(comment => {
        var size = this._calcSize(comment);
        comment.width = size.width;
        comment.height = size.height;
      }, this);

      this._comments.forEach(comment => {
        comment.y = this._calcY(comment);
        if (comment.bullet) comment.color = "orange";
      }, this);
    }

    _calcSize(comment) {
      var dummy = this._viewer.getDummyComment(comment);

      dummy.comment = {
        text:       comment.text,
        color:      comment.color,
        size:       comment.size,
        visibility: false
      };
      var size = {
        width: dummy.width,
        height: dummy.height
      };
      dummy.comment = {};

      return size;
    }

    _calcX(comment, position) {
      if (position === void(0))
        position = this._position;

      if (comment.position === "ue" || comment.position === "shita") {
        return parseInt((this._viewer.width - comment.width) / 2);
      } else {
        let rate = (position - comment.vpos) / this._duration;
        return parseInt(this._viewer.width - rate * (this._viewer.width + comment.width));
      }
    }

    _calcY(comment) {
      const isUe = comment.position === "ue",
            isShita = comment.position === "shita",
            duration = (isUe || isShita) ? this._durationAlt : this._duration,
            height = this._viewer.height;

      var y = 0, bullet = false;

      var loop = (() => {
        var flag = false;

        this._comments.some(current => {
          if (current === comment) return true;
          if (current.position !== comment.position) return false;
          if (comment.vpos - current.vpos > duration) return false;
          if (current.bullet) return false;

          if (isUe || isShita) {
            y += current.height;

            if (y > height - comment.height) {
              // 弾幕モード
              // Math.ceil or Math.floor?
              y = Math.floor(Math.random() * (height - comment.height));
              bullet = true;

              return true;
            }

            flag = true;
          } else {
            if (y >= current.y + current.height || current.y >= y + comment.height) return;

                  // 2つのコメントが同時に表示される時間の開始時刻
            const vstart = Math.max(comment.vpos, current.vpos),
                  // 2つのコメントが同時に表示される時間の終了時刻
                  vend = Math.min(comment.vpos + duration, current.vpos + duration),
                  // 2つのコメントが同時に表示され始まるときのcommentのx
                  commentStartX = this._calcX(comment, vstart),
                  // 2つのコメントが同時に表示されるのが終わるときのcommentのx
                  commentEndX = this._calcX(comment, vend),
                  // 2つのコメントが同時に表示され始まるときのcurrentのx
                  currentStartX = this._calcX(current, vstart),
                  // 2つのコメントが同時に表示されるのが終わるときのcurrentのx
                  currentEndX = this._calcX(current, vend);

            if ((commentStartX >= currentStartX + current.width || currentStartX >= commentStartX + comment.width) &&
                (commentEndX >= currentEndX + current.width || currentEndX >= commentEndX + comment.width))
                return;

            y += current.height;

            if (y > height - comment.height) {
              // 弾幕モード
              y = Math.floor(Math.random() * (height - comment.height));
              bullet = true;

              return true;
            }

            flag = true;
          }
        }, this);

        if (flag) loop();
      }).bind(this);

      loop();

      comment.bullet = bullet;
      return (isShita && !bullet) ? height - y : y;
    }

    _isVisible(comment, position) {
      const duration = (comment.position === "ue" || comment.position === "shita") ? this._durationAlt : this._duration;

      if (position === void(0))
        position = this._position;

      return comment.vpos <= position && position <= comment.vpos + duration;
    }

  }

  window.JikkyoViewer.Adapter = Adapter;
})();
