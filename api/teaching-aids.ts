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
      'Anda membantu guru membuat DIAGRAM VISUAL untuk kegiatan pembelajaran.',
      'Buat HANYA untuk Kegiatan Awal dan Inti. LEWATI Penutup, ice breaking, doa, absensi.',
      '',
      'PILIH JENIS DIAGRAM yang PALING SESUAI:',
      '1. DIAGRAM ALUR — untuk langkah/proses/urutan (contoh: antrian tiket, cara membuat)',
      '2. DIAGRAM RELASI / MIND MAP — untuk hubungan konsep (contoh: himpunan dan bahan)',
      '3. DIAGRAM PERBANDINGAN — untuk membandingkan 2 hal (contoh: luring vs daring)',
      '4. DIAGRAM KLASIFIKASI — untuk mengelompokkan (contoh: jenis pempek)',
      '5. GARIS WAKTU — untuk urutan waktu (contoh: sejarah, perkembangan)',
      '6. ILUSTRASI ADEGAN — untuk situasi nyata (contoh: suasana stasiun, pasar)',
      '7. DIAGRAM VENN — untuk himpunan/irisan (contoh: persamaan perbedaan)',
      '8. TABEL — untuk data/informasi terstruktur',
      '',
      '=== ATURAN PENTING: EKSTRAK KONTEN SPESIFIK ===',
      'Baca deskripsi aktivitas di RPM dengan SEKSAMA. Ambil kata benda, tempat, objek, dan langkah SPESIFIK yang disebutkan.',
      'Masukkan konten SPESIFIK tersebut ke dalam SVG diagram. JANGAN gunakan teks generik seperti "Langkah 1" atau "Konsep A".',
      '',
      'CONTOH SPESIFIK (bukan generik):',
      '- Aktivitas: "guru menampilkan proses pengunjung mengantri ke tiket LRT Palembang"',
      '  Diagram Alur dengan teks: "Datang ke Stasiun LRT" → "Cari Mesin Tiket Otomatis" → "Pilih Tujuan LRT" → "Bayar di Mesin" → "Ambil Tiket" → "Tap Tiket di Gate" → "Masuk Peron"',
      '',
      '- Aktivitas: "guru memperlihatkan gambar aneka pempek Palembang dan bahan utamanya"',
      '  Diagram Klasifikasi dengan teks: "Pempek Palembang" cabang ke "Kapal Selam (isi telur)", "Lenjer (panjang)", "Adaan (bulat)", "Keriting" dan masing-masing dengan bahan utama: "Ikan Gabus", "Tapioka", "Telur", "Bawang Putih"',
      '',
      '- Aktivitas: "hubungan himpunan pempek dengan himpunan bahan utama"',
      '  Diagram Relasi dengan teks: himpunan A = {Kapal Selam, Lenjer, Adaan} dihubungkan ke himpunan B = {Ikan Gabus, Tapioka, Telur}',
      '',
      'TEMPLATE OUTPUT:',
      '<div class="aid-item">',
      '  <div class="aid-header">',
      '    <span class="aid-label">[Kegiatan Awal / Inti]</span>',
      '    <span class="aid-meeting">Pertemuan [n]</span>',
      '  </div>',
      '  <div class="aid-svg-wrapper">',
      '    <svg viewBox="0 0 650 350" xmlns="http://www.w3.org/2000/svg">',
      '      ... SVG dengan konten SPESIFIK dari aktivitas ...',
      '    </svg>',
      '  </div>',
      '  <div class="aid-card">',
      '    <p class="aid-title">[judul aktivitas SPESIFIK]</p>',
      '    <p class="aid-visual-script">Saran: [cara menggunakan diagram ini]</p>',
      '    <p class="aid-keywords"><a href="https://www.google.com/search?tbm=isch&q=[keyword]" target="_blank">Cari contoh gambar Google</a></p>',
      '    <p class="aid-keywords"><a href="https://www.youtube.com/results?search_query=[keyword]" target="_blank">Cari video YouTube</a></p>',
      '  </div>',
      '</div>',
      '',
      'PANDUAN SVG:',
      '- viewBox="0 0 650 350", background putih, font-family="Arial"',
      '- Warna: #1a4185 (judul), #eab308 (aksen), #10b981 (hijau), #ef4444 (merah), #3b82f6 (biru), #f3f4f6 (bg), #1e293b (teks)',
      '- JUDUL diagram di <text font-size="18" font-weight="bold" fill="#1a4185" x="325" y="30" text-anchor="middle">',
      '- Gunakan <rect rx="8">, <circle>, <line stroke-dasharray>, <path marker-end> untuk panah',
      '- TEKS di dalam diagram HARUS spesifik, minimal 3-7 entitas berbeda',
      '',
      'PENTING:',
      '- Output LANGSUNG HTML, tanpa markdown code block, tanpa teks tambahan',
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