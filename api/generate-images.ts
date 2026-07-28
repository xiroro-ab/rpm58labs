import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method Not Allowed' }); }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) {} }

    const { html } = body;
    if (!html) return res.status(400).json({ error: 'HTML diperlukan' });
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi' });

    // Find all unique keywords from picsum images
    const keywords: string[] = [];
    const imgRegex = /alt="([^"]+)"[^>]*src="https:\/\/picsum/gi;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const kw = match[1].trim();
      if (kw && !keywords.includes(kw)) keywords.push(kw);
    }

    if (keywords.length === 0) {
      return res.json({ html, generated: 0, total: 0 });
    }

    let resultHtml = html;
    let generated = 0;

    for (let i = 0; i < Math.min(keywords.length, 4); i++) {
      try {
        const keyword = keywords[i];
        const imgPrompt = 'Buat ilustrasi edukatif, flat design, colorful, untuk: "' + keyword + '". Background putih, simple, ramah anak, tanpa teks.';

        const resp = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + process.env.GEMINI_API_KEY,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: imgPrompt }] }],
              generationConfig: { responseModalities: ['Image', 'Text'] }
            })
          }
        );

        const data = await resp.json() as any;
        const parts = data?.candidates?.[0]?.content?.parts || [];
        let imgDataUrl = '';

        for (const part of parts) {
          if (part.inlineData?.data) {
            imgDataUrl = 'data:' + part.inlineData.mimeType + ';base64,' + part.inlineData.data;
            break;
          }
        }

        if (imgDataUrl) {
          // Replace the first matching image with this keyword
          const escapedKw = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp('(<img[^>]*alt="' + escapedKw + '"[^>]*src=")[^"]+(")', 'i');
          if (regex.test(resultHtml)) {
            resultHtml = resultHtml.replace(regex, '$1' + imgDataUrl + '$2');
            generated++;
          }
        }
      } catch (e) {
        console.error('Image gen failed for', keywords[i], e);
      }
    }

    res.json({ html: resultHtml, generated, total: keywords.length });
  } catch (error: any) {
    console.error('Generate Images Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal: ' + (error.message || '') });
  }
}