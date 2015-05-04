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
        viewer = document.querySelector("jikkyo-viewer"),
        preferenceDialog = document.querySelector("jikkyo-preference-dialog");

    var pref = new window.jikkyo.Preference();
    pref.load();
    preferenceDialog.preference = pref;
    controller.preference = pref;

    win.on("maximize", () => container.classList.add("maximized"));
    win.on("unmaximize", () => container.classList.remove("maximized"));
    win.on("focus", () => container.classList.add("hover"));

    win.on("blur", () => {
      titlebar.hide();
      if (!controller.isFixed) {
        controller.hide();
      }
      container.classList.remove("hover");
    });

    container.addEventListener("mouseover", () => {
      container.classList.add("hover");
    });

    container.addEventListener("mouseout", () => {
      titlebar.hide();
      if (!controller.isFixed) {
        controller.hide();
      }
      container.classList.remove("hover");
    });

    container.addEventListener("mousemove", e => {
      var rect = container.getBoundingClientRect();
      if (rect.top <= e.clientY && e.clientY < 50)
        titlebar.show();
      else
        titlebar.hide();

      if (win.height - 100 < e.clientY && e.clientY <= rect.bottom) {
        controller.show();
      } else if (!controller.isFixed) {
        controller.hide();
      }
    });

    var manager = new window.jikkyo.ModeManager();
    manager.viewerView = viewer;
    manager.controllerView = controller;
    manager.preferenceDialogView = preferenceDialog;
    manager.preference = pref;
    manager.addMode(new window.jikkyo.FileMode());
    manager.addMode(new window.jikkyo.TwitterMode());

    win.setTransparent(true);
    win.show();

  });

})();
