module.exports = {
  env: {
    browser: true
  },
  globals: {
    Mousetrap: true
  },
  rules: {
    "prefer-spread": 0,
    "node/no-missing-require": 0,
    "node/no-missing-import": 0,
    "node/no-unpublished-require": [2, {
      allowModules: ["nw.gui"]
    }],
    "node/no-unpublished-import": [2, {
      allowModules: ["nw.gui"]
    }],
    "node/no-unsupported-features": [2, { "version": 4 }],
    "no-extra-bind": 0,
    strict: [2, "function"]
  }
};
