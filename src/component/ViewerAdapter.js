(() => {
  "use strict";

  var EventEmitter = require('events').EventEmitter;

  var Adapter = class {

    get view() {
      return this._el;
    }

    set view(v) {
      if (v === this._el) return;
      if (v) {
        this.stop();
      }
      this._el = v;
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
      this._event.removeEventListener("observe", listener);
    }

    constructor() {
      this._el = null;
      this._comments = [];
      this._rows = 12;
      this._pos = 0;
      this._length = 0;
      this._playing = false;
      this._oldDate = 0;
      this._event = new EventEmitter();
      this._drawCb = (() => {
        if (!this._playing) return;
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
      }).bind(this);

      // draw関連
      this._delay = 4000;
      this._map = new WeakMap();
      this._queue = [];
    }

    add(c) {
      var self = this;
      this._comments.push({
        text: c.text,
        vpos: c.vpos,
        color: c.color,
        size: c.size,
        position: c.position,
        get visible() {
          return this.vpos <= self._pos && self._pos <= this.vpos + self._delay;
        },
        get ratio() {
          return (self._pos - this.vpos) / self._delay;
        }
      });
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
      // コメントの位置決定ロジック

      const comments = this._comments,
            el = this._el,
            views = el.comments,
            width = el.width,
            map = this._map,
            queue = this._queue;

      const x = (c, v) => {
        v.x = (width + v.width) * (1 - c.ratio) - v.width;
      };

      const y = () => {
        return Math.random() * 300;
      };

      comments.some(c => {
        var v;

        // コメントデータに関連付けられているビューを探す

        if ((v = map.get(c))) {

          // 既にビューに関連付けられている

          if (c.visible) {

            // 引き続き表示されるのでnakaに限り動かすだけでOK

            if (!c.position) x(c, v);

          } else {

            // コメントが表示されなくなったので関連付けを解除

            map.delete(c);
            let i = queue.indexOf(v);
            if (i >= 0) queue.splice(i, 1);
            v.clear();

            console.log("cleared");

          }

        } else if (c.visible) {

          // 新しく表示されるコメント

          // 空いているビューを探す
          views.some(view => {
            return !view.tag && (v = view);
          });

          if (!v) {
            // 空いているビューが無ければ表示中の最古のコメントを消す
            v = queue.pop(v);
            v.clear();
          }
          map.set(c, v);
          queue.unshift(v);

          v.text = c.text;
          v.color = c.color;
          v.size = c.size;
          v.visible = true;
          // ビューが使用中であることを示すフラグ
          v.tag = true;

          v.y = y();
          x(c, v);
        }
      });
    }

    _getFontSize() {
      return 36;
    }

  };

  window.JikkyoViewer.Adapter = Adapter;
})();
