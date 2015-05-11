(() => {
  "use strict";

  class ModeManager {

    constructor() {
      this._mode = -1;
      this._modeList = [];
      this._pref = null;
      this._viewerView = null;
      this._controllerView = null;
      this._preferenceDialogView = null;
      this._modeChangedCb = this._modeChangedCb.bind(this);
    }

    get mode() {
      return this._mode;
    }

    set mode(v) {
      if (v === this._mode) return;
      if (typeof v !== "number")
        throw new TypeError("mode must be number: " + typeof v);
      if (v < 0 || v >= this._modeList.length)
        throw new RangeError("mode is wrong: " + v);

      this._setMode(v);

      if (this._pref && v !== this._pref.mode) {
        this._pref.mode = v;
        this._pref.save();
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

    get preferenceDialogView() {
      return this._preferenceDialogView;
    }

    set preferenceDialogView(v) {
      this._preferenceDialogView = v;
      if (v) this._modeList.forEach(mode => {
        var view = mode.getPreferenceView();
        if (view) this._preferenceDialogView.addModePreference(
          view, mode.preferenceLabel || mode.label,
          mode.initPreferenceView.bind(mode), mode.savePreferenceView.bind(mode));
      });
    }

    get preference() {
      return this._pref;
    }

    set preference(v) {
      this._pref = v;
      this._modeList.forEach(m => {
        m.preference = v;
        if (m.preferenceName && !this._pref[m.preferenceName])
          this._pref[m.preferenceName] = m.initPreference();
      });
      this._pref.save();
    }

    addMode(mode) {
      if (!(mode instanceof window.jikkyo.Mode))
        throw new TypeError("mode must be Mode: " + typeof mode);
      this._modeList.push(mode);
      if (this._pref) {
        mode.preference = this._pref;
        if (mode.preferenceName && !this._pref[mode.preferenceName]) {
          this._pref[mode.preferenceName] = mode.initPreference();
          this._pref.save();
        }
      }
      if (this._controllerView)
        this._controllerView.addMode(mode);
      if (this._preferenceDialogView) {
        let view = mode.getPreferenceView();
        if (view) this._preferenceDialogView.addModePreference(
          view, mode.preferenceLabel || mode.label,
          mode.initPreferenceView.bind(mode), mode.savePreferenceView.bind(mode));
      }
      if (this._mode === -1) this._setMode(0);
    }

    setModeFromPref() {
      if (!this._pref || typeof this._pref.mode !== "number") return;
      this.mode = this._pref.mode;
    }

    setDuration(duration) {
      this._modeList.forEach(m => m.adapter.duration = duration);
    }

    setDurationAlt(duration) {
      this._modeList.forEach(m => m.adapter.durationAlt = duration);
    }

    refresh() {
      this._modeList.forEach(m => m.refresh());
    }

    _setMode(mode) {
      if (this.currentMode) {
        this.currentMode.hide();
        this.currentMode.viewerView = null;
      }

      this._mode = mode;

      if (this._controllerView)
        this._controllerView.mode = mode;
      this.currentMode.viewerView = this._viewerView;
      this.currentMode.show();
    }

    _modeChangedCb(type, i) {
      if (type === "modeChange") {
        this.mode = i;
      }
    }

  }

  window.jikkyo.ModeManager = ModeManager;
})();
