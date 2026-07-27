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
      'Anda adalah asisten guru yang menyiapkan visual untuk kegiatan pembelajaran.',
      'ANALISIS RPM ini dan buat alat bantu visual UNTUK SETIAP AKTIVITAS DI KEGIATAN AWAL DAN KEGIATAN INTI SAJA.',
      'LEWATI Kegiatan Penutup dan aktivitas ice breaking/salam/doa/absensi.',
      '',
      'UNTUK SETIAP AKTIVITAS, analisis kalimat aktivitasnya dan generatesikan KATA KUNCI pencarian yang SPESIFIK berdasarkan isi aktivitas tersebut.',
      '',
      'CARA MENETENTUKAN KATA KUNCI:',
      '- Ambil kata benda/nama kegiatan utama dari deskripsi aktivitas',
      '- Tambahkan konteks lokasi/topik jika disebutkan secara spesifik',
      '- Contoh kalasan: "guru menampilkan proses pengunjung mengantri ke tiket LRT" -> keyword: "proses pengunjung tiket LRT Palembang"',
      '- Contoh: "guru memperlihatkan gambar aneka pempek Palembang" -> keyword: "gambar aneka pempek Palembang"',
      '',
      'OUTPUT format HTML (TANPA markdown code block, LANGSUNG HTML):',
      '<div class="aid-item">',
      '  <div class="aid-header">',
      '    <span class="aid-label">[Jenis: Kegiatan Awal / Kegiatan Inti]</span>',
      '    <span class="aid-meeting">Pertemuan [N]</span>',
      '  </div>',
      '  <div class="aid-card">',
      '    <p class="aid-title">[Nama Aktivitas]</p>',
      '    <p class="aid-visual-script"><strong>Saran Visual Guru:</strong> [ deskripsi APA yg harus ditampilkan guru: gambar, video, atau benda nyata]</p>',
      '    <p class="aid-detail"><strong>Kata Kunci Pencarian:</strong></p>',
      '    <p class="aid-keywords">• Google: "[kata kunci spesifik]"</p>',
      '    <p class="aid-keywords">• YouTube: "[kata kunci spesifik]"</p>',
      '    <p class="aid-keywords">• Bing Image Creator (bebas): "[deskripsi detail dalam Bahasa Inggris, gaya ilustrasi]"</p>',
      '    <p class="aid-bing-prompt"><strong>Prompt AI Gambar (Bing/DALL-E):</strong> "[deskripsi visual dalam Bahasa Inggris, simple, illustration style]"</p>',
      '  </div>',
      '  <div class="aid-links">',
      '    <a class="aid-link aid-google" href="https://www.google.com/search?tbm=isch&q=[keyword+spesifik]" target="_blank">Cari Gambar Google</a>',
      '    <a class="aid-link aid-youtube" href="https://www.youtube.com/results?search_query=[keyword+spesifik]" target="_blank">Cari Video YouTube</a>',
      '  </div>',
      '</div>',
      '',
      'ATURAN:',
      '- Hanya untuk Kegiatan Awal (A) dan Kegiatan Inti (B)',
      '- LEWATI: salam/ice breaking, doa, absensi, kegiatan penutup',
      '- LEWATI aktivitas yang cuma "siswa membaca" tanpa ada visual',
      '- Kata kunci HARUS SPESIFIK dan dalam Bahasa Indonesia (kecuali prompt AI gambar yg pakai English)',
      '- Gunakan konteks dari RPM (sekolah di Palembang, mapel Informatika, dll) untuk membuat keyword lebih relevan',
      '- Jika aktivitas menyebutkan benda/langkah spesifik (contoh: "antrian tiket", "membuat pempek", "proses fotosintesis") -> fokus keyword pada objek/langkah tersebut',
      '- Output LANGSUNG HTML, tanpa teks tambahan diluar template',
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