(() => {
  "use strict";

  var gui = require("nw.gui");
  var win = gui.Window.get();

  var Titlebar = require("./Widget/Titlebar");

  window.document.body.setAttribute("data-platform", process.platform);
  window.addEventListener("DOMContentLoaded", () => {

    window.addEventListener("keydown", e => {
      if (e.keyCode === 123) win.showDevTools();
    });

    win.setTransparent(true);
    win.show();
  });

})();
