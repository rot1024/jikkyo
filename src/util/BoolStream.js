module.exports = (() => {
  "use strict";

  var BoolStream = class {

    constructor(size) {
      this._buf = new Buffer(size || 0);
      this._buf.fill(0);
    }

    get size() {
      return this._buf.length;
    }

    set size(v) {
      var l = this._buf.length;
      if (v === l) return;
      if (v < l) this._buf = this._buf.slice(0, v);
      else {
        let buf = new Buffer(v - l);
        buf.fill(0);
        this._buf = Buffer.concat([this._buf, buf]);
      }
    }

    clear() {
      this._buf.fill(0);
    }

    fill(val, start, end) {
      this._buf.fill(val ? 1 : 0, start, end);
    }

    vacant(start, end) {
      var b = this._buf.slice(start, end);
      for (let i = 0; i < b.length; ++i) {
        if (b[i] === 1) return false;
      }
      return true;
    }

  };

  return BoolStream;
})();
