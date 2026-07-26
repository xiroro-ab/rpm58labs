import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const { html, instruction } = body;
    if (!html || !instruction) {
      return res.status(400).json({ error: 'HTML and instruction are required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on server' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `Anda adalah asisten AI spesialis assessment pendidikan.

Tugas: Buat konten assessment berdasarkan instruksi dan dokumen RPM berikut.
- Output HANYA konten assessment dalam HTML, JANGAN output seluruh dokumen.
- JANGAN gunakan markdown code block.
- Langsung keluarkan HTML.

INSTRUKSI:
${instruction}

DOKUMEN RPM:
${html}`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache, no-transform');

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }

    res.end();
  } catch (error: any) {
    console.error('Revise Stream Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate assessment: ' + (error.message || '') });
    } else {
      res.end();
    }
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
