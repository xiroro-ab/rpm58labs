import { GoogleGenAI } from '@google/genai';

export const config = {
  api: {
    bodyParser: { sizeLimit: '10mb' },
  },
};

async function callAI(ai: any, parts: any[]): Promise<string> {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: [{ role: 'user', parts }] });
      return (r.text || '').trim();
    } catch (e: any) {
      if ((e.message?.includes('503') || e.status === 503) && i < 2) {
        await new Promise(r => setTimeout(r, (i + 1) * 2000));
        continue;
      }
      throw e;
    }
  }
  return '';
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method Not Allowed' }); }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) {} }

    const { sourceHtml, text, imageBase64, imageMime, customApiKey } = body;
    if (!sourceHtml && !text && !imageBase64) {
      return res.status(400).json({ error: 'Sumber soal diperlukan (dokumen RPM, teks, atau foto).' });
    }
    const key = customApiKey || process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: 'API Key diperlukan.' });

    const ai = new GoogleGenAI({ apiKey: key });

    const parts: any[] = [];
    let sourceDesc = '';
    if (imageBase64) {
      parts.push({ inlineData: { mimeType: imageMime || 'image/jpeg', data: imageBase64 } });
      sourceDesc = 'foto/gambar naskah soal';
    }
    if (text && text.trim()) {
      parts.push({ text: 'TEKS SOAL:\n' + text });
      sourceDesc = sourceDesc || 'teks soal';
    }
    if (sourceHtml) {
      parts.push({ text: 'DOKUMEN RPM (HTML):\n' + sourceHtml });
      sourceDesc = sourceDesc || 'dokumen RPM';
    }

    parts.push({ text: `Ekstrak SEMUA soal dari ${sourceDesc} di atas menjadi bank soal.

ATURAN:
- Jika sumbernya dokumen RPM: ambil soal dari bagian Lampiran Asesmen. PRIORITASKAN Asesmen Sumatif (soal pilihan ganda + uraian beserta KUNCI JAWABAN-nya). Abaikan rubrik dan tabel kunci sebagai soal.
- Untuk soal pilihan ganda: ambil huruf kunci dari bagian KUNCI JAWABAN. Isi "options" dengan daftar opsi lengkap (contoh: "A. Fotosintesis").
- Untuk soal uraian: ringkas kunci jawabannya menjadi 1-2 kalimat pada field "answer", options dikosongkan [].
- Benar/salah dan isian singkat dianggap type "pg".
- Nomori ulang berurutan mulai dari 1 sesuai urutan asli soal.
- question cukup teks soalnya saja (tanpa opsi).

Balas HANYA JSON valid tanpa teks lain tanpa markdown, dengan format persis:
{"questions":[{"number":1,"type":"pg","question":"teks soal","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A"},{"number":2,"type":"essay","question":"teks soal","options":[],"answer":"kunci singkat"}]}

type hanya boleh "pg" atau "essay".` });

    const raw = await callAI(ai, parts);
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Format respons AI tidak valid');
    const parsed = JSON.parse(m[0]);
    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('Tidak ada soal terdeteksi dari sumber tersebut.');
    }
    const questions = parsed.questions.map((q: any, i: number) => ({
      number: i + 1,
      type: q.type === 'essay' ? 'essay' : 'pg',
      question: String(q.question || `Soal ${i + 1}`).slice(0, 500),
      options: Array.isArray(q.options) ? q.options.slice(0, 6).map((o: any) => String(o)) : [],
      answer: String(q.answer || '').slice(0, 300),
    }));
    res.json({ questions });
  } catch (error: any) {
    console.error('Extract Questions Error:', error);
    res.status(500).json({ error: 'Gagal mengekstrak soal: ' + (error.message || '') });
  }
}
