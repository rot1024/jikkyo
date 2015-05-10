module.exports = (() => {
  "use strict";

  var fs = require("fs"),
      xml = require("xml2js").parseString;

  class NicoComment {

    constructor() {
      this._comment = [];
      this.options = {
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
        this.read(data).then(r => deferred.resolve(r));
      }).bind(this));

      return deferred.promise;
    }

    read(data) {
      var deferred = Promise.defer();

      this.clearComment();

      xml(data, ((err, result) => {
        if (err) return deferred.reject(err);

        if (result === null || !("packet" in result) || !("chat" in result.packet)) {
          return deferred.resolve(this._comment);
        }

        var margin = result.packet.chat.reduce((margin, obj) => {
          if (margin === -1) margin = 100;
          for (; parseInt(obj.$.vpos) % margin !== 0; margin /= 10);
          return margin;
        }, -1);

        this._comment = result.packet.chat.map(obj => {
          return this._parseChat(obj, margin);
        }, this);

        deferred.resolve(this._comment);
      }).bind(this));

      return deferred.promise;
    }

    write() {

    }

    writeToFile(/*path*/) {
      var deferred = Promise.defer();

      deferred.reject(new Error("not implemented"));

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

    _parseChat(obj, margin) {
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
          }
        }, this);
      }

      return chat;
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
    black2:         "#666666",
  };

  NicoComment.defaultSize = {
    big:    "150%",
    small:  "50%"
  };

  NicoComment.position = ["ue", "shita"];

  return NicoComment;
})();
