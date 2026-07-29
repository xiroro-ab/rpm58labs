import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method Not Allowed' }); }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) {} }

    const { html, instruction, customApiKey, aiProvider } = body;
    if (!html || !instruction) return res.status(400).json({ error: 'HTML dan instruksi diperlukan' });
    const key = customApiKey || process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: 'API Key diperlukan' });

    const provider = aiProvider || 'gemini';
    const promptText = 'Revisi website berikut sesuai instruksi. Pertahankan tema Neo Brutalism. Output LANGSUNG kode HTML lengkap, tanpa markdown.\n\nINSTRUKSI: ' + instruction + '\n\nWEBSITE:\n' + html;

    let revisedHtml = '';

    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: promptText });
      revisedHtml = response.text || '';
    } else {
      let baseURL = 'https://api.groq.com/openai/v1';
      let modelName = 'llama3-70b-8192';
      if (provider === 'openai') { baseURL = ''; modelName = 'gpt-4o-mini'; }
      else if (provider === 'deepseek') { baseURL = 'https://api.deepseek.com/v1'; modelName = 'deepseek-chat'; }
      else if (provider === 'groq') { baseURL = 'https://api.groq.com/openai/v1'; modelName = 'llama3-70b-8192'; }

      const openai = new OpenAI({ apiKey: key, baseURL: baseURL || undefined });
      const completion = await openai.chat.completions.create({ model: modelName, messages: [{ role: 'user', content: promptText }] });
      revisedHtml = completion.choices[0]?.message?.content || '';
    }

    revisedHtml = revisedHtml.replace(/```[\s\S]*?```/g, '').trim();
    const htmlMatch = revisedHtml.match(/(<!DOCTYPE[\s\S]*?<\/html>|<html[\s\S]*?<\/html>)/i);
    if (htmlMatch) revisedHtml = htmlMatch[1];

    res.json({ html: revisedHtml });
  } catch (error: any) {
    console.error('Revise Website Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal: ' + (error.message || '') });
  }
}