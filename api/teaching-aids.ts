import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method Not Allowed' }); }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) {} }

    const { html, topic } = body;
    if (!html) return res.status(400).json({ error: 'HTML RPM diperlukan' });
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi' });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = [
      'Anda membantu guru menyiapkan referensi visual untuk KEGIATAN AWAL dan INTI. LEWATI Penutup.',
      '',
      'Untuk SETIAP aktivitas, output TEMPLATE EXACT berikut:',
      '<div class="aid-item">',
      '  <div class="aid-header"><span class="aid-label">[Kegiatan Awal/Inti]</span><span class="aid-meeting">Pertemuan [n]</span></div>',
      '  <div class="aid-card">',
      '    <p class="aid-title">[nama aktivitas SPESIFIK dari RPM]</p>',
      '    <p class="aid-visual-script"><strong>Saran Visual Guru:</strong> [deskripsi APA yang harus ditampilkan guru di kelas]</p>',
      '    <p class="aid-detail"><strong>Buat visualnya di sini:</strong></p>',
      '    <p class="aid-keywords"><a href="https://www.canva.com/ai-image-generator/" target="_blank">🎨 Buka Canva AI → paste prompt di bawah → Generate</a></p>',
      '    <p class="aid-prompt"><strong>Prompt Canva:</strong> [Prompt BAHASA INGGRIS deskriptif untuk Canva Magic Media, minimal 20 kata, sebutkan gaya "professional educational illustration, flat design, colorful, classroom presentation"]</p>',
      '    <p class="aid-keywords"><a href="https://www.google.com/search?tbm=isch&q=[keyword+spesifik]" target="_blank">📷 Cari Google Images</a></p>',
      '    <p class="aid-keywords"><a href="https://www.youtube.com/results?search_query=[keyword+spesifik]" target="_blank">▶ Cari YouTube</a></p>',
      '  </div>',
      '</div>',
      '',
      'PENTING:',
      '- Prompt Canva dalam BAHASA INGGRIS, deskriptif, minimal 20 kata',
      '- Sertakan gaya: "educational illustration, flat design, classroom presentation"',
      '- Keyword Google/YouTube dalam BAHASA INDONESIA, SPESIFIK sesuai konteks RPM',
      '- Ekstrak konten SPESIFIK dari RPM (misal: "antrian tiket LRT Palembang", bukan hal generik)',
      '- Output LANGSUNG HTML tanpa markdown',
      '',
      'TOPIK: ' + topic,
      'RPM:', html,
    ].join('\n');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    const output = response.text || '';

    if (!output.trim()) {
      res.write('<div class="aid-error">Maaf, AI tidak dapat menghasilkan visual untuk RPM ini. Coba generate ulang atau periksa konten RPM.</div>');
    } else {
      res.write(output);
    }
    res.end();
  } catch (error: any) {
    console.error('Teaching Aids Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal: ' + (error.message || '') });
    else res.end();
  }
}