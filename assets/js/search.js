/* ==========================================================================
   Quantia Tech — search.js
   Buscador global (la lupa del header). Abre un panel sobre la página, busca
   en nombre, categoría, marca y descripción de los 200 productos y muestra los
   mejores resultados. Si no hay coincidencia exacta, propone productos
   similares. Requiere products-data.js (window.QuantiaData).
   ========================================================================== */

(function () {
  "use strict";

  var MAX_RESULTS = 8;

  /* -------------------------------- Utilidades -------------------------------- */

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Minúsculas y sin tildes, para que "audifonos" encuentre "Audífonos".
  function norm(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function formatQ(amount) {
    return "Q" + amount.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Resalta la parte del nombre que coincide con la búsqueda.
  function highlight(name, query) {
    var idx = norm(name).indexOf(query);
    if (idx === -1) return esc(name);
    return (
      esc(name.slice(0, idx)) +
      "<mark>" + esc(name.slice(idx, idx + query.length)) + "</mark>" +
      esc(name.slice(idx + query.length))
    );
  }

  /* -------------------------------- Motor de búsqueda -------------------------------- */

  function scoreProduct(p, query, tokens) {
    var name = norm(p.name);
    var cat = norm(p.catLabel);
    var brand = norm(p.brand || "");
    var desc = norm(p.desc || "");
    var score = 0;

    if (name === query) score += 1000;
    else if (name.indexOf(query) === 0) score += 400;
    else if (name.indexOf(query) > -1) score += 220;

    if (brand.indexOf(query) > -1) score += 140;
    if (cat.indexOf(query) > -1) score += 110;

    var matched = 0;
    tokens.forEach(function (t) {
      if (name.indexOf(t) > -1) { score += 60; matched++; }
      else if (brand.indexOf(t) > -1) { score += 45; matched++; }
      else if (cat.indexOf(t) > -1) { score += 35; matched++; }
      else if (desc.indexOf(t) > -1) { score += 12; matched++; }
    });
    if (matched && matched === tokens.length) score += 90;

    return score;
  }

  // Busca el fragmento más largo del término que aparezca en el texto.
  // Devuelve su longitud (0 si no hay ninguno de al menos `minLen`).
  function longestFragment(token, text, minLen) {
    for (var len = token.length; len >= minLen; len--) {
      for (var i = 0; i + len <= token.length; i++) {
        if (text.indexOf(token.slice(i, i + len)) > -1) return len;
      }
    }
    return 0;
  }

  // Segunda pasada, más permisiva: sirve para "resultados similares" cuando la
  // búsqueda literal no devolvió nada (errores de dedo, plurales, etc.).
  // Una coincidencia en el nombre/categoría/marca pesa mucho más que una en la
  // descripción, para que "lapton" sugiera laptops y no otra cosa que solo
  // menciona "laptop" en su texto.
  function looseScore(p, tokens) {
    var strong = norm(p.name + " " + p.catLabel + " " + (p.brand || ""));
    var weak = norm(p.desc || "");
    var score = 0;
    tokens.forEach(function (t) {
      if (t.length < 3) return;
      var hit = longestFragment(t, strong, 3);
      if (hit) { score += hit * 10; return; }
      score += longestFragment(t, weak, 4);
    });
    return score;
  }

  function search(products, rawQuery) {
    var query = norm(rawQuery).trim();
    if (!query) return { query: "", exact: [], similar: [] };

    var tokens = query.split(/\s+/).filter(Boolean);

    var exact = products
      .map(function (p) { return { p: p, s: scoreProduct(p, query, tokens) }; })
      .filter(function (r) { return r.s > 0; })
      .sort(function (a, b) { return b.s - a.s || a.p.price - b.p.price; })
      .map(function (r) { return r.p; });

    var similar = [];
    if (exact.length < 3) {
      var taken = {};
      exact.forEach(function (p) { taken[p.id] = true; });
      similar = products
        .filter(function (p) { return !taken[p.id]; })
        .map(function (p) { return { p: p, s: looseScore(p, tokens) }; })
        .filter(function (r) { return r.s > 0; })
        .sort(function (a, b) { return b.s - a.s || a.p.price - b.p.price; })
        .slice(0, MAX_RESULTS)
        .map(function (r) { return r.p; });
    }

    return { query: query, exact: exact, similar: similar };
  }

  /* -------------------------------- Interfaz -------------------------------- */

  function resultHTML(p, query, index) {
    return (
      '<a class="search-result" href="producto.html?id=' + encodeURIComponent(p.id) + '" data-index="' + index + '">' +
        // Sin loading="lazy": el panel arranca oculto y el navegador no llegaría
        // a cargar las miniaturas al abrirlo.
        '<span class="search-result-media"><img src="' + esc(p.image) + '" alt=""></span>' +
        '<span class="search-result-info">' +
          '<span class="search-result-meta">' + esc(p.catLabel) + " · " + esc(p.brand || "") + "</span>" +
          '<span class="search-result-name">' + highlight(p.name, query) + "</span>" +
        "</span>" +
        '<span class="search-result-price">' + formatQ(p.price) + "</span>" +
      "</a>"
    );
  }

  function chipsHTML(categories) {
    return categories
      .filter(function (c) { return c.id !== "todos"; })
      .map(function (c) {
        return '<a class="search-chip" href="tienda.html#cat-' + esc(c.id) + '">' + esc(c.label) + "</a>";
      })
      .join("");
  }

  function suggestionsHTML(categories, title) {
    return (
      '<div class="search-hint">' +
        '<p class="search-hint-title">' + esc(title) + "</p>" +
        '<div class="search-chips">' + chipsHTML(categories) + "</div>" +
      "</div>"
    );
  }

  function buildPanel() {
    var overlay = document.createElement("div");
    overlay.className = "search-overlay";
    overlay.innerHTML =
      '<div class="search-panel" role="dialog" aria-modal="true" aria-label="Buscar productos">' +
        '<div class="search-field">' +
          '<svg class="search-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
            '<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21" stroke-linecap="round"/>' +
          "</svg>" +
          '<input type="text" class="search-input" placeholder="Buscar productos, categorías o marcas…" autocomplete="off" spellcheck="false" aria-label="Buscar productos">' +
          '<button type="button" class="search-close" aria-label="Cerrar búsqueda">Esc</button>' +
        "</div>" +
        '<div class="search-body" data-search-body></div>' +
        '<div class="search-foot">' +
          '<span class="search-keys">↑ ↓ navegar · ↵ abrir · Esc cerrar</span>' +
          '<span data-search-all></span>' +
        "</div>" +
      "</div>";
    document.body.appendChild(overlay);
    return overlay;
  }

  function initSearch() {
    var triggers = document.querySelectorAll("[data-search-open]");
    if (!triggers.length) return;
    if (!window.QuantiaData || !window.QuantiaData.PRODUCTS) return;

    var products = window.QuantiaData.PRODUCTS;
    var categories = window.QuantiaData.CATEGORIES;

    var overlay = buildPanel();
    var panel = overlay.querySelector(".search-panel");
    var input = overlay.querySelector(".search-input");
    var body = overlay.querySelector("[data-search-body]");
    var allEl = overlay.querySelector("[data-search-all]");
    var closeBtn = overlay.querySelector(".search-close");

    var active = -1;      // resultado resaltado con el teclado
    var current = [];     // productos mostrados ahora mismo
    var lastQuery = "";
    var debounce = null;

    function renderIdle() {
      body.innerHTML = suggestionsHTML(categories, "Busca por producto, categoría o marca");
      allEl.innerHTML = "";
      current = [];
      active = -1;
    }

    function render(rawQuery) {
      var res = search(products, rawQuery);
      lastQuery = res.query;

      if (!res.query) return renderIdle();

      var html = "";
      current = [];

      if (res.exact.length) {
        var shown = res.exact.slice(0, MAX_RESULTS);
        current = current.concat(shown);
        html +=
          '<div class="search-section">' +
            '<p class="search-section-title">' + res.exact.length + " resultado" + (res.exact.length === 1 ? "" : "s") + "</p>" +
            shown.map(function (p, i) { return resultHTML(p, res.query, i); }).join("") +
          "</div>";
      } else {
        html +=
          '<div class="search-empty">' +
            "<p>Sin resultados para <strong>" + esc(rawQuery.trim()) + "</strong></p>" +
          "</div>";
      }

      if (res.similar.length) {
        var offset = current.length;
        current = current.concat(res.similar);
        html +=
          '<div class="search-section">' +
            '<p class="search-section-title">También te puede servir</p>' +
            res.similar.map(function (p, i) { return resultHTML(p, res.query, offset + i); }).join("") +
          "</div>";
      }

      if (!res.exact.length && !res.similar.length) {
        html += suggestionsHTML(categories, "Prueba con otra palabra o explora las categorías");
      }

      body.innerHTML = html;
      body.scrollTop = 0;

      allEl.innerHTML = res.exact.length > MAX_RESULTS
        ? '<a class="search-all-link" href="tienda.html?q=' + encodeURIComponent(rawQuery.trim()) + '">Ver los ' + res.exact.length + " resultados →</a>"
        : "";

      active = -1;
    }

    function setActive(next) {
      var items = body.querySelectorAll(".search-result");
      if (!items.length) return;
      if (next < 0) next = items.length - 1;
      if (next >= items.length) next = 0;
      items.forEach(function (el) { el.classList.remove("is-active"); });
      items[next].classList.add("is-active");
      items[next].scrollIntoView({ block: "nearest" });
      active = next;
    }

    function open() {
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
      input.value = "";
      renderIdle();
      setTimeout(function () { input.focus(); }, 40);
    }

    function close() {
      overlay.classList.remove("open");
      document.body.style.overflow = "";
      active = -1;
    }

    triggers.forEach(function (btn) { btn.addEventListener("click", open); });
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (!panel.contains(e.target)) close();
    });

    input.addEventListener("input", function () {
      clearTimeout(debounce);
      var value = input.value;
      debounce = setTimeout(function () { render(value); }, 140);
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
      else if (e.key === "Enter") {
        var items = body.querySelectorAll(".search-result");
        if (active > -1 && items[active]) {
          window.location.href = items[active].getAttribute("href");
        } else if (input.value.trim()) {
          window.location.href = "tienda.html?q=" + encodeURIComponent(input.value.trim());
        }
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("open")) {
        e.stopPropagation();
        close();
        return;
      }
      // Atajo: Ctrl/Cmd + K abre el buscador desde cualquier página.
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (overlay.classList.contains("open")) close();
        else open();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    try { initSearch(); } catch (err) { console.error("[QuantiaTech] Error en initSearch:", err); }
  });
})();
