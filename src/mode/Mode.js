(() => {
  "use strict";

  class Mode extends HTMLElement {

    createdCallback() {
      this._adapter = new window.jikkyo.Viewer.Adapter();
      this._label = "";
      this._preferenceLabel = "";
      this._viewerView = null;
      this._pref = null;
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
      if (!this.viewerView) return;
      this._adapter.refresh();
      if (!this._adapter.praying)
        this._adapter.render();
    }

    show() {
      this._adapter.showComment();
    }

    hide() {
      this._adapter.stop();
      this._adapter.hideComment();
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

    _initPref() {
      if (this._pref && this.preferenceName && !this._pref[this.preferenceName]) {
        this._pref[this.preferenceName] = this.initPreference();
        this._pref.save();
      }
    }

  }

  window.jikkyo.Mode = Mode;
})();
