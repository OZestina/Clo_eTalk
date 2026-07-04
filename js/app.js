require("dotenv").config();

const readline = require("readline");
const chalk = require("chalk");

const { loadJSON, saveJSON } = require("./storage");
const { getAvailableQuestions, pickQuestion } = require("./questions");
const { isExactMatch } = require("./copy");
const { buildCloze } = require("./cloze");
const { renderMemory } = require("./memory");
const { generateFollowup } = require("./followup");
const { saveSession, loadHistory } = require("./historyManager");
const ui = require("./ui");

let SETTINGS = loadJSON("./data/settings.json");
let QUESTIONS = loadJSON("./data/questions.json");
let HISTORY = loadHistory("./data/history.json");

let pool = getAvailableQuestions(QUESTIONS, SETTINGS, HISTORY);
let current = pickQuestion(pool);

let step = 0;
let buffer = null;

let session = {
  session_id: Date.now(),
  question_id: current.id,
  question: current.question,
  answers: [],
  correction: null,
  selected: [],
  final_sentence: "",
  followups: []
};

ui.clearScreen();
ui.logQuestion(current.question);
console.log(ui.renderHeader(step));
process.stdout.write(ui.printPrompt(step));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on("line", async (input) => {

  if(step === 0){
    session.answers = input.split(". ");

    session.correction = {
      corrections: [{original:"x",easy:"a",medium:"b",natural:"c"}],
      sentences:{medium:"I went to Japan last year"}
    };

    step = 1;
    process.stdout.write(ui.printPrompt(step));
    return;
  }

  if(step === 1){
    session.selected = ["medium","medium"];
    session.final_sentence = session.correction.sentences.medium;

    step = 2;
    process.stdout.write(ui.printPrompt(step));
    return;
  }

  if(step === 2){
    if(!isExactMatch(input, session.final_sentence)){
      console.log(chalk.red("TRY AGAIN"));
      process.stdout.write(ui.printPrompt(step));
      return;
    }
    step = 3;
    process.stdout.write(ui.printPrompt(step));
    return;
  }

  if(step === 3){
    console.log(buildCloze(session.final_sentence, session.correction.corrections, session.selected));
    step = 4;
    process.stdout.write(ui.printPrompt(step));
    return;
  }

  if(step === 4){
    console.log(renderMemory(session.final_sentence,1));
    step = 5;
    process.stdout.write(ui.printPrompt(step));
    return;
  }

  if(step === 5){
    session.followups.push({q:"why?", a:input});
    saveSession("./data/history.json", HISTORY, session);
    console.log("SESSION SAVED");
    process.exit();
  }
});