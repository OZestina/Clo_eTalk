function getAvailableQuestions(questions, settings, history) {
  const used = new Set(history.sessions.map(s => s.question_id));

  return Object.values(questions)
    .filter(q => settings.topics.includes(q.topic))
    .filter(q => !used.has(q.id));
}

function pickQuestion(list) {
  return list[Math.floor(Math.random() * list.length)];
}

module.exports = { getAvailableQuestions, pickQuestion };