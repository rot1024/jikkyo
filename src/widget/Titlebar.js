module.exports = (() => {
  "use strict";

  var Widget = require("./Widget");

  var Titlebar = class extends Widget {
    constructor() {
      super();
      this._maxmized = false;
    }

    onAttach(element) {
    }
  };

  return Titlebar;
})();
