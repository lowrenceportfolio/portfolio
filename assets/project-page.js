(function () {
  var projects = window.STUDIO_NERO_PROJECTS || {};
  var fileName = decodeURIComponent(window.location.pathname.split("/").pop() || "");
  var slug = fileName.replace(/\.html$/i, "");
  var project = projects[slug];

  var title = document.getElementById("projectTitle");
  var eyebrow = document.getElementById("projectEyebrow");
  var description = document.getElementById("projectDescription");
  var meta = document.getElementById("projectMeta");
  var visual = document.getElementById("projectVisual");
  var approach = document.getElementById("projectApproach");
  var body = document.querySelector(".project-body");

  function appendMeta(label, value, href) {
    if (!meta || !value) {
      return;
    }

    var item = document.createElement("div");
    var labelNode = document.createElement("span");
    var valueNode = document.createElement("span");

    item.className = "project-meta-item";
    labelNode.className = "project-meta-label";
    valueNode.className = "project-meta-value";
    labelNode.textContent = label;

    if (href) {
      var link = document.createElement("a");
      link.href = href;
      link.textContent = value;

      if (/^https?:\/\//.test(href)) {
        link.target = "_blank";
        link.rel = "noreferrer";
      }

      valueNode.appendChild(link);
    } else {
      valueNode.textContent = value;
    }

    item.appendChild(labelNode);
    item.appendChild(valueNode);
    meta.appendChild(item);
  }

  function buildPlaceholder(cover) {
    var wrap = document.createElement("div");
    var top = document.createElement("div");
    var mark = document.createElement("div");
    var big = document.createElement("div");
    var lines = document.createElement("div");
    var bottom = document.createElement("div");
    var topLeft = document.createElement("span");
    var topRight = document.createElement("span");
    var bottomLeft = document.createElement("span");
    var bottomRight = document.createElement("span");

    wrap.className = "visual-placeholder";
    top.className = "visual-placeholder-top";
    mark.className = "visual-placeholder-mark";
    big.className = "visual-placeholder-title";
    lines.className = "visual-placeholder-lines";
    bottom.className = "visual-placeholder-bottom";

    topLeft.textContent = cover.left || "Studio";
    topRight.textContent = cover.right || "Project";
    bottomLeft.textContent = cover.bottomLeft || "Case";
    bottomRight.textContent = cover.bottomRight || "Study";
    big.textContent = cover.title || "Project";

    for (var index = 0; index < 3; index += 1) {
      lines.appendChild(document.createElement("i"));
    }

    top.appendChild(topLeft);
    top.appendChild(topRight);
    mark.appendChild(big);
    mark.appendChild(lines);
    bottom.appendChild(bottomLeft);
    bottom.appendChild(bottomRight);
    wrap.appendChild(top);
    wrap.appendChild(mark);
    wrap.appendChild(bottom);

    return wrap;
  }

  function buildPalette(colors) {
    if (!body || !colors || !colors.length) {
      return;
    }

    var section = document.createElement("section");
    var label = document.createElement("span");
    var list = document.createElement("div");

    section.className = "project-palette";
    section.setAttribute("aria-label", "Palette colori progetto");
    label.className = "project-section-label";
    label.textContent = "Palette";
    list.className = "palette-list";

    colors.forEach(function (color) {
      if (!color || !color.hex) {
        return;
      }

      var item = document.createElement("div");
      var swatch = document.createElement("span");
      var info = document.createElement("span");
      var name = document.createElement("span");
      var hex = document.createElement("span");

      item.className = "palette-item";
      swatch.className = "palette-swatch";
      info.className = "palette-info";
      name.className = "palette-name";
      hex.className = "palette-hex";

      item.style.backgroundColor = color.hex;
      item.style.color = getReadableTextColor(color.hex);
      swatch.style.backgroundColor = color.hex;
      name.textContent = color.name || "Colore";
      hex.textContent = color.hex.toUpperCase();

      info.appendChild(name);
      info.appendChild(hex);
      item.appendChild(swatch);
      item.appendChild(info);
      list.appendChild(item);
    });

    if (!list.children.length) {
      return;
    }

    section.appendChild(label);
    section.appendChild(list);
    body.insertAdjacentElement("afterend", section);
  }

  function getReadableTextColor(hex) {
    var cleanHex = hex.replace("#", "");

    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split("").map(function (char) {
        return char + char;
      }).join("");
    }

    var red = parseInt(cleanHex.slice(0, 2), 16);
    var green = parseInt(cleanHex.slice(2, 4), 16);
    var blue = parseInt(cleanHex.slice(4, 6), 16);
    var brightness = (red * 299 + green * 587 + blue * 114) / 1000;

    return brightness > 145 ? "#000000" : "#FFFFFF";
  }

  if (!project) {
    document.title = "Progetto non trovato - Studio Nero";

    if (eyebrow) {
      eyebrow.textContent = "Project";
    }

    if (title) {
      title.textContent = "Progetto non trovato";
    }

    if (description) {
      description.textContent = "Torna al portfolio per aprire uno dei case study disponibili.";
    }

    if (approach) {
      approach.textContent = "La pagina richiesta non corrisponde a un progetto pubblicato.";
    }

    return;
  }

  document.title = project.title + " - Studio Nero";

  if (eyebrow) {
    eyebrow.textContent = project.eyebrow || "Case Study";
  }

  if (title) {
    title.textContent = project.title;
  }

  if (description) {
    description.textContent = project.intro;
  }

  appendMeta("Cliente", project.client);
  appendMeta("Anno", project.year);
  appendMeta("Servizi", project.services);
  appendMeta("Settore", project.sector);
  appendMeta("Website", project.websiteLabel, project.websiteHref);

  if (visual) {
    if (project.image) {
      var image = document.createElement("img");
      image.src = project.image;
      image.alt = project.alt || "";
      image.loading = "eager";
      visual.appendChild(image);
    } else {
      visual.appendChild(buildPlaceholder(project.cover || {}));
    }
  }

  if (approach) {
    approach.textContent = project.approach;
  }

  buildPalette(project.palette);
})();

(function () {
  var logo = document.querySelector(".logo");
  var pageTransition = document.getElementById("pageTransition");
  var links = document.querySelectorAll("a[href]");

  links.forEach(function (link) {
    link.addEventListener("click", function (event) {
      var rawHref = link.getAttribute("href");

      if (!rawHref || rawHref.charAt(0) === "#" || rawHref.indexOf("mailto:") === 0 || rawHref.indexOf("tel:") === 0) {
        return;
      }

      var target = new URL(rawHref, window.location.href);

      if (target.href === window.location.href) {
        return;
      }

      if ((target.protocol === "http:" || target.protocol === "https:") && target.origin !== window.location.origin) {
        return;
      }

      event.preventDefault();

      if (pageTransition) {
        pageTransition.classList.add("is-active");
      }

      if (logo) {
        logo.classList.remove("is-spinning");
        void logo.offsetWidth;
        logo.classList.add("is-spinning");
      }

      window.setTimeout(function () {
        window.location.href = target.href;
      }, 560);
    });
  });
})();
