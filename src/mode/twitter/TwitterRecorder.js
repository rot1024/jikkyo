module.exports = (() => {
  "use strict";

  var fs = require("fs"),
      path = require("path"),
      EventEmitter = require("events").EventEmitter;

  var escapeHTML = (content) => {
    const table = {
      '&': '&amp;',
      '"': '&quot;',
      '<': '&lt;',
      '>': '&gt;'
    };
    return content.replace(/[&"<>]/g, m => table[m]);
  };

  class TwitterRecorder extends EventEmitter {

    constructor() {
      this._stream = null;
      this._directory = "";
      this._filename = "YYYY-MM-DD_hh-mm-ss.xml";
      this._open = false;
      this._counter = 0;
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

    get isRecording() {
      return this._open;
    }

    start() {
      if (!this._directory || !this._filename)
        return false;
      var filename = this._formatDate(new Date(), this._filename);
      var stream = this._stream = fs.createWriteStream(path.join(this._directory, filename));
      stream.on("error", (err => {
        console.error(err);
        stream.end();
        this._counter = 0;
        this._open = false;
        this.emit("error", err);
      }).bind(this));
      this._open = true;
      this._counter = 0;
      this._stream.write('<?xml version="1.0" encoding="UTF-8"?>\n<packet>\n');
      return true;
    }

    record(chat) {
      if (!this._open || chat.text === "") return;
      chat = this._convertChat(chat);
      this._stream.write(`<chat user_id="${chat.userId}" date="${chat.date}" vpos="${chat.vpos}" vposm="${chat.vposm}" no="${this._counter++}"${chat.mail ? ` mail="${chat.mail}"` : ""}>${chat.text}</chat>\n`);
    }

    stop() {
      if (!this._open) return;
      this._stream.write("</packet>\n");
      this._stream.end();
      this._counter = 0;
      this._open = false;
    }

    _convertChat(chat) {
      return {
        text: escapeHTML(chat.text),
        date: chat.date,
        vpos: ~~(chat.vpos / 10),
        vposm: chat.vpos,
        mail: chat.color,
        userId: chat.userId
      };
    }

    _mkdirp(dirPath, mode, callback) {
      var mkdirp = this._mkdirp;
      fs.mkdir(dirPath, mode, function(error) {
        if (error && error.errno === 34) {
          mkdirp(path.dirname(dirPath), mode, callback);
          mkdirp(dirPath, mode, callback);
        }
        if (callback) callback();
      });
    }

    _formatDate(date, format) {
      date = date || new Date();
      format = format || 'YYYY-MM-DD hh:mm:ss.SSS';
      format = format.replace(/YYYY/g, date.getFullYear());
      format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
      format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
      format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2));
      format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
      format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
      if (format.match(/S/g)) {
        let milliSeconds = ('00' + date.getMilliseconds()).slice(-3);
        let length = format.match(/S/g).length;
        for (var i = 0; i < length; i++)
          format = format.replace(/S/, milliSeconds.substring(i, i + 1));
      }
      return format;
    }

  }

  return TwitterRecorder;
})();
