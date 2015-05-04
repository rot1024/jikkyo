(() => {
  "use strict";

  class Preference {

    constructor() {
    }

    save() {
      var pref = {};
      Object.keys(this).forEach(k => pref[k] = this[k], this);
      window.localStorage.setItem("preference", JSON.stringify(pref));
    }

    load() {
      var pref;
      try {
        let prefRaw = window.localStorage.getItem("preference");
        if (!prefRaw) return;
        pref = JSON.parse(prefRaw);
        if (pref === null) return;
        Object.keys(pref).forEach(key => this[key] = pref[key], this);
      } catch(e) {
        console.error(e);
      }
    }

  }

  window.jikkyo.Preference = Preference;

})();
