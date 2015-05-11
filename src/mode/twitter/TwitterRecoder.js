module.exports = (() => {
  "use strict";

  var fs = require("fs");
  var EventEmitter = require("events").EventEmitter;

  class TwitterRecoder extends EventEmitter {

    constructor() {
      this._stream = null;
      this._directory = "";
      this._filename = "";
    }

    get directory() {
      return this._directory;
    }

    set directory(v) {
      this._directory = v;
    }

    get filename() {
      return this._filename;
    }

    set filename(v) {
      this._filename = v;
    }

    get path() {

    }

    start() {
      var stream = this._stream = fs.createWriteStream(this.path);
      stream.on("error", err => {
        stream.end();
      });
    }

    stop() {

    }

  }

  return TwitterRecoder;
})();
