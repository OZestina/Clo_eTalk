const fs = require("fs");
const fetch = require("node-fetch");

function loadPrompt(name) {
  return fs.readFileSync(`./prompts/${name}.txt`, "utf-8");
}

async function callAI(type, data, API_KEY) {
  const prompt = loadPrompt(type).replace(
    "{{input}}",
    JSON.stringify(data)
  );

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-5.3-mini",
      input: prompt,
      response_format: { type: "json_object" }
    })
  });

  const json = await res.json();
  return JSON.parse(json.output_text);
}

module.exports = { callAI };