(() => {
  "use strict";

  var EventEmitter = require('events').EventEmitter;

  var Adapter = class {

    get viewerView() {
      return this._el;
    }

    set viewerView(v) {
      if (v === this._el) return;
      if (v) {
        this.stop();
      }
      this._el = v;

      window.addEventListener("resize", (() => {
        this.refresh();
        this.draw();
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
      return this._pos;
    }

    set position(v) {
      this._pos = Math.min(this._length, v);
    }

    get length() {
      return this._length;
    }

    set length(v) {
      this._length = v;
      this._pos = Math.min(this._pos, v);
      this._event.emit("observe", "length", this._length);
      this._event.emit("observe", "position", this._pos);
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
      this._el = null;
      this._controller = null;
      this._comments = [];
      this._rows = 12;
      this._pos = 0;
      this._length = 0;
      this._playing = false;
      this._oldDate = 0;
      this._event = new EventEmitter();
      this._drawCb = (() => {
        if (!this._el) return;
        if (this._playing) {
          var now = Date.now();
          this._pos = Math.min(this._length, this._pos + now - this._oldDate);
          this._event.emit("observe", "position", this._pos);
          this.draw();
          this._oldDate = now;
          if (this._pos >= this._length) {
            this.stop();
          } else {
            window.requestAnimationFrame(this._drawCb);
          }
        } else {
          this.draw();
        }
      }).bind(this);

      window.addEventListener("resize", this._drawCb);

      // draw関連
      this._delay = 4000;
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
      if (this._playing || this._pos >= this._length)
        return;
      this._playing = true;
      this._oldDate = Date.now();
      this._drawCb();
    }

    stop() {
      this._playing = false;
    }

    draw() {
      if (!this._el) return;
      // コメントの位置決定ロジック

      const comments = this._comments,
            el = this._el,
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
      if (pos === void 0) pos = this._pos;
      return c.vpos <= pos && pos <= c.vpos + delay;
    }

    _calcX(c, pos) {
      if (c.position === "ue" || c.position === "shita") {
        return (this._el.width - c.width) / 2;
      } else {
        if (pos === void 0) pos = this._pos;
        let r = (pos - c.vpos) / this._delay;
        return (this._el.width + c.width) * (1 - r) - c.width;
      }
    }

    _calcY(comment) {
      const delay = comment.position === "ue" || comment.position === "shita" ? 3000 : this._delay,
            height = this._el.height,
            width = this._el.width,
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
      var size = this._el.calcCommentSize(comment);
      comment.width = size.width;
      comment.height = size.height;
    }

  };

  window.JikkyoViewer.Adapter = Adapter;
})();
