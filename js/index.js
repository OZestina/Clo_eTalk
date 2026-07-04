require("dotenv").config();

const fs = require("fs");
const readline = require("readline");

const { loadJSON, saveJSON } = require("./js/storage");
const { getAvailableQuestions, pickQuestion } = require("./js/questions");
const { callAI } = require("./js/ai");

let SETTINGS = loadJSON("./data/settings.json");
let QUESTIONS = loadJSON("./data/questions.json");
let HISTORY = loadJSON("./data/history.json");

let pool = getAvailableQuestions(QUESTIONS, SETTINGS, HISTORY);
let current = pickQuestion(pool);

let session = {
  session_id: Date.now(),
  question_id: current.id,
  question: current.question,
  answers: [],
  followups: []
};

let phase = "question";
let state = {};

console.log("\nQUESTION:");
console.log(current.question);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on("line", async (input) => {
  await handle(input);
});