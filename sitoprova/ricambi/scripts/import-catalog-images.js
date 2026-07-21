const fs = require("fs");
const path = require("path");

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/import-catalog-images.js <pasted-text.txt>");
  process.exit(1);
}

const source = fs.readFileSync(input, "utf8");
const imgRe = /<img\s+alt="([\s\S]*?)"\s+src="([^"]+)"\s*\/>/g;
const images = [];
let match;

while ((match = imgRe.exec(source))) {
  images.push({
    alt: normalizeText(match[1]),
    src: normalizeSrc(match[2])
  });
}

function normalizeText(value) {
  return String(value || "")
    .replace(/Ã—/g, "x")
    .replace(/Ãª/g, "e")
    .replace(/Ã¨/g, "e")
    .replace(/Ã©/g, "e")
    .replace(/Ã /g, "a")
    .replace(/Ã¬/g, "i")
    .replace(/Ã²/g, "o")
    .replace(/Ã¹/g, "u")
    .replace(/Ã¼/g, "u")
    .replace(/Ã¤/g, "a")
    .replace(/Ã¶/g, "o")
    .replace(/Ã–/g, "O")
    .replace(/Ãœ/g, "U")
    .replace(/Âª/g, "a")
    .replace(/Â°/g, " gradi")
    .replace(/â€™/g, "'")
    .replace(/â€œ|â€|â€ž/g, '"')
    .replace(/â€“|â€”/g, "-")
    .replace(/â€‹/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/[×]/g, "x")
    .replace(/[éèê]/g, "e")
    .replace(/[à]/g, "a")
    .replace(/[ì]/g, "i")
    .replace(/[ò]/g, "o")
    .replace(/[ù]/g, "u")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSrc(value) {
  return String(value || "").trim();
}

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72) || "ricambio";
}

function imageNumber(src, index) {
  const file = src.split("/").pop().split("?")[0];
  const stem = file.replace(/\.[^.]+$/, "");
  return /^\d+$/.test(stem) ? stem.padStart(3, "0") : String(index + 1).padStart(3, "0");
}

function displayName(alt, src, index) {
  const clean = normalizeText(alt);
  if (!clean || /^[.\s]+$/.test(clean)) return `Ricambio d'epoca ${imageNumber(src, index)}`;
  if (clean.length > 118) return clean.slice(0, 115).replace(/\s+\S*$/, "") + "...";
  return clean;
}

function inferBrand(text) {
  const t = text.toLowerCase();
  if (t.includes("autobianchi") || t.includes("bianchina")) return "Autobianchi";
  if (t.includes("lancia") || t.includes("fulvia") || t.includes("flavia") || t.includes("flaminia") || t.includes("ardea") || t.includes("aprilia") || t.includes("augusta") || t.includes("aurelia")) return "Lancia";
  if (t.includes("alfa")) return "Alfa Romeo";
  if (t.includes("volkswagen")) return "Volkswagen";
  if (t.includes("bugatti")) return "Bugatti";
  if (t.includes("simca")) return "SIMCA";
  if (t.includes("fiat") || t.includes("topolino") || t.includes("balilla") || t.includes("campagnola") || t.includes("dino")) return "Fiat";
  return "Varie";
}

function inferModel(text) {
  const t = text.toLowerCase();
  if (t.includes("topolino")) return "Topolino A/B/C";
  if (t.includes("balilla")) return "Balilla";
  if (t.includes("bianchina")) return "Bianchina";
  if (t.includes("fulvia")) return "Fulvia";
  if (t.includes("flavia")) return "Flavia";
  if (t.includes("flaminia")) return "Flaminia";
  if (t.includes("ardea")) return "Ardea";
  if (t.includes("aprilia")) return "Aprilia";
  if (t.includes("augusta")) return "Augusta";
  if (t.includes("aurelia")) return "Aurelia";
  if (t.includes("campagnola")) return "Campagnola";
  if (t.includes("fiat 1100") || /\b1100\b/.test(t)) return "1100";
  if (t.includes("fiat 850") || /\b850\b/.test(t)) return "850";
  if (t.includes("fiat 600") || /\b600\b/.test(t)) return "600";
  if (t.includes("fiat 500") || /\b500\b/.test(t)) return "500";
  if (t.includes("fiat dino") || t.includes("dino")) return "Dino";
  if (t.includes("volkswagen")) return "Volkswagen T1";
  if (t.includes("bugatti")) return "Bugatti";
  if (t.includes("simca")) return "SIMCA";
  return "Auto storiche";
}

function modelSlug(model) {
  const t = model.toLowerCase();
  if (t.includes("topolino")) return "fiat-topolino";
  if (t.includes("1100")) return "fiat-1100";
  if (t.includes("balilla")) return "fiat-balilla";
  if (t.includes("bianchina")) return "autobianchi-bianchina";
  if (t.includes("fulvia")) return "lancia-fulvia";
  return slugify(model);
}

function inferYears(model, text) {
  const t = `${model} ${text}`.toLowerCase();
  if (t.includes("topolino")) return "1936-1955";
  if (t.includes("balilla")) return "1932-1937";
  if (t.includes("bianchina")) return "1957-1969";
  if (t.includes("fulvia")) return "1963-1976";
  if (t.includes("1100")) return "1937-1969";
  if (t.includes("600")) return "1955-1969";
  if (t.includes("850")) return "1964-1971";
  if (t.includes("500")) return "1936-1975";
  return "Da verificare";
}

function inferCategory(text) {
  const t = text.toLowerCase();
  if (/(freno|freni|pompa freno|cilindri freno|ceppi|tamburi)/.test(t)) return "Freni";
  if (/(ammortizzatori|sospensioni|molle)/.test(t)) return "Sospensioni";
  if (/(fondo|fondi|pavimento|lamiera|pannelli|sottoporta|pianali|carrozzeria|porta|box batteria)/.test(t)) return "Carrozzeria";
  if (/(guarnizion|gomma|parapolvere)/.test(t)) return "Guarnizioni";
  if (/(giunt|trasmissione|colonna sterzo|albero)/.test(t)) return "Trasmissione";
  if (/(crom|ottone|rame|ramato|paraurti|portapacchi|portavalige|rondelle|dadi|coppe|tappi|scritta|specchio|manovelle|fanali|frecce|indicatori|chiave|capottina|parasole|piedini)/.test(t)) return "Cromature";
  if (/(motore|olio|carburatore|cinghia|puleggia|valvola|testata|coppa|impianto elettrico|cablaggi|cavi|scarico|radiatore|tubo|cuscinetti|mozzo|ruota)/.test(t)) return "Motore";
  return "Accessori";
}

function inferMaterial(text, category) {
  const t = text.toLowerCase();
  if (t.includes("ottone")) return "Ottone";
  if (t.includes("alluminio")) return "Alluminio";
  if (t.includes("acciaio inox")) return "Acciaio inox";
  if (t.includes("acciaio")) return "Acciaio";
  if (t.includes("rame")) return "Rame";
  if (t.includes("gomma")) return "Gomma tecnica";
  if (t.includes("lamiera")) return "Lamiera";
  if (category === "Guarnizioni") return "Gomma tecnica o materiale specifico";
  if (category === "Carrozzeria") return "Lamiera o metallo lavorato";
  return "Materiale da verificare";
}

function inferAvailability(index) {
  if (index % 5 === 0) return "limitata";
  if (index % 3 === 0) return "su-richiesta";
  return "pronta";
}

const products = images.map((image, index) => {
  const name = displayName(image.alt, image.src, index);
  const brand = inferBrand(name);
  const model = inferModel(name);
  const category = inferCategory(name);
  const num = imageNumber(image.src, index);
  const id = `catalogo-${num}-${slugify(name).slice(0, 42)}`;

  return {
    id,
    slug: slugify(name),
    name,
    code: `RE-${num}`,
    brand,
    model,
    modelSlug: modelSlug(model),
    years: inferYears(model, name),
    category,
    availability: inferAvailability(index),
    material: inferMaterial(name, category),
    finish: category === "Cromature" ? "Finitura lucida o trattamento su richiesta" : "Finitura da confermare",
    production: "Ricambio da catalogo o riproduzione su richiesta",
    price: "Richiedi preventivo",
    image: image.src,
    gallery: [image.src],
    description: name.startsWith("Ricambio d'epoca")
      ? "Immagine presente nel catalogo Ricambi d'Epoca. Richiedi informazioni inviando codice e foto del componente."
      : name,
    notes: "Compatibilita' e misure da confermare prima dell'ordine.",
    recent: images.length - index,
    featured: ["002", "006", "017", "036", "058", "098", "121", "152"].includes(num)
  };
});

const output = `window.RDE_PRODUCTS = ${JSON.stringify(products, null, 2)}.map(function(product) {
  product.url = "ricambio.html?id=" + encodeURIComponent(product.id);
  return product;
});
`;

fs.writeFileSync(path.join(process.cwd(), "assets/js/products.js"), output);
console.log(`Imported ${products.length} catalog images into assets/js/products.js`);
