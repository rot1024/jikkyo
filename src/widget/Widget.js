module.exports = (() => {
  "use strict";

  var elementSymbol = Symbol("element");

  var Widget = class {

    constructor() {
      this[elementSymbol] = null;
    }

    attach(element) {
      this[elementSymbol] = element;
      if (typeof this.onAttach === "function")
        this.onAttach(element);
    }

    detach() {
      if (this[elementSymbol] && typeof this.onDetach === "function") {
        this.onDetach(this[elementSymbol]);
      }
      this[elementSymbol] = null;
    }

    get isAttached() {
      return !!this[elementSymbol];
    }

    get element() {
      return this[elementSymbol];
    }

    get window() {
      return this.element.ownerDocument.defaultView;
    }

    get document() {
      return this.window.document;
    }

    get body() {
      return this.document.body;
    }

  };

  return Widget;
})();
