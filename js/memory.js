function mask(word, level) {
  if (level === 0) return "_____";
  if (level === 1) return word[0] + "____";
  if (level === 2) return word.slice(0,2) + "___";
  if (level === 3) return word.slice(0, Math.ceil(word.length/2)) + "__";
  if (level === 4) return word.slice(0, -1) + "_";
  return word;
}

function renderMemory(sentence, level) {
  return sentence.split(" ").map(w => mask(w, level)).join(" ");
}

module.exports = { renderMemory };