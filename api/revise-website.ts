import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method Not Allowed' }); }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) {} }

    const { html, instruction, customApiKey } = body;
    if (!html || !instruction) return res.status(400).json({ error: 'HTML dan instruksi diperlukan' });
    const key = customApiKey || process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: 'API Key diperlukan' });

    const ai = new GoogleGenAI({ apiKey: key });
    const prompt = [
      'Anda adalah web developer. Revisi website pembelajaran berikut sesuai instruksi user.',
      'PERTAHANKAN tema Neo Brutalism, struktur, dan gaya desain. Jangan ubah layout di luar yang diminta.',
      'Output LANGSUNG kode HTML lengkap yang sudah direvisi, tanpa markdown block.',
      '',
      'INSTRUKSI: ' + instruction,
      '',
      'WEBSITE SAAT INI:',
      html,
    ].join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    const revisedHtml = response.text || '';
    res.json({ html: revisedHtml });
  } catch (error: any) {
    console.error('Revise Website Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal: ' + (error.message || '') });
  }
}