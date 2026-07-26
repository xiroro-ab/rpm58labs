import fs from 'fs';

const serverCode = fs.readFileSync('server.ts', 'utf8');

// Simple regex matching or substring matching to extract the bodies
const generateStart = serverCode.indexOf("app.post('/api/generate', async (req, res) => {");
const generateEnd = serverCode.indexOf("app.post(\"/api/pdf\"");

let generateBody = serverCode.substring(generateStart, generateEnd);
// Remove the app.post wrapper
generateBody = generateBody.replace("app.post('/api/generate', async (req, res) => {", "export default async function handler(req: any, res: any) {\n  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });\n");
generateBody = generateBody.substring(0, generateBody.lastIndexOf("});"));
generateBody = generateBody + "\n}\n";

const pdfStart = serverCode.indexOf("app.post(\"/api/pdf\", async (req, res) => {");
const pdfEnd = serverCode.indexOf("// Vite middleware for development");
let pdfBody = serverCode.substring(pdfStart, pdfEnd);
pdfBody = pdfBody.replace("app.post(\"/api/pdf\", async (req, res) => {", "import twemoji from '@twemoji/api';\nimport puppeteer from 'puppeteer-core';\nimport chromium from '@sparticuz/chromium';\n\nexport default async function handler(req: any, res: any) {\n  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });\n");
pdfBody = pdfBody.substring(0, pdfBody.lastIndexOf("});"));
pdfBody = pdfBody + "\n}\n";

fs.mkdirSync('api', { recursive: true });

const generateCode = `
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

` + generateBody;

fs.writeFileSync('api/generate.ts', generateCode);
fs.writeFileSync('api/pdf.ts', pdfBody);

console.log("Restored api/generate.ts and api/pdf.ts");
