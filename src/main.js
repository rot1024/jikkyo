(() => {
  "use strict";

  var gui = require("nw.gui");
  var win = gui.Window.get();

  window.document.body.setAttribute("data-platform", process.platform);
  window.addEventListener("DOMContentLoaded", () => {

    window.addEventListener("keydown", e => {
      if (e.keyCode === 123) win.showDevTools();
    });

    var titlebar = document.querySelector("jikkyo-titlebar");
    window.addEventListener("click", () => {
      titlebar.toggleTitlebar();
    });

    win.setTransparent(true);
    win.show();
  });

})();
