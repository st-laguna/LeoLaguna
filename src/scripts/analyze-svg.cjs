const fs = require("fs");
const path = require("path");

const svgFolder = "X:/LEOLAGUNA/leonardolaguna.com/leonardolaguna.com/public/images/brands";

function getSVGFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      getSVGFiles(fullPath, files);
    } else if (item.endsWith(".svg")) {
      files.push(fullPath);
    }
  }

  return files;
}

function analyzeSVG(file) {
  const content = fs.readFileSync(file, "utf8");

  return {
    Archivo: path.basename(file),
    Width: content.match(/width="([^"]+)"/)?.[1] || "No definido",
    Height: content.match(/height="([^"]+)"/)?.[1] || "No definido",
    ViewBox: content.match(/viewBox="([^"]+)"/)?.[1] || "No definido",
  };
}

const svgFiles = getSVGFiles(svgFolder);
const results = svgFiles.map(analyzeSVG);

console.table(results);