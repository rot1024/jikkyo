(() => {
  "use strict";

  var gui = require("nw.gui");
  var win = gui.Window.get();

  var Titlebar = require("./Widget/Titlebar");

  window.addEventListener("DOMContentLoaded", () => {

    window.document.body.setAttribute("data-platform", process.platform);

    window.addEventListener("keydown", e => {
      if (e.keyCode === 123) win.showDevTools();
    });

    var titlebar = new Titlebar();
    titlebar.attach(window.document.getElementById("titlebar"));

    var viewer = window.document.getElementById("viewer");
    viewer.setAttribute("width", win.width);
    viewer.setAttribute("height", win.height);
    win.on("resize", (w, h) => {
      viewer.setAttribute("width", w);
      viewer.setAttribute("height", h);
    });

    win.setTransparent(true);
    win.show();
  });

})();
