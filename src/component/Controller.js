/* global Mousetrap */
(() => {
  "use strict";

  var win = require("nw.gui").Window.get();
  var constants = require("./constants");
  var doc = document.currentScript.ownerDocument;

  var EventEmitter = require("events").EventEmitter;

  var Controller = class extends HTMLElement {

    hide() {
      if (this._isFixed) return;
      this.shadowRoot.getElementById("container").classList.add("hidden");
    }

    show() {
      this.shadowRoot.getElementById("container").classList.remove("hidden");
    }

    toggle() {
      if (this.isShown) this.hide();
      else this.show();
    }

    get isShown() {
      return !this.shadowRoot.getElementById("container").classList.contains("hidden");
    }

    get isAlwaysOnTop() {
      return this._alwaysOnTop;
    }

    set isAlwaysOnTop(v) {
      this._alwaysOnTop = v;
      var btn = this.shadowRoot.getElementById("btn-alwaysontop");
      if (v) btn.classList.add("on");
      else btn.classList.remove("on");
      win.setAlwaysOnTop(v);
    }

    get isFixed() {
      return this._isFixed;
    }

    set isFixed(v) {
      this._isFixed = !!v;
      var btn = this.shadowRoot.getElementById("btn-fix");
      if (v) {
        this.show();
        btn.classList.add("on");
      }
      else btn.classList.remove("on");
    }

    get mode() {
      return this._mode;
    }

    set mode(v) {
      if (v === this._mode) return;

      this._modeMenuItems.forEach((m, i) => {
        m.checked = i === v;
      });

      this._modes.forEach((m, i) => {
        if (i === v)
          m.classList.remove("hidden");
        else
          m.classList.add("hidden");
      });

      this._mode = v;
    }

    get preference() {
      return this._pref;
    }

    set preference(v) {
      this._pref = v;
      this.loadPref();
    }

    loadPref() {
      var p = this._pref;
      if (!p || !p.controller) return;

      this.isAlwaysOnTop = p.controller.alwaysOnTop || false;
      this.isFixed = p.controller.fixed || false;
    }

    savePref() {
      var p = this._pref;
      if (!p) return;

      if (!p.controller) p.controller = {};
      p.controller.alwaysOnTop = this.isAlwaysOnTop;
      p.controller.fixed = this.isFixed;

      p.save();
    }

    addMode(mode) {
      var i = this._modes.length;
      var item = new window.jikkyo.MenuItem({
        label: mode.label,
        checked: i === this._mode,
        click: (() => {
          this.mode = i;
          this._event.emit("observe", "modeChange", i);
        }).bind(this)
      });
      this._menu.add(item, this._menuSeparetor);
      this._modeMenuItems.push(item);

      mode.classList.add("mode");
      if (i !== this._mode) mode.classList.add("hidden");
      this._modes.push(mode);
      this._modeContainer.appendChild(mode);
    }

    on(listener) {
      this._event.on("observe", listener);
    }

    off(listener) {
      this._event.removeListener("observe", listener);
    }

    createdCallback() {
      var that = this;
      var root = this.createShadowRoot();
      var template = doc.getElementById("main");
      root.appendChild(document.importNode(template.content, true));
      root.addEventListener("click", e => e.stopPropagation());

      this._event = new EventEmitter();
      this._alwaysOnTop = false;
      this._isFixed = false;
      this._mode = 0;
      this._modes = [];
      this._modeMenuItems = [];
      this._modeContainer = root.getElementById("container-mode");

      var alwaysontopBtn = root.getElementById("btn-alwaysontop"),
          fixBtn = root.getElementById("btn-fix"),
          menuBtn = root.getElementById("btn-menu");

      var fix = (() => {
        this.isFixed = !this.isFixed;
        this.savePref();
      }).bind(this);

      var alwaysontop = (() => {
        this.isAlwaysOnTop = !this.isAlwaysOnTop;
        this.savePref();
      }).bind(this);

      var modeNext = (() => {
        this._event.emit("observe", "modeNext");
      }).bind(this);

      var modePrev = (() => {
        this._event.emit("observe", "modePrev");
      }).bind(this);

      alwaysontopBtn.addEventListener("click", alwaysontop);
      fixBtn.addEventListener("click", fix);

      this._menu = document.createElement("jikkyo-menu");
      this._menuSeparetor = new window.jikkyo.MenuItem({ type: "separator" });
      this._menu.add(this._menuSeparetor);
      this._menu.add({
        label: "ショートカットキーのヘルプ",
        click() {
          that._event.emit("observe", "showShortcutkeysHelp");
        }
      });
      this._menu.add({
        label: "開発者ツールを表示",
        click() {
          win.showDevTools();
        }
      });
      this._menu.add({
        label: "設定",
        click() {
          document.querySelector("jikkyo-preference-dialog").show();
        }
      });

      menuBtn.addEventListener("click", (() => {
        var rect = menuBtn.getBoundingClientRect();
        this._menu.show(rect.right, rect.top);
      }).bind(this));

      var resetWindow = () => {
        win.unmaximize();
        win.x = (window.screen.availWidth - constants.window.width) / 2;
        win.y = (window.screen.availHeight - constants.window.height) / 2;
        win.width = constants.window.width;
        win.height = constants.window.height;
      };

      this.shortcutkeys = [
        { key: "ctrl+t", macKey: "command+t", label: "常に最前面表示", press: alwaysontop },
        { key: "ctrl+f", macKey: "command+f", label: "コントロールバーを固定", press: fix },
        { key: "ctrl+n", macKey: "command+n", label: "次のモード", press: modeNext },
        { key: "ctrl+p", macKey: "command+p", label: "前のモード", press: modePrev },
        { key: "ctrl+r", macKey: "command+r", label: "ウィンドウの位置・サイズをを初期状態に戻す", press: resetWindow }
      ];

      const mac = process.platform === "darwin";
      this.shortcutkeys.forEach(k => {
        Mousetrap.bind(mac && k.macKey ? k.macKey : k.key, k.press);
      });
    }

  };

  window.jikkyo.Controller = document.registerElement("jikkyo-controller", {
    prototype: Controller.prototype
  });

})();
