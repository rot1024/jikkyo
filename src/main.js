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

    var container = document.getElementById("window"),
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

    win.on("focus", () => {
      if (window.WindowWrapper.clickthrough) {
        titlebar.show();
        controller.show();
      }
      container.classList.add("hover");
    });

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
      window.WindowWrapper.save(pref);
      win.close(true);
    });

    container.addEventListener("mouseover", () => {
      if (window.WindowWrapper.clickthrough) return;
      container.classList.add("hover");
    });

    container.addEventListener("mouseout", () => {
      if (window.WindowWrapper.clickthrough) return;
      titlebar.hide();
      if (!controller.isFixed) {
        controller.hide();
      }
      container.classList.remove("hover");
    });

    container.addEventListener("mousemove", e => {
      if (window.WindowWrapper.clickthrough) return;
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
    window.WindowWrapper.init(pref);

    setTimeout(() => {
      container.classList.remove("attention");
    }, 100);
  });

})();
