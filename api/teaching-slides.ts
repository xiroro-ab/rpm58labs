import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) {} }

    const { html, topic } = body;
    if (!html) return res.status(400).json({ error: 'HTML RPM diperlukan' });
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi' });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = [
      'Anda adalah pembuat slide presentasi pembelajaran otomatis. Buat slide interaktif berdasarkan RPM di bawah.',
      '',
      'BUAT SLIDE HANYA UNTUK KEGIATAN AWAL (A) DAN KEGIATAN INTI (B). LEWATI Kegiatan Penutup.',
      '',
      'SETIAP SLIDE adalah <div class="slide"> dengan format:',
      '',
      '<div class="slide">',
      '  <div class="slide-header">',
      '    <span class="slide-badge">[Kegiatan Awal / Inti]</span>',
      '    <span class="slide-meeting">Pertemuan [n]</span>',
      '    <span class="slide-counter">[nomor] / [total]</span>',
      '  </div>',
      '  <div class="slide-body">',
      '    <!-- ILUSTRASI SVG: Diagram sederhana yang INFORMATIF dan sesuai aktivitas -->',
      '    <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">... KONTEN SPESIFIK ...</svg>',
      '    <div class="slide-content">',
      '      <h2 class="slide-title">[judul aktivitas spesifik]</h2>',
      '      <p class="slide-text">[instruksi/pertanyaan langsung untuk siswa, dalam Bahasa Indonesia yg komunikatif]</p>',
      '      <div class="slide-actions">',
      '        <span class="slide-tip">💡 [tips untuk guru]</span>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>',
      '',
      'PANDUAN MEMBUAT SLIDE YANG POWERFUL:',
      '- Gunakan konten SPESIFIK dari RPM (bukan template generik)',
      '- Slide harus LANGSUNG siap tayang di kelas (proyektor)',
      '- Teks komunikatif, langsung ke siswa (gunakan "kalian" bukan "peserta didik")',
      '- SVG diagram: flowchart/mindmap/klasifikasi sesuai aktivitas, viewBox 800 400, warna: #1a4185, #eab308, #10b981, #f3f4f6',
      '- Slide pertama = pertanyaan pemantik dengan visual menarik',
      '- Slide berikutnya = langkah kegiatan dengan visual pendukung',
      '',
      'CONTOH SLIDE UNTUK AKTIVITAS "guru menampilkan proses antrian tiket LRT":',
      '<div class="slide">',
      '  <div class="slide-header"><span class="slide-badge">Kegiatan Awal</span><span class="slide-meeting">Pertemuan 1</span><span class="slide-counter">1 / 3</span></div>',
      '  <div class="slide-body">',
      '    <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="400" fill="#f8fafc"/><text x="400" y="50" text-anchor="middle" font-size="24" font-weight="bold" fill="#1a4185">Antrian Tiket LRT Palembang</text><!-- diagram --></svg>',
      '    <div class="slide-content"><h2 class="slide-title">Apa yang kalian lihat?</h2><p class="slide-text">Perhatikan gambar di samping. Menurut kalian, apa yang sedang terjadi? Bagaimana proses seseorang membeli tiket LRT?</p><div class="slide-actions"><span class="slide-tip">💡 Minta siswa mengamati dan menebak langkah-langkahnya</span></div></div>',
      '  </div>',
      '</div>',
      '',
      'ATURAN:',
      '- Output HANYA kumpulan <div class="slide">...</div> tanpa <html>/<body>/markdown',
      '- Minimal 2 slide, maksimal 6 slide',
      '- Setiap slide HARUS punya SVG diagram spesifik (bukan placeholder)',
      '- Output LANGSUNG, tanpa markdown block',
      '',
      'TOPIK: ' + topic,
      '',
      'RPM:',
      html,
    ].join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    const slidesHtml = response.text || '';

    // Step 2: Try to generate images for some slides using Gemini 2.0 Flash
    const slideTitles: string[] = [];
    const stRegex = /<h2 class="slide-title">([^<]+)<\/h2>/g;
    let sm;
    while ((sm = stRegex.exec(slidesHtml)) !== null) slideTitles.push(sm[1]);

    let enrichedHtml = slidesHtml;
    for (let i = 0; i < Math.min(slideTitles.length, 3); i++) {
      try {
        const imgResp = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + process.env.GEMINI_API_KEY,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Buat ilustrasi edukatif sederhana, flat design, colorful, untuk slide pembelajaran: "' + slideTitles[i] + '". background putih, gaya kartun, ramah anak, tanpa teks.' }] }],
              generationConfig: { responseModalities: ['Image', 'Text'] as any }
            })
          }
        );
        const data = await imgResp.json() as any;
        const parts = data?.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            const imgTag = '<img class="slide-gen-image" src="data:' + part.inlineData.mimeType + ';base64,' + part.inlineData.data + '" alt="' + slideTitles[i] + '" />';
            enrichedHtml = enrichedHtml.replace(
              '<h2 class="slide-title">' + slideTitles[i] + '</h2>',
              imgTag + '<h2 class="slide-title">' + slideTitles[i] + '</h2>'
            );
            break;
          }
        }
      } catch (e) {
        // Image gen failed, slides work without it
      }
    }

    res.setHeader('Content-Type', 'application/json');
    res.json({ slidesHtml: enrichedHtml });
  } catch (error: any) {
    console.error('Teaching Slides Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal: ' + (error.message || '') });
  }
}