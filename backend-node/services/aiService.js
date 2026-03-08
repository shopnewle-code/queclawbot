import axios from "axios";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export class AIService {

constructor() {

this.aiServerUrl = env.AI_SERVER_URL;

this.openaiApiKey = env.OPENAI_API_KEY;

this.groqApiKey = env.GROQ_API_KEY;

this.claudeApiKey = env.CLAUDE_API_KEY;

this.geminiApiKey = env.GEMINI_API_KEY;

this.hfApiKey = env.HUGGINGFACE_API_KEY;

this.openaiBaseUrl = env.OPENAI_BASE_URL || "https://api.openai.com/v1";

this.openaiModel = env.OPENAI_MODEL || "gpt-4o-mini";

this.timeout = 30000;

}



async askAI(prompt, userId, plan = "free") {

const text = `${prompt || ""}`.trim();

if (!text) throw new Error("Prompt cannot be empty");



try {



/* ---------- 1️⃣ Try Python AI Server ---------- */

if (this.aiServerUrl) {

try {

const response = await axios.post(

`${this.aiServerUrl}/ask`,

{ text, user_id: userId },

{ timeout: this.timeout }

);

return response.data;

} catch (err) {

logger.warn("AI server unavailable. Switching to cloud AI.");

}

}



/* ---------- 2️⃣ Plan Based Routing ---------- */

if (plan === "enterprise" && this.claudeApiKey) {

return await this.askClaude(text);

}



if (plan === "pro" && this.openaiApiKey) {

return await this.askOpenAI(text);

}



/* ---------- 3️⃣ Free Tier ---------- */

if (this.groqApiKey) {

return await this.askGroq(text);

}



/* ---------- 4️⃣ Fallback Chain ---------- */

if (this.openaiApiKey) {

return await this.askOpenAI(text);

}



if (this.geminiApiKey) {

return await this.askGemini(text);

}



if (this.hfApiKey) {

return await this.askHuggingFace(text);

}



throw new Error("No AI provider configured");



} catch (error) {

logger.error("AI request failed", error.message);

throw error;

}

}



/* ==============================

OPENAI

============================== */

async askOpenAI(prompt) {

const response = await axios.post(

`${this.openaiBaseUrl}/chat/completions`,

{

model: this.openaiModel,

messages: [{ role: "user", content: prompt }]

},

{

headers: {

Authorization: `Bearer ${this.openaiApiKey}`,

"Content-Type": "application/json"

}

}

);



return {

reply: response.data.choices[0].message.content.trim(),

provider: "openai",

model: this.openaiModel

};

}



/* ==============================

GROQ (FAST FREE MODEL)

============================== */

async askGroq(prompt) {

const response = await axios.post(

"https://api.groq.com/openai/v1/chat/completions",

{

model: "llama3-70b-8192",

messages: [{ role: "user", content: prompt }]

},

{

headers: {

Authorization: `Bearer ${this.groqApiKey}`,

"Content-Type": "application/json"

}

}

);



return {

reply: response.data.choices[0].message.content,

provider: "groq",

model: "llama3-70b"

};

}



/* ==============================

CLAUDE (ENTERPRISE)

============================== */

async askClaude(prompt) {

const response = await axios.post(

"https://api.anthropic.com/v1/messages",

{

model: "claude-3-haiku-20240307",

max_tokens: 1024,

messages: [{ role: "user", content: prompt }]

},

{

headers: {

"x-api-key": this.claudeApiKey,

"anthropic-version": "2023-06-01",

"Content-Type": "application/json"

}

}

);



return {

reply: response.data.content[0].text,

provider: "claude",

model: "claude-3-haiku"

};

}



/* ==============================

GEMINI

============================== */

async askGemini(prompt) {

const response = await axios.post(

`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,

{

contents: [

{

parts: [{ text: prompt }]

}

]

}

);



return {

reply: response.data.candidates[0].content.parts[0].text,

provider: "gemini",

model: "gemini-pro"

};

}



/* ==============================

HUGGINGFACE

============================== */

async askHuggingFace(prompt) {

const response = await axios.post(

"https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",

{ inputs: prompt },

{

headers: {

Authorization: `Bearer ${this.hfApiKey}`

}

}

);



return {

reply: response.data[0].generated_text,

provider: "huggingface",

model: "mistral-7b"

};

}



/* ==============================

HEALTH CHECK

============================== */

async healthCheck() {

try {

if (this.aiServerUrl) {

const res = await axios.get(`${this.aiServerUrl}/health`);

if (res.status === 200) return true;

}



return Boolean(

this.openaiApiKey ||

this.groqApiKey ||

this.claudeApiKey ||

this.geminiApiKey ||

this.hfApiKey

);

} catch {

return false;

}

}

}



export const aiService = new AIService();

export default aiService;