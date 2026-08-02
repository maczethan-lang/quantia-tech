/* ==========================================================================
   Quantia Tech — main.js
   Navegación, animaciones de entrada, carrito (compartido en todas las
   páginas) y utilidades comunes. Patrón IIFE, sin módulos ES, sin dependencias.
   ========================================================================== */

(function () {
  "use strict";

  function safe(fn, name) {
    try { fn(); } catch (err) {
      console.error("[QuantiaTech] Error en " + name + ":", err);
    }
  }

  /* -------------------------------- Navegación móvil -------------------------------- */

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");
    if (!toggle || !links) return;
    toggle.addEventListener("click", function () {
      var isOpen = links.classList.toggle("mobile-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      toggle.textContent = isOpen ? "✕" : "☰";
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("mobile-open");
        toggle.textContent = "☰";
      });
    });
  }

  /* -------------------------------- Reveal on scroll -------------------------------- */

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    // Escalonar la aparición de elementos que comparten un mismo contenedor (grid).
    var groups = new Map();
    items.forEach(function (el) {
      var parent = el.parentElement || document.body;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });
    groups.forEach(function (siblings) {
      siblings.forEach(function (el, idx) {
        el.style.transitionDelay = Math.min(idx * 80, 400) + "ms";
      });
    });

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in-view"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -40px 0px" });

    items.forEach(function (el) { observer.observe(el); });

    // Red de seguridad: nunca dejar contenido invisible más de 6s.
    setTimeout(function () {
      items.forEach(function (el) { el.classList.add("in-view"); });
    }, 6000);
  }

  /* -------------------------------- Barra de progreso de scroll -------------------------------- */

  function initScrollProgress() {
    var bar = document.createElement("div");
    bar.className = "scroll-progress";
    document.body.appendChild(bar);
    function update() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var height = document.documentElement.scrollHeight - window.innerHeight;
      var pct = height > 0 ? scrollTop / height : 0;
      bar.style.transform = "scaleX(" + pct + ")";
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* -------------------------------- Header al hacer scroll -------------------------------- */

  function initHeaderScroll() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    function update() {
      if (window.scrollY > 30) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* -------------------------------- Menú desplegable del header -------------------------------- */

  function initNavDropdown() {
    var dropdowns = document.querySelectorAll(".nav-dropdown");
    var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var closeTimer = null;

    dropdowns.forEach(function (dropdown) {
      var trigger = dropdown.querySelector(".nav-dropdown-trigger");
      if (!trigger) return;

      trigger.addEventListener("click", function (e) {
        e.stopPropagation();
        var willOpen = !dropdown.classList.contains("open");
        dropdowns.forEach(function (d) { d.classList.remove("open"); });
        if (willOpen) dropdown.classList.add("open");
      });

      if (canHover) {
        dropdown.addEventListener("mouseenter", function () {
          clearTimeout(closeTimer);
          dropdowns.forEach(function (d) { if (d !== dropdown) d.classList.remove("open"); });
          dropdown.classList.add("open");
        });
        dropdown.addEventListener("mouseleave", function () {
          closeTimer = setTimeout(function () { dropdown.classList.remove("open"); }, 150);
        });
      }
    });

    document.addEventListener("click", function (e) {
      dropdowns.forEach(function (d) {
        if (!d.contains(e.target)) d.classList.remove("open");
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") dropdowns.forEach(function (d) { d.classList.remove("open"); });
    });
  }

  /* -------------------------------- Contadores animados -------------------------------- */

  function initCounters() {
    var counters = document.querySelectorAll(".hero-stats strong");
    if (!counters.length || !("IntersectionObserver" in window)) return;

    function animate(el) {
      var raw = el.textContent.trim();
      var match = raw.match(/([\d.,]+)/);
      if (!match) return;
      var target = parseFloat(match[1].replace(",", ""));
      var suffix = raw.replace(match[1], "");
      var start = null;
      var duration = 1100;
      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var current = Math.floor(progress * target);
        el.textContent = current + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      }
      requestAnimationFrame(step);
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    counters.forEach(function (el) { observer.observe(el); });
  }

  /* -------------------------------- Toast -------------------------------- */

  var toastTimer = null;
  function showToast(message) {
    var toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2400);
  }
  window.QuantiaToast = showToast;

  /* -------------------------------- Carrito (estado compartido) -------------------------------- */

  var CART_KEY = "quantiaTechCart";

  function getCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
    document.dispatchEvent(new CustomEvent("quantia:cart-updated", { detail: { cart: cart } }));
  }

  function cartCount(cart) {
    return (cart || getCart()).reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  function cartTotal(cart) {
    return (cart || getCart()).reduce(function (sum, item) { return sum + item.qty * item.price; }, 0);
  }

  function addToCart(product) {
    var cart = getCart();
    var existing = cart.find(function (i) { return i.id === product.id; });
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, qty: 1 });
    }
    saveCart(cart);
  }

  function updateQty(id, delta) {
    var cart = getCart();
    var item = cart.find(function (i) { return i.id === id; });
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(function (i) { return i.id !== id; });
    }
    saveCart(cart);
  }

  function removeFromCart(id) {
    var cart = getCart().filter(function (i) { return i.id !== id; });
    saveCart(cart);
  }

  function clearCart() { saveCart([]); }

  function formatQ(amount) {
    return "Q" + amount.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  var badgeInitialized = false;
  function updateCartBadge() {
    var badge = document.querySelector(".cart-badge");
    if (!badge) return;
    var count = cartCount();
    var changed = badge.getAttribute("data-count") !== String(count);
    badge.textContent = count;
    badge.setAttribute("data-count", count);
    if (changed && badgeInitialized) {
      badge.classList.remove("pulse");
      void badge.offsetWidth;
      badge.classList.add("pulse");
    }
    badgeInitialized = true;
  }

  function renderCartDrawer() {
    var itemsEl = document.querySelector(".cart-items");
    var totalEl = document.querySelector(".cart-total-value");
    var payBtn = document.querySelector(".cart-pay-btn");
    if (!itemsEl) return;

    var cart = getCart();

    if (!cart.length) {
      itemsEl.innerHTML =
        '<div class="cart-empty">' +
        '<div class="cart-empty-icon">🛒</div>' +
        "<p>Tu carrito está vacío.<br>Explora la tienda y agrega tus productos favoritos.</p>" +
        "</div>";
      if (payBtn) payBtn.disabled = true;
    } else {
      itemsEl.innerHTML = cart.map(function (item) {
        return (
          '<div class="cart-item" data-id="' + item.id + '">' +
            '<div class="cart-item-media"><img src="' + item.image + '" alt="" loading="lazy"></div>' +
            '<div class="cart-item-info">' +
              "<h4>" + item.name + "</h4>" +
              '<div class="cart-item-row">' +
                '<div class="qty-control">' +
                  '<button type="button" data-action="dec" aria-label="Reducir cantidad">−</button>' +
                  "<span>" + item.qty + "</span>" +
                  '<button type="button" data-action="inc" aria-label="Aumentar cantidad">+</button>' +
                "</div>" +
                '<span class="cart-item-price">' + formatQ(item.price * item.qty) + "</span>" +
              "</div>" +
              '<button type="button" class="remove-item-btn" data-action="remove">Eliminar</button>' +
            "</div>" +
          "</div>"
        );
      }).join("");
      if (payBtn) payBtn.disabled = false;
    }

    if (totalEl) totalEl.textContent = formatQ(cartTotal(cart));
    updateCartBadge();
  }

  function initCartDrawer() {
    var overlay = document.querySelector(".cart-overlay");
    var drawer = document.querySelector(".cart-drawer");
    var openBtns = document.querySelectorAll("[data-cart-open]");
    var closeBtn = document.querySelector(".cart-close-btn");
    var itemsEl = document.querySelector(".cart-items");
    var payBtn = document.querySelector(".cart-pay-btn");

    updateCartBadge();
    if (!overlay || !drawer) return;

    function open() {
      renderCartDrawer();
      overlay.classList.add("open");
      drawer.classList.add("open");
      document.body.style.overflow = "hidden";
    }
    function close() {
      overlay.classList.remove("open");
      drawer.classList.remove("open");
      document.body.style.overflow = "";
    }

    openBtns.forEach(function (btn) { btn.addEventListener("click", open); });
    if (closeBtn) closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

    if (itemsEl) {
      itemsEl.addEventListener("click", function (e) {
        var actionBtn = e.target.closest("[data-action]");
        if (!actionBtn) return;
        var itemEl = e.target.closest(".cart-item");
        var id = itemEl && itemEl.getAttribute("data-id");
        if (!id) return;
        var action = actionBtn.getAttribute("data-action");
        if (action === "inc") updateQty(id, 1);
        if (action === "dec") updateQty(id, -1);
        if (action === "remove") removeFromCart(id);
        renderCartDrawer();
      });
    }

    if (payBtn) {
      payBtn.addEventListener("click", function () {
        if (!getCart().length) return;
        openCheckoutModal();
      });
    }

    document.addEventListener("quantia:cart-updated", renderCartDrawer);
  }

  /* -------------------------------- Modal de pago simulado -------------------------------- */

  function openCheckoutModal() {
    var modal = document.querySelector(".modal-overlay");
    if (!modal) return;
    var orderIdEl = modal.querySelector(".modal-order-id");
    var totalEl = modal.querySelector(".modal-total-value");
    if (orderIdEl) {
      var orderId = "QT-" + Math.floor(100000 + Math.random() * 900000);
      orderIdEl.textContent = "Pedido #" + orderId;
    }
    if (totalEl) totalEl.textContent = formatQ(cartTotal());
    modal.classList.add("open");

    var closeBtn = modal.querySelector(".modal-close-btn");
    var confirmBtn = modal.querySelector(".modal-confirm-btn");

    function finish() {
      modal.classList.remove("open");
      var drawer = document.querySelector(".cart-drawer");
      var overlay = document.querySelector(".cart-overlay");
      if (drawer) drawer.classList.remove("open");
      if (overlay) overlay.classList.remove("open");
      document.body.style.overflow = "";
    }

    if (closeBtn) closeBtn.onclick = finish;
    if (confirmBtn) {
      confirmBtn.onclick = function () {
        clearCart();
        finish();
        QuantiaToast("Pedido simulado registrado. ¡Gracias por tu compra de práctica!");
      };
    }
  }

  window.QuantiaMotion = {
    refresh: function () {
      safe(initReveal, "initReveal");
    },
  };

  window.QuantiaCart = {
    get: getCart,
    add: addToCart,
    remove: removeFromCart,
    updateQty: updateQty,
    clear: clearCart,
    total: cartTotal,
    count: cartCount,
    formatQ: formatQ,
    render: renderCartDrawer,
  };

  /* -------------------------------- Año en footer -------------------------------- */

  function initYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* -------------------------------- Init -------------------------------- */

  document.addEventListener("DOMContentLoaded", function () {
    safe(initNav, "initNav");
    safe(initNavDropdown, "initNavDropdown");
    safe(initReveal, "initReveal");
    safe(initCartDrawer, "initCartDrawer");
    safe(initYear, "initYear");
    safe(updateCartBadge, "updateCartBadge");
    safe(initScrollProgress, "initScrollProgress");
    safe(initHeaderScroll, "initHeaderScroll");
    safe(initCounters, "initCounters");
  });
})();
