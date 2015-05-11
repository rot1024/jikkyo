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

    win.on("close", () => {
      win.hide();

      pref.maximized = container.classList.contains("maximized");
      if (!pref.maximized) {
        pref.x = win.x;
        pref.y = win.y;
        pref.width = win.width;
        pref.height = win.height;
      }
      pref.save();

      win.close(true);
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
    manager.setModeFromPref();

    var refreshPref = () => {
      var css = `font-family: ${pref.general.fontFamily};`;
      css += `opacity: ${pref.general.opacity};`;
      css += pref.general.style;

      var bulletCss = `opacity: ${pref.general.bulletOpacity};`;
      bulletCss += pref.general.bulletStyle;

      manager.setDuration(pref.general.duration);
      manager.setDurationAlt(pref.general.usDuration);
      viewer.setChatStyle(css);
      viewer.setBulletChatStyle(bulletCss);

      manager.refresh();
    };
    refreshPref();
    preferenceDialog.on("hide", refreshPref);

    win.show();

    if (pref.maximized) win.maximize();
    else {
      if (typeof pref.x === "number")
        win.x = pref.x;
      if (typeof pref.y === "number")
        win.y = pref.y;
      if (typeof pref.width === "number" && pref.width >= 100)
        win.width = pref.width;
      if (typeof pref.height === "number" && pref.height >= 100)
        win.height = pref.height;
    }

    setTimeout(() => {
      container.classList.remove("attention");
    }, 100);
  });

})();
