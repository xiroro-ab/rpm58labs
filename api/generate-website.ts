import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

async function callAI(prompt: string, key: string, provider: string): Promise<string> {
  if (provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: key });
    const r = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt });
    return (r.text || '').replace(/```[\s\S]*?```/g, '').trim();
  }
  let baseURL = 'https://api.groq.com/openai/v1';
  let modelName = 'llama-3.3-70b-versatile';
  if (provider === 'openai') { baseURL = ''; modelName = 'gpt-4o-mini'; }
  else if (provider === 'deepseek') { baseURL = 'https://api.deepseek.com/v1'; modelName = 'deepseek-chat'; }

  const oa = new OpenAI({ apiKey: key, baseURL: baseURL || undefined });
  const c = await oa.chat.completions.create({ model: modelName, messages: [{ role: 'user', content: prompt }] });
  return (c.choices[0]?.message?.content || '').replace(/```[\s\S]*?```/g, '').trim();
}

function extractHTML(text: string): string {
  const m = text.match(/(<!DOCTYPE[\s\S]*?<\/html>|<html[\s\S]*?<\/html>)/i);
  return m ? m[1] : text;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method Not Allowed' }); }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) {} }

    const { html, topic, customApiKey, aiProvider } = body;
    if (!html) return res.status(400).json({ error: 'HTML RPM diperlukan' });
    const key = customApiKey || process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: 'API Key diperlukan.' });
    const provider = aiProvider || 'gemini';

    // === PHASE 1: Generate website structure + content (no heavy games yet) ===
    const skeletonPrompt = [
      'Buat SATU file HTML website pembelajaran INTERAKTIF untuk SISWA.',
      'Konten dari RPM: topik, tujuan, kegiatan per pertemuan (Awal/Inti/Penutup), evaluasi.',
      '',
      'WAJIB: sidebar, header sticky, Neo Brutalism (#FFD700 #FF6B6B #4ECDC4 #000 #fff), border 4px hitam, shadow 6px 6px 0 #000.',
      'Labekl kegiatan HARUS sama seperti di RPM.',
      '',
      'UNTUK SEKARANG:',
      '- Kegiatan Awal: soal dari Asesmen Diagnostik (tampilkan sebagai teks dulu, sederhana)',
      '- Kegiatan Inti: konten teks + tempat kosong untuk visual nanti',
      '- Evaluasi: soal dari Asesmen Sumatif, per pertemuan, tanpa kunci',
      '- Custom notif DIV pop-up (bukan alert)',
      '',
      'BELUM perlu game berat atau animasi kompleks. Fokus struktur dulu.',
      'Besarkan tempat untuk animasi nanti dengan komentar <!-- ANIMASI: [nama] -->',
      'Output <!DOCTYPE html> langsung.',
      '',
      'TOPIK: ' + topic,
      'RPM:', html,
    ].join('\n');

    let websiteHtml = extractHTML(await callAI(skeletonPrompt, key, provider));

    if (!websiteHtml.includes('</html>') || websiteHtml.length < 500) {
      websiteHtml = extractHTML(await callAI(
        'Buat website HTML Neo Brutalism sederhana. Output langsung. TOPIK: ' + topic + '\nRPM:\n' + html,
        key, provider
      ));
    }

    // === PHASE 2: Enhance with games and animations one by one ===
    const sections = ['ANIMASI:', 'GAME:', 'KUIS:'];
    for (const section of sections) {
      const idx = websiteHtml.indexOf('<!-- ' + section);
      if (idx === -1) continue;

      const before = websiteHtml.substring(0, idx);
      const after = websiteHtml.substring(idx);
      const endIdx = after.indexOf('-->', 2);
      const name = after.substring(0, endIdx + 3); // <!-- ANIMASI: xxx -->

      const enhancePrompt = [
        'Buat konten HTML+CSS+JS untuk ' + name.replace('<!--', '').replace('-->', '').trim() + ' dari RPM ini. Tema Neo Brutalism.',
        'Hanya output kode HTML/JS yang dibutuhkan (tanpa <html><body>).',
        'Kreatif, interaktif, seru untuk siswa.',
        'RPM:', html,
      ].join('\n');

      const enhancement = await callAI(enhancePrompt, key, provider);
      // Insert enhancement and remove comment
      websiteHtml = before + enhancement + '\n' + after.substring(endIdx + 3);
    }

    // If no section markers found, try to enhance game/evaluasi sections by content
    if (sections.every(s => !websiteHtml.includes('<!-- ' + s))) {
      // Find Game section in the HTML
      const gameMatch = websiteHtml.match(/<section[^>]*id="?game"?[^>]*>[\s\S]*?<\/section>/i);
      if (!gameMatch) {
        const anyGame = websiteHtml.match(/<div[^>]*>[\s\S]*?(?:Game|game|Permainan)[\s\S]*?<\/div>/i);
        if (anyGame) {
          const enhanceGame = await callAI(
            'Buat game edukasi interaktif HTML+CSS+JS (puzzle/drag/tebak) dengan tema Neo Brutalism. Output langsung kode HTML. RPM:\n' + html,
            key, provider
          );
          websiteHtml = websiteHtml.replace(anyGame[0], enhanceGame);
        }
      }
    }

    res.json({ html: websiteHtml || '<html><body><p>Gagal generate.</p></body></html>' });
  } catch (error: any) {
    console.error('Generate Website Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal: ' + (error.message || '') });
  }
}