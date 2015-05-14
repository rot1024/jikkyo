(() => {
  "use strict";

  var gui = require("nw.gui"),
      EventEmitter = require("events").EventEmitter,
      UpdateChecker = require("./util/UpdateChecker"),
      doc = document.currentScript.ownerDocument;

  class PreferenceDialog extends window.jikkyo.Modal {

    createdCallback() {
      super.createdCallback();

      this.width = 640;
      this.height = 420;
      this._preference = null;

      this.appendStyle(document.importNode(doc.querySelector("#style").content, true));
      this.appendContent(document.importNode(doc.querySelector("#content").content, true));

      this._modePrefs = [];
      this._initPrefCb = [];
      this._savePrefCb = [];
      this._tabs = this.content.querySelector("#tabs");
      this._prefs = this.content.querySelector("#prefs");
      this._event = new EventEmitter();

      var prefc = this.content.querySelectorAll(".pref");
      Array.from(prefc).forEach(c => {
        this.addModePreference(c, c.dataset.title, null, null, true, c.hasAttribute("data-last"));
      }, this);

      this.content.querySelector("#ok").addEventListener("click", (() => {
        this.hide();
      }).bind(this));

      var modal = this.shadowRoot.querySelector("#about-modal");

      this.shadowRoot.querySelector("#about-version").textContent = UpdateChecker.currentVersion;
      this.shadowRoot.querySelector("#about-homepage").addEventListener(
          "click", () => gui.Shell.openExternal(UpdateChecker.homepageURL));
      this.shadowRoot.querySelector("#about-repository").addEventListener(
        "click", () => gui.Shell.openExternal(UpdateChecker.repositoryURL));

      this.shadowRoot.querySelector("#about-check").addEventListener(
        "click", () => {
          modal.use("loading");
          modal.show();
          UpdateChecker.getLatestVersion().then(v => {
            if (v !== UpdateChecker.currentVersion) {
              modal.use(
                "alert", `新バージョン ${v} が公開されています。公式サイトを開きますか？`,
                () => modal.hide(),
                () => {
                  gui.Shell.openExternal(UpdateChecker.homepageURL);
                  modal.hide();
                });
            } else {
              modal.use("alert", "最新バージョンをお使いです。", () => modal.hide());
            }
          }).catch(e => {
            console.error(e);
            modal.use("alert", "データの取得に失敗しました。", () => modal.hide());
          });
        });

    }

    get preference() {
      return this._preference;
    }

    set preference(v) {
      this._preference = v;
      if (!v.general)
        v.general = this._initGeneralPreference();
    }

    on(type, listener) {
      this._event.on(type, listener);
    }

    off(type, listener) {
      this._event.removeListener(type, listener);
    }

    show() {
      var at = this._tabs.querySelector(".active");
      if (at) at.classList.remove("active");
      at = this._prefs.querySelector(".pref.active");
      if (at) at.classList.remove("active");
      at = this._tabs.children[0];
      if (at) at.classList.add("active");
      at = this._prefs.children[0];
      if (at) at.classList.add("active");

      if (this.preference) {
        this._modePrefs.forEach((p, i) => this._initPrefCb[i](p), this);
        if (!this.preference.general)
          this.preference.general = this._initGeneralPreference();
        this._loadGeneralPreference(this.content, this.preference.general);
      }

      super.show();
    }

    hide() {
      var pr = this.preference;
      if (pr) {
        this._modePrefs.forEach((p, i) => this._savePrefCb[i](p), this);
        this._saveGeneralPreference(this.content, this.preference.general);
        pr.save();

        this._event.emit("hide");
      }

      super.hide();
    }

    addModePreference(element, title, initCb, saveCb, builtin, last) {
      if (!element) return;
      var tab = document.createElement("li");
      if (last) tab.setAttribute("data-last", "");
      tab.textContent = title;
      tab.addEventListener("click", (() => {
        var active = this._prefs.querySelector(".active");
        if (active) active.classList.remove("active");
        element.classList.add("active");
        this._tabs.querySelector(".active").classList.remove("active");
        tab.classList.add("active");
      }).bind(this));
      element.classList.add("pref");
      this._prefs.appendChild(element);

      var lastTab = this._tabs.querySelector("li[data-last]");
      if (lastTab) this._tabs.insertBefore(tab, lastTab);
      else this._tabs.appendChild(tab);

      if (!builtin) {
        this._modePrefs.push(element);
        if (initCb) this._initPrefCb.push(initCb);
        if (saveCb) this._savePrefCb.push(saveCb);
      }
    }

    _initGeneralPreference() {
      return {
        fontFamily: process.platform === "darwin" ? "sans-serif" : 'Meiryo, sans-serif',
        fontWeight: true,
        duration: 4000,
        usDuration: 3000,
        opacity: 1,
        bulletOpacity: 1,
        sizing: 0,
        fontSize: "32px",
        rows: 12,
        style: "",
        bulletStyle: "",
        checkNewVersionAuto: true
      };
    }

    _loadGeneralPreference(r, p) {
      r.querySelector("#comment-font-family").value = p.fontFamily;
      r.querySelector("#comment-font-weight").checked = p.fontWeight;
      r.querySelector("#comment-duration").value = p.duration;
      r.querySelector("#comment-us-duration").value = p.usDuration;
      r.querySelector("#comment-opacity").value = p.opacity;
      r.querySelector("#comment-bullet-opacity").value = p.bulletOpacity;
      r.querySelector("#comment-sizing").value = p.sizing;
      r.querySelector("#comment-font-size").value = p.fontSize;
      r.querySelector("#comment-rows").value = p.rows;
      r.querySelector("#comment-style").value = p.style;
      r.querySelector("#comment-bullet-style").value = p.bulletStyle;
      r.querySelector("#about-check-auto").checked = p.checkNewVersionAuto;
    }

    _saveGeneralPreference(r, p) {
      var tmp;
      p.fontFamily = r.querySelector("#comment-font-family").value;
      p.fontWeight = r.querySelector("#comment-font-weight").checked;

      tmp = parseInt(r.querySelector("#comment-duration").value);
      if (tmp >= 100 && tmp <= 10000) p.duration = tmp;

      tmp = parseInt(r.querySelector("#comment-us-duration").value);
      if (tmp >= 100 && tmp <= 10000) p.usDuration = tmp;

      tmp = parseFloat(r.querySelector("#comment-opacity").value);
      if (tmp >= 0 && tmp <= 1) p.opacity = tmp;

      tmp = parseFloat(r.querySelector("#comment-bullet-opacity").value);
      if (tmp >= 0 && tmp <= 1) p.bulletOpacity = tmp;

      p.sizing = parseInt(r.querySelector("#comment-sizing").value);
      p.fontSize = r.querySelector("#comment-font-size").value;

      tmp = parseInt(r.querySelector("#comment-rows").value);
      if (tmp > 0 && tmp < 40) p.rows = tmp;

      p.style = r.querySelector("#comment-style").value;
      p.bulletStyle = r.querySelector("#comment-bullet-style").value;

      p.checkNewVersionAuto = r.querySelector("#about-check-auto").checked;
    }

  }

  window.jikkyo.PreferenceDialog = document.registerElement("jikkyo-preference-dialog", {
    prototype: PreferenceDialog.prototype
  });

})();
