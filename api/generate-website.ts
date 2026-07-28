import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method Not Allowed' }); }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) {} }

    const { html, topic, customApiKey } = body;
    if (!html) return res.status(400).json({ error: 'HTML RPM diperlukan' });
    const key = customApiKey || process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: 'API Key diperlukan. Masukkan di Pengaturan.' });

    const ai = new GoogleGenAI({ apiKey: key });
    const prompt = [
      'Buat SATU file HTML website pembelajaran INTERAKTIF untuk SISWA berdasarkan RPM.',
      'Website ini adalah media belajar mandiri siswa — BUKAN dokumen guru.',
      '',
      '=== ATURAN KONTEN ===',
      '- Ambil dari RPM: Topik, Tujuan Pembelajaran, Kegiatan per Pertemuan (Awal/Inti/Penutup), Pertanyaan Pemantik',
      '- JANGAN tampilkan kunci jawaban, instruksi guru, asesmen sumatif (soal PG dengan kunci)',
      '- JANGAN salin mentah RPM. Tulis ulang dengan bahasa siswa',
      '',
      '=== STRUKTUR WEBSITE (WAJIB) ===',
      '1. SIDEBAR NAVIGASI — tetap ada di kiri, bisa disembunyikan. Menu: Beranda, Tujuan, Pertemuan 1, 2, dst, Game, Evaluasi',
      '2. HEADER — Judul Mapel, Kelas, Topik, dengan tombol hamburger untuk sidebar',
      '3. HALAMAN TIAP PERTEMUAN:',
      '   a. KEGIATAN AWAL — Tampilkan pertanyaan pemantik INTERAKTIF:',
      '      - Animasi visual/motion menggunakan CSS + JS (bukan video)',
      '      - Siswa bisa klik/tebak jawaban',
      '      - Jika RPM menyebut "guru menampilkan video", buat ANIMASI HTML/JS interaktif (bukan embed YouTube)',
      '      - Jika RPM menyebut "guru menampilkan gambar", buat ilustrasi SVG/Canvas interaktif',
      '      - Kustom notifikasi pop-up (bukan alert/confirm browser) — sesuai tema Neo Brutalism',
      '   b. KEGIATAN INTI — Aktivitas siswa:',
      '      - JANGAN berikan jawaban langsung',
      '      - Berikan CLUE interaktif (bisa diklik, hover, drag) yang memancing pemikiran siswa',
      '      - Jika ada soal/project, tampilkan soalnya — siswa cari jawabannya sendiri',
      '      - Animasi/progress tracker biar siswa tau langkahnya',
      '   c. KEGIATAN PENUTUP — Kesimpulan, refleksi interaktif (siswa pilih emoji/sentimen)',
      '4. GAME EDUKASI — Minimal 1 game interaktif (tebak kata, puzzle, drag & drop) pakai JS murni',
      '5. EVALUASI — Soal interaktif tanpa kunci. Setelah siswa jawab, muncul notifikasi custom "Benar/Salah"',
      '',
      '=== FITUR W AJIB ===',
      '- Sidebar navigasi dengan menu per pertemuan',
      '- Semua notifikasi pake DIV pop-up kustom (bukan alert/confirm/prompt browser)',
      '- Animasi interaktif untuk pertanyaan pemantik (gerakan, transisi, efek CSS)',
      '- Clue interaktif (hover/klik) untuk kegiatan inti — bukan jawaban',
      '- Responsive mobile',
      '- Satu file HTML utuh, inline CSS & JS, zero dependencies',
      '',
      '=== GAYA ===',
      '- Neo Brutalism: border hitam tebal 4px, shadow offset 6px 6px 0 #000',
      '- Warna: putih (#fff), kuning (#FFD700), merah salmon (#FF6B6B), tosca (#4ECDC4), hitam (#000)',
      '- Font bold sans-serif',
      '- Sidebar: background gelap (#1a1a2e atau #16213e), teks putih',
      '- Header: sticky dengan efek blur',
      '',
      '=== CONTOH POP-UP NOTIFIKASI ===',
      'Ganti semua alert/confirm dengan DIV kayak gini: <div id="notif" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#FFD700;border:4px solid #000;padding:20px;z-index:999;box-shadow:8px 8px 0 #000;max-width:400px;text-align:center"><p id="notif-msg">Pesan</p><button onclick="closeNotif()" style="margin-top:10px;padding:8px 20px;background:#000;color:#fff;border:none;font-weight:bold;cursor:pointer">OK</button></div><div id="notif-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:998" onclick="closeNotif()"></div>',
      'Fungsi JS: function showNotif(msg){document.getElementById("notif-msg").textContent=msg;document.getElementById("notif").style.display="block";document.getElementById("notif-overlay").style.display="block"} function closeNotif(){document.getElementById("notif").style.display="none";document.getElementById("notif-overlay").style.display="none"}',
      '',
      'TOPIK: ' + topic,
      '',
      'RPM:',
      html,
    ].join('\n');

    res.setHeader('Content-Type', 'application/json');
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    let websiteHtml = response.text || '';

    // Bersihkan markdown code block jika ada
    websiteHtml = websiteHtml.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    // Pastikan output dimulai dengan <!DOCTYPE html> atau <html>
    if (!websiteHtml.startsWith('<!DOCTYPE') && !websiteHtml.startsWith('<html') && !websiteHtml.startsWith('<HTML')) {
      // Coba ekstrak HTML dari response jika ada markdown atau teks lain
      const htmlMatch = websiteHtml.match(/(<!DOCTYPE[\s\S]*?<\/html>|<html[\s\S]*?<\/html>)/i);
      if (htmlMatch) {
        websiteHtml = htmlMatch[1];
      }
    }

    res.json({ html: websiteHtml });
  } catch (error: any) {
    console.error('Generate Website Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal: ' + (error.message || '') });
  }
}