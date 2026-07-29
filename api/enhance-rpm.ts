import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method Not Allowed' }); }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) {} }

    const { html, customApiKey } = body;
    if (!html) return res.status(400).json({ error: 'HTML RPM diperlukan' });
    const key = customApiKey || process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: 'API Key diperlukan' });

    const ai = new GoogleGenAI({ apiKey: key });

    // Find Kegiatan Awal and Inti sections
    const sections: { name: string; content: string }[] = [];
    const pattern = /(<td class="bg-(?:green|yellow)-light[^>]*>[\s\S]*?<td>[\s\S]*?<\/td>\s*<\/tr>)/gi;
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const block = match[1];
      const isAwal = block.includes('Kegiatan Awal');
      const isInti = block.includes('Kegiatan Inti');
      if (isAwal || isInti) {
        sections.push({ name: isAwal ? 'Kegiatan Awal' : 'Kegiatan Inti', content: block });
      }
    }

    if (sections.length === 0) {
      return res.json({ html, enhanced: 0 });
    }

    let enhancedHtml = html;
    let enhanced = 0;

    for (const section of sections) {
      try {
        const prompt = [
          'Analisis aktivitas pembelajaran berikut dan buat SATU SVG diagram sederhana yang INFORMATIF.',
          'SVG harus: viewBox="0 0 600 250", background putih, font-family Arial.',
          'Warna: #1a4185 (judul), #eab308 (aksen), #10b981 (hijau), #ef4444 (merah), #1e293b (teks), #f3f4f6 (bg).',
          'Buat flowchart/diagram relasi/klasifikasi sesuai konteks aktivitas.',
          'Isi diagram HARUS SPESIFIK sesuai aktivitas (jangan generik).',
          '',
          'Output LANGSUNG kode <svg>...</svg> tanpa markdown, tanpa teks lain.',
          '',
          'Aktivitas: ' + section.name,
          'Detail: ' + section.content.substring(0, 300),
        ].join('\n');

        const resp = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
        });

        let svg = (resp.text || '').replace(/```[\s\S]*?```/g, '').trim();
        const svgMatch = svg.match(/<svg[\s\S]*?<\/svg>/i);
        if (svgMatch) {
          svg = svgMatch[0];
          const wrapper = '<div class="rpm-embed-visual" style="margin: 10px 0; page-break-inside: avoid;">' + svg + '</div>';
          
          // Insert after the activity content
          const idx = enhancedHtml.indexOf(section.content);
          if (idx !== -1) {
            const insertAt = idx + section.content.length;
            enhancedHtml = enhancedHtml.substring(0, insertAt) + wrapper + enhancedHtml.substring(insertAt);
            enhanced++;
          }
        }
      } catch (e) {
        console.error('Enhance failed for', section.name, e);
      }
    }

    res.json({ html: enhancedHtml, enhanced });
  } catch (error: any) {
    console.error('Enhance RPM Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal: ' + (error.message || '') });
  }
}