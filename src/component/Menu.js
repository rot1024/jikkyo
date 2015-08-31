(() => {
  "use strict";

  var doc = document.currentScript.ownerDocument;

  class MenuItem {

    constructor(item) {
      this._el = document.createElement("li");
      this._type = item.type;
      if (this._type === "separator")
        this._el.classList.add("separator");
      else {
        this._el.classList.add("item");
        this.label = item.label;
        this.checked = item.checked || false;
        this.checkable = item.checkable || false;
        this.disabled = item.disabled || false;
        this.onclick = item.onclick;
        this.click = item.click;
      }
    }

    get type() { return this._type; }

    get el() { return this._el; }

    get label() { return this._label; }
    set label(v) {
      this._el.textContent = v;
      this._label = v;
    }

    get checked() { return this._checked; }
    set checked(v) {
      if (v) this._el.classList.add("checked");
      else this._el.classList.remove("checked");
      this._checked = v;
    }

    get disabled() { return this._disabled; }
    set disabled(v) {
      if (v) this._el.classList.add("disabled");
      else this._el.classList.remove("disabled");
      this._disabled = v;
    }

    on(type, listener, capture) {
      this._el.addEventListener(type, listener, capture);
    }

    off(type, listener, capture) {
      this._el.removeEventListener(type, listener, capture);
    }

  }

  class Menu extends HTMLElement {

    createdCallback() {
      var root = this.createShadowRoot();
      var template = doc.querySelector("template");
      root.appendChild(document.importNode(template.content, true));

      this._menu = root.querySelector("ul");
      this._menu.addEventListener("click", e => e.stopPropagation());

      this._items = [];
      this._hidden = true;

      this._menuCb = (e => {
        if (this.inside(e.clientX, e.clientY))
          return;
        if (this.parentNode) this.hide();
        e.stopPropagation();
      }).bind(this);

      this._stopPropagationCb = e => e.stopPropagation();
    }

    get items() {
      return this._items;
    }

    inside(x, y) {
      var rect = this._menu.getBoundingClientRect();
      return rect.left <= x && x <= rect.right &&
        rect.top <= y && y <= rect.bottom;
    }

    add(item, index) {
      if (index instanceof MenuItem) {
        index = this._items.indexOf(index);
      }

      var menuItem = item instanceof MenuItem ? item : new MenuItem(item);

      menuItem.on("click", (e => {
        if (!menuItem.disabled) {
          if (menuItem.checkable)
            menuItem.checked = !menuItem.checked;
          if (typeof menuItem.click === "function")
            menuItem.click(menuItem);
          this.hide();
        }
        e.stopPropagation();
      }).bind(this));

      if (index >= 0 && index < this._items.length) {
        this._items.splice(index, 0, menuItem);
        this._menu.insertBefore(menuItem.el, this._menu.childNodes[index]);
      } else {
        this._items.push(menuItem);
        this._menu.appendChild(menuItem.el);
      }
    }

    clear() {
      this._items.forEach((menuItem => this._menu.removeChild(menuItem.el)).bind(this));
      this._items = [];
    }

    show(x, y) {
      var left = x, top = y;
      document.body.appendChild(this);
      const rect = this._menu.getBoundingClientRect();
      if (window.innerWidth < x + rect.width)
        left -= rect.width;
      if (window.innerHeight < y + rect.height)
        top -= rect.height;
      this.style.left = left + "px";
      this.style.top = top + "px";
      this._menu.classList.remove("hidden");
      window.addEventListener("click", this._menuCb, true);
      window.addEventListener("mousemove", this._stopPropagationCb, true);
      window.addEventListener("mouseout", this._stopPropagationCb, true);
    }

    hide() {
      this._menu.classList.add("hidden");
      this.style.left = 0;
      this.style.top = 0;
      window.removeEventListener("click", this._menuCb, true);
      window.removeEventListener("mousemove", this._stopPropagationCb, true);
      window.removeEventListener("mouseout", this._stopPropagationCb, true);
      if (this.parentNode) document.body.removeChild(this);
    }

  }

  window.jikkyo.MenuItem = MenuItem;

  window.jikkyo.Menu = document.registerElement("jikkyo-menu", {
    prototype: Menu.prototype
  });

})();
