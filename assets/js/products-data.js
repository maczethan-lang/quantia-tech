/* ==========================================================================
   Quantia Tech — products-data.js
   Fuente única de datos del catálogo: 10 categorías x 20 productos, con
   imágenes variadas, precio, descripción y especificaciones técnicas
   generadas por plantilla. Usado por catalog.js (listado) y producto.js
   (ficha de detalle). Expone window.QuantiaData.
   ========================================================================== */

(function () {
  "use strict";

  var IMG = "assets/img/products/";

  function idify(catId, model) {
    return catId + "-" + model.toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function tierPick(pool, i, n) {
    var idx = Math.min(pool.length - 1, Math.floor((i * pool.length) / n));
    return pool[idx];
  }

  function parseFrom(regex, text, fallback) {
    var m = regex.exec(text);
    return m ? m[0] : fallback;
  }

  /* La marca sale de la lista de la categoría, rotando por índice. Las tarjetas de
     video son la excepción: su modelo ya indica el fabricante del chip, así que se
     deduce con brandRules en lugar de asignar una marca de la casa. */
  function brandFor(def, model, i) {
    if (def.brandRules) {
      for (var r = 0; r < def.brandRules.length; r++) {
        if (def.brandRules[r][0].test(model)) return def.brandRules[r][1];
      }
    }
    return def.brands[i % def.brands.length];
  }

  /* -------------------------------- Generación de specs por categoría -------------------------------- */

  var SPEC_BUILDERS = {
    laptops: function (name, i, n) {
      var cpu = tierPick(["Intel Core i3-1215U", "Intel Core i5-1240P", "AMD Ryzen 5 7530U", "Intel Core i7-1355U", "AMD Ryzen 7 7735U", "Intel Core i9-13900H"], i, n);
      var ram = tierPick(["8GB DDR4", "16GB DDR4", "16GB DDR5", "32GB DDR5"], i, n);
      var storage = tierPick(["256GB SSD", "512GB SSD", "512GB SSD NVMe", "1TB SSD NVMe"], i, n);
      var screen = parseFrom(/1[3-7](\.\d)?"/, name, tierPick(['13.3"', '14"', '15.6"', '17.3"'], i, n));
      return [
        ["Procesador", cpu], ["Memoria RAM", ram], ["Almacenamiento", storage],
        ["Pantalla", screen + " Full HD"], ["Sistema operativo", "Windows 11 Home"], ["Garantía", "6 meses"],
      ];
    },
    "pc-gamer": function (name, i, n) {
      var cpu = tierPick(["AMD Ryzen 5 5600", "Intel Core i5-13400F", "AMD Ryzen 7 7700", "Intel Core i7-13700F", "AMD Ryzen 9 7900X", "Intel Core i9-13900F"], i, n);
      var gpu = tierPick(["RTX 3050 8GB", "RTX 4060 8GB", "RTX 4060 Ti 8GB", "RTX 4070 12GB", "RTX 4070 Ti 12GB", "RTX 4080 16GB"], i, n);
      var ram = tierPick(["16GB DDR4", "16GB DDR5", "32GB DDR5", "64GB DDR5"], i, n);
      var storage = tierPick(["512GB SSD NVMe", "1TB SSD NVMe", "2TB SSD NVMe"], i, n);
      return [
        ["Procesador", cpu], ["Tarjeta gráfica", gpu], ["Memoria RAM", ram], ["Almacenamiento", storage],
        ["Fuente de poder", "650W 80+ Bronze"], ["Garantía", "6 meses"],
      ];
    },
    "pc-oficina": function (name, i, n) {
      var cpu = tierPick(["Intel Core i3-12100", "AMD Ryzen 5 5600G", "Intel Core i5-12400", "Intel Core i5-13400"], i, n);
      var ram = tierPick(["8GB DDR4", "8GB DDR4", "16GB DDR4"], i, n);
      var storage = tierPick(["256GB SSD", "480GB SSD", "512GB SSD NVMe"], i, n);
      return [
        ["Procesador", cpu], ["Memoria RAM", ram], ["Almacenamiento", storage],
        ["Gráficos integrados", "Sí"], ["Sistema operativo", "Windows 11 Pro"], ["Garantía", "6 meses"],
      ];
    },
    monitores: function (name, i, n) {
      var size = parseFrom(/\d{2}(\.\d)?"/, name, tierPick(['21.5"', '24"', '27"', '32"'], i, n));
      var panel = tierPick(["TN", "VA", "IPS", "IPS"], i, n);
      var res = /4K/.test(name) ? "4K UHD (3840x2160)" : (/QHD/.test(name) ? "Quad HD (2560x1440)" : "Full HD (1920x1080)");
      var refresh = tierPick(["60Hz", "75Hz", "144Hz", "165Hz"], i, n);
      return [
        ["Tamaño de pantalla", size], ["Panel", panel], ["Resolución", res],
        ["Frecuencia de actualización", refresh], ["Conectividad", "HDMI, DisplayPort"], ["Garantía", "6 meses"],
      ];
    },
    teclados: function (name, i, n) {
      var sw = tierPick(["Membrana", "Membrana", "Mecánico Red", "Mecánico Blue", "Mecánico Brown"], i, n);
      var conn = tierPick(["USB con cable", "Inalámbrico 2.4GHz", "Bluetooth + USB"], i, n);
      var backlight = tierPick(["No", "Sí, blanca", "Sí, RGB"], i, n);
      return [
        ["Tipo de switch", sw], ["Conectividad", conn], ["Retroiluminación", backlight],
        ["Idioma", "Español Latinoamericano"], ["Garantía", "6 meses"],
      ];
    },
    mouse: function (name, i, n) {
      var sensor = tierPick(["Óptico 1000 DPI", "Óptico 3200 DPI", "Óptico 8000 DPI", "Láser 16000 DPI"], i, n);
      var conn = tierPick(["USB con cable", "Inalámbrico 2.4GHz", "Bluetooth"], i, n);
      var buttons = tierPick(["3 botones", "5 botones", "6 botones programables"], i, n);
      return [
        ["Sensor", sensor], ["Conectividad", conn], ["Botones", buttons], ["Garantía", "6 meses"],
      ];
    },
    "tarjetas-video": function (name, i, n) {
      var vram = parseFrom(/\d+GB/, name, tierPick(["6GB", "8GB", "12GB", "16GB"], i, n));
      var power = tierPick(["550W", "650W", "750W", "850W"], i, n);
      return [
        ["Memoria de video", vram], ["Bus", "PCIe 4.0 x16"], ["Salidas de video", "HDMI 2.1, DisplayPort 1.4a"],
        ["Consumo recomendado", power], ["Garantía", "12 meses"],
      ];
    },
    "memoria-ram": function (name, i, n) {
      var type = /DDR5/.test(name) ? "DDR5" : "DDR4";
      var capacity = parseFrom(/\d+GB(\s*\(\d+x\d+\))?/, name, "16GB");
      var speed = type === "DDR5" ? tierPick(["4800MHz", "5200MHz", "6000MHz"], i, n) : tierPick(["2666MHz", "3000MHz", "3200MHz"], i, n);
      var latency = tierPick(["CL40", "CL36", "CL30", "CL16"], i, n);
      return [
        ["Tipo", type], ["Capacidad", capacity], ["Velocidad", speed], ["Latencia", latency], ["Garantía", "12 meses"],
      ];
    },
    almacenamiento: function (name, i, n) {
      var type = /NVMe/.test(name) ? "SSD NVMe" : (/HDD/.test(name) ? "HDD" : (/MicroSD/.test(name) ? "MicroSD" : (/USB/.test(name) ? "USB Flash" : "SSD SATA")));
      var capacity = parseFrom(/\d+(GB|TB)/, name, "256GB");
      var iface = type === "SSD NVMe" ? "NVMe PCIe 4.0" : (type === "HDD" ? "SATA III" : (type === "USB Flash" ? "USB 3.0" : "SATA III"));
      var speed = tierPick(["100MB/s", "550MB/s", "3500MB/s", "7000MB/s"], i, n);
      return [
        ["Tipo", type], ["Capacidad", capacity], ["Interfaz", iface], ["Velocidad de lectura", speed], ["Garantía", "12 meses"],
      ];
    },
    audifonos: function (name, i, n) {
      var type = /In-Ear/.test(name) ? "In-ear" : (/Over-Ear/.test(name) ? "Over-ear" : tierPick(["In-ear", "On-ear", "Over-ear"], i, n));
      var conn = tierPick(["Cable 3.5mm", "USB", "Bluetooth 5.0", "Bluetooth 5.2 + Cable"], i, n);
      var mic = tierPick(["No", "Sí, integrado", "Sí, desmontable"], i, n);
      return [
        ["Tipo", type], ["Conectividad", conn], ["Micrófono", mic], ["Garantía", "6 meses"],
      ];
    },
  };

  function genCategory(def) {
    var products = [];
    var n = def.models.length;
    for (var i = 0; i < n; i++) {
      var model = def.models[i];
      var name = (def.prefix ? def.prefix + " " + model : model);
      var price = Math.round(def.priceMin + ((def.priceMax - def.priceMin) * (i / (n - 1))));
      price = Math.round(price / 10) * 10 - 1;
      var image = Array.isArray(def.image) ? def.image[i % def.image.length] : def.image;
      var specBuilder = SPEC_BUILDERS[def.id];
      var brand = brandFor(def, model, i);
      products.push({
        id: idify(def.id, model),
        cat: def.id,
        catLabel: def.catLabel,
        brand: brand,
        image: IMG + image,
        name: name,
        desc: def.desc[i % def.desc.length],
        price: price,
        specs: [["Marca", brand]].concat(specBuilder ? specBuilder(name, i, n) : []),
      });
    }
    return products;
  }

  var CATEGORY_DEFS = [
    {
      id: "laptops", catLabel: "Laptops", prefix: "Laptop",
      brands: ["Vantek", "Corvex", "Lumina", "Aureus"],
      image: ["laptop-general.jpg", "laptop-gaming.jpg", "hero-laptop.jpg", "laptop-2.jpg", "laptop-3.jpg", "laptop-4.jpg"],
      priceMin: 3499, priceMax: 13499,
      models: ["Zenith 14 Ultra", "Vortex Gamer 15", "AirLite 13", "Nimbus Pro 14", "Nimbus Air 13", "Orion X1 14", "Orion X2 15", "Falcon Elite 15", "Falcon Slim 14", "Atlas Work 15", "Atlas Study 14", "Nova Creator 16", "Nova Basic 14", "Quantum Ultra 15", "Quantum Mini 13", "Drift Book 14", "Drift Pro 15", "Halo Convertible 14", "Halo Slim 13", "Titan Mobile 17"],
      desc: [
        "Equilibrio entre rendimiento y portabilidad para el día a día.",
        "Pensada para estudio y trabajo con buena autonomía de batería.",
        "Rendimiento superior para multitarea y creación de contenido.",
        "Diseño ligero, ideal para llevar a clases o a la oficina.",
        "Configuración pensada para quienes exigen más de su equipo.",
      ],
    },
    {
      id: "pc-gamer", catLabel: "PC Gamer", prefix: "PC Gamer",
      brands: ["Quantia", "Corvex", "Kaido", "Zephyr"],
      image: ["desktop-gaming.jpg", "pcgamer-2.jpg", "pcgamer-3.jpg"],
      priceMin: 5999, priceMax: 20999,
      models: ["Titan Gaming I", "Titan Gaming II", "Inferno RGB", "Inferno Pro", "Vulcan Core i5", "Vulcan Core i7", "Vulcan Core i9", "Raptor Strike", "Raptor Elite", "Cyclone RGB", "Cyclone Pro", "Warlord Basic", "Warlord Ultra", "Nebula Gamer", "Nebula Extreme", "Phantom RGB", "Phantom X", "Apex Gamer", "Apex Pro", "Apex Ultra"],
      desc: [
        "Armado para juegos exigentes a resoluciones altas.",
        "Gabinete RGB con buen flujo de aire y componentes balanceados.",
        "Pensada para streaming y gaming simultáneo sin cuellos de botella.",
        "Configuración de entrada gamer con espacio para crecer.",
        "Potencia máxima para los títulos más recientes.",
      ],
    },
    {
      id: "pc-oficina", catLabel: "PC de Oficina", prefix: "PC Oficina",
      brands: ["Quantia", "Vantek", "Nexbit"],
      image: ["desktop-office.jpg", "pcoficina-3.jpg", "pcoficina-4.jpg"],
      priceMin: 2799, priceMax: 7799,
      models: ["Nova Lite", "Nova Plus", "Work Station I", "Work Station II", "Compacta i3", "Compacta i5", "Business Mini", "Business Tower", "Escritorio Pro I", "Escritorio Pro II", "Essential 1", "Essential 2", "Modular A", "Modular B", "Silent Office", "Slim Desk", "Study Basic", "Study Plus", "Admin Tower", "Admin Mini"],
      desc: [
        "Ideal para tareas de oficina, hojas de cálculo y navegación.",
        "Silenciosa y compacta, pensada para espacios reducidos.",
        "Buen balance de precio y rendimiento para uso administrativo.",
        "Lista para videollamadas, documentos y multitarea ligera.",
        "Confiable para uso prolongado en oficina o estudio.",
      ],
    },
    {
      id: "monitores", catLabel: "Monitores", prefix: "Monitor",
      brands: ["Lumina", "Vantek", "Aureus", "Nexbit"],
      image: ["monitor-curved.jpg", "monitor-desk.jpg", "monitor-4.jpg", "monitor-5.jpg"],
      priceMin: 899, priceMax: 5199,
      models: ["24\" FHD", "27\" FHD", "Curvo 27\" QHD", "Curvo 32\" QHD", "4K 27\"", "4K 32\"", "Gamer 144Hz 24\"", "Gamer 165Hz 27\"", "IPS 24\"", "IPS 27\"", "Ultrawide 29\"", "Ultrawide 34\"", "Portátil 15\"", "Vertical 24\"", "Oficina 22\"", "Diseño 27\" 4K", "Curvo 27\" 165Hz", "Económico 21\"", "Profesional 32\"", "Dual Pack 24\""],
      desc: [
        "Colores precisos y buen ángulo de visión para trabajo y estudio.",
        "Panel curvo inmersivo, ideal para gaming y multitarea.",
        "Resolución alta para diseño, edición y detalle fino.",
        "Frecuencia de actualización alta para juegos fluidos.",
        "Opción versátil para oficina, estudio o entretenimiento.",
      ],
    },
    {
      id: "teclados", catLabel: "Teclados", prefix: "Teclado",
      brands: ["Kaido", "Nexbit", "Zephyr", "Quantia"],
      image: ["keyboard-mechanical.jpg", "teclado-3.jpg", "teclado-4.jpg"],
      priceMin: 179, priceMax: 819,
      models: ["Mecánico Aurora", "Mecánico Nova", "Membrana Basic", "Inalámbrico Slim", "RGB Pro", "TKL Compacto", "Silencioso Office", "Numérico Extra", "Ergonómico Split", "60% Mini", "Retroiluminado Blanco", "Switch Rojo", "Switch Azul", "Switch Marrón", "Gamer Compacto", "Bluetooth Multi", "Recargable", "Antiderrame", "Membrana RGB", "Full Size Pro"],
      desc: [
        "Switches táctiles con buena retroalimentación para escritura y juego.",
        "Retroiluminación RGB personalizable y estructura resistente.",
        "Compacto y silencioso, ideal para oficina compartida.",
        "Conexión inalámbrica estable con batería de larga duración.",
        "Resistente a derrames, pensado para uso diario intenso.",
      ],
    },
    {
      id: "mouse", catLabel: "Mouse", prefix: "Mouse",
      brands: ["Kaido", "Zephyr", "Nexbit", "Quantia"],
      image: ["mouse-wireless.jpg", "mouse-2.jpg", "mouse-3.jpg", "mouse-4.jpg"],
      priceMin: 119, priceMax: 649,
      models: ["Precision Pro", "Gamer RGB", "Inalámbrico Slim", "Ergonómico", "Vertical", "Óptico Basic", "Bluetooth Silencioso", "Gamer Ultraligero", "6 Botones", "Recargable USB-C", "Simétrico", "Zurdo", "Oficina Compacto", "Alta Precisión 16K", "Dual Mode", "Trackball", "Mini Portátil", "RGB Programable", "Gamer Wireless Pro", "Clásico USB"],
      desc: [
        "Sensor óptico de alta precisión y diseño ergonómico.",
        "Botones programables pensados para gaming competitivo.",
        "Ligero y silencioso, ideal para uso prolongado en oficina.",
        "Conexión inalámbrica confiable con batería de larga duración.",
        "Diseño cómodo para mano derecha o uso ambidiestro.",
      ],
    },
    {
      id: "tarjetas-video", catLabel: "Tarjetas de Video", prefix: "Tarjeta de Video",
      brands: ["NVIDIA"],
      brandRules: [[/RTX|GTX/i, "NVIDIA"], [/\bRX\b/i, "AMD"], [/Arc/i, "Intel"]],
      image: ["gpu-card.jpg", "gpu-3.jpg", "gpu-4.jpg"],
      priceMin: 1799, priceMax: 13999,
      models: ["RTX 4060 8GB", "RTX 4060 Ti 8GB", "RTX 4070 12GB", "RTX 4070 Ti 12GB", "RTX 4080 16GB", "RTX 4090 24GB", "RX 7600 8GB", "RX 7700 XT 12GB", "RX 7800 XT 16GB", "RX 7900 XT 20GB", "GTX 1660 Super 6GB", "RTX 3050 8GB", "RTX 3060 12GB", "RTX 3060 Ti 8GB", "RTX 3070 8GB", "Arc A750 8GB", "Arc A770 16GB", "RTX 4060 Low Profile", "RX 6600 8GB", "RX 6650 XT 8GB"],
      desc: [
        "Ray tracing y DLSS para gráficos de última generación.",
        "Buen rendimiento por precio para gaming en 1080p y 1440p.",
        "Pensada para 4K y cargas de trabajo creativas exigentes.",
        "Opción sólida de gama media para actualizar tu equipo.",
        "Eficiente y silenciosa para setups compactos.",
      ],
    },
    {
      id: "memoria-ram", catLabel: "Memoria RAM", prefix: "Memoria RAM",
      brands: ["Corvex", "Nexbit", "Vantek"],
      image: ["ram-module.jpg", "ram-2.jpg", "ram-3.jpg", "ram-4.jpg"],
      priceMin: 249, priceMax: 2399,
      models: ["DDR4 8GB", "DDR4 16GB (2x8)", "DDR4 32GB (2x16)", "DDR5 16GB (2x8)", "DDR5 32GB (2x16)", "DDR5 64GB (2x32)", "DDR4 8GB SODIMM", "DDR4 16GB SODIMM", "DDR5 16GB SODIMM", "DDR5 32GB SODIMM", "DDR4 16GB RGB", "DDR5 32GB RGB", "DDR4 16GB 3200MHz", "DDR5 32GB 6000MHz", "DDR4 8GB 2666MHz", "DDR5 16GB 5200MHz", "DDR4 16GB Low Profile", "DDR5 48GB (2x24)", "DDR4 64GB (2x32)", "DDR5 96GB (2x48)"],
      desc: [
        "Kit dual channel de alta velocidad, compatible con plataformas recientes.",
        "Ideal para actualizar equipos de oficina o estudio.",
        "Ampliación pensada para multitarea y edición exigente.",
        "Módulo para laptop, formato SODIMM de bajo perfil.",
        "Alta capacidad para estaciones de trabajo y creación de contenido.",
      ],
    },
    {
      id: "almacenamiento", catLabel: "Almacenamiento", prefix: "",
      brands: ["Nexbit", "Corvex", "Aureus", "Vantek"],
      image: ["ssd-drive.jpg", "almacenamiento-2.jpg", "almacenamiento-3.jpg", "almacenamiento-4.jpg"],
      priceMin: 149, priceMax: 2799,
      models: ["SSD SATA 256GB", "SSD SATA 512GB", "SSD SATA 1TB", "SSD NVMe 256GB", "SSD NVMe 512GB", "SSD NVMe 1TB", "SSD NVMe 2TB", "SSD NVMe 4TB", "SSD Externo 512GB", "SSD Externo 1TB", "HDD 1TB", "HDD 2TB", "HDD 4TB", "HDD Externo 1TB", "HDD Externo 2TB", "SSD M.2 Gen4 1TB", "SSD M.2 Gen4 2TB", "MicroSD 128GB", "MicroSD 256GB", "USB Flash 128GB"],
      desc: [
        "Velocidades de lectura altas para arrancar tu equipo en segundos.",
        "Buena relación capacidad-precio para uso diario.",
        "Ideal para respaldo de archivos y proyectos pesados.",
        "Formato compacto y portátil para llevar tus archivos contigo.",
        "Confiable para almacenamiento masivo a bajo costo.",
      ],
    },
    {
      id: "audifonos", catLabel: "Audífonos", prefix: "",
      brands: ["Kaido", "Zephyr", "Lumina", "Quantia"],
      image: ["headset.jpg", "audifonos-2.jpg", "audifonos-3.jpg", "audifonos-4.jpg"],
      priceMin: 179, priceMax: 1599,
      models: ["Headset Gamer RGB", "Headset Inalámbrico", "Audífonos Bluetooth", "Audífonos Estudio", "Headset 7.1 Surround", "Audífonos In-Ear", "Audífonos Over-Ear", "Headset con Micrófono", "Audífonos Deportivos", "Audífonos Cancelación de Ruido", "Headset Económico", "Audífonos Gamer Wireless", "Headset Oficina", "Audífonos True Wireless", "Headset RGB Pro", "Audífonos Plegables", "Headset USB", "Audífonos Bass Boost", "Headset Ultraligero", "Audífonos Recargables"],
      desc: [
        "Sonido envolvente con micrófono para juego y llamadas.",
        "Cómodos para sesiones largas de estudio o trabajo.",
        "Conexión inalámbrica estable con buena autonomía.",
        "Cancelación de ruido para concentrarte en lo importante.",
        "Diseño ligero pensado para uso diario prolongado.",
      ],
    },
  ];

  var PRODUCTS = CATEGORY_DEFS.reduce(function (acc, def) {
    return acc.concat(genCategory(def));
  }, []);

  var CATEGORIES = [{ id: "todos", label: "Todos" }].concat(
    CATEGORY_DEFS.map(function (d) { return { id: d.id, label: d.catLabel }; })
  );

  var BRANDS = PRODUCTS.reduce(function (acc, p) {
    if (acc.indexOf(p.brand) === -1) acc.push(p.brand);
    return acc;
  }, []).sort();

  var PRICE_RANGE = PRODUCTS.reduce(function (acc, p) {
    return { min: Math.min(acc.min, p.price), max: Math.max(acc.max, p.price) };
  }, { min: Infinity, max: 0 });

  window.QuantiaData = {
    PRODUCTS: PRODUCTS,
    CATEGORIES: CATEGORIES,
    CATEGORY_DEFS: CATEGORY_DEFS,
    BRANDS: BRANDS,
    PRICE_RANGE: PRICE_RANGE,
  };
})();
