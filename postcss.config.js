"use strict";

const cssimport = require("postcss-smart-import");
const cssnext = require("postcss-cssnext");

module.exports = {
  plugins: [
    cssimport({
      path: ["node_modules", "./app/renderer"]
    }),
    cssnext()
  ]
};
