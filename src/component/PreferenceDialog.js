
(() => {
  "use strict";

  var doc = document.currentScript.ownerDocument;

  class PreferenceDialog extends window.jikkyo.Modal {

    createdCallback() {
      super.createdCallback();

      this.width = 500;
      this.height = 340;
      this.preference = null;

      this.appendStyle(document.importNode(doc.querySelector("#style").content, true));
      this.appendContent(document.importNode(doc.querySelector("#content").content, true));

      this._modePrefs = [];
      this._initPrefCb = [];
      this._savePrefCb = [];
      this._tabs = this.content.querySelector("#tabs");
      this._prefs = this.content.querySelector("#prefs");

      var prefc = this.content.querySelectorAll(".pref");
      [].forEach.call(prefc, c => {
        this.addModePreference(c, c.dataset.title, null, null, true);
      }, this);

      this.content.querySelector("#ok").addEventListener("click", (() => {
        this.hide();
      }).bind(this));
    }

    show() {
      var at = this._tabs.querySelector(".active");
      if (at) at.classList.remove("active");
      at = this._prefs.querySelector(".pref.active");
      if (at) at.classList.remove("active");
      at = this._tabs.querySelector(":scope > :first-child");
      if (at) at.classList.add("active");
      at = this._prefs.querySelector(":scope > :first-child");
      if (at) at.classList.add("active");

      var pr = this.preference;
      if (pr) {
        this._modePrefs.forEach((p, i) => this._initPrefCb[i](p, pr), this);
      }

      super.show();
    }

    hide() {
      var pr = this.preference;
      if (pr) {
        this._modePrefs.forEach((p, i) => this._savePrefCb[i](p, pr), this);
      }
      pr.save();

      super.hide();
    }

    addModePreference(element, title, initCb, saveCb, builtin) {
      if (!element) return;
      var tab = document.createElement("li");
      tab.textContent = title;
      tab.addEventListener("click", (() => {
        var active = this._prefs.querySelector(".active");
        if (active) active.classList.remove("active");
        element.classList.add("active");
        this._tabs.querySelector(".active").classList.remove("active");
        tab.classList.add("active");
      }).bind(this));
      this._tabs.appendChild(tab);
      element.classList.add("pref");
      this._prefs.appendChild(element);

      if (!builtin) {
        this._modePrefs.push(element);
        if (initCb) this._initPrefCb.push(initCb);
        if (saveCb) this._savePrefCb.push(saveCb);
      }
    }

  }

  window.jikkyo.PreferenceDialog = document.registerElement("jikkyo-preference-dialog", {
    prototype: PreferenceDialog.prototype
  });

})();
