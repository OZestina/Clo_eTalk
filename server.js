require('dotenv').config();
const express = require('express');
const cors = require('cors');

// ✅ Node.js 16 환경 대응: node-fetch v2(CommonJS 지원 버전)로 전역 fetch polyfill
// ⚠️ node-fetch v3는 ESM 전용이라 require()가 안 되므로 반드시 v2를 사용해야 합니다.
const fetch = require('node-fetch');
const { Headers, Request, Response } = require('node-fetch');
const { FormData } = require('formdata-node');

globalThis.fetch = fetch;
globalThis.Headers = Headers;
globalThis.Request = Request;
globalThis.Response = Response;
globalThis.FormData = FormData;

// 3대 AI SDK 로드
const { OpenAI } = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// 공통 시스템 프롬프트 (3개 카테고리 단일 제안 강제)
const SYSTEM_PROMPT = `You are 'Qlue', an expert English interview coach. 
Your task is to correct the user's English answer and provide alternative expressions for key parts of the sentence.

[CRITICAL RULE] 
Do NOT provide overly long, academic, or complex phrases. Focus on practical, native-like expressions.
For the key part of the sentence, you MUST provide exactly ONE option for each of the following 3 categories:

1. "simple": ONE very easy, short, and beginner-friendly native expression.
2. "standard": ONE natural, common, and widely-used expression.
3. "creative": ONE unique, expressive, or idiomatic native expression that shows high proficiency.

You MUST respond ONLY in valid JSON format with the following structure (Do not include markdown like \`\`\`json):
{
  "original": "user's original answer",
  "corrected": "grammatically perfect and natural native-like answer",
  "alternatives": [
    {
      "part": "the exact phrase from the ORIGINAL answer to be replaced",
      "simple": "only one easy option string",
      "standard": "only one normal option string",
      "creative": "only one cool option string"
    }
  ]
}
Provide alternatives for 1 or 2 key parts that need improvement.`;

// ✅ 공통 유틸: AI 응답에서 마크다운 펜스 등을 제거하고 안전하게 JSON 파싱
function safeJsonParse(rawText) {
    if (!rawText || typeof rawText !== 'string') {
        throw new Error("빈 응답이거나 문자열이 아닙니다.");
    }

    let cleaned = rawText.trim();

    // ```json ... ``` 또는 ``` ... ``` 형태 제거
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');

    // 혹시 앞뒤에 잡텍스트가 붙은 경우, 첫 '{'부터 마지막 '}'까지만 추출
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        throw new Error(`JSON 파싱 실패: ${e.message} / 원본 일부: ${rawText.slice(0, 100)}`);
    }
}

// 1순위: OpenAI 호출
async function callOpenAI(question, userAnswer) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI API Key is missing.");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Question: ${question}\nUser Answer: ${userAnswer}` }
        ]
    });
    return safeJsonParse(response.choices[0].message.content);
}

// 2순위: Claude 호출
async function callClaude(question, userAnswer) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("Anthropic API Key is missing.");
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Question: ${question}\nUser Answer: ${userAnswer}` }]
    });
    return safeJsonParse(response.content[0].text);
}

// 3순위: Gemini 호출 (안정적인 최신 모델 탑재)
async function callGemini(question, userAnswer) {
    if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API Key is missing.");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
        model: "models/gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });
    const result = await model.generateContent(`${SYSTEM_PROMPT}\n\nQuestion: ${question}\nUser Answer: ${userAnswer}`);
    return safeJsonParse(result.response.text());
}

// AI 교정 및 추천 표현 생성 API 엔드포인트 (릴레이 폴백 구조)
app.post('/api/correct', async (req, res) => {
    const { question, userAnswer } = req.body;
    let errorLogs = [];

    try {
        console.log("💡 [1순위] OpenAI 호출 시도...");
        const result = await callOpenAI(question, userAnswer);
        return res.json({ provider: "openai", data: result });
    } catch (e) {
        console.log("⚠️ OpenAI 패스:", e.message);
        errorLogs.push(`OpenAI: ${e.message}`);
    }

    try {
        console.log("💡 [2순위] Claude 호출 시도...");
        const result = await callClaude(question, userAnswer);
        return res.json({ provider: "claude", data: result });
    } catch (e) {
        console.log("⚠️ Claude 패스:", e.message);
        errorLogs.push(`Claude: ${e.message}`);
    }

    try {
        console.log("💡 [3순위] Gemini 호출 시도...");
        const result = await callGemini(question, userAnswer);
        return res.json({ provider: "gemini", data: result });
    } catch (e) {
        console.log("⚠️ Gemini 실패:", e.message);
        errorLogs.push(`Gemini: ${e.message}`);
    }

    res.status(500).json({ error: "모든 AI 서버 통신에 실패했습니다.", details: errorLogs });
});

// [추가] 후속 질문 생성용 Gemini 함수 및 엔드포인트
async function callGeminiFollowUp(previousAnswer, interests) {
    if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API Key is missing.");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });
    
    const prompt = `You are 'Qlue', an expert English interview coach. 
The user just answered: "${previousAnswer}"
The user's interests are: "${interests}"

Based on their answer and interests, generate a natural, engaging, and relevant NEXT interview follow-up question.
CRITICAL RULE: Output ONLY the question text itself. Do not include any greeting, markdown, or commentary. Exactly ONE sentence.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

app.post('/api/next-question', async (req, res) => {
    const { previousAnswer, interests } = req.body;
    try {
        console.log("💡 [Gemini] 후속 질문 생성 중...");
        const nextQuestion = await callGeminiFollowUp(previousAnswer, interests);
        return res.json({ question: nextQuestion });
    } catch (e) {
        console.error("후속 질문 생성 실패:", e.message);
        return res.json({ question: "Tell me more about your experience related to that." });
    }
});

app.listen(3000, () => {
    console.log(`🚀 Qlue's Local Server is running on http://localhost:3000`);
});