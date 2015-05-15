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
      this._dropHolder = null;
      this._modeChangedCb = this._modeChangedCb.bind(this);
      this._dropCb = this._dropCb.bind(this);
      this.shortcutKeysAvailable = true;
    }

    get mode() {
      return this._mode;
    }

    set mode(v) {
      if (v === this._mode) return;
      if (typeof v !== "number")
        throw new TypeError("mode must be number: " + typeof v);
      if (v < 0) v = 0;
      if(v >= this._modeList.length) v = this._modeList.length - 1;
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
      if (v) {
        this._modeList.forEach(mode => {
          var view = mode.getPreferenceView();
          if (view) this._preferenceDialogView.addModePreference(
            view, mode.preferenceLabel || mode.label,
            mode.initPreferenceView.bind(mode), mode.savePreferenceView.bind(mode));
        });
        v.on("show", (() => {
          this.setShortcutkeysAvailable(false);
        }).bind(this));
        v.on("hide", (() => {
          this.setShortcutkeysAvailable(true);
        }).bind(this));
      }
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

    get dropHolder() {
      return this._dropHolder;
    }

    set dropHolder(dropHolder) {
      if (dropHolder === this._dropHolder) return;
      if (this._dropHolder) this._dropHolder.off("drop", this._dropCb);
      this._dropHolder = dropHolder;
      if (dropHolder) dropHolder.on("drop", this._dropCb);
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

    setShortcutkeysAvailable(available) {
      this.shortcutKeysAvailable = available;
      if (this._controllerView)
        this._controllerView.shortcutKeysAvailable = available;
      if (this._modeList.length > 0)
        this.currentMode.shortcutKeysAvailable = available;
    }

    setDuration(duration) {
      this._modeList.forEach(m => m.adapter.duration = duration);
    }

    setDurationAlt(duration) {
      this._modeList.forEach(m => m.adapter.durationAlt = duration);
    }

    setLimit(limit) {
      this._modeList.forEach(m => m.adapter.limit = limit);
    }

    setSizingMode(sizingMode) {
      this._modeList.forEach(m => m.adapter.sizingMode = sizingMode);
    }

    setBaseFontSize(fontSize) {
      this._modeList.forEach(m => m.adapter.baseFontSize = fontSize);
    }

    setRows(rows) {
      this._modeList.forEach(m => m.adapter.rows = rows);
    }

    refresh() {
      this._modeList.forEach(m => m.refresh());
    }

    applyPreference() {
      var p = this._pref;
      if (!p) return;
      this._modeList.forEach(m => {
        m.adapter.duration = p.general.duration;
        m.adapter.durationAlt = p.general.usDuration;
        m.adapter.limit = p.general.limit;
        m.adapter.sizingMode = p.general.sizing;
        m.adapter.baseFontSize = p.general.fontSize;
        m.adapter.rows = p.general.rows;
      });

    }

    showShortcutkeysHelp() {
      if (!this.modal) return;

      const mac = process.platform === "darwin";
      var str = "", keys = [];

      if (this._controllerView && Array.isArray(this._controllerView.shortcutkeys))
        keys.push({ keys: this._controllerView.shortcutkeys });
      keys = keys.concat(this._modeList.map(m => ({ label: m.label, keys: m.shortcutkeys })));

      keys.forEach(m => {
        if (m.label) str += `<h1>${m.label}</h1>`;
        m.keys.forEach(k => {
          var key = (mac && k.macKey ? k.macKey : k.key).split("+");
          key = key.map(s => {
            if (s === "left") return "←";
            if (s === "right") return "→";
            if (s === "command") return "&#x2318;";
            if (s === "shift" && mac) return "&#x21e7;";
            if (s === "ctrl" && mac) return "&#8963;";
            return s.length === 1 ? s.toUpperCase() : s[0].toUpperCase() + s.slice(1);
          });
          str += `<p><kbd><span>${key.join("</span> + <span>")}</span></kbd> ${k.label}</p>`;
        });
      });

      this.modal.use("alert", str, (() => {
        this.setShortcutkeysAvailable(true);
        this.modal.hide();
      }).bind(this));
      this.modal.width = 500;
      this.modal.height = 400;
      this.modal.appendStyle(`
p { vertical-align: middle; }
kbd {
display: inline-block;
min-width: 120px;
padding-right: 10px;
vertical-align: middle;
}
kbd span {
display: inline-block;
margin-bottom: 4px;
padding: 2px 5px;
border: 1px solid #666;
border-radius: 2px;
vertical-align: middle;
}`);
      this.setShortcutkeysAvailable(false);
      this.modal.show();
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

      if (this._dropHolder)
        this._dropHolder.enabled = this.currentMode.droppable;
    }

    _modeChangedCb(type, i) {
      if (type === "modeChange") {
        this.mode = i;
      } else if (type === "showShortcutkeysHelp") {
        this.showShortcutkeysHelp();
      } else if (type === "modeNext") {
        this.mode++;
      } else if (type === "modePrev") {
        this.mode--;
      }
    }

    _dropCb(file) {
      this.currentMode.drop(file);
    }

  }

  window.jikkyo.ModeManager = ModeManager;
})();
