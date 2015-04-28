(() => {
  "use strict";

  var gui = require("nw.gui");
  var win = gui.Window.get();

  win.on("loaded", () => {

    window.addEventListener("keydown", e => {
      if (e.keyCode === 123) win.showDevTools();
    });

    var titlebar = document.querySelector("jikkyo-titlebar"),
        controller = document.querySelector("jikkyo-controller"),
        viewer = document.querySelector("jikkyo-viewer"),
        draggable = document.querySelector("jikkyo-draggable");

    draggable.hide();
    window.addEventListener("click", () => {
      titlebar.toggle();
      if (titlebar.isShown) {
        controller.show();
        draggable.hide();
      } else {
        controller.hide();
        draggable.show();
      }
    });

    var adapter = new window.JikkyoViewer.Adapter();
    adapter.viewer = viewer;
    adapter.controller = controller;

    win.setTransparent(true);
    win.show();

  });

})();
