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

    async function callAI(prompt: string): Promise<string> {
      for (let i = 0; i < 3; i++) {
        try {
          const r = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt });
          return (r.text || '').replace(/```[\s\S]*?```/g, '').trim();
        } catch (e: any) {
          if ((e.message?.includes('503') || e.status === 503) && i < 2) {
            await new Promise(r => setTimeout(r, (i + 1) * 2000));
            continue;
          }
          throw e;
        }
      }
      return '';
    }

    // Prompt LENGKAP seperti dulu (sebelum fase2) — isi: puzzle, animasi, game, teka-teki, dll
    const prompt = [
      'Buat SATU file HTML website pembelajaran INTERAKTIF untuk SISWA berdasarkan RPM.',
      'Website ini untuk siswa belajar mandiri, BUKAN dokumen guru.',
      '',
      '=== STRUKTUR WAJIB ===',
      '1. SIDEBAR kiri (toggle): Beranda ➔ Tujuan ➔ Pertemuan 1/2/dst ➔ Game ➔ Evaluasi per Pertemuan',
      '2. HEADER sticky: judul mapel + hamburger menu',
      '3. TIAP PERTEMUAN berisi 3 section berurutan: Awal ➔ Inti ➔ Penutup — dengan LABEL JELAS buat guru',
      '4. LABEL kegiatan HARUS sama persis dengan di RPM (misal: "Kegiatan Awal", "Fase 1: Orientasi") biar guru tau ini bagian mana',
      '5. GAME edukasi (min 1, seru, pakai JS murni — puzzle/drag/tebak)',
      '6. EVALUASI: soal per PERTEMUAN, jangan digabung',
      '',
      '=== KUALITAS ANIMASI & SVG (PENTING!) ===',
      'Jika RPM menyebut "menampilkan video/menayangkan video/memperlihatkan gambar/ilustrasi":',
      'BUAT ANIMASI atau SVG interaktif yang BENAR-BENAR BAGUS, SERU, dan MEMBANTU PEMAHAMAN:',
      '- Gunakan HTML + CSS + JavaScript murni (bukan embed YouTube/Vimeo)',
      '- Animasi harus GERAK, bukan gambar diam — ada transisi, efek, atau interaksi',
      '- SVG/Canvas harus detail, proporsional, dan INFORMATIF — siswa bisa paham cuma dari liat visualnya',
      '- Tambahkan teks label, warna kontras, dan elemen yang bisa diklik/disentuh',
      '- Contoh: "proses antrian tiket" ➔ animasi orang bergerak ngantri; "sistem komputer" ➔ diagram interaktif 3 komponen; "flowchart" ➔ diagram alur dengan animasi langkah',
      '- JANGAN asal-asalan. Visual ini adalah PENGGANTI video — harus sebagus mungkin membantu siswa paham.',
      '',
      '=== INTERAKTIF WAJIB ===',
      'Setiap pertanyaan HARUS berbentuk PERMAINAN, bukan teks doang:',
      '- Puzzle (drag & drop, jodoh, susun kata)',
      '- Teka-teki, tebak gambar, kuis interaktif dengan timer/efek',
      '- Animasi yang bisa diklik/digerakin',
      '- Custom notif (bukan alert)',
      '',
      '=== ISI PER SECTION ===',
      'A. KEGIATAN AWAL:',
      '   - Soal dari ASESMEN DIAGNOSTIK di RPM (soal asli, jangan bikin baru)',
      '   - Bungkus dalam PERMAINAN interaktif (teka-teki, tebak, puzzle)',
      '',
      'B. KEGIATAN INTI:',
      '   - Jika RPM bilang "tampilkan video/tayangkan video/gambar/ilustrasi":',
      '     BUAT ANIMASI HTML/SVG/CANVAS yang menggambarkan adegan itu (bukan embed video)',
      '   - Jika ada soal: beri CLUE interaktif (hover/klik), BUKAN jawaban',
      '',
      'C. KEGIATAN PENUTUP:',
      '   - Refleksi interaktif (pilih emoji/sentimen, tarik slider)',
      '',
      'D. EVALUASI:',
      '   - Soal sama PERSIS Asesmen Sumatif RPM (soal, opsi, jumlah)',
      '   - TAMPILKAN PER PERTEMUAN (misal: Pertemuan 1 ➔ soal 1-10, Pertemuan 2 ➔ 11-20, dst)',
      '   - JANGAN tampilkan kunci jawaban',
      '',
      '=== GAYA & TEKNIS ===',
      '- Neo Brutalism: border 4px hitam, shadow offset 6px 6px 0 #000',
      '- Warna: #FFD700, #FF6B6B, #4ECDC4, #000, #fff',
      '- Sidebar background gelap (#1a1a2e), scrollbar kUSTOM sesuai tema (bukan bawaan browser)',
      '- Satu file HTML, inline CSS/JS, zero dependencies',
      '- Semua notif pake DIV kustom (bukan alert/confirm)',
      '- Responsive mobile',
      '- Output LANGSUNG <!DOCTYPE html> tanpa markdown, tanpa teks lain',
      '',
      'TOPIK: ' + topic,
      '',
      'RPM:',
      html,
    ].join('\n');

    let websiteHtml = await callAI(prompt);

    const m1 = websiteHtml.match(/(<!DOCTYPE[\s\S]*?<\/html>|<html[\s\S]*?<\/html>)/i);
    if (m1) websiteHtml = m1[1];

    res.json({ html: websiteHtml || '<html><body><p>Coba generate ulang.</p></body></html>' });
  } catch (error: any) {
    console.error('Generate Website Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal: ' + (error.message || '') });
  }
}