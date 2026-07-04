async function generateFollowup(context) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-5.3-mini",
      input: `Generate one follow-up question: ${JSON.stringify(context)}`
    })
  });

  const json = await res.json();
  return json.output_text || "Why?";
}

module.exports = { generateFollowup };