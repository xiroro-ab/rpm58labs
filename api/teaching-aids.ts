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
      'Anda adalah asisten guru yang menyiapkan referensi visual UNTUK SETIAP AKTIVITAS DI KEGIATAN AWAL DAN KEGIATAN INTI.',
      'LEWATI Kegiatan Penutup, ice breaking, salam, doa, absensi.',
      '',
      'Untuk SETIAP aktivitas, analisis teks aktivitasnya lalu tentukan:',
      '1. unsplashKeyword: kata kunci Bahasa Inggris untuk mencari gambar di Unsplash',
      '2. googleKeyword: kata kunci Bahasa Indonesia untuk mencari gambar di Google',
      '3. youtubeKeyword: kata kunci Bahasa Indonesia untuk mencari video di YouTube',
      '4. bingPrompt: prompt dalam Bahasa Inggris untuk generate gambar AI (Bing Image Creator)',
      '5. visualScript: deskripsi APA yang harus ditampilkan guru (dalam Bahasa Indonesia)',
      '',
      'PENTING: unsplashKeyword HARUS dalam Bahasa Inggris dan menggunakan kata/frasa FOTOGRAFIS (bukan ilustrasi).',
      'Contoh:',
      '- Aktivitas "antrian tiket LRT" -> unsplashKeyword: "train station ticket queue"',
      '- Aktivitas "gambar pempek Palembang" -> unsplashKeyword: "Indonesian traditional food fishcake"',
      '- Aktivitas "fotosintesis" -> unsplashKeyword: "photosynthesis plant leaves sun"',
      '- Aktivitas "sistem pencernaan" -> unsplashKeyword: "digestive system anatomy"',
      '',
      'OUTPUT HTML (TANPA markdown code block):',
      '<div class="aid-item">',
      '  <div class="aid-header">',
      '    <span class="aid-label">[Jenis Aktivitas]</span>',
      '    <span class="aid-meeting">Pertemuan [N]</span>',
      '  </div>',
      '  <div class="aid-visual-img">',
      '    <!-- UNSplash membutuhkan keyword Bahasa Inggris untuk foto yang relevan -->',
      '    <img src="https://source.unsplash.com/800x400/?unsplashKeyword" alt="unsplashKeyword" loading="lazy" onerror="this.style.display=\'none\'" />',
      '  </div>',
      '  <div class="aid-card">',
      '    <p class="aid-title">[Nama Aktivitas]</p>',
      '    <p class="aid-visual-script"><strong>Saran Visual:</strong> [deskripsi APA yg harus disiapkan guru]</p>',
      '    <p class="aid-detail"><strong>Link & Tools:</strong></p>',
      '    <p class="aid-keywords"> Google Images: <a href="https://www.google.com/search?tbm=isch&q=googleKeyword" target="_blank">googleKeyword</a></p>',
      '    <p class="aid-keywords"> YouTube: <a href="https://www.youtube.com/results?search_query=youtubeKeyword" target="_blank">youtubeKeyword</a></p>',
      '    <p class="aid-keywords"> Bing Image Creator: <a href="https://www.bing.com/images/create?q=bingPrompt" target="_blank">Buat gambar AI dengan Bing (gratis)</a></p>',
      '  </div>',
      '</div>',
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