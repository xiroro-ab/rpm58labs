import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'text/html');

  const models = [
    'gemini-3.6-flash',
    'gemini-1.5-pro',
    'gemini-2.0-pro-exp',
    'gemini-2.5-pro-exp-03-25',
  ];

  let html = `<html><head><title>Model Test</title>
  <style>body{font-family:sans-serif;padding:20px;background:#1e293b;color:#e2e8f0}
  .ok{color:#10b981;font-weight:bold}.fail{color:#ef4444}
  pre{background:#0f172a;padding:10px;border-radius:8px;font-size:12px}</style></head><body>
  <h1>Test Model AI</h1><table border="1" cellpadding="10" style="border-collapse:collapse;width:100%">
  <tr><th>Model</th><th>Status</th><th>Response</th></tr>`;

  for (const model of models) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const resp = await ai.models.generateContent({
        model,
        contents: 'Katakan "OK" saja.',
      });
      const text = (resp.text || '').trim();
      html += `<tr><td>${model}</td><td class="ok">✅ OK</td><td><pre>${text}</pre></td></tr>`;
    } catch (e: any) {
      html += `<tr><td>${model}</td><td class="fail">❌ Gagal</td><td><pre>${e.message || e}</pre></td></tr>`;
    }
  }

  html += `</table></body></html>`;
  res.write(html);
  res.end();
}