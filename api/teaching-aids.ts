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
      'Anda membantu guru membuat DIAGRAM VISUAL KONTEKSTUAL untuk kegiatan pembelajaran.',
      'Buat HANYA untuk Kegiatan Awal dan Inti. LEWATI Penutup, ice breaking, doa, absensi.',
      '',
      'PILIH JENIS DIAGRAM yang PALING SESUAI dengan aktivitas:', 
      '',
      '1. DIAGRAM ALUR / FLOWCHART — untuk aktivitas berisi langkah/proses/urutan',
      '   Contoh: "proses antrian tiket", "langkah pembuatan", "tahapan fotosintesis"',
      '   Bentuk: kotak berisi teks, dihubungkan panah vertikal/horizontal',
      '',
      '2. DIAGRAM RELASI / MIND MAP — untuk aktivitas berisi hubungan antar konsep',
      '   Contoh: "hubungan himpunan pempek dan bahan", "jenis-jenis usaha", "klasifikasi makhluk hidup"',
      '   Bentuk: lingkaran/elips pusat, cabang ke konsep lain',
      '',
      '3. DIAGRAM PERBANDINGAN — untuk aktivitas membandingkan 2 hal atau lebih',  
      '   Contoh: "perbedaan Luring dan Daring", "kelebihan kekurangan"',
      '   Bentuk: dua kolom dengan tabel perbandingan',
      '',
      '4. DIAGRAM KLASIFIKASI — untuk aktivitas mengelompokkan',
      '   Contoh: "jenis pempek", "kategori hewan", "macam-macam profesi"',
      '   Bentuk: hirarki pohon dari atas ke bawah',
      '',
      '5. GARIS WAKTU / TIMELINE — untuk aktivitas berisi urutan waktu/sejarah',
      '   Contoh: "perkembangan teknologi", "sejarah kerajaan"',
      '   Bentuk: garis horizontal dengan titik-titik peristiwa',
      '',
      '6. ILUSTRASI ADEGAN SEDERHANA — untuk aktivitas menggambarkan situasi nyata',
      '   Contoh: "suasana pasar", "kegiatan gotong royong", "situasi di stasiun"',
      '   Bentuk: gambar sederhana orang/tempat/benda dengan label teks',
      '',
      '7. DIAGRAM VENN — untuk aktivitas himpunan/irisan',
      '   Contoh: "himpunan bilangan", "persamaan perbedaan"',
      '   Bentuk: dua lingkaran beririsan dengan label',
      '',
      '8. TABEL INFORMASI — untuk aktivitas menyajikan data/informasi terstruktur',
      '   Contoh: "jadwal pelajaran", "daftar harga", "syarat ketentuan"',
      '   Bentuk: tabel dengan baris dan kolom',
      '',
      'TEMPLATE OUTPUT:',
      '<div class="aid-item">',
      '  <div class="aid-header">',
      '    <span class="aid-label">[Kegiatan Awal / Inti]</span>',
      '    <span class="aid-meeting">Pertemuan [n]</span>',
      '  </div>',
      '  <div class="aid-svg-wrapper">',
      '    <svg viewBox="0 0 650 350" xmlns="http://www.w3.org/2000/svg">',
      '      ... SVG DIAGRAM SESUAI JENIS YANG DIPILIH ...',
      '    </svg>',
      '  </div>',
      '  <div class="aid-card">',
      '    <p class="aid-title">[nama aktivitas]</p>',
      '    <p class="aid-visual-script">Saran: [cara menggunakan diagram ini di kelas]</p>',
      '    <p class="aid-keywords"><a href="https://www.google.com/search?tbm=isch&q=[keyword]" target="_blank">Cari contoh gambar Google</a></p>',
      '    <p class="aid-keywords"><a href="https://www.youtube.com/results?search_query=[keyword]" target="_blank">Cari video pembelajaran YouTube</a></p>',
      '  </div>',
      '</div>',
      '',
      'PANDUAN SVG:',
      '- viewBox="0 0 650 350", background putih #ffffff',
      '- Warna: #1a4185 (judul/header), #eab308 (aksen emas), #10b981 (hijau), #ef4444 (merah), #3b82f6 (biru), #f3f4f6 (abu bg), #1e293b (teks)',
      '- font-family="Arial, sans-serif", font-size="14" untuk teks biasa, "18" untuk judul',
      '- JUDUL diagram di bagian atas: <text font-size="20" font-weight="bold" fill="#1a4185">[judul diagram]</text>',
      '- Buat SVG yang rapi, proporsional, dan INFORMATIF',
      '- Gunakan <rect rx="8" untuk kotak dengan sudut membulat, <circle>, <line>, <path> untuk panah',
      '',
      'PENTING:',
      '- Pilih JENIS DIAGRAM yang paling sesuai dengan aktivitas (jangan paksa flowchart)',
      '- Konten diagram harus SPESIFIK sesuai aktivitas di RPM, bukan template kosong',
      '- Gunakan konteks lokal (misal: Palembang, pempek, LRT) dalam konten diagram',
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