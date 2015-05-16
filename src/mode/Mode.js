/* global Mousetrap */
(() => {
  "use strict";

  class Mode extends HTMLElement {

    createdCallback() {
      this._adapter = new window.jikkyo.Viewer.Adapter();
      this._label = "";
      this._preferenceLabel = "";
      this._viewerView = null;
      this._pref = null;
      this._customMenu = document.createElement("jikkyo-menu");
      this.shortcutkeys = [];
      this.shortcutKeysAvailable = true;
      this.droppable = false;
    }

    get adapter() {
      return this._adapter;
    }

    get label() {
      return this._label;
    }

    set label(v) {
      this._label = v;
    }

    get viewerView() {
      return this._viewerView;
    }

    set viewerView(v) {
      this._viewerView = v;
      if (this._adapter) this._adapter.viewer = v;
    }

    get preference() {
      return this._pref;
    }

    set preference(v) {
      this._pref = v;
      this._initPref();
    }

    refresh() {
      this._adapter.refresh();
      this._adapter.render();
    }

    show() {
      this._adapter.showComment();

      const mac = process.platform === "darwin";
      this.shortcutkeys.forEach(k => {
        Mousetrap.bind(mac && k.macKey ? k.macKey : k.key, (() => {
          if (this.shortcutKeysAvailable) k.press();
        }).bind(this));
      }, this);
    }

    hide() {
      this._adapter.stop();
      this._adapter.hideComment();

      this._customMenu.hide();

      const mac = process.platform === "darwin";
      this.shortcutkeys.forEach(k => {
        Mousetrap.unbind(mac && k.macKey ? k.macKey : k.key);
      });
    }

    getPreferenceView() {
      return null;
    }

    initPreferenceView() {
      this._initPref();
    }

    savePreferenceView() {
      this._initPref();
    }

    initPreference() {}

    drop() {}

    menu() {}

    _initPref() {
      if (!this._pref || !this.preferenceName) return;

      var init = this.initPreference();

      if (!this._pref[this.preferenceName]) {
        this._pref[this.preferenceName] = init;
        this._pref.save();
      } else {
        let c = false;
        Object.keys(init).forEach(key => {
          if (this._pref[this.preferenceName][key] === void(0)) {
            this._pref[this.preferenceName][key] = init[key];
            c = true;
          }
        }, this);
        if (c) this._pref.save();
      }
    }

  }

  window.jikkyo.Mode = Mode;
})();
