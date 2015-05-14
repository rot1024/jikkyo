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
      this.shortcutkeys = [];
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
        Mousetrap.bind(mac && k.macKey ? k.macKey : k.key, k.press);
      });
    }

    hide() {
      this._adapter.stop();
      this._adapter.hideComment();

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

    initPreference() {
    }

    drop() {
    }

    _initPref() {
      if (this._pref && this.preferenceName && !this._pref[this.preferenceName]) {
        this._pref[this.preferenceName] = this.initPreference();
        this._pref.save();
      }
    }

  }

  window.jikkyo.Mode = Mode;
})();
