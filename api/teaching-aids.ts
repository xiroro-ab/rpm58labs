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
      'Anda adalah asisten guru yang membantu mencari referensi visual untuk kegiatan pembelajaran.',
      'ANALISIS RPM berikut dan buat alat bantu visual HANYA untuk KEGIATAN AWAL dan KEGIATAN INTI.',
      'LEWATI Kegiatan Penutup (tidak perlu dibuatkan alat bantu).',
      '',
      'UNTUK SETIAP KEGIATAN, analisis teks aktivitasnya dan tentukan KATA KUNCI pencarian yang TEPAT berdasarkan panduan berikut:',
      '',
      'PANDUAN KATA KUNCI BERDASARKAN JENIS AKTIVITAS:',
      '',
      'A. Jika aktivitas mengandung: "guru menayangkan/menampilkan/memperlihatkan VIDEO"',
      '   → Kata kunci Google Images: "ilustrasi [topik]", "gambar [topik]"',
      '   → Kata kunci YouTube: "video pembelajaran [topik]", "animasi [topik]"',
      '   → Saran Visual: "Guru dapat menampilkan video pembelajaran tentang [topik] yang relevan"',
      '',
      'B. Jika aktivitas mengandung: "guru memperlihatkan/menunjukkan GAMBAR/FOTO"',
      '   → Kata kunci Google Images: "gambar [topik]", "foto [topik]"',
      '   → Kata kunci YouTube: "[topik] penjelasan"',
      '   → Saran Visual: "Siapkan gambar/foto tentang [topik] untuk diamati siswa"',
      '',
      'C. Jika aktivitas mengandung: "guru menjelaskan/menerangkan/menyampaikan"',
      '   → Kata kunci Google Images: "diagram [topik]", "infografis [topik]"',
      '   → Kata kunci YouTube: "materi [topik]", "penjelasan [topik]"',
      '   → Saran Visual: "Gunakan diagram atau infografis untuk menjelaskan [topik]"',
      '',
      'D. Jika aktivitas mengandung: "siswa mengamati/melihat/mengidentifikasi/mencermati"',
      '   → Kata kunci Google Images: "contoh [topik]", "gambar [topik]"',
      '   → Kata kunci YouTube: "contoh [topik]"',
      '   → Saran Visual: "Sediakan contoh visual [topik] yang bisa diamati siswa"',
      '',
      'E. Jika aktivitas mengandung: "siswa berdiskusi/bertanya/menjawab/memikirkan"',
      '   → Kata kunci Google Images: "pertanyaan pemantik [topik]", "gambar [topik]"',
      '   → Kata kunci YouTube: "pertanyaan pemantik [topik]"',
      '   → Saran Visual: "Gunakan gambar menarik sebagai pertanyaan pemantik diskusi"',
      '',
      'F. Jika aktivitas mengandung: "siswa melakukan/mempraktikkan/mencoba/mendemokan"',
      '   → Kata kunci Google Images: "langkah [topik]", "cara [topik]"',
      '   → Kata kunci YouTube: "tutorial [topik]", "praktik [topik]"',
      '   → Saran Visual: "Tunjukkan langkah-langkah [topik] secara visual"',
      '',
      'G. Jika aktivitas mengandung: "siswa mempresentasikan/menyampaikan hasil"',
      '   → Kata kunci Google Images: "contoh presentasi [topik]"',
      '   → Kata kunci YouTube: "contoh presentasi [topik]"',
      '   → Saran Visual: "Siapkan format presentasi untuk siswa"',
      '',
      'H. Jika aktivitas mengandung hal spesifik seperti: "antrian tiket LRT", "pembuatan pempek", dll',
      '   → Kata kunci Google Images: gunakan kata kunci SPESIFIK dalam Bahasa Indonesia',
      '   → Kata kunci YouTube: gunakan kata kunci SPESIFIK dalam Bahasa Indonesia',
      '   → Saran Visual: deskripsikan visual yang sesuai dengan aktivitas spesifik tersebut',
      '',
      'I. Jika aktivitas adalah ICE BREAKING/salam/doa/absensi (kegiatan rutin)',
      '   → LEWATI, tidak perlu dibuatkan alat bantu',
      '',
      '',
      'OUTPUT dalam format HTML berikut (TANPA markdown code block):',
      '<div class="aid-item">',
      '  <div class="aid-header">',
      '    <span class="aid-label">[Jenis: Kegiatan Awal / Kegiatan Inti]</span>',
      '    <span class="aid-meeting">Pertemuan [N]</span>',
      '  </div>',
      '  <div class="aid-card">',
      '    <p class="aid-title">[Nama Aktivitas]</p>',
      '    <p class="aid-visual-script"><strong>Saran Visual Guru:</strong> [Deskripsi APA yang harus ditampilkan/dilakukan guru]</p>',
      '  </div>',
      '  <div class="aid-links">',
      '    <a class="aid-link aid-google" href="https://www.google.com/search?tbm=isch&q=[kata+kunci+google]" target="_blank">Cari Gambar Google</a>',
      '    <a class="aid-link aid-youtube" href="https://www.youtube.com/results?search_query=[kata+kunci+youtube]" target="_blank">Cari Video YouTube</a>',
      '  </div>',
      '</div>',
      '',
      'PENTING:',
      '- HANYA buat untuk Kegiatan Awal dan Kegiatan Inti',
      '- LEWATI ice breaking, salam, doa, absensi',
      '- Kata kunci pencarian harus SPESIFIK dan dalam Bahasa Indonesia (kecuali istilah teknis)',
      '- Jika aktivitas menyebutkan hal spesifik (contoh: "pempek Palembang", "LRT Palembang"), gunakan itu sebagai kata kunci utama',
      '- Jangan gunakan markdown code block',
      '- OUTPUT LANGSUNG HTML, tanpa teks tambahan',
      '',
      'TOPIK PEMBELAJARAN: ' + topic,
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