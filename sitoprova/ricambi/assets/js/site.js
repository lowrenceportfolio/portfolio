(function () {
  var products = window.RDE_PRODUCTS || [];

  function rootPath() {
    return document.body.getAttribute("data-root") || "";
  }

  function imagePath(src) {
    if (!src) return "";
    if (/^https?:\/\//.test(src)) return src;
    return rootPath() + src;
  }

  function productUrl(product) {
    return rootPath() + product.url;
  }

  function statusLabel(value) {
    if (value === "pronta") return "Disponibile";
    if (value === "limitata") return "Disponibilita' limitata";
    return "Su richiesta";
  }

  function whatsappFor(product) {
    var text = "Buongiorno, vorrei ricevere informazioni sul ricambio " +
      product.name + ", codice " + product.code + ", per " + product.brand + " " + product.model + ".";
    return "https://wa.me/393357413636?text=" + encodeURIComponent(text);
  }

  function unique(list) {
    return Array.from(new Set(list.filter(Boolean))).sort();
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function card(product) {
    var readyClass = product.availability === "pronta" ? " ready" : "";
    var name = escapeHtml(product.name);
    var meta = escapeHtml(product.brand + " / " + product.model + " / " + product.code);
    return [
      '<article class="product-card reveal">',
      '<a class="product-card__image" href="' + escapeHtml(productUrl(product)) + '" aria-label="Visualizza ' + name + '">',
      '<img src="' + escapeHtml(imagePath(product.image)) + '" alt="' + name + '" loading="lazy">',
      '</a>',
      '<div class="product-card__body">',
      '<span class="product-meta">' + meta + '</span>',
      '<h3>' + name + '</h3>',
      '<span class="status' + readyClass + '">' + statusLabel(product.availability) + '</span>',
      '<a class="button-small" href="' + escapeHtml(productUrl(product)) + '">Visualizza ricambio</a>',
      '</div>',
      '</article>'
    ].join("");
  }

  function revealNow(scope) {
    var nodes = (scope || document).querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (node) { node.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    nodes.forEach(function (node) { observer.observe(node); });
  }

  function initMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-site-nav]");
    if (!button || !nav) return;
    button.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      document.body.classList.toggle("menu-open", open);
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (event) {
      if (event.target.tagName === "A") {
        nav.classList.remove("is-open");
        document.body.classList.remove("menu-open");
        button.setAttribute("aria-expanded", "false");
      }
    });
  }

  function countInto(selector, filter) {
    document.querySelectorAll(selector).forEach(function (node) {
      var key = node.getAttribute("data-count");
      var count = products.filter(function (product) { return filter(product, key); }).length;
      node.textContent = count + " ricambi";
    });
  }

  function renderFeatured() {
    var target = document.querySelector("[data-featured-products]");
    if (!target) return;
    target.innerHTML = products.filter(function (product) { return product.featured; }).slice(0, 8).map(card).join("");
    revealNow(target);
  }

  function initHomeSearch() {
    var form = document.querySelector("[data-home-search]");
    var target = document.querySelector("[data-quick-results]");
    if (!form || !target) return;
    var input = form.querySelector("[name='q']");
    var brand = form.querySelector("[name='brand']");
    var category = form.querySelector("[name='category']");
    var model = form.querySelector("[name='model']");
    var availability = form.querySelector("[name='availability']");

    function fill(select, values, label) {
      if (!select) return;
      select.innerHTML = '<option value="">' + label + '</option>' +
        values.map(function (value) { return '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>'; }).join("");
    }

    fill(brand, unique(products.map(function (p) { return p.brand; })), "Marca");
    fill(model, unique(products.map(function (p) { return p.model; })), "Modello");
    fill(category, unique(products.map(function (p) { return p.category; })), "Categoria");

    function matches(product) {
      var query = (input.value || "").toLowerCase();
      var haystack = [product.name, product.code, product.brand, product.model, product.category].join(" ").toLowerCase();
      return (!query || haystack.indexOf(query) > -1) &&
        (!brand.value || product.brand === brand.value) &&
        (!model.value || product.model === model.value) &&
        (!category.value || product.category === category.value) &&
        (!availability.value || product.availability === availability.value);
    }

    function render() {
      var results = products.filter(matches).slice(0, 4);
      target.innerHTML = results.map(card).join("");
      revealNow(target);
    }

    form.addEventListener("input", render);
    form.addEventListener("change", render);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var params = new URLSearchParams();
      if (input.value) params.set("q", input.value);
      if (brand.value) params.set("brand", brand.value);
      if (model.value) params.set("model", model.value);
      if (category.value) params.set("category", category.value);
      if (availability.value) params.set("availability", availability.value);
      window.location.href = rootPath() + "catalogo/?" + params.toString();
    });
    render();
  }

  function initCatalog() {
    var grid = document.querySelector("[data-catalog-grid]");
    if (!grid) return;

    var state = {
      limit: 8,
      q: "",
      brand: "",
      model: "",
      category: "",
      availability: "",
      year: "",
      sort: "recent"
    };

    var controls = {
      q: document.querySelector("[data-filter='q']"),
      brand: document.querySelector("[data-filter='brand']"),
      model: document.querySelector("[data-filter='model']"),
      category: document.querySelector("[data-filter='category']"),
      availability: document.querySelector("[data-filter='availability']"),
      year: document.querySelector("[data-filter='year']"),
      sort: document.querySelector("[data-filter='sort']")
    };
    var count = document.querySelector("[data-result-count]");
    var chips = document.querySelector("[data-active-filters]");
    var loadMore = document.querySelector("[data-load-more]");
    var clear = document.querySelector("[data-clear-filters]");
    var panel = document.querySelector("[data-filter-panel]");
    var toggle = document.querySelector("[data-filter-toggle]");

    function fill(select, values, label) {
      if (!select) return;
      select.innerHTML = '<option value="">' + label + '</option>' +
        values.map(function (value) { return '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>'; }).join("");
    }

    fill(controls.brand, unique(products.map(function (p) { return p.brand; })), "Tutte le marche");
    fill(controls.model, unique(products.map(function (p) { return p.model; })), "Tutti i modelli");
    fill(controls.category, unique(products.map(function (p) { return p.category; })), "Tutte le categorie");

    var params = new URLSearchParams(window.location.search);
    Object.keys(state).forEach(function (key) {
      if (params.has(key)) state[key] = params.get(key);
      if (controls[key]) controls[key].value = state[key];
    });

    function filtered() {
      var list = products.filter(function (product) {
        var query = state.q.toLowerCase();
        var haystack = [product.name, product.code, product.brand, product.model, product.category, product.years].join(" ").toLowerCase();
        return (!query || haystack.indexOf(query) > -1) &&
          (!state.brand || product.brand === state.brand) &&
          (!state.model || product.model === state.model) &&
          (!state.category || product.category === state.category) &&
          (!state.year || product.years.indexOf(state.year) > -1) &&
          (!state.availability || product.availability === state.availability);
      });
      if (state.sort === "alpha") {
        list.sort(function (a, b) { return a.name.localeCompare(b.name); });
      } else {
        list.sort(function (a, b) { return b.recent - a.recent; });
      }
      return list;
    }

    function syncUrl() {
      var params = new URLSearchParams();
      ["q", "brand", "model", "category", "availability", "year", "sort"].forEach(function (key) {
        if (state[key] && !(key === "sort" && state[key] === "recent")) params.set(key, state[key]);
      });
      var url = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
      history.replaceState(null, "", url);
    }

    function renderChips() {
      if (!chips) return;
      var active = ["q", "brand", "model", "category", "availability", "year"].filter(function (key) { return state[key]; });
      chips.innerHTML = active.map(function (key) {
        return '<button class="chip" type="button" data-chip="' + escapeHtml(key) + '">' + escapeHtml(state[key]) + ' x</button>';
      }).join("");
    }

    function render() {
      var list = filtered();
      grid.innerHTML = list.slice(0, state.limit).map(card).join("");
      if (count) count.textContent = list.length + " ricambi trovati";
      if (loadMore) loadMore.classList.toggle("hidden", state.limit >= list.length);
      renderChips();
      syncUrl();
      revealNow(grid);
    }

    Object.keys(controls).forEach(function (key) {
      var control = controls[key];
      if (!control) return;
      control.addEventListener("input", function () {
        state[key] = control.value;
        state.limit = 8;
        render();
      });
      control.addEventListener("change", function () {
        state[key] = control.value;
        state.limit = 8;
        render();
      });
    });

    if (loadMore) {
      loadMore.addEventListener("click", function () {
        state.limit += 8;
        render();
      });
    }

    if (clear) {
      clear.addEventListener("click", function () {
        ["q", "brand", "model", "category", "availability", "year"].forEach(function (key) {
          state[key] = "";
          if (controls[key]) controls[key].value = "";
        });
        state.limit = 8;
        render();
      });
    }

    if (chips) {
      chips.addEventListener("click", function (event) {
        var key = event.target.getAttribute("data-chip");
        if (!key) return;
        state[key] = "";
        if (controls[key]) controls[key].value = "";
        render();
      });
    }

    if (toggle && panel) {
      toggle.addEventListener("click", function () {
        var open = panel.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    render();
  }

  function initProductPage() {
    var page = document.querySelector("[data-product-page]");
    if (!page) return;
    var id = page.getAttribute("data-product-page") || new URLSearchParams(window.location.search).get("id");
    var legacyCodes = {
      "aste-bilancieri-topolino": "RE-002",
      "ammortizzatori-fiat-1100": "RE-003",
      "kit-fissaggio-capotta-topolino": "RE-006",
      "dadi-ruota-topolino-1100": "RE-012",
      "portapacchi-topolino-c": "RE-017",
      "capottina-bianchina": "RE-026",
      "cinghia-dentata-topolino": "RE-027",
      "giunti-trasmissione-topolino": "RE-036",
      "cilindri-freno-topolino-balilla": "RE-058",
      "pompa-freno-fiat-1100": "RE-084",
      "fondi-lancia-fulvia": "RE-098",
      "pompa-freno-lancia-fulvia": "RE-139",
      "guarnizioni-carrozzeria": "RE-152",
      "tubo-acqua-topolino": "RE-154"
    };
    var legacyCode = legacyCodes[id];
    var product = products.find(function (item) {
      return item.id === id || item.slug === id || (legacyCode && item.code === legacyCode);
    }) || products[0];
    if (!product) return;

    var setText = function (selector, value) {
      document.querySelectorAll(selector).forEach(function (node) {
        node.textContent = value;
      });
    };
    var setHTML = function (selector, value) {
      var node = document.querySelector(selector);
      if (node) node.innerHTML = value;
    };

    document.title = product.name + " | Ricambi d'Epoca";
    var desc = document.querySelector("meta[name='description']");
    if (desc) desc.setAttribute("content", product.description);
    var canonical = document.querySelector("link[rel='canonical']");
    if (canonical && window.location.origin !== "null") {
      canonical.setAttribute("href", window.location.origin + "/" + product.url);
    }

    setText("[data-product-name]", product.name);
    setText("[data-product-code]", product.code);
    setText("[data-product-description]", product.description);
    setText("[data-product-status]", statusLabel(product.availability));
    setText("[data-product-notes]", product.notes);
    setHTML("[data-product-specs]", [
      ["Marca", product.brand],
      ["Modello", product.model],
      ["Anni compatibili", product.years],
      ["Categoria", product.category],
      ["Misure", "Da confermare su campione o modello"],
      ["Materiale", product.material],
      ["Finitura", product.finish],
      ["Produzione", product.production],
      ["Disponibilita'", statusLabel(product.availability)],
      ["Prezzo", product.price]
    ].map(function (row) {
      return "<div><dt>" + escapeHtml(row[0]) + "</dt><dd>" + escapeHtml(row[1]) + "</dd></div>";
    }).join(""));

    var gallery = product.gallery && product.gallery.length ? product.gallery : [product.image];
    setHTML("[data-product-gallery]", [
      '<div class="product-gallery-main"><img src="' + escapeHtml(imagePath(gallery[0])) + '" alt="' + escapeHtml(product.name) + '" loading="eager"></div>',
      '<div class="product-thumbs">' + gallery.slice(0, 4).map(function (src, index) {
        return '<img src="' + escapeHtml(imagePath(src)) + '" alt="' + escapeHtml(product.name) + ' dettaglio ' + (index + 1) + '" loading="lazy">';
      }).join("") + '</div>'
    ].join(""));

    var wa = document.querySelector("[data-product-whatsapp]");
    if (wa) wa.href = whatsappFor(product);
    var floating = document.querySelector(".floating-whatsapp");
    if (floating) floating.href = whatsappFor(product);

    var related = products.filter(function (item) {
      return item.id !== product.id && (item.brand === product.brand || item.modelSlug === product.modelSlug || item.category === product.category);
    }).slice(0, 4);
    setHTML("[data-related-products]", related.map(card).join(""));

    var share = document.querySelector("[data-share-product]");
    if (share) {
      share.addEventListener("click", function () {
        if (navigator.share) {
          navigator.share({ title: product.name, text: product.description, url: window.location.href });
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href);
          share.textContent = "Link copiato";
        }
      });
    }

    var json = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "sku": product.code,
      "brand": { "@type": "Brand", "name": product.brand },
      "image": imagePath(product.image),
      "description": product.description,
      "offers": {
        "@type": "Offer",
        "priceCurrency": "EUR",
        "availability": product.availability === "pronta" ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
        "url": window.location.href
      }
    };
    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(json);
    document.head.appendChild(script);
    revealNow(page);
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.body.classList.remove("is-preload");
    initMenu();
    countInto("[data-brand-count]", function (product, key) { return slugify(product.brand) === key; });
    countInto("[data-category-count]", function (product, key) { return slugify(product.category) === key; });
    renderFeatured();
    initHomeSearch();
    initCatalog();
    initProductPage();
    revealNow(document);
  });
})();
