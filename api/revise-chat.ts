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

    const { html, instruction, chatHistory, sectionOnly } = body;
    if (!html || !instruction) {
      return res.status(400).json({ error: 'HTML and instruction are required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on server' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    let historyContext = '';
    if (chatHistory && chatHistory.length > 0) {
      historyContext = 'RIWAYAT PERCAKAPAN:\n' + 
        chatHistory.map((m: any) => `${m.role === 'user' ? 'USER' : 'AI'}: ${m.content}`).join('\n') + '\n\n';
    }

    const prompt = `Anda adalah asisten AI yang membantu guru merevisi dokumen Rencana Pembelajaran Mendalam (RPM).

KEMAMPUAN ANDA:
- Mengubah teks, soal, atau bagian tertentu dalam dokumen
- Mengganti jawaban soal, menambah/menghapus soal
- Memperbaiki tata bahasa dan ejaan
- Menyesuaikan alokasi waktu, model pembelajaran, dll
- Jawab dalam bahasa Indonesia dengan gaya membantu dan santai

ATURAN:
1. ${body.sectionOnly ? 'Output HANYA HTML bagian yang direvisi (fragment), BUKAN seluruh dokumen. Output langsung HTML fragment, tanpa tag pembungkus.' : 'Output HANYA kode HTML lengkap yang sudah direvisi'}
2. JANGAN gunakan markdown code block
3. Jangan ubah struktur di luar yang diminta instruksi
4. Jika instruksi spesifik (contoh: "ubah soal nomor 3"), lakukan tepat pada bagian itu
5. Pertahankan semua inline style dan class yang sudah ada

${historyContext}INSTRUKSI PENGGUNA:
${instruction}

DOKUMEN RPM SAAT INI:
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
    console.error('Revise Chat Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Gagal: ' + (error.message || '') });
    } else {
      res.end();
    }
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: '10mb' },
  },
};
