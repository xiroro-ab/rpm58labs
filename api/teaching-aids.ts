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
      'Anda adalah asisten pembuat alat bantu visual PROFESIONAL untuk guru. Analisis RPM berikut dan buat alat bantu visual untuk SETIAP aktivitas pembelajaran.',
      '',
      'Untuk SETIAP aktivitas, buat dalam format HTML berikut:',
      '',
      '<div class="aid-item">',
      '  <div class="aid-header">',
      '    <span class="aid-label">[Jenis Aktivitas: Kegiatan Awal/Inti/Penutup]</span>',
      '    <span class="aid-meeting">Pertemuan [N]</span>',
      '  </div>',
      '  <div class="aid-svg-wrapper">',
      '    <svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">',
      '      ... SVG KUSTOM UNTUK AKTIVITAS INI ...',
      '    </svg>',
      '  </div>',
      '  <div class="aid-card">',
      '    <p class="aid-title">[Judul Aktivitas]</p>',
      '    <p class="aid-desc">[Penjelasan aktivitas dan bagaimana visual di atas membantu]</p>',
      '    <p class="aid-prompt"><strong>Prompt AI:</strong> [Prompt DALL-E/Midjourney dlm Bahasa Inggris, deskriptif]</p>',
      '  </div>',
      '  <div class="aid-links">',
      '    <a class="aid-link aid-google" href="https://www.google.com/search?tbm=isch&q=[kata+kunci]" target="_blank">Cari Gambar</a>',
      '    <a class="aid-link aid-youtube" href="https://www.youtube.com/results?search_query=[kata+kunci]" target="_blank">Cari Video</a>',
      '    <a class="aid-link aid-unsplash" href="https://unsplash.com/s/photos/[kata+kunci]" target="_blank">Unsplash</a>',
      '  </div>',
      '</div>',
      '',
      'PENTING:',
      '- Gunakan SVG MURNI dengan viewBox="0 0 800 450"',
      '- SVG: background putih/abu, teks hitam/biru tua (#1a4185), aksen emas (#eab308), hijau (#10b981), merah (#ef4444)',
      '- SVG harus proporsional, rapi, dengan teks terbaca, judul, label, panah, ikon',
      '- Jangan gunakan markdown code block',
      '- OUTPUT LANGSUNG HTML, tanpa teks tambahan',
      '- Buat SVG KREATIF dan SESUAI konteks aktivitas',
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