const http = require("http");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const host = "127.0.0.1";
const port = Number(process.env.PORT || 8000);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".mp3": "audio/mpeg"
};

function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  let filePath = path.join(root, decoded);
  if (!filePath.startsWith(root)) return null;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }
  return filePath;
}

http.createServer((req, res) => {
  const filePath = resolveFile(req.url === "/" ? "/index.html" : req.url);
  if (!filePath || !fs.existsSync(filePath)) {
    const notFound = path.join(root, "404.html");
    res.writeHead(404, { "Content-Type": types[".html"] });
    res.end(fs.existsSync(notFound) ? fs.readFileSync(notFound) : "Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}).listen(port, host, () => {
  console.log(`Ricambi d'Epoca static server: http://${host}:${port}/`);
});
