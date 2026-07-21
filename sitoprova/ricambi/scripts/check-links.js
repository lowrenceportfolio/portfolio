const fs = require("fs");
const path = require("path");

const root = process.cwd();
const htmlFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(filePath);
    } else if (entry.name.endsWith(".html")) {
      htmlFiles.push(filePath);
    }
  }
}

function localTarget(fromFile, rawUrl) {
  if (/^(https?:|mailto:|tel:|#|data:)/.test(rawUrl)) return null;
  if (rawUrl.startsWith("/")) return null;

  const clean = rawUrl.split("#")[0].split("?")[0];
  if (!clean) return null;

  let target = path.resolve(path.dirname(fromFile), clean);
  if (clean.endsWith("/")) target = path.join(target, "index.html");
  if (!path.extname(target)) target = path.join(target, "index.html");
  return target;
}

walk(root);

const bad = [];
const attrRe = /(?:href|src)=["']([^"']+)["']/g;

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  let match;
  while ((match = attrRe.exec(html))) {
    const target = localTarget(file, match[1]);
    if (target && !fs.existsSync(target)) {
      bad.push(`${path.relative(root, file)} -> ${match[1]}`);
    }
  }
}

if (bad.length) {
  console.error(bad.join("\n"));
  process.exit(1);
}

console.log(`local links ok: ${htmlFiles.length} html files`);
