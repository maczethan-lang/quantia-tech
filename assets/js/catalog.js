/* ==========================================================================
   Quantia Tech — catalog.js
   Renderiza el catálogo (grid + filtros) en tienda.html a partir de
   window.QuantiaData (definido en products-data.js). Cada tarjeta enlaza a
   producto.html?id=... para ver la ficha completa.
   ========================================================================== */

(function () {
  "use strict";

  function formatQ(amount) {
    return "Q" + amount.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function productCardHTML(p) {
    var url = "producto.html?id=" + encodeURIComponent(p.id);
    return (
      '<article class="card product-card reveal" data-cat="' + p.cat + '">' +
        '<a class="product-link" href="' + url + '">' +
          '<div class="product-media"><img src="' + p.image + '" alt="' + p.name + '" loading="lazy"></div>' +
        "</a>" +
        '<div class="product-body">' +
          '<a class="product-link" href="' + url + '">' +
            '<span class="tag">' + p.catLabel + "</span>" +
            "<h3>" + p.name + "</h3>" +
            '<p class="product-desc">' + p.desc + "</p>" +
          "</a>" +
          '<div class="product-footer">' +
            '<span class="product-price">' + formatQ(p.price) + "</span>" +
            '<button type="button" class="add-to-cart-btn" data-id="' + p.id + '">Agregar</button>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function renderFilters(container, activeId, categories) {
    container.innerHTML = categories.map(function (c) {
      return '<button type="button" class="chip' + (c.id === activeId ? " active" : "") + '" data-filter="' + c.id + '">' + c.label + "</button>";
    }).join("");
  }

  function renderProducts(grid, filter, products) {
    var list = filter && filter !== "todos" ? products.filter(function (p) { return p.cat === filter; }) : products;
    grid.innerHTML = list.map(productCardHTML).join("");
    if (window.QuantiaMotion) window.QuantiaMotion.refresh();
  }

  function categoryFromHash(categories) {
    var hash = window.location.hash || "";
    var match = hash.match(/^#cat-(.+)$/);
    if (!match) return "todos";
    var id = match[1];
    return categories.some(function (c) { return c.id === id; }) ? id : "todos";
  }

  function initCatalog() {
    var grid = document.querySelector("[data-product-grid]");
    var filtersEl = document.querySelector("[data-category-filters]");
    if (!grid || !window.QuantiaData) return;

    var products = window.QuantiaData.PRODUCTS;
    var categories = window.QuantiaData.CATEGORIES;

    var initial = categoryFromHash(categories);
    if (filtersEl) renderFilters(filtersEl, initial, categories);
    renderProducts(grid, initial, products);

    if (filtersEl) {
      filtersEl.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-filter]");
        if (!btn) return;
        filtersEl.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
        btn.classList.add("active");
        renderProducts(grid, btn.getAttribute("data-filter"), products);
      });
    }

    window.addEventListener("hashchange", function () {
      var cat = categoryFromHash(categories);
      if (filtersEl) {
        filtersEl.querySelectorAll(".chip").forEach(function (c) {
          c.classList.toggle("active", c.getAttribute("data-filter") === cat);
        });
      }
      renderProducts(grid, cat, products);
    });

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
