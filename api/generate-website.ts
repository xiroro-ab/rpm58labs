import { GoogleGenAI } from '@google/genai';
import { createOpenRouterClient, getApiKey, getGeminiModel, getOpenRouterModel, isOpenRouterProvider, normalizeProvider } from './_ai-provider.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method Not Allowed' }); }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) {} }

    let { html, topic, customApiKey, aiProvider, aiModel, previousOutput } = body;
    if (!html && !previousOutput) return res.status(400).json({ error: 'HTML RPM diperlukan' });
    const provider = normalizeProvider(aiProvider);
    const key = getApiKey(customApiKey, isOpenRouterProvider(provider) ? provider : 'gemini');
    if (!key) return res.status(400).json({ error: 'API key untuk provider ' + provider + ' diperlukan.' });

    let prompt = [
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
      '',
      'PENTING: Di baris paling akhir kodemu, tambahkan elemen ini persis setelah penutup </html>:',
      '<div id="SELESAI" style="display:none;"></div>'
    ].join('\n');

    if (previousOutput) {
      prompt += `

[PERHATIAN SANGAT PENTING: PENGGUNA MEMINTA KAMU UNTUK MELANJUTKAN KODE HTML KARENA TERPOTONG!]

Kode HTML sebelumnya yang sudah kamu hasilkan (namun terpotong di tengah jalan) adalah:
=== BATAS AWAL KODE SEBELUMNYA ===
${previousOutput}
=== BATAS AKHIR KODE SEBELUMNYA ===

TUGAS KAMU SEKARANG:
Lanjutkan pembuatan kode HTML tersebut TEPAT dari titik ia terputus pada "BATAS AKHIR KODE SEBELUMNYA".
JANGAN MENGULANGI KODE ATAU TEKS YANG SUDAH ADA DI ATAS!
JANGAN tambahkan kata pembukaan/penutup apa pun, LANGSUNG TULIS SAMBUNGAN KODE HTML-NYA agar menjadi satu kesatuan dokumen yang valid saat digabungkan dengan kode sebelumnya. Gunakan panduan kerangka HTML di atas sebagai panduan arahmu.`;
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache, no-transform');

    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey: key });
      let retries = 3;
      let delay = 1000;
      let hasStartedStreaming = false;

      while (retries > 0) {
        try {
          const responseStream = await ai.models.generateContentStream({
            model: getGeminiModel(aiModel),
            contents: prompt,
          });
          for await (const chunk of responseStream) {
            if (chunk.text) {
              hasStartedStreaming = true;
              res.write(chunk.text);
            }
          }
          break;
        } catch (error: any) {
          if (hasStartedStreaming) {
            throw error;
          }
          retries--;
          if (retries > 0) {
            await new Promise(r => setTimeout(r, delay));
            delay *= 2;
          } else {
            throw error;
          }
        }
      }
    } else if (provider === 'openrouter' || provider === 'openrouter-free') {
      const openRouter = createOpenRouterClient(key);
      const responseStream = await openRouter.chat.completions.create({
        model: getOpenRouterModel(provider, aiModel),
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      });

      for await (const chunk of responseStream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(content);
        }
      }
    }

    res.end();
  } catch (error: any) {
    console.error('Generate Website Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Gagal: ' + (error.message || '') });
    } else {
      try {
        if (!res.writableEnded) {
          res.end();
        }
      } catch (e) {}
    }
  }
}