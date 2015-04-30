module.exports = (() => {
  "use strict";

  class Time {

    get hour() {
      return this._h;
    }

    get minute() {
      return this._m;
    }

    get second() {
      return this._s;
    }

    get totalMillisecond() {
      return this._total;
    }

    set totalMillisecond(v) {
      var ts, tm;
      this._total = v;
      ts = ~~(this._total / 1000);
      this._s = ts % 60;
      tm = ~~(ts / 60);
      this._m = tm % 60;
      this._h = ~~(tm / 60);
    }

    constructor() {
      this._total = this._ms = this._s = this._m = this._h = 0;
    }

    toString() {
      return (this._h >= 100 ? this._h : ("0" + this._h).slice(-2)) + ":" +
        ("0" + this._m).slice(-2) + ":" +
        ("0" + this._s).slice(-2);
    }
  }

  return Time;
})();
