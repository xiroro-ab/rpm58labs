import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

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

    const promptText = [
      'Buat SATU file HTML website pembelajaran INTERAKTIF untuk SISWA berdasarkan RPM.',
      'Website ini untuk siswa belajar mandiri, BUKAN dokumen guru.',
      '',
      '=== STRUKTUR WAJIB ===',
      '1. SIDEBAR kiri (toggle): Beranda, Tujuan, Pertemuan 1/2/dst, Game, Evaluasi per Pertemuan',
      '2. HEADER sticky: judul + hamburger menu',
      '3. TIAP PERTEMUAN berisi 3 section berurutan: Awal ➔ Inti ➔ Penutup',
      '4. GAME edukasi (min 1, seru, pakai JS murni — puzzle/drag/tebak)',
      '5. EVALUASI: soal per PERTEMUAN, jangan digabung',
      '',
      '=== KUALITAS ANIMASI & SVG ===',
      'Jika RPM menyebut "menampilkan video/gambar/ilustrasi":',
      'BUAT ANIMASI HTML+CSS+JS interaktif yang BENAR-BENAR BAGUS dan SERU:',
      '- Animasi GERAK (transisi, efek), bukan gambar diam',
      '- Bisa diklik/disentuh siswa',
      '- Detail, proporsional, informatif — siswa paham dari visualnya',
      '- JANGAN embed YouTube — bikin sendiri pake HTML/JS',
      '',
      '=== INTERAKTIF ===',
      'Setiap pertanyaan HARUS berbentuk PERMAINAN (puzzle, drag, tebak, teka-teki)',
      'Custom notif DIV pop-up (bukan alert browser)',
      '',
      '=== KONTEN ===',
      'A. KEGIATAN AWAL: soal dari ASESMEN DIAGNOSTIK RPM, interaktif',
      'B. KEGIATAN INTI: label fase jelas, clue interaktif (bukan jawaban), animasi kalo ada "tampilkan video/gambar"',
      'C. KEGIATAN PENUTUP: refleksi emoji/slider',
      'D. EVALUASI: soal SAMA PERSIS Asesmen Sumatif, per pertemuan, tanpa kunci',
      '',
      '=== GAYA ===',
      'Neo Brutalism: border 4px hitam, shadow 6px 6px 0 #000, #FFD700 #FF6B6B #4ECDC4 #000 #fff',
      'Sidebar #1a1a2e, scrollbar kustom, responsive, zero dependencies, satu file HTML',
      'Output LANGSUNG <!DOCTYPE html> tanpa markdown, tanpa teks lain',
      '',
      'TOPIK: ' + topic,
      '',
      'RPM:',
      html,
    ].join('\n');

    let resultHtml = '';

    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: promptText });
      resultHtml = response.text || '';
    } else {
      let baseURL = 'https://api.groq.com/openai/v1';
      let modelName = 'llama3-70b-8192';
      if (provider === 'openai') { baseURL = ''; modelName = 'gpt-4o-mini'; }
      else if (provider === 'deepseek') { baseURL = 'https://api.deepseek.com/v1'; modelName = 'deepseek-chat'; }
      else if (provider === 'groq') { baseURL = 'https://api.groq.com/openai/v1'; modelName = 'llama3-70b-8192'; }

      const openai = new OpenAI({ apiKey: key, baseURL: baseURL || undefined });
      const completion = await openai.chat.completions.create({
        model: modelName,
        messages: [{ role: 'user', content: promptText }],
      });
      resultHtml = completion.choices[0]?.message?.content || '';
    }

    resultHtml = resultHtml.replace(/```[\s\S]*?```/g, '').trim();
    const htmlMatch = resultHtml.match(/(<!DOCTYPE[\s\S]*?<\/html>|<html[\s\S]*?<\/html>)/i);
    if (htmlMatch) resultHtml = htmlMatch[1];

    if (!resultHtml.includes('</html>') || resultHtml.length < 500) {
      if (provider === 'gemini') {
        const shortPrompt = 'Buat website pembelajaran interaktif HTML. Neo Brutalism. Output langsung <!DOCTYPE html>. TOPIK: ' + topic + '\nRPM:\n' + html;
        const ai = new GoogleGenAI({ apiKey: key });
        const retry = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: shortPrompt });
        resultHtml = (retry.text || '').replace(/```[\s\S]*?```/g, '').trim();
        const m2 = resultHtml.match(/(<!DOCTYPE[\s\S]*?<\/html>|<html[\s\S]*?<\/html>)/i);
        if (m2) resultHtml = m2[1];
      }
    }

    res.json({ html: resultHtml || '<html><body><p>Gagal generate. Coba lagi.</p></body></html>' });
  } catch (error: any) {
    console.error('Generate Website Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal: ' + (error.message || '') });
  }
}