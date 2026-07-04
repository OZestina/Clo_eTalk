const state = {
  phase: "question",

  session: null,

  currentQuestion: null,
  answers: [],

  correction: null,
  selected: null,

  copyTarget: "",
  copyInput: "",

  clozeTarget: "",
  clozeInput: "",
  clozeFail: 0,

  memoryLevel: 0,
  memoryFail: 0,

  followupDepth: 0
};