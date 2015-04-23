(() => {
  "use strict";

  var gui = require("nw.gui");
  var win = gui.Window.get();

  require("./util/maximized")(win).inspect();

  window.addEventListener("load", () => {

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
