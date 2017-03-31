"use strict";

module.exports = {
  extends: "stylelint-config-standard",
  rules: {
    "no-empty-source": null,
    "property-no-unknown": [true, { ignoreProperties: ["composes"] }],
    "selector-list-comma-newline-after": null
  }
};
