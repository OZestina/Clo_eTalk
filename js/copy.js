function normalize(t) {
  return t.replace(/\s+/g, " ").trim();
}

function isExactMatch(a, b) {
  return normalize(a) === normalize(b);
}

module.exports = { isExactMatch };