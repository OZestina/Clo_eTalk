const fs = require("fs");

function loadJSON(path) {
  return JSON.parse(fs.readFileSync(path, "utf-8"));
}

function saveJSON(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

module.exports = { loadJSON, saveJSON };