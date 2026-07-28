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
      'Anda adalah web developer yang membuat WEBSITE PEMBELAJARAN INTERAKTIF untuk SISWA berdasarkan Rencana Pembelajaran Mendalam (RPM) guru.',
      '',
      'ATURAN UTAMA:',
      '- Website ditujukan untuk SISWA, bukan guru.',
      '- JANGAN tampilkan kunci jawaban, instruksi guru, atau "asesmen sumatif" yang berisi soal PG dengan kunci.',
      '- Ambil konten PENTING dari RPM: Topik, Tujuan Pembelajaran, Kegiatan per Pertemuan, Pertanyaan Pemantik.',
      '- JANGAN salin mentah RPM. Buat ulang dengan bahasa yang komunikatif untuk siswa.',
      '',
      'STRUKTUR WEBSITE (urutan WAJIB):',
      '1. HEADER: Judul Mapel, Kelas, Topik',
      '2. INFO: Tujuan Pembelajaran (dari RPM, dibuat ringkas)',
      '3. KEGIATAN: Urut per pertemuan. Tiap pertemuan:',
      '   a. Kegiatan Awal — Tampilkan pertanyaan pemantik INTERAKTIF (siswa bisa klik jawaban) + gambar/ilustrasi relevan',
      '   b. Kegiatan Inti — Langkah kegiatan siswa, tampilkan gambar/diagram langsung, bukan "guru menampilkan"',
      '   c. Kegiatan Penutup — Kesimpulan, refleksi singkat',
      '4. GAME EDUKASI: Minimal 1 game interaktif (tebak kata, drag & drop, kuis, atau puzzle) pakai JavaScript',
      '5. EVALUASI: Soal pilihan ganda interaktif (tanpa kunci jawaban) — siswa bisa cek jawabannya sendiri',
      '',
      'GAYA DESAIN: Neo Brutalism',
      '- Border hitam tebal (4-6px), shadow offset 6px 6px 0 #000',
      '- Warna: putih (#fff), kuning (#FFD700), merah salmon (#FF6B6B), tosca (#4ECDC4), hitam (#000)',
      '- Font bold sans-serif, typography besar',
      '- Responsive mobile-friendly',
      '- Gunakan emoji untuk icon (gak perlu Font Awesome)',
      '',
      'TEKNIS:',
      '- SATU file HTML utuh, inline CSS & JS',
      '- NO external dependencies (gak usah CDN apapun)',
      '- Game pake Vanilla JavaScript murni',
      '- Output LANGSUNG HTML tanpa markdown block',
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

    const websiteHtml = response.text || '';
    res.json({ html: websiteHtml });
  } catch (error: any) {
    console.error('Generate Website Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal: ' + (error.message || '') });
  }
}