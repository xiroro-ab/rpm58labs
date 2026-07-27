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
    const prompt = 'Anda adalah asisten pembuat alat bantu visual PROFESIONAL untuk guru. Analisis RPM berikut dan buat alat bantu visual untuk SETIAP aktivitas pembelajaran.\n\n'
      + 'Untuk SETIAP aktivitas, buat dalam format HTML berikut:\n\n'
      + '<div class="aid-item">\n'
      + '  <div class="aid-header">\n'
      + '    <span class="aid-label">[Jenis Aktivitas: Kegiatan Awal/Inti/Penutup]</span>\n'
      + '    <span class="aid-meeting">Pertemuan [N]</span>\n'
      + '  </div>\n'
      + '  <div class="aid-svg-wrapper">\n'
      + '    <!-- SVG WAJIB: Diagram/ilustrasi yang INFORMATIF dan ESTETIK. viewBox="0 0 800 450".\n'
      + '         Gunakan: background putih/abu soft, teks hitam/biru tua (#1a4185),\n'
      + '         aksen warna: emas (#eab308), hijau (#10b981), merah (#ef4444), biru (#3b82f6).\n'
      + '         Tambahkan: judul, label, panah, ikon sederhana, dan elemen visual pendukung.\n'
      + '         Pastikan SVG proporsional, rapi, dan terbaca. -->\n'
      + '    <svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">\n'
      + '      ... SVG KUSTOM UNTUK AKTIVITAS INI ...\n'
      + '    </svg>\n'
      + '  </div>\n'
      + '  <div class="aid-card">\n'
      + '    <p class="aid-title">[Judul Aktivitas]</p>\n'
      + '    <p class="aid-desc">[Penjelasan aktivitas dan bagaimana visual di atas membantu proses belajar]</p>\n'
      + '    <p class="aid-prompt"><strong>Prompt AI:</strong> [Prompt detail untuk generate gambar di DALL-E/Midjourney/Stable Diffusion - dalam Bahasa Inggris, deskriptif]</p>\n'
      + '  </div>\n'
      + '  <div class="aid-links">\n'
      + '    <a class="aid-link aid-google" href="https://www.google.com/search?tbm=isch&q=[kata+kunci+gambar]" target="_blank">🖼 Cari Gambar</a>\n'
      + '    <a class="aid-link aid-youtube" href="https://www.youtube.com/results?search_query=[kata+kunci+video]" target="_blank">▶ Cari Video</a>\n'
      + '    <a class="aid-link aid-unsplash" href="https://unsplash.com/s/photos/[kata+kunci]" target="_blank">📸 Unsplash</a>\n'
      + '    <a class="aid-link aid-prompt-copy" href="#" onclick="navigator.clipboard.writeText(\'[Prompt AI untuk generate gambar]\');alert(\'Prompt disalin!\')">📋 Salin Prompt AI</a>\n'
      + '  </div>\n'
      + '</div>\n\n'
      + 'PENTING:\n'
      + '- Gunakan SVG MURNI (bukan gambar eksternal)\n'
      + '- SVG harus proporsional, rapi, dengan teks yang terbaca\n'
+ '- Jangan gunakan markdown code block\n'
+ '- OUTPUT LANGSUNG HTML, tanpa teks tambahan\n'
      + - Buat SVG yang benar-benar KREATIF dan SESUAI dengan konteks aktivitas\n\n'
      + 'TOPIK PEMBELAJARAN: ' + topic + '\n\n'
      + 'RPM:\n' + html;

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