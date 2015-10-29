"use strict";

var illegalRe = /[\/\?<>\\:\*\|":]/g;
var controlRe = /[\x00-\x1f\x80-\x9f]/g;
var reservedRe = /^\.+$/;

function sanitize(path) {
    return path.replace(illegalRe, toFull)
               .replace(controlRe, "")
               .replace(illegalRe, "");
}

function toFull(str) {
    return str.replace(/[\!-\~]/g, s => {
        return String.fromCharCode(s.charCodeAt(0) + 0xFEE0);
    }).replace(/ /g, "\u3000");
}

module.exports = sanitize;
