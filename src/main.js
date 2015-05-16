(() => {
  "use strict";

  var gui = require("nw.gui"),
      win = gui.Window.get(),
      UpdateChecker = require("./util/UpdateChecker");

  var pref = new window.jikkyo.Preference();
  pref.load();

  if (pref.general && pref.general.checkNewVersionAuto) {
    UpdateChecker.getLatestVersion().then(v => {
      if (v === UpdateChecker.currentVersion) return;
      var modal = document.querySelector("jikkyo-modal");
      modal.use(
        "yesno", `新バージョン ${v} が公開されています。公式サイトを開きますか？`,
        null,
        () => {
          gui.Shell.openExternal(UpdateChecker.homepageURL);
          modal.hide();
        }
      );
      modal.show();
    });
  }

  if (window.WindowWrapper.clickthrough) {
    win.x = 0;
    win.y = 0;
    win.width = window.screen.availWidth;
    win.height = window.screen.availHeight;
  }

  win.on("loaded", () => {

    window.ondragover = e => { e.preventDefault(); return false; };
    window.ondrop = e => { e.preventDefault(); return false; };

    window.addEventListener("keydown", e => {
      if (e.keyCode === 123) win.showDevTools();
    });

    var winp = document.getElementById("windowp"),
        container = document.getElementById("window"),
        titlebar = document.querySelector("jikkyo-titlebar"),
        controller = document.querySelector("jikkyo-controller"),
        viewer = document.querySelector("jikkyo-viewer"),
        preferenceDialog = document.querySelector("jikkyo-preference-dialog"),
        modal = document.querySelector("jikkyo-modal"),
        holder = document.querySelector("jikkyo-drop-holder"),
        manager = new window.jikkyo.ModeManager();

    if (window.WindowWrapper.clickthrough) {
      window.document.body.classList.add("clickthrough");
      titlebar.setAttribute("clickthrough", "");
    }

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
      manager.currentMode.hide();
      win.hide();

      pref.maximized = container.classList.contains("maximized");
      if (!pref.maximized) {
        pref.x = window.WindowWrapper.x;
        pref.y = window.WindowWrapper.y;
        pref.width = window.WindowWrapper.width;
        pref.height = window.WindowWrapper.height;
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
      if (e.clientY < 70) titlebar.show();
      else titlebar.hide();
      if (win.height - 150 < e.clientY)
        controller.show();
      else if (!controller.isFixed)
        controller.hide();
    });

    manager.viewerView = viewer;
    manager.controllerView = controller;
    manager.preferenceDialogView = preferenceDialog;
    manager.preference = pref;
    manager.modal = modal;
    manager.dropHolder = holder;
    manager.addMode(new window.jikkyo.FileMode());
    manager.addMode(new window.jikkyo.TwitterMode());
    manager.setModeFromPref();

    var applyPreference = () => {
      if (pref.general.windowBgColorTransparent) {
        container.style.backgroundColor = null;
      } else {
        container.style.backgroundColor = pref.general.windowBgColor;
      }

      var css = `font-family: ${pref.general.fontFamily}; `;
      if (pref.general.fontWeight) css += `font-weight: bold; `;
      css += `opacity: ${pref.general.opacity}; `;
      css += pref.general.style;

      var bulletCss = `opacity: ${pref.general.bulletOpacity}; `;
      bulletCss += pref.general.bulletStyle;
      manager.applyPreference();
      viewer.setChatStyle(css);
      viewer.setBulletChatStyle(bulletCss);

      manager.refresh();
    };
    applyPreference();
    preferenceDialog.on("hide", applyPreference);

    win.show();

    if (window.WindowWrapper.clickthrough) {
      if (
        pref.maximized &&
        process.platform !== "darwin" /* workaround */
      ) {
        winp.style.left = "0";
        winp.style.top = "0";
        winp.style.width = win.width + "px";
        winp.style.height = win.height + "px";
      } else {
        if (typeof pref.x === "number")
          winp.style.left = pref.x + "px";
        if (typeof pref.y === "number")
          winp.style.top = pref.y + "px";
        if (typeof pref.width === "number" && pref.width >= 100)
          winp.style.width = pref.width + "px";
        else
          winp.style.width = "800px";
        if (typeof pref.height === "number" && pref.height >= 100)
          winp.style.height = pref.height + "px";
        else
          winp.style.height = "800px";
      }
    } else {
      if (
        pref.maximized &&
        process.platform !== "darwin" /* workaround */
      ) win.maximize();
      else {
        if (typeof pref.x === "number")
          win.x = pref.x;
        if (typeof pref.y === "number")
          win.y = pref.y;
        if (typeof pref.width === "number" && pref.width >= 100)
          win.width = pref.width;
        else
          win.width = 800;
        if (typeof pref.height === "number" && pref.height >= 100)
          win.height = pref.height;
        else
          win.height = 520;
      }
    }

    setTimeout(() => {
      container.classList.remove("attention");
    }, 100);
  });

})();
