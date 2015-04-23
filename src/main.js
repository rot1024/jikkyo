(() => {
  "use strict";

  var gui = require("nw.gui");
  var win = gui.Window.get();

  require("./util/maximized")(win).inspect();

  window.addEventListener("load", () => {

    window.addEventListener("keydown", e => {
      if (e.keyCode === 123) win.showDevTools();
    });

    var titlebar = document.querySelector("jikkyo-titlebar"),
        controller = document.querySelector("jikkyo-controller");
    window.addEventListener("click", () => {
      titlebar.toggleTitlebar();
      controller.toggle();
    });

    win.setTransparent(true);
    win.show();
  });

})();
