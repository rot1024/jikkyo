module.exports = (() => {
  "use strict";

  var BoolArray = class {

    constructor(size) {
      this._buf = [];
      for (let i = 0; i < size; ++i)
        this._buf.push(false);
    }

    get size() {
      return this._buf.length;
    }

    set size(v) {
      var l = this._buf.length;
      if (v === l) return;
      if (v < l) this._buf.splice(v);
      else {
        for (let i = 0; i < v - l; ++i)
          this._buf.push(false);
      }
    }

    clear() {
      this._buf.fill(false);
    }

    fill(val, start, end) {
      var v = !!val;
      this._buf.fill(val, start, end);
    }

    vacant(start, end) {
      for (let i = start; i <= end; ++i)
        if (this._buf[i]) return false;
      return true;
    }

  };

  return BoolArray;
})();
