
(() => {
  "use strict";

  var doc = document.currentScript.ownerDocument;

  class PreferenceDialog extends window.JikkyoModal {

    createdCallback() {
      super.createdCallback();

      this.width = 500;
      this.height = 340;

      this.appendStyle(document.importNode(doc.querySelector("#style").content, true));
      this.appendContent(document.importNode(doc.querySelector("#content").content, true));

      var tabs = this.content.querySelector("#tabs"),
          prefs = this.content.querySelector("#prefs"),
          prefc = this.content.querySelectorAll("#prefs > div");

      [].forEach.call(prefc, (c, i) => {
        var tab = document.createElement("li");
        tab.textContent = c.dataset.title;
        if (i === 0) {
          c.classList.add("active");
          tab.classList.add("active");
        }
        tab.addEventListener("click", () => {
          var active = prefs.querySelector(".active");
          if (active) active.classList.remove("active");
          c.classList.add("active");
          tabs.querySelector(".active").classList.remove("active");
          tab.classList.add("active");
        });
        tabs.appendChild(tab);
      });

      this.content.querySelector("#ok").addEventListener("click", (() => this.hide()).bind(this));
    }

  }

  window.JikkyoPreferenceDialog = document.registerElement("jikkyo-preference-dialog", {
    prototype: PreferenceDialog.prototype
  });

})();
