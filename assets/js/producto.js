/* ==========================================================================
   Quantia Tech — producto.js
   Ficha de detalle de un producto individual. Lee ?id= de la URL y busca el
   producto en window.QuantiaData (products-data.js). Muestra especificaciones,
   precio, selector de cantidad y productos relacionados de la misma categoría.
   ========================================================================== */

(function () {
  "use strict";

  function formatQ(amount) {
    return "Q" + amount.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function relatedCardHTML(p) {
    var url = "producto.html?id=" + encodeURIComponent(p.id);
    return (
      '<article class="card product-card reveal">' +
        '<a class="product-link" href="' + url + '">' +
          '<div class="product-media"><img src="' + p.image + '" alt="' + p.name + '" loading="lazy"></div>' +
        "</a>" +
        '<div class="product-body">' +
          '<a class="product-link" href="' + url + '">' +
            '<span class="tag">' + p.catLabel + "</span>" +
            "<h3>" + p.name + "</h3>" +
          "</a>" +
          '<div class="product-footer">' +
            '<span class="product-price">' + formatQ(p.price) + "</span>" +
            '<button type="button" class="add-to-cart-btn" data-id="' + p.id + '">Agregar</button>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  /* Bloque de "cómo comprar": envío, pago y garantía. La garantía sale de las
     especificaciones del producto para no contradecir la ficha. */
  function purchaseInfoHTML(product) {
    var garantia = "6 meses";
    product.specs.forEach(function (row) {
      if (/garant/i.test(row[0])) garantia = row[1];
    });

    var envio = product.price >= 500
      ? "Envío gratis a toda Guatemala"
      : "Envío Q35 · gratis en compras desde Q500";

    var items = [
      ["Entrega", envio + " · 2 a 4 días hábiles"],
      ["Retiro en tienda", "Sin costo en Zona 10, disponible al día siguiente"],
      ["Formas de pago", "Visa, Mastercard, transferencia bancaria o contra entrega"],
      ["Garantía", garantia + " por defectos de fábrica"],
    ];

    // <dl> en vez de <ul>: dt y dd son de bloque, así que aunque el CSS no
    // cargue el rótulo y su valor nunca quedan pegados en la misma línea.
    return (
      '<dl class="purchase-info">' +
        items.map(function (i) {
          return '<div class="purchase-row"><dt>' + i[0] + "</dt><dd>" + i[1] + "</dd></div>";
        }).join("") +
      "</dl>"
    );
  }

  function renderNotFound(container, breadcrumbEl) {
    container.innerHTML =
      '<div class="not-found">' +
        "<h1>Producto no encontrado</h1>" +
        "<p>Puede que el enlace esté incompleto o el producto ya no exista.</p>" +
        '<a href="tienda.html" class="btn btn-primary">Volver al catálogo</a>' +
      "</div>";
    if (breadcrumbEl) breadcrumbEl.innerHTML = '<a href="index.html">Inicio</a> / <a href="tienda.html">Categorías</a> / Producto no encontrado';
  }

  function renderProduct(product) {
    document.title = product.name + " | Quantia Tech";

    var breadcrumbEl = document.querySelector("[data-product-breadcrumb]");
    if (breadcrumbEl) {
      breadcrumbEl.innerHTML =
        '<a href="index.html">Inicio</a> / <a href="tienda.html">Categorías</a> / ' +
        '<a href="tienda.html#cat-' + product.cat + '">' + product.catLabel + "</a> / " + product.name;
    }

    var specsHTML = product.specs.map(function (row) {
      return '<div class="specs-row"><dt>' + row[0] + "</dt><dd>" + row[1] + "</dd></div>";
    }).join("");

    var detail = document.querySelector("[data-product-detail]");
    detail.innerHTML =
      '<div class="product-detail">' +
        '<div class="product-detail-media"><img src="' + product.image + '" alt="' + product.name + '"></div>' +
        "<div>" +
          '<span class="tag">' + product.catLabel + "</span>" +
          "<h1>" + product.name + "</h1>" +
          '<div class="stock-badge">Disponible en tienda — Zona 10</div>' +
          '<p class="product-detail-price">' + formatQ(product.price) + "</p>" +
          "<p>" + product.desc + "</p>" +
          '<dl class="specs-list">' + specsHTML + "</dl>" +
          '<div class="product-detail-actions">' +
            '<div class="qty-control">' +
              '<button type="button" data-qty="dec" aria-label="Reducir cantidad">−</button>' +
              '<span data-qty-value>1</span>' +
              '<button type="button" data-qty="inc" aria-label="Aumentar cantidad">+</button>' +
            "</div>" +
            '<button type="button" class="btn btn-primary" data-add-detail>Agregar al carrito</button>' +
          "</div>" +
          purchaseInfoHTML(product) +
        "</div>" +
      "</div>";

    var qty = 1;
    var qtyValueEl = detail.querySelector("[data-qty-value]");
    detail.querySelectorAll("[data-qty]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-qty");
        if (action === "inc" && qty < 20) qty++;
        if (action === "dec" && qty > 1) qty--;
        qtyValueEl.textContent = qty;
      });
    });

    var addBtn = detail.querySelector("[data-add-detail]");
    addBtn.addEventListener("click", function () {
      for (var i = 0; i < qty; i++) window.QuantiaCart.add(product);
      window.QuantiaToast(qty + " x " + product.name + " agregado al carrito");
      var cartOpenBtn = document.querySelector("[data-cart-open]");
      if (cartOpenBtn) cartOpenBtn.click();
    });

    if (window.QuantiaMotion) window.QuantiaMotion.refresh();

    renderRelated(product);
  }

  function renderRelated(product) {
    var section = document.querySelector("[data-related-section]");
    var grid = document.querySelector("[data-related-products]");
    if (!section || !grid) return;

    var related = window.QuantiaData.PRODUCTS
      .filter(function (p) { return p.cat === product.cat && p.id !== product.id; })
      .slice(0, 4);

    if (!related.length) return;

    grid.innerHTML = related.map(relatedCardHTML).join("");
    section.style.display = "";

    grid.addEventListener("click", function (e) {
      var btn = e.target.closest(".add-to-cart-btn");
      if (!btn) return;
      var p = window.QuantiaData.PRODUCTS.find(function (x) { return x.id === btn.getAttribute("data-id"); });
      if (!p) return;
      window.QuantiaCart.add(p);
      window.QuantiaToast(p.name + " se agregó al carrito");
    });

    if (window.QuantiaMotion) window.QuantiaMotion.refresh();
  }

  function init() {
    var params = new URLSearchParams(window.location.search);
    var id = params.get("id");
    var detail = document.querySelector("[data-product-detail]");
    var breadcrumbEl = document.querySelector("[data-product-breadcrumb]");
    if (!detail || !window.QuantiaData) return;

    var product = window.QuantiaData.PRODUCTS.find(function (p) { return p.id === id; });
    if (!product) {
      renderNotFound(detail, breadcrumbEl);
      return;
    }
    renderProduct(product);
  }

  document.addEventListener("DOMContentLoaded", function () {
    try { init(); } catch (err) { console.error("[QuantiaTech] Error en producto.js:", err); }
  });
})();
