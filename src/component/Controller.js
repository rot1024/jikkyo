/* global Mousetrap */
(() => {
  "use strict";

  const win = require("nw.gui").Window.get();
  const doc = document.currentScript.ownerDocument;

  const EventEmitter = require("events").EventEmitter;

  const Controller = class extends HTMLElement {

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
      const btn = this.shadowRoot.getElementById("btn-alwaysontop");
      if (v) btn.classList.add("on");
      else btn.classList.remove("on");
      win.setAlwaysOnTop(v);
    }

    get isFixed() {
      return this._isFixed;
    }

    set isFixed(v) {
      this._isFixed = !!v;
      const btn = this.shadowRoot.getElementById("btn-fix");
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
      const p = this._pref;
      if (!p || !p.controller) return;

      this.isAlwaysOnTop = p.controller.alwaysOnTop || false;
      this.isFixed = p.controller.fixed || false;
    }

    savePref() {
      const p = this._pref;
      if (!p) return;

      if (!p.controller) p.controller = {};
      p.controller.alwaysOnTop = this.isAlwaysOnTop;
      p.controller.fixed = this.isFixed;

      p.save();
    }

    addMode(mode) {
      const i = this._modes.length;
      const item = new window.jikkyo.MenuItem({
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
      const that = this;
      const root = this.createShadowRoot();
      const template = doc.getElementById("main");
      root.appendChild(document.importNode(template.content, true));
      root.addEventListener("click", e => e.stopPropagation());

      this.shortcutKeysAvailable = true;

      this._event = new EventEmitter();
      this._alwaysOnTop = false;
      this._isFixed = false;
      this._mode = 0;
      this._modes = [];
      this._modeMenuItems = [];
      this._modeContainer = root.getElementById("container-mode");

      const alwaysontopBtn = root.getElementById("btn-alwaysontop"),
            fixBtn = root.getElementById("btn-fix"),
            menuBtn = root.getElementById("btn-menu");

      const fix = (() => {
        this.isFixed = !this.isFixed;
        this.savePref();
      }).bind(this);

      const alwaysontop = (() => {
        this.isAlwaysOnTop = !this.isAlwaysOnTop;
        this.savePref();
      }).bind(this);

      const modeNext = (() => {
        this._event.emit("observe", "modeNext");
      }).bind(this);

      const modePrev = (() => {
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
        const rect = menuBtn.getBoundingClientRect();
        this._menu.show(rect.right, rect.top);
      }).bind(this));

      function resetWindow() {
        window.windowWrapper.reset();
      }

      this.shortcutkeys = [
        { key: "ctrl+t", macKey: "command+t", label: "常に最前面表示", press: alwaysontop },
        { key: "ctrl+f", macKey: "command+f", label: "コントロールバーを固定", press: fix },
        { key: "ctrl+n", macKey: "command+n", label: "次のモード", press: modeNext },
        { key: "ctrl+p", macKey: "command+p", label: "前のモード", press: modePrev },
        { key: "ctrl+i", macKey: "command+i", label: "ウィンドウの位置・サイズをを初期状態に戻す", press: resetWindow }
      ];

      const mac = process.platform === "darwin";
      this.shortcutkeys.forEach(k => {
        Mousetrap.bind(mac && k.macKey ? k.macKey : k.key, (() => {
          if (this.shortcutKeysAvailable) k.press();
        }).bind(this));
      }, this);
    }

  };

  window.jikkyo.Controller = document.registerElement("jikkyo-controller", {
    prototype: Controller.prototype
  });

})();
