import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {}
    }

    const { html, instruction } = body;
    
    if (!html || !instruction) {
      return res.status(400).json({ error: 'HTML and instruction are required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on server' });
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `Anda adalah asisten AI untuk merevisi dokumen modul ajar (RPM).
Tugas Anda: Revisi dokumen HTML berikut HANYA pada bagian yang diminta oleh instruksi pengguna. 
- JANGAN mengubah kerangka dasar, layout, atau gaya desain (inline styles, class).
- Jika instruksi mengharuskan penambahan konten (misal: "tambah 5 soal"), buat strukturnya semirip mungkin dengan bagian sebelumnya.
- Output HANYA berupa keseluruhan kode HTML yang sudah direvisi, tanpa teks awalan/akhiran, tanpa markdown blok (seperti \`\`\`html).

INSTRUKSI PENGGUNA:
${instruction}

DOKUMEN HTML ASLI:
${html}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    let revisedHtml = response.text || html;
    // Clean up potential markdown formatting from the response
    revisedHtml = revisedHtml.replace(/^```html\n?/i, '').replace(/```$/i, '').trim();

    res.status(200).json({ revisedHtml });
  } catch (error: any) {
    console.error('Revise Error:', error);
    res.status(500).json({ error: 'Failed to revise HTML' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
