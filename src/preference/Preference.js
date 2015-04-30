(() => {
  "use strict";

  class Preference {

    constructor() {
      this.twitter = {
        consumerKey: "",
        consumerSecret: "",
        accessToken: "",
        accessSecret: ""
      };
      this.controller = {
        mode: 0,
        fixed: false,
        track: "",
        alwaysOnTop: false
      };
    }

    save() {
      var pref = {
        twitter: this.twitter,
        controller: this.controller
      };
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

  window.JikkyoPreference = Preference;

})();
