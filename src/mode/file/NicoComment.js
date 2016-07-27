/* eslint { strict: [2, "global"], "key-spacing": 0 } */
"use strict";

const fs = require("fs");
const xml = require("xml2js").parseString;

const colorRegExp = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const size = ["big", "small"];
const position = ["ue", "shita"];
const color = {
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

function read(data) {
  const deferred = Promise.defer();

  xml(data, (err, result) => {
    if (err) {
      deferred.reject(err);
      return;
    }

    if (result === null ||
        typeof result.packet !== "object" ||
        !("chat" in result.packet)) {
      deferred.reject(new Error("parse error"));
      return;
    }

    const comment = result.packet.chat
      .filter(chat => !!chat._)
      .map(chat => {

        const newChat = {
          text: chat._,
          vpos: parseInt(chat.$.vpos, 10)
        };

        if ("mail" in chat.$) {
          chat.$.mail.split(" ").forEach(command => {
            if (command in color) {
              newChat.color = color[command];
            } else if (size.includes(command)) {
              newChat.size = command;
            } else if (position.includes(command)) {
              newChat.position = command;
            } else if (colorRegExp.test(command)) {
              newChat.color = command;
            }
          });
        }

        return newChat;
      });

    deferred.resolve(comment);
  });

  return deferred.promise;
}

module.exports = {

  readFromFile(path) {
    const deferred = Promise.defer();
    fs.readFile(path, "utf8", (err, data) => {
      if (err) {
        deferred.reject(err);
        return;
      }
      read(data).then(r => deferred.resolve(r))
        .catch(e => deferred.reject(e));
    });
    return deferred.promise;
  },

  read

};
