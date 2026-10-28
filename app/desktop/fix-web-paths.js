const fs = require("fs");
const path = require("path");

const indexPath = path.join(__dirname, "..", "dist", "index.html");
let html = fs.readFileSync(indexPath, "utf8");

html = html
  .replace(/(src|href)="\/(?!\/)/g, '$1="./')
  .replace(/url\((\/(?!\/)[^)]+)\)/g, "url(.$1)");

fs.writeFileSync(indexPath, html);
