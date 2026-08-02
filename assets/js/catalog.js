/* ==========================================================================
   Quantia Tech — catalog.js
   Renderiza el catálogo de tienda.html a partir de window.QuantiaData y aplica
   los filtros del panel lateral: búsqueda por texto, categoría, rango de
   precio, marca y orden. Cada tarjeta enlaza a producto.html?id=...
   ========================================================================== */

(function () {
  "use strict";

  /* -------------------------------- Utilidades -------------------------------- */

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function norm(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function formatQ(amount) {
    return "Q" + amount.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatQShort(amount) {
    return "Q" + amount.toLocaleString("es-GT", { maximumFractionDigits: 0 });
  }

  /* -------------------------------- Estado de los filtros -------------------------------- */

  var state = {
    q: "",
    cat: "todos",
    min: null,
    max: null,
    brands: [],
    sort: "destacados",
  };

  var PRICE_PRESETS = [
    { label: "Hasta Q1,000", min: null, max: 1000 },
    { label: "Q1,000 – Q5,000", min: 1000, max: 5000 },
    { label: "Q5,000 – Q10,000", min: 5000, max: 10000 },
    { label: "Más de Q10,000", min: 10000, max: null },
  ];

  function queryTokens() {
    return norm(state.q).trim().split(/\s+/).filter(Boolean);
  }

  function matchesQuery(p, tokens) {
    if (!tokens.length) return true;
    var hay = norm(p.name + " " + p.catLabel + " " + (p.brand || "") + " " + p.desc);
    return tokens.every(function (t) { return hay.indexOf(t) > -1; });
  }

  // `skip` permite ignorar un filtro para calcular los contadores de esa faceta
  // (así "Laptops (20)" no se vuelve "(0)" al marcar una marca).
  function passes(p, tokens, skip) {
    if (skip !== "cat" && state.cat !== "todos" && p.cat !== state.cat) return false;
    if (skip !== "price") {
      if (state.min !== null && p.price < state.min) return false;
      if (state.max !== null && p.price > state.max) return false;
    }
    if (skip !== "brand" && state.brands.length && state.brands.indexOf(p.brand) === -1) return false;
    return matchesQuery(p, tokens);
  }

  function filterProducts(products, skip) {
    var tokens = queryTokens();
    return products.filter(function (p) { return passes(p, tokens, skip); });
  }

  function sortProducts(list) {
    var out = list.slice();
    if (state.sort === "precio-asc") out.sort(function (a, b) { return a.price - b.price; });
    else if (state.sort === "precio-desc") out.sort(function (a, b) { return b.price - a.price; });
    else if (state.sort === "nombre") out.sort(function (a, b) { return a.name.localeCompare(b.name, "es"); });
    return out;
  }

  function hasActiveFilters() {
    return !!(state.q || state.cat !== "todos" || state.min !== null || state.max !== null || state.brands.length);
  }

  /* -------------------------------- Plantillas -------------------------------- */

  function productCardHTML(p) {
    var url = "producto.html?id=" + encodeURIComponent(p.id);
    return (
      '<article class="card product-card reveal" data-cat="' + esc(p.cat) + '">' +
        '<a class="product-link" href="' + url + '">' +
          '<div class="product-media"><img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy"></div>' +
        "</a>" +
        '<div class="product-body">' +
          '<a class="product-link" href="' + url + '">' +
            '<span class="tag">' + esc(p.catLabel) + " · " + esc(p.brand || "") + "</span>" +
            "<h3>" + esc(p.name) + "</h3>" +
            '<p class="product-desc">' + esc(p.desc) + "</p>" +
          "</a>" +
          '<div class="product-footer">' +
            '<span class="product-price">' + formatQ(p.price) + "</span>" +
            '<button type="button" class="add-to-cart-btn" data-id="' + esc(p.id) + '">Agregar</button>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function optionHTML(type, value, label, count, checked) {
    return (
      '<label class="filter-option' + (count === 0 ? " is-empty" : "") + '">' +
        '<input type="' + (type === "cat" ? "radio" : "checkbox") + '"' +
          ' name="filter-' + type + '" value="' + esc(value) + '"' +
          ' data-filter-' + type + (checked ? " checked" : "") + ">" +
        '<span class="filter-option-label">' + esc(label) + "</span>" +
        '<span class="filter-option-count">' + count + "</span>" +
      "</label>"
    );
  }

  /* -------------------------------- Render -------------------------------- */

  function renderCategories(el, products, categories) {
    if (!el) return;
    var base = filterProducts(products, "cat");
    var counts = {};
    base.forEach(function (p) { counts[p.cat] = (counts[p.cat] || 0) + 1; });

    el.innerHTML = categories.map(function (c) {
      var count = c.id === "todos" ? base.length : (counts[c.id] || 0);
      return optionHTML("cat", c.id, c.label, count, state.cat === c.id);
    }).join("");
  }

  function renderBrands(el, products) {
    if (!el) return;
    var base = filterProducts(products, "brand");
    var counts = {};
    base.forEach(function (p) { counts[p.brand] = (counts[p.brand] || 0) + 1; });

    var names = Object.keys(counts).sort();
    // Mantener visibles las marcas ya marcadas aunque el resto de filtros las deje en 0.
    state.brands.forEach(function (b) { if (names.indexOf(b) === -1) names.push(b); });
    names.sort();

    if (!names.length) {
      el.innerHTML = '<p class="filter-note">No hay marcas para estos filtros.</p>';
      return;
    }
    el.innerHTML = names.map(function (b) {
      return optionHTML("brand", b, b, counts[b] || 0, state.brands.indexOf(b) > -1);
    }).join("");
  }

  function renderPricePresets(el) {
    if (!el) return;
    el.innerHTML = PRICE_PRESETS.map(function (p, i) {
      var active = state.min === p.min && state.max === p.max;
      return '<button type="button" class="chip chip-sm' + (active ? " active" : "") + '" data-price-preset="' + i + '">' + esc(p.label) + "</button>";
    }).join("");
  }

  function renderActiveFilters(el, categories) {
    if (!el) return;
    var pills = [];

    if (state.q) pills.push({ type: "q", label: '"' + state.q + '"' });
    if (state.cat !== "todos") {
      var cat = categories.find(function (c) { return c.id === state.cat; });
      if (cat) pills.push({ type: "cat", label: cat.label });
    }
    if (state.min !== null || state.max !== null) {
      var label = state.min !== null && state.max !== null
        ? formatQShort(state.min) + " – " + formatQShort(state.max)
        : (state.min !== null ? "Desde " + formatQShort(state.min) : "Hasta " + formatQShort(state.max));
      pills.push({ type: "price", label: label });
    }
    state.brands.forEach(function (b) { pills.push({ type: "brand", label: b, value: b }); });

    el.innerHTML = pills.length
      ? pills.map(function (p) {
          return '<button type="button" class="active-pill" data-remove="' + p.type + '"' +
            (p.value ? ' data-value="' + esc(p.value) + '"' : "") + '>' +
            esc(p.label) + '<span aria-hidden="true">✕</span></button>';
        }).join("") + '<button type="button" class="active-clear" data-clear-filters>Limpiar todo</button>'
      : "";
  }

  function renderGrid(grid, countEl, products) {
    var list = sortProducts(filterProducts(products));

    if (countEl) {
      countEl.textContent = list.length
        ? "Mostrando " + list.length + " de " + products.length + " productos"
        : "Sin resultados";
    }

    grid.innerHTML = list.length
      ? list.map(productCardHTML).join("")
      : '<div class="shop-empty">' +
          "<h3>No encontramos productos con esos filtros</h3>" +
          "<p>Prueba quitando alguno de los filtros o busca con otra palabra.</p>" +
          '<button type="button" class="btn btn-primary" data-clear-filters>Limpiar filtros</button>' +
        "</div>";

    grid.classList.toggle("grid-3", list.length > 0);
    if (window.QuantiaMotion) window.QuantiaMotion.refresh();
  }

  /* -------------------------------- URL -------------------------------- */

  function readURL(categories) {
    var params = new URLSearchParams(window.location.search);
    var q = params.get("q");
    if (q) state.q = q;

    var match = (window.location.hash || "").match(/^#cat-(.+)$/);
    if (match && categories.some(function (c) { return c.id === match[1]; })) {
      state.cat = match[1];
    }
  }

  function syncURL() {
    var url = window.location.pathname;
    if (state.q) url += "?q=" + encodeURIComponent(state.q);
    if (state.cat !== "todos") url += "#cat-" + state.cat;
    // replaceState no dispara hashchange, así que no reentra en el render.
    window.history.replaceState(null, "", url);
  }

  /* -------------------------------- Init -------------------------------- */

  function initCatalog() {
    var grid = document.querySelector("[data-product-grid]");
    if (!grid || !window.QuantiaData) return;

    var products = window.QuantiaData.PRODUCTS;
    var categories = window.QuantiaData.CATEGORIES;

    var els = {
      search: document.querySelector("[data-shop-search]"),
      cats: document.querySelector("[data-category-filters]"),
      brands: document.querySelector("[data-brand-filters]"),
      presets: document.querySelector("[data-price-presets]"),
      min: document.querySelector("[data-price-min]"),
      max: document.querySelector("[data-price-max]"),
      sort: document.querySelector("[data-sort]"),
      count: document.querySelector("[data-results-count]"),
      active: document.querySelector("[data-active-filters]"),
      panel: document.querySelector("[data-shop-filters]"),
      toggle: document.querySelector("[data-filters-toggle]"),
    };

    readURL(categories);
    if (els.search && state.q) els.search.value = state.q;

    function renderAll() {
      renderCategories(els.cats, products, categories);
      renderBrands(els.brands, products);
      renderPricePresets(els.presets);
      renderActiveFilters(els.active, categories);
      renderGrid(grid, els.count, products);
      syncURL();
    }

    function clearAll() {
      state.q = "";
      state.cat = "todos";
      state.min = null;
      state.max = null;
      state.brands = [];
      if (els.search) els.search.value = "";
      if (els.min) els.min.value = "";
      if (els.max) els.max.value = "";
      renderAll();
    }

    renderAll();

    /* Búsqueda dentro del catálogo */
    if (els.search) {
      var debounce = null;
      els.search.addEventListener("input", function () {
        clearTimeout(debounce);
        debounce = setTimeout(function () {
          state.q = els.search.value.trim();
          renderAll();
        }, 200);
      });
    }

    /* Categoría (radio) */
    if (els.cats) {
      els.cats.addEventListener("change", function (e) {
        var input = e.target.closest("[data-filter-cat]");
        if (!input) return;
        state.cat = input.value;
        // Descartar marcas que ya no existen en la nueva categoría.
        var available = {};
        products.forEach(function (p) {
          if (state.cat === "todos" || p.cat === state.cat) available[p.brand] = true;
        });
        state.brands = state.brands.filter(function (b) { return available[b]; });
        renderAll();
      });
    }

    /* Marca (checkbox) */
    if (els.brands) {
      els.brands.addEventListener("change", function (e) {
        var input = e.target.closest("[data-filter-brand]");
        if (!input) return;
        var value = input.value;
        if (input.checked) {
          if (state.brands.indexOf(value) === -1) state.brands.push(value);
        } else {
          state.brands = state.brands.filter(function (b) { return b !== value; });
        }
        renderAll();
      });
    }

    /* Precio: campos numéricos */
    function readPriceInputs() {
      var min = els.min && els.min.value !== "" ? Number(els.min.value) : null;
      var max = els.max && els.max.value !== "" ? Number(els.max.value) : null;
      state.min = min !== null && !isNaN(min) ? min : null;
      state.max = max !== null && !isNaN(max) ? max : null;
      renderAll();
    }
    var priceDebounce = null;
    [els.min, els.max].forEach(function (input) {
      if (!input) return;
      input.addEventListener("input", function () {
        clearTimeout(priceDebounce);
        priceDebounce = setTimeout(readPriceInputs, 350);
      });
    });

    /* Precio: chips de rango rápido */
    if (els.presets) {
      els.presets.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-price-preset]");
        if (!btn) return;
        var preset = PRICE_PRESETS[Number(btn.getAttribute("data-price-preset"))];
        var isActive = state.min === preset.min && state.max === preset.max;
        state.min = isActive ? null : preset.min;
        state.max = isActive ? null : preset.max;
        if (els.min) els.min.value = state.min === null ? "" : state.min;
        if (els.max) els.max.value = state.max === null ? "" : state.max;
        renderAll();
      });
    }

    /* Orden */
    if (els.sort) {
      els.sort.addEventListener("change", function () {
        state.sort = els.sort.value;
        renderGrid(grid, els.count, products);
      });
    }

    /* Quitar un filtro puntual desde las pastillas */
    if (els.active) {
      els.active.addEventListener("click", function (e) {
        var pill = e.target.closest("[data-remove]");
        if (!pill) return;
        var type = pill.getAttribute("data-remove");
        if (type === "q") { state.q = ""; if (els.search) els.search.value = ""; }
        if (type === "cat") state.cat = "todos";
        if (type === "price") {
          state.min = null; state.max = null;
          if (els.min) els.min.value = "";
          if (els.max) els.max.value = "";
        }
        if (type === "brand") {
          var value = pill.getAttribute("data-value");
          state.brands = state.brands.filter(function (b) { return b !== value; });
        }
        renderAll();
      });
    }

    /* Limpiar filtros (botón del panel, de las pastillas o del estado vacío) */
    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-clear-filters]")) clearAll();
    });

    /* Panel plegable en móvil */
    if (els.toggle && els.panel) {
      els.toggle.addEventListener("click", function () {
        var open = els.panel.classList.toggle("is-open");
        els.toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    /* Enlaces del megamenú estando ya en tienda.html */
    window.addEventListener("hashchange", function () {
      var match = (window.location.hash || "").match(/^#cat-(.+)$/);
      var cat = match && categories.some(function (c) { return c.id === match[1]; }) ? match[1] : "todos";
      if (cat === state.cat) return;
      state.cat = cat;
      renderAll();
    });

    /* Agregar al carrito */
    grid.addEventListener("click", function (e) {
      var btn = e.target.closest(".add-to-cart-btn");
      if (!btn) return;
      var product = products.find(function (p) { return p.id === btn.getAttribute("data-id"); });
      if (!product) return;
      window.QuantiaCart.add(product);
      btn.textContent = "Agregado";
      btn.classList.add("added");
      window.QuantiaToast(product.name + " se agregó al carrito");
      setTimeout(function () {
        btn.textContent = "Agregar";
        btn.classList.remove("added");
      }, 1400);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    try { initCatalog(); } catch (err) { console.error("[QuantiaTech] Error en initCatalog:", err); }
  });
})();
