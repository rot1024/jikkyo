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
    }

    save() {
      var pref = {
        twitter: this.twitter
      };
      window.localStorage.setItem("preference", JSON.stringify(pref));
    }

    load() {
      var pref;
      try {
        pref = JSON.parse(window.localStorage.getItem("preference"));
        if (pref === null) return;
        this.twitter = pref.twitter;
      } catch(e) {
        console.error(e);
      }
    }

  }

  window.JikkyoPreference = Preference;

})();
