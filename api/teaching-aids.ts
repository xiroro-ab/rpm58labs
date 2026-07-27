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

    const { html, topic } = body;
    if (!html) {
      return res.status(400).json({ error: 'HTML RPM diperlukan' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = [
      'Anda membantu guru menyiapkan DIAGRAM VISUAL untuk kegiatan pembelajaran.',
      'Buat diagram HANYA untuk Kegiatan Awal dan Kegiatan Inti. LEWATI Penutup, ice breaking, doa, absensi.',
      '',
      'UNTUK SETIAP AKTIVITAS, buat:',
      '1. SVG diagram/ilustrasi sederhana (flowchart, mind map, atau diagram relasi)',
      '2. Saran visual guru (teks)',
      '3. Link Google Images + YouTube untuk referensi tambahan',
      '',
      'PANDUAN SVG:',
      '- viewBox="0 0 600 300", background putih',
      '- Gunakan: <rect>, <circle>, <line>, <text>, <path>',
      '- Warna: #1a4185 (biru tua judul), #eab308 (emas aksen), #10b981 (hijau), #ef4444 (merah), #f3f4f6 (abu bg)',
      '- Teks gunakan font-family="Arial, sans-serif", font-size="14" atau "16"',
      '- Judul di bagian atas dengan font-size="18" font-weight="bold" fill="#1a4185"',
      '- Buat diagram yang logis dan sesuai konteks aktivitas',
      '',
      'TEMPLATE EXACT:',
      '<div class="aid-item">',
      '  <div class="aid-header">',
      '    <span class="aid-label">[Kegiatan Awal / Inti]</span>',
      '    <span class="aid-meeting">Pertemuan [n]</span>',
      '  </div>',
      '  <div class="aid-svg-wrapper">',
      '    <svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg">',
      '      ... SVG DIAGRAM ...',
      '    </svg>',
      '  </div>',
      '  <div class="aid-card">',
      '    <p class="aid-title">[nama aktivitas]</p>',
      '    <p class="aid-visual-script"><strong>Saran Visual Guru:</strong> [deskripsi]</p>',
      '    <p class="aid-detail"><strong>Referensi tambahan:</strong></p>',
      '    <p class="aid-keywords"> <a href="https://www.google.com/search?tbm=isch&q=[keyword]" target="_blank">Cari Gambar Google</a></p>',
      '    <p class="aid-keywords"> <a href="https://www.youtube.com/results?search_query=[keyword]" target="_blank">Cari Video YouTube</a></p>',
      '  </div>',
      '</div>',
      '',
      'CONTOH: aktivitas "guru menampilkan proses antrian tiket LRT" -> buat diagram alur:',
      'svg: kotak "Datang ke Stasiun" panah kotak "Cari Mesin Tiket" panah kotak "Pilih Tujuan" panah kotak "Bayar" panah kotak "Ambil Tiket" panah kotak "Masuk Peron"',
      '',
      'PENTING: SVG HARUS valid XML, jangan gunakan markdown code block. Output LANGSUNG HTML.',
      '',
      'TOPIK: ' + topic,
      '',
      'RPM:',
      html,
    ].join('\n');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache, no-transform');

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    for await (const chunk of responseStream) {
      if (chunk.text) res.write(chunk.text);
    }
    res.end();
  } catch (error) {
    console.error('Teaching Aids Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal membuat alat bantu visual' });
    else res.end();
  }
}