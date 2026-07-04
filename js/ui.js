const chalk = require("chalk");

const steps = ["QUESTION","CORRECTION","COPY","CLOZE","MEMORY","FOLLOW-UP"];

function renderHeader(step){
  return steps.map((s,i)=>{
    if(i===step) return chalk.green("▶ "+s);
    if(i<step) return chalk.gray("✔ "+s);
    return "  "+s;
  }).join(" | ");
}

function clearScreen(){
  console.clear();
}

function printPrompt(step){
  const m = [
    "Answer",
    "Select (e.g. 0 2)",
    "Type exact sentence",
    "Cloze",
    "Memory",
    "Follow-up"
  ];
  return "\n> " + m[step] + ": ";
}

function logQuestion(q){ console.log(chalk.cyan("\nQUESTION\n"+q)); }
function logCorrection(d){ console.log(chalk.yellow("\nCORRECTION"), d); }
function logCloze(t){ console.log(chalk.magenta("\nCLOZE\n"+t)); }
function logMemory(t){ console.log(chalk.blue("\nMEMORY\n"+t)); }
function logFollowup(t){ console.log(chalk.green("\nFOLLOW-UP\n"+t)); }

module.exports = {
  renderHeader,
  clearScreen,
  printPrompt,
  logQuestion,
  logCorrection,
  logCloze,
  logMemory,
  logFollowup
};