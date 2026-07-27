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
    const prompt = 'Anda adalah asisten pembuat alat bantu visual untuk guru. Analisis RPM berikut dan buat alat bantu visual untuk SETIAP aktivitas pembelajaran.\n\n'
      + 'Untuk setiap aktivitas, buat:\n'
      + '1. **SVG Ilustrasi** diagram/ilustrasi yang MENDETAIL, proporsional, estetik. Gunakan SVG murni (bukan gambar luar). Ukuran viewBox="0 0 800 400". Gunakan warna: biru (#1a4185), emas (#eab308), hijau (#10b981), merah (#ef4444), putih, abu2. Tambahkan teks, ikon, panah, dan elemen visual yang relevan.\n'
      + '2. **Link Google** kata kunci pencarian yang tepat\n'
      + '3. **Link YouTube** kata kunci pencarian video yang tepat\n'
      + '4. **Ringkasan Aktivitas** jelaskan aktivitas dan bagaimana visual membantu\n\n'
      + 'TOPIK: ' + topic + '\n\n'
      + 'OUTPUT dalam format HTML berikut (TANPA markdown block, LANGSUNG HTML):\n'
      + '<div class="teaching-aids-container">\n'
      + '  <div class="aid-item">\n'
      + '    <div class="aid-header">\n'
      + '      <span class="aid-label">[Jenis Aktivitas]</span>\n'
      + '      <span class="aid-meeting">Pertemuan [N]</span>\n'
      + '    </div>\n'
      + '    <div class="aid-svg-wrapper">\n'
      + '      <!-- SVG LANGSUNG DI SINI -->\n'
      + '    </div>\n'
      + '    <div class="aid-card">\n'
      + '      <p class="aid-desc">[Ringkasan aktivitas dan bagaimana visual membantu]</p>\n'
      + '    </div>\n'
      + '    <div class="aid-links">\n'
      + '      <a class="aid-link aid-google" href="https://www.google.com/search?q=[kata+kunci]" target="_blank">🔍 Cari Google</a>\n'
      + '      <a class="aid-link aid-youtube" href="https://www.youtube.com/results?search_query=[kata+kunci]" target="_blank">▶️ Cari YouTube</a>\n'
      + '    </div>\n'
      + '  </div>\n'
      + '</div>\n\n'
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