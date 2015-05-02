(() => {
  "use strict";

  var win = require("nw.gui").Window.get();
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
      if (v) this.show();
      this._menuFixedItem.checked = this._isFixed;
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
      if (!p) return;

      this.isAlwaysOnTop = p.controller.alwaysOnTop || false;
      this.isFixed = p.controller.fixed || false;
    }

    savePref() {
      var p = this._pref;
      if (!p) return;

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

      var alwaysontopBtn = root.getElementById("btn-alwaysontop");
      var menuBtn = root.getElementById("btn-menu");

      alwaysontopBtn.addEventListener("click", (() => {
        this.isAlwaysOnTop = !this.isAlwaysOnTop;
        this.savePref();
      }).bind(this));

      this._menu = document.createElement("jikkyo-menu");

      this._menuSeparetor = new window.jikkyo.MenuItem({ type: "separator" });
      this._menuFixedItem = new window.jikkyo.MenuItem({
        label: "コントロールバーを固定",
        checkable: true,
        click: (item => {
          this.isFixed = item.checked;
          this.savePref();
        }).bind(this)
      });

      this._menu.add(this._menuSeparetor);
      this._menu.add(this._menuFixedItem);
      this._menu.add({ type: "separator" });
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
    }

  };

  window.jikkyo.Controller = document.registerElement("jikkyo-controller", {
    prototype: Controller.prototype
  });

})();
