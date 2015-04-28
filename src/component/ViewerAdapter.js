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
      this._span = 4000;
      this._spanAlt = 3000;

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
        if (comment.bullet) comment.color = "red";
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
        let rate = (position - comment.vpos) / this._span;
        return parseInt(this._viewer.width - rate * (this._viewer.width + comment.width));
      }
    }

    _calcY(comment) {
      const isUe = comment.position === "ue",
            isShita = comment.position === "shita",
            span = (isUe || isShita) ? this._spanAlt : this._span,
            height = this._viewer.height;

      var y = 0, bullet = false;

      this._comments.some(current => {
        if (current === comment) return true;
        if (current.position !== comment.position) return false;
        if (comment.vpos - current.vpos > span) return false;
        if (current.bullet) return false;

        if (isUe || isShita) {
          y += current.height/* + 1*/;

          if (y > height - comment.height) {
            // 弾幕モード
            // Math.ceil or Math.floor?
            y = Math.floor(Math.random() * (height - comment.height));
            bullet = true;

            return true;
          }
        } else {
          if (y >= current.y + current.height || current.y >= y + comment.height) return;

                // 2つのコメントが同時に表示される時間の開始時刻
          const vstart = Math.max(comment.vpos, current.vpos),
                // 2つのコメントが同時に表示される時間の終了時刻
                vend = Math.min(comment.vpos + span, current.vpos + span),
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
        }
      }, this);

      comment.bullet = bullet;
      return (isShita && !bullet) ? height - y : y;
    }

    _isVisible(comment, position) {
      const span = (comment.position === "ue" || comment.position === "shita") ? this._spanAlt : this._span;

      if (position === void(0))
        position = this._position;

      return comment.vpos <= position && position <= comment.vpos + span;
    }

  }

  window.JikkyoViewer.Adapter = Adapter;
/*  var Adapter = class {

    get viewerView() {
      return this._viewer;
    }

    set viewerView(v) {
      if (v === this._viewer) return;
      if (v) {
        this.stop();
      }
      this._viewer = v;

      window.addEventListener("resize", (() => {
        this.refresh();
        this.render();
      }).bind(this));
    }

    get controllerView() {
      return this._controller;
    }

    set controllerView(v) {
      if (v === this._controller) return;
      this._controller = v;
      if (v) this._controller.adapter = this;
    }

    get comments() {
      return this._comments;
    }

    set comments(v) {
      this._comments = v;
    }

    get rows() {
      return this._rows;
    }

    set rows(v) {
      this._rows = v;
    }

    get position() {
      return this._position;
    }

    set position(v) {
      this._position = Math.min(this._length, v);
    }

    get length() {
      return this._length;
    }

    set length(v) {
      this._length = v;
      this._position = Math.min(this._position, v);
      this._event.emit("observe", "length", this._length);
      this._event.emit("observe", "position", this._position);
    }

    get playing() {
      return this._playing;
    }

    on(listener) {
      this._event.on("observe", listener);
    }

    off(listener) {
      this._event.removeListener("observe", listener);
    }

    constructor() {
      this._viewer = null;
      this._controller = null;
      this._comments = [];
      this._rows = 12;
      this._position = 0;
      this._length = 0;
      this._playing = false;
      this._oldDate = 0;
      this._event = new EventEmitter();
      this._renderCb = (() => {
        if (!this._viewer) return;
        if (this._playing) {
          var now = Date.now();
          this._position = Math.min(this._length, this._position + now - this._oldDate);
          this._event.emit("observe", "position", this._position);
          this.render();
          this._oldDate = now;
          if (this._position >= this._length) {
            this.stop();
          } else {
            window.requestAnimationFrame(this._renderCb);
          }
        } else {
          this.render();
        }
      }).bind(this);

      window.addEventListener("resize", this._renderCb);

      // draw関連
      this._span = 4000;
      this._map = new WeakMap();
      this._queue = [];
    }

    add(comment) {
      const convert = c => ({
        text: c.text,
        vpos: c.vpos,
        color: c.color,
        size: c.size,
        position: c.position,
        bullet: false,
        y: 0,
        width: 0,
        height: 0
      });

      if (Array.isArray(comment)) {
        comment.forEach((c => {
          this._comments.push(convert(c));
        }).bind(this));
      } else {
        this._comments.push(convert(comment));
      }
      this.refresh();
    }

    start() {
      if (this._playing || this._position >= this._length)
        return;
      this._playing = true;
      this._oldDate = Date.now();
      this._renderCb();
    }

    stop() {
      this._playing = false;
    }

    draw() {
      if (!this._viewer) return;
      // コメントの位置決定ロジック

      const comments = this._comments,
            el = this._viewer,
            views = el.comments,
            map = this._map,
            queue = this._queue,
            calcX = this._calcX.bind(this),
            visible = this._visible.bind(this);

      comments.some(c => {
        var v = map.get(c);

        // コメントデータに関連付けられているビューを探す

        if (v && v.tag) {

          // 既にビューに関連付けられている

          if (visible(c)) {

            // 引き続き表示されるので動かすだけでOK
            v.x = calcX(c);
            v.y = c.y;

          } else {

            // コメントが表示されなくなったので関連付けを解除

            map.delete(c);
            let i = queue.indexOf(v);
            if (i >= 0) queue.splice(i, 1);
            v.clear();

          }

        } else if (visible(c)) {

          // 新しく表示されるコメント

          // 空いているビューを探す
          views.some(view => {
            return !view.tag && (v = view);
          });

          if (!v) {
            // 空いているビューが無ければ表示中の最古のコメントを消す
            v = queue.pop(v);
            if (v) {
              map.delete(v.tag);
              v.clear();
            }
          }

          map.set(c, v);
          queue.unshift(v);
          v.text = c.text;
          v.color = c.color;
          v.size = c.size;
          v.visible = true;
          v.tag = c;
          v.x = calcX(c);
          v.y = c.y;
        }
      });
    }

    refresh() {
      this._comments.sort((a, b) => a.vpos > b.vpos ? 1 : -1);
      this._comments.forEach((c => {
        this._calcSize(c);
        c.y = 0;
        c.bullet = false;
      }).bind(this));
      this._comments.forEach((c => {
        this._calcY(c);
        if (c.bullet) c.color = "red";
      }).bind(this));
    }

    _getFontSize() {
      return 36;
    }

    _visible(c, pos) {
      const delay = c.position === "ue" || c.position === "shita" ? 3000 : 4000;
      if (pos === void 0) pos = this._position;
      return c.vpos <= pos && pos <= c.vpos + delay;
    }

    _calcX(c, pos) {
      if (c.position === "ue" || c.position === "shita") {
        return (this._viewer.width - c.width) / 2;
      } else {
        if (pos === void 0) pos = this._position;
        let r = (pos - c.vpos) / this._span;
        return (this._viewer.width + c.width) * (1 - r) - c.width;
      }
    }

    _calcY(comment) {
      const delay = comment.position === "ue" || comment.position === "shita" ? 3000 : this._span,
            height = this._viewer.height,
            width = this._viewer.width,
            calcX = this._calcX.bind(this);
      var bullet = false,
          y = 0;

      this._comments.some(c => {

        if (comment.vpos < c.vpos) return true;

        if (c === comment || c.position !== comment.position ||
            comment.vpos - c.vpos >= delay || c.bullet)
          return false;

        if (comment.position === "ue" || comment.position === "shita") {

          y += c.height + 1;

          if (y > height - comment.height) {
            // 弾幕モード
            y = Math.ceil(Math.random() * (height - comment.height));
            bullet = true;
            return true;
          }

        } else if (c.y + c.height >= y && y + comment.height >= c.y) {

          //       2つのコメントが同時に表示される時間の開始時刻
          const vstart = Math.max(comment.vpos, c.vpos),
                // 2つのコメントが同時に表示される時間の終了時刻
                vend = Math.min(comment.vpos + delay, c.vpos + delay),
                // 2つのコメントが同時に表示され始まるときのthisのX
                commentStartX = calcX(comment, vstart),
                // 2つのコメントが同時に表示されるのが終わるときのthisのX
                commentEndX = calcX(comment, vend),
                // 2つのコメントが同時に表示され始まるときのcのX
                cStartX = calcX(c, vstart),
                // 2つのコメントが同時に表示されるのが終わるときのcのX
                cEndX = calcX(c, vend);

          if (
            //width + c.width < (1 - (c.vpos - comment.vpos) / delay) * (width + comment.width)
            //commentStartX <= cStartX + c.width || commentEndX <= cEndX + c.width
            commentStartX <= cStartX + c.width && cStartX <= commentStartX + comment.width ||
            commentEndX <= cEndX + c.width && cEndX <= commentEndX + comment.width
          ) {
            y += c.height + 1;
            if (y > height - comment.height) {
              // 弾幕モード
              y = Math.ceil(Math.random() * (height - comment.height));
              bullet = true;
              return true;
            }
          }

        }
      });
      comment.bullet = bullet;
      y = Math.floor(y);

      comment.y = comment.position === "shita" && !bullet ? height - y : y;
    }

    _calcSize(comment) {
      var size = this._viewer.calcCommentSize(comment);
      comment.width = size.width;
      comment.height = size.height;
    }

  };

  window.JikkyoViewer.Adapter = Adapter;*/
})();
