(() => {
  "use strict";

  class Mode extends HTMLElement {

    createdCallback() {
      this._adapter = new window.jikkyo.Viewer.Adapter();
      this._label = "";
      this._viewerView = null;
      this._pref = null;
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
    }

    savePref() {
      if (this._pref) this._pref.save();
    }

    show() {
    }

    hide() {
      this._adapter.stop();
    }

    refresh() {
    }

  }

  window.jikkyo.Mode = Mode;
})();
