(() => {
  "use strict";

  class ModeManager {

    constructor() {
      this._mode = -1;
      this._modeList = [];
      this._pref = null;
      this._viewerView = null;
      this._controllerView = null;
      this._modeChangedCb = this._modeChangedCb.bind(this);
    }

    get mode() {
      return this._mode;
    }

    set mode(v) {
      if (v === this._mode) return;
      if (typeof v !== "number")
        throw new TypeError("mode must be number: " + typeof v);
      v = ~~v;
      if (v !== -1 && (v < 0 || v >= this._modeList.length))
        throw new RangeError("mode is wrong: " + v);

      if (this._mode >= 0) {
        this.currentMode.hide();
        this.currentMode.viewerView = null;
      }
      this._mode = v;
      if (this._mode >= 0) {
        if (this._controllerView) this._controllerView.mode = v;
        this.currentMode.viewerView = this._viewerView;
        this.currentMode.show();
      }
    }

    get modes() {
      return this._modeList;
    }

    get currentMode() {
      return this._modeList[this._mode];
    }

    get viewerView() {
      return this._viewerView;
    }

    set viewerView(v) {
      this._viewerView = v;
    }

    get controllerView() {
      return this._controllerView;
    }

    set controllerView(v) {
      if (this._controllerView === v) return;
      if (this._controllerView) {
        v.off(this._modeChangedCb);
      }
      this._controllerView = v;
      if (v) {
        v.on(this._modeChangedCb);
        this._modeList.forEach(m => v.addMode(m));
      }
    }

    get preference() {
      return this._pref;
    }

    set preference(v) {
      this._pref = v;
      this._modeList.forEach(m => m.preference = v);
    }

    addMode(mode) {
      if (!(mode instanceof window.jikkyo.Mode))
        throw new TypeError("mode must be Mode: " + typeof mode);
      this._modeList.push(mode);
      if (this._controllerView)
        this._controllerView.addMode(mode);
      if (this._pref)
        mode.preference = this._pref;
      if (this._mode === -1) this.mode = 0;
    }

    _modeChangedCb(type, i) {
      if (type === "modeChange") {
        this.mode = i;
      }
    }

  }

  window.jikkyo.ModeManager = ModeManager;
})();
