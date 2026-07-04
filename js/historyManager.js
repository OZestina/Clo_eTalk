const { loadJSON, saveJSON } = require("./storage");

function loadHistory(path) {
  try {
    return loadJSON(path);
  } catch {
    return { sessions: [] };
  }
}

function saveSession(path, HISTORY, session) {
  HISTORY.sessions.push(session);
  saveJSON(path, HISTORY);
}

module.exports = { loadHistory, saveSession };