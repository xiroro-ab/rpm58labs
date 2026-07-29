import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method Not Allowed' }); }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) {} }

    const { html, topic, customApiKey } = body;
    if (!html) return res.status(400).json({ error: 'HTML RPM diperlukan' });
    const key = customApiKey || process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: 'API Key diperlukan.' });

    const ai = new GoogleGenAI({ apiKey: key });

    // Helper: call Gemini with retry on 503
    async function callGemini(prompt: string): Promise<string> {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const resp = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt });
          return (resp.text || '').replace(/```[\s\S]*?```/g, '').trim();
        } catch (e: any) {
          const is503 = e.message?.includes('503') || e.message?.includes('UNAVAILABLE') || e.status === 503;
          if (is503 && attempt < 2) {
            await new Promise(r => setTimeout(r, (attempt + 1) * 2000));
            continue;
          }
          throw e;
        }
      }
      return '';
    }

    // PHASE 1: Generate structure + content (detailed prompt — same as best version)
    const prompt1 = [
      'Buat SATU file HTML website pembelajaran INTERAKTIF untuk SISWA.',
      'Konten dari RPM: topik, tujuan, kegiatan per pertemuan, evaluasi.',
      '',
      'DESAIN: Neo Brutalism — border 4px #000, shadow 6px 6px 0 #000, #FFD700 #FF6B6B #4ECDC4.',
      'Sidebar kiri (#1a1a2e) navigasi, header sticky.',
      'Custom notif DIV pop-up, bukan alert browser.',
      '',
      'STRUKTUR PER PERTEMUAN: Awal (soal interaktif dari Asesmen Diagnostik) ➔ Inti (clue + animasi) ➔ Penutup (refleksi).',
      'Evaluasi: soal sama persis Asesmen Sumatif per pertemuan, tanpa kunci.',
      'Game edukasi interaktif (puzzle/drag/tebak) pake JS.',
      'Zero dependencies, responsive mobile.',
      '',
      'JANGAN embed YouTube/video eksternal. Buat animasi sendiri pake HTML/JS.',
      'Output <!DOCTYPE html> langsung, tanpa markdown.',
      '',
      'TOPIK: ' + topic,
      '',
      'RPM:',
      html,
    ].join('\n');

    const resp1 = await callGemini(prompt1);
    let websiteHtml = resp1;

    // Extract HTML
    const m1 = websiteHtml.match(/(<!DOCTYPE[\s\S]*?<\/html>|<html[\s\S]*?<\/html>)/i);
    if (m1) websiteHtml = m1[1];

    // If too short, retry with simpler prompt
    if (!websiteHtml.includes('</html>') || websiteHtml.length < 1000) {
      const prompt2 = [
        'Buat website pembelajaran HTML Neo Brutalism dari RPM. Satu file, zero deps.',
        'TOPIK: ' + topic,
        'Output <!DOCTYPE html> langsung.',
        'RPM:', html,
      ].join('\n');
      const resp2 = await callGemini(prompt2);
      websiteHtml = resp2;
      const m2 = websiteHtml.match(/(<!DOCTYPE[\s\S]*?<\/html>|<html[\s\S]*?<\/html>)/i);
      if (m2) websiteHtml = m2[1];
    }

    // PHASE 2: Enhance - generate a game section if the HTML has one
    if (websiteHtml.includes('</html>')) {
      try {
        const gamePrompt = [
          'Buat game edukasi HTML+CSS+JS interaktif untuk website pembelajaran. Tema Neo Brutalism.',
          'Game: puzzle, drag & drop, atau tebak gambar. Satu file, zero deps, responsive.',
          'Kreatif dan seru. Output kode HTML game LENGKAP (bisa langsung dipasang).',
          'TOPIC: ' + topic,
          'RPM:', html,
        ].join('\n');
        const gameResp = await callGemini(gamePrompt);
        let gameHtml = gameResp;
        const gMatch = gameHtml.match(/<section[\s\S]*?<\/section>|<div[\s\S]*?<\/div>/i);
        if (gMatch && gMatch[0].length > 200) {
          // Insert game before </body>
          websiteHtml = websiteHtml.replace('</body>', gMatch[0] + '\n</body>');
        }
      } catch (e) { console.error('Game gen failed', e); }
    }

    res.json({ html: websiteHtml || '<html><body><p>Coba generate ulang.</p></body></html>' });
  } catch (error: any) {
    console.error('Generate Website Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal: ' + (error.message || '') });
  }
}