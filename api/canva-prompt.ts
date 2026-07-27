import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method Not Allowed' }); }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) {} }

    const { html, topic } = body;
    if (!html) return res.status(400).json({ error: 'HTML RPM diperlukan' });
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi' });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = [
      'Anda adalah asisten yang membuat PROMPT untuk Canva AI Code (canva.com/ai/code).',
      'Canva AI Code adalah fitur AI yang bisa membuat desain presentasi dari deskripsi teks.',
      '',
      'Tugas Anda: baca RPM di bawah, lalu buat SATU PROMPT BAHASA INGGRIS yang akan digunakan di Canva AI Code untuk membuat presentasi pembelajaran.',
      '',
      'PROMPT HARUS:',
      '- Dalam Bahasa Inggris',
      '- Mendeskripsikan SETIAP KEGIATAN (Awal + Inti + Penutup) secara detail',
      '- Menyebutkan judul slide, konten teks, dan gambar/visual yang dibutuhkan per slide',
      '- Untuk aktivitas "guru menayangkan video" -> minta Canva menampilkan ikon/placeholder video',
      '- Untuk aktivitas "guru menampilkan gambar" -> minta Canva menampilkan ilustrasi/foto relevant',
      '- Format seperti "Slide 1: Title ... Content ... Image suggestion ..."',
      '- Minimal 200 kata, detail, sehingga Canva bisa membuat desain yang lengkap',
      '',
      'TOPIK PEMBELAJARAN: ' + topic,
      '',
      'RPM:',
      html,
    ].join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    const canvaPrompt = (response.text || '').trim() || '[AI gagal membuat prompt]';

    res.setHeader('Content-Type', 'application/json');
    res.json({ canvaPrompt });
  } catch (error: any) {
    console.error('Canva Prompt Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal: ' + (error.message || '') });
  }
}