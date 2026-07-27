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
      'Canva AI Code membuat desain presentasi dari deskripsi teks.',
      '',
      'Tugas: baca RPM, buat SATU PROMPT BAHASA INGGRIS untuk Canva AI Code.',
      '',
      'ATURAN PROMPT:',
      '- Bahasa Inggris, minimal 200 kata, detail',
      '- Deskripsikan SETIAP KEGIATAN (Awal + Inti + Penutup) per pertemuan',
      '- Untuk SEMUA aktivitas, minta Canva membuat ILLUSTRASI GAMBAR/DIAGRAM (bukan placeholder video)',
      '- Jika aktivitas menyebut "menayangkan video", abaikan videonya dan minta ilustrasi gambar saja',
      '- Jika aktivitas menyebut "menampilkan gambar", minta ilustrasi yang sesuai',
      '- Jika aktivitas menyebut "diskusi/tanya jawab", minta ilustrasi orang berdiskusi',
      '- Format per slide: "Slide [N]: Title: ... Content: ... Visual: deskripsi gambar yang harus dibuat Canva AI"',
      '- Sebutkan gaya: "clean, professional, educational, colorful, suitable for classroom projection"',
      '',
      'CONTOH FORMAT:',
      'Slide 1: Title: "Apersepsi - Pempek Palembang"',
      'Content: "Guru menunjukkan gambar aneka pempek. Siswa diminta menebak jenis dan bahan."',
      'Visual: "Illustration of various Palembang fishcakes on a plate - kapal selam, lenjer, adaan - colorful food illustration"',
      '',
      'Slide 2: Title: "Kegiatan Inti - Relasi Himpunan"',
      'Content: "Siswa mengelompokkan jenis pempek berdasarkan bahan utamanya dalam diagram relasi."',
      'Visual: "Simple set diagram connecting pempek types to their ingredients with arrows and labels"',
      '',
      'TOPIK: ' + topic,
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