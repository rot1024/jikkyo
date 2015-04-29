(() => {
  "use strict";

  var gui = require("nw.gui");
  var win = gui.Window.get();

  win.on("loaded", () => {

    window.addEventListener("keydown", e => {
      if (e.keyCode === 123) win.showDevTools();
    });

    var container = document.getElementById("window"),
        titlebar = document.querySelector("jikkyo-titlebar"),
        controller = document.querySelector("jikkyo-controller"),
        viewer = document.querySelector("jikkyo-viewer");

    win.on("maximize", () => container.classList.add("maximized"));
    win.on("unmaximize", () => container.classList.remove("maximized"));
    win.on("focus", () => container.classList.add("hover"));
    win.on("blur", () => container.classList.remove("hover"));
    container.addEventListener("mouseover", () => container.classList.add("hover"));
    container.addEventListener("mouseout", () => container.classList.remove("hover"));
    container.addEventListener("mousemove", e => {
      if (e.clientY < 50)
        titlebar.show();
      else
        titlebar.hide();

      if (win.height - e.clientY < 100) {
        controller.show();
      } else if (!controller.isFixed) {
        controller.hide();
      }
    });

    var adapter = new window.JikkyoViewer.Adapter();
    adapter.viewer = viewer;
    adapter.controller = controller;

    win.setTransparent(true);
    win.show();

  });

})();
