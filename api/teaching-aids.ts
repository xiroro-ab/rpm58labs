import { GoogleGenAI } from '@google/genai';

const IMAGE_STYLE = 'flat design, colorful, educational, simple, cute, cartoon style, clean white background, vector illustration, suitable for classroom display, no text';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) {} }

    const { html, topic } = body;
    if (!html) return res.status(400).json({ error: 'HTML RPM diperlukan' });
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi' });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Step 1: Generate text analysis (keywords, links, visual script)
    // Use non-streaming since we need the full text before adding images
    const textPrompt = [
      'Anda membantu guru menyiapkan referensi visual untuk KEGIATAN AWAL dan INTI saja. LEWATI Penutup.',
      '',
      'Untuk SETIAP aktivitas, output HTML dengan TEMPLATE berikut:',
      '<div class="aid-item">',
      '  <div class="aid-header"><span class="aid-label">[Kegiatan Awal/Inti]</span><span class="aid-meeting">Pertemuan [n]</span></div>',
      '  <div class="aid-svg-wrapper"><svg viewBox="0 0 650 300" xmlns="http://www.w3.org/2000/svg">',
      '    <text x="325" y="25" text-anchor="middle" font-size="18" font-weight="bold" fill="#1a4185">[JUDUL DIAGRAM]</text>',
      '    ... diagram SVG dengan KONTEN SPESIFIK dari aktivitas (bukan generik!) ...',
      '  </svg></div>',
      '  <div class="aid-card">',
      '    <p class="aid-title">[nama aktivitas]</p>',
      '    <p class="aid-visual-script">Saran: [cara pakai]</p>',
      '    <p class="aid-keywords"><a href="https://www.google.com/search?tbm=isch&q=[keyword]" target="_blank">Cari gambar Google</a></p>',
      '    <p class="aid-keywords"><a href="https://www.youtube.com/results?search_query=[keyword]" target="_blank">Cari video YouTube</a></p>',
      '  </div>',
      '</div>',
      '',
      'PENTING: EKSTRAK konten SPESIFIK dari RPM. Misal aktivitas "antrian tiket LRT" -> diagram berisi: "Datang Stasiun", "Cari Mesin Tiket", "Pilih Tujuan", "Bayar", "Ambil Tiket", "Tap Gate", "Masuk Peron".',
      '',
      'Output LANGSUNG HTML tanpa markdown.',
      'TOPIK: ' + topic,
      'RPM:', html,
    ].join('\n');

    const textRes = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: textPrompt,
    });
    let htmlOutput = textRes.text || '';

    // Step 2: Generate images using Gemini REST API directly
    // Extract activity titles for image prompts
    const titles: string[] = [];
    const tRegex = /<p class="aid-title">([^<]+)<\/p>/g;
    let m;
    while ((m = tRegex.exec(htmlOutput)) !== null) titles.push(m[1]);

    const imgParts: string[] = [];

    for (let i = 0; i < Math.min(titles.length, 4); i++) {
      try {
        const imgPrompt = encodeURIComponent(
          'Buat ilustrasi edukatif sederhana untuk: "' + titles[i] + '". ' + IMAGE_STYLE
        );

        const resp = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + process.env.GEMINI_API_KEY,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Buat ilustrasi edukatif sederhana untuk kegiatan: "' + titles[i] + '". ' + IMAGE_STYLE }] }],
              generationConfig: { responseModalities: ['Image', 'Text'] }
            })
          }
        );

        const data = await resp.json() as any;
        const parts = data?.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            imgParts.push(
              '<div class="aid-visual-img"><img src="data:' + part.inlineData.mimeType + ';base64,' + part.inlineData.data + '" alt="' + titles[i] + '" loading="lazy" /></div>'
            );
            break;
          }
        }
      } catch (e) {
        console.error('Image gen failed for', titles[i], e);
      }
    }

    // Insert images after title paragraphs in reverse order to maintain index
    if (imgParts.length > 0) {
      const segments = htmlOutput.split(/(<p class="aid-title">[^<]+<\/p>)/);
      let imgIdx = 0;
      for (let i = 1; i < segments.length && imgIdx < imgParts.length; i += 2) {
        segments[i] += imgParts[imgIdx];
        imgIdx++;
      }
      htmlOutput = segments.join('');
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.write(htmlOutput);
    res.end();
  } catch (error: any) {
    console.error('Teaching Aids Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal: ' + (error.message || '') });
    else res.end();
  }
}