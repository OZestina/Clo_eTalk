function buildCloze(sentence, corrections, selected) {
  let words = sentence.split(" ");

  corrections.forEach((c, i) => {
    const level = selected[i];
    const text = c[level];
    if (!text) return;

    text.split(" ").forEach(w => {
      const idx = words.indexOf(w);
      if (idx !== -1) words[idx] = "_____";
    });
  });

  return words.join(" ");
}

module.exports = { buildCloze };