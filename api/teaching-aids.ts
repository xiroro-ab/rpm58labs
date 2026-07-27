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
      'Anda membantu guru menyiapkan referensi visual untuk kegiatan pembelajaran.',
      '',
      'Buat alat bantu visual HANYA untuk Kegiatan Awal dan Kegiatan Inti. LEWATI Kegiatan Penutup, ice breaking, salam, doa, absensi.',
      '',
      'Untuk setiap aktivitas, tentukan kata kunci dan saran visual. Gunakan TEMPLATE EXACT berikut (ganti [...] dengan isi):',
      '',
      '<!-- START -->',
      '<div class="aid-item">',
      '  <div class="aid-header">',
      '    <span class="aid-label">[Jenis: Kegiatan Awal atau Kegiatan Inti]</span>',
      '    <span class="aid-meeting">Pertemuan [nomor]</span>',
      '  </div>',
      '  <div class="aid-card">',
      '    <p class="aid-title">[judul aktivitas]</p>',
      '    <p class="aid-visual-script"><strong>Saran Visual Guru:</strong> [deskripsi apa yang harus dilakukan/ditampilkan guru]</p>',
      '    <p class="aid-detail"><strong>Cari referensi visual:</strong></p>',
      '    <p class="aid-keywords"> Gambar Google: <a href="https://www.google.com/search?tbm=isch&q=[kata+kunci+bahasa+indonesia]" target="_blank">[kata kunci bahasa indonesia]</a></p>',
      '    <p class="aid-keywords"> Video YouTube: <a href="https://www.youtube.com/results?search_query=[kata+kunci+bahasa+indonesia]" target="_blank">[kata kunci bahasa indonesia]</a></p>',
      '    <p class="aid-keywords"> Buat Gambar AI (Bing gratis): <a href="https://www.bing.com/images/create?q=[deskripsi+dalam+bahasa+inggris]" target="_blank">Buka Bing Image Creator</a></p>',
      '  </div>',
      '</div>',
      '<!-- END -->',
      '',
      'CONTOH:',
      'Aktivitas: "guru menampilkan proses pengunjung mengantri ke tiket LRT"',
      'Hasil:',
      '<div class="aid-item">',
      '  <div class="aid-header"><span class="aid-label">Kegiatan Inti</span><span class="aid-meeting">Pertemuan 1</span></div>',
      '  <div class="aid-card">',
      '    <p class="aid-title">Menganati Proses Antrian Tiket LRT</p>',
      '    <p class="aid-visual-script"><strong>Saran Visual Guru:</strong> Tampilkan foto stasiun LRT dan ilustrasi sederhana alur antrian di papan tulis. Minta siswa mengamati langkah-langkahnya.</p>',
      '    <p class="aid-detail"><strong>Cari referensi visual:</strong></p>',
      '    <p class="aid-keywords"> Gambar Google: <a href="https://www.google.com/search?tbm=isch&q=stasiun+LRT+Palembang+antrian" target="_blank">stasiun LRT Palembang antrian</a></p>',
      '    <p class="aid-keywords"> Video YouTube: <a href="https://www.youtube.com/results?search_query=cara+naik+LRT+Palembang" target="_blank">cara naik LRT Palembang</a></p>',
      '    <p class="aid-keywords"> Buat Gambar AI (Bing gratis): <a href="https://www.bing.com/images/create?q=simple+illustration+people+queuing+ticket+machine+train+station+Palembang+educational+style" target="_blank">Buka Bing Image Creator</a></p>',
      '  </div>',
      '</div>',
      '',
      'CONTOH 2:',
      'Aktivitas: "guru memperlihatkan gambar aneka pempek Palembang"',
      'Hasil:',
      '<div class="aid-item">',
      '  <div class="aid-header"><span class="aid-label">Kegiatan Awal</span><span class="aid-meeting">Pertemuan 1</span></div>',
      '  <div class="aid-card">',
      '    <p class="aid-title">Mengamati Aneka Pempek Palembang</p>',
      '    <p class="aid-visual-script"><strong>Saran Visual Guru:</strong> Siapkan gambar/foto aneka jenis pempek (kapal selam, lenjer, adaan, keriting). Minta siswa mengidentifikasi perbedaan bentuk dan bahan.</p>',
      '    <p class="aid-detail"><strong>Cari referensi visual:</strong></p>',
      '    <p class="aid-keywords"> Gambar Google: <a href="https://www.google.com/search?tbm=isch&q=aneka+pempek+Palembang+kapal+selam+lenjer" target="_blank">aneka pempek Palembang kapal selam lenjer</a></p>',
      '    <p class="aid-keywords"> Video YouTube: <a href="https://www.youtube.com/results?search_query=jenis+jenis+pempek+Palembang" target="_blank">jenis jenis pempek Palembang</a></p>',
      '    <p class="aid-keywords"> Buat Gambar AI (Bing gratis): <a href="https://www.bing.com/images/create?q=various+Indonesian+pempek+fish+cakes+Palembang+traditional+food+on+plate+realistic+photo" target="_blank">Buka Bing Image Creator</a></p>',
      '  </div>',
      '</div>',
      '',
      'ATURAN PENTING:',
      '- GANTI [...] dengan konten aktual dari RPM',
      '- Kata kunci Google dan YouTube dalam Bahasa Indonesia, SPESIFIK sesuai aktivitas',
      '- Deskripsi Bing AI dalam Bahasa Inggris, format URL (spasi diganti +)',
      '- OUTPUT LANGSUNG HTML, tanpa markdown code block, tanpa teks tambahan',
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