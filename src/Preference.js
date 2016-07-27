(() => {
  "use strict";

  class Preference {

    save() {
      const pref = {};
      // eslint-disable-next-line no-return-assign
      Object.keys(this).forEach(k => pref[k] = this[k], this);
      window.localStorage.setItem("preference", JSON.stringify(pref));
    }

    load() {
      let pref;
      try {
        const prefRaw = window.localStorage.getItem("preference");
        if (!prefRaw) return;
        pref = JSON.parse(prefRaw);
        if (pref === null) return;
        // eslint-disable-next-line no-return-assign
        Object.keys(pref).forEach(key => this[key] = pref[key], this);
      } catch (e) {
        console.error(e);
      }
    }

  }

  window.jikkyo.Preference = Preference;

})();
