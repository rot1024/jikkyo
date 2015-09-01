module.exports = (() => {
  "use strict";

  var fs = require("fs"),
      xml = require("xml2js").parseString;

  var colorRegExp = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

  class NicoComment {

    constructor() {
      this._comment = [];
      this.options = {
        autoColoring: false,
        size: {
          big: NicoComment.defaultSize.big,
          small: NicoComment.defaultSize.small
        }
      };
    }

    get comment() {
      return this._comment;
    }

    readFromFile(path) {
      var deferred = Promise.defer();

      fs.readFile(path, "utf8", ((err, data) => {
        if (err) return deferred.reject(err);
        this.read(data).then(
          r => deferred.resolve(r),
          e => deferred.reject(e)
        );
      }).bind(this));

      return deferred.promise;
    }

    read(data) {
      var deferred = Promise.defer();

      this.clearComment();

      xml(data, ((err, result) => {
        if (err) return deferred.reject(err);

        if (result === null ||
            typeof result.packet !== "object" ||
            !("chat" in result.packet)) {
          return deferred.reject(new Error("parse error"));
        }

        var margin = result.packet.chat.reduce((margin2, obj) => {
          if (margin2 === -1) margin2 = 100;
          for (; parseInt(obj.$.vpos) % margin2 !== 0; ) margin2 /= 10;
          return margin2;
        }, -1);

        var autoColoring =
          this.options.autoColoring ? !result.packet.chat.some(obj => {
            if (!("mail" in obj.$)) return false;
            return obj.$.mail.split(" ").some(m => colorRegExp.test(m));
          }) : false;

        this._comment = result.packet.chat.map(obj => {
          return this._parseChat(obj, margin, autoColoring);
        }, this).filter(obj => obj !== null);

        deferred.resolve(this._comment);
      }).bind(this));

      return deferred.promise;
    }

    addChat(chat) {
      this.addComment([chat]);
    }

    addComment(comment) {
      if (!Array.isArray(comment))
        throw new TypeError("comment must be array: " + typeof comment);

      comment.forEach(chat => {
        this._comment.push(chat);
      }, this);
    }

    clearComment() {
      this._comment = [];
    }

    _parseChat(obj, margin, autoColoring) {
      if (!obj._) return null;

      margin = margin || 0;

      var chat = {
        text: obj._,
        vpos: (parseInt(obj.$.vpos) + Math.floor(Math.random() * margin)) * 10
      };

      if ("mail" in obj.$) {
        obj.$.mail.split(" ").forEach(command => {
          if (command in NicoComment.color) {
            chat.color = NicoComment.color[command];
          } else if (command in this.options.size) {
            chat.size = this.options.size[command];
          } else if (NicoComment.position.includes(command)) {
            chat.position = command;
          } else if (colorRegExp.test(command)) {
            chat.color = command;
          }
        }, this);
      }

      if (autoColoring && !chat.color) {
        let id = obj.$.user_id;
        let hash;

        if (!id)
          hash = Math.random() * 0xFFFFFF;
        else if (/^[0-9]{1,}$/.test(id))
          hash = parseInt(id);
        else
          hash = this._hashCode(id);

        let r = (hash & 0xFF0000) >> 16;
        let g = (hash & 0x00FF00) >> 8;
        let b = hash & 0x0000FF;

        chat.color = "#" + this._toHex(r) + this._toHex(g) + this._toHex(b);
      }

      return chat;
    }

    _hashCode(str) {
      var hash = 0, i, len;
      if (str.length === 0) return hash;
      for (i = 0, len = str.length; i < len; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return hash;
    }

    _toHex(num) {
      return ("0" + Number(num).toString(16)).slice(-2);
    }

  }

  NicoComment.color = {
    white:          "#FFFFFF",
    red:            "#FF0000",
    pink:           "#FF8080",
    orange:         "#FFC000",
    yellow:         "#FFFF00",
    green:          "#00FF00",
    cyan:           "#00FFFF",
    blue:           "#0000FF",
    purple:         "#C000FF",
    black:          "#000000",
    white2:         "#CCCC99",
    niconicowhite:  "#CCCC99",
    red2:           "#CC0033",
    truered:        "#CC0033",
    pink2:          "#FF33CC",
    orange2:        "#FF6600",
    passionorange:  "#FF6600",
    yellow2:        "#999900",
    madyellow:      "#999900",
    green2:         "#00CC66",
    elementalgreen: "#00CC66",
    cyan2:          "#00CCCC",
    blue2:          "#3399FF",
    marineblue:     "#3399FF",
    purple2:        "#6633CC",
    nobleviolet:    "#6633CC",
    black2:         "#666666"
  };

  NicoComment.defaultSize = {
    big:    "150%",
    small:  "50%"
  };

  NicoComment.position = ["ue", "shita"];

  return NicoComment;
})();
