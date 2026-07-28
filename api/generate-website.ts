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
      'Website ini untuk siswa belajar mandiri, BUKAN dokumen guru.',
      '',
      '=== STRUKTUR WAJIB ===',
      '1. SIDEBAR kiri (toggle): Beranda, Tujuan, Pertemuan 1/2/dst, Game, Evaluasi',
      '2. HEADER sticky: judul + hamburger menu',
      '3. TIAP PERTEMUAN berisi 3 section berurutan: Awal → Inti → Penutup',
      '4. GAME edukasi (min 1, pakai JS murni)',
      '5. EVALUASI',
      '',
      '=== ISI PER SECTION ===',
      'A. KEGIATAN AWAL:',
      '   - Soal dari ASESMEN DIAGNOSTIK yg ada di RPM (jangan bikin soal baru)',
      '   - Buat INTERAKTIF: animasi, klik jawaban, efek visual, custom notif (bukan alert)',
      '',
      'B. KEGIATAN INTI:',
      '   - Jika RPM menyebut "guru menampilkan video/menayangkan video/memperlihatkan gambar/ilustrasi":',
      '     BUAT ANIMASI/SVG/CANVAS HTML interaktif yang menggambarkan adegan tsb (bukan embed video)',
      '     Contoh: "guru menampilkan proses antrian" → buat animasi orang ngantri pake div dan JS',
      '   - Jika ada soal/aktivitas: beri CLUE interaktif (hover/klik), BUKAN jawaban',
      '   - Progress tracker langkah kegiatan',
      '',
      'C. KEGIATAN PENUTUP:',
      '   - Refleksi interaktif (siswa pilih emoji/sentimen), kesimpulan',
      '',
      'D. EVALUASI:',
      '   - Soal PLEK KETIPLEK sama ASESMEN SUMATIF di RPM (soal, pilihan, jumlah persis)',
      '   - JANGAN tampilkan kunci jawaban',
      '   - Setelah siswa jawab, notif custom "Benar" atau "Salah"',
      '',
      '=== ATURAN TEKNIS ===',
      '- Satu file HTML, inline CSS & JS, zero dependencies',
      '- Semua notifikasi pakai DIV pop-up kustom (bukan alert/confirm)',
      '- Gaya Neo Brutalism: border 4px hitam, shadow offset 6px 6px 0 #000',
      '- Warna: #FFD700, #FF6B6B, #4ECDC4, #000, #fff',
      '- Sidebar: background gelap (#1a1a2e), teks putih',
      '- Responsive mobile',
      '- Output LANGSUNG <!DOCTYPE html> tanpa markdown, tanpa teks lain',
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

    let websiteHtml = response.text || '';
    websiteHtml = websiteHtml.replace(/```[\s\S]*?```/g, '').trim();
    const htmlMatch = websiteHtml.match(/(<!DOCTYPE[\s\S]*?<\/html>|<html[\s\S]*?<\/html>)/i);
    if (htmlMatch) websiteHtml = htmlMatch[1];

    if (!websiteHtml.includes('</html>') || websiteHtml.length < 500) {
      const short = [
        'Buat website pembelajaran interaktif HTML dari RPM. Gaya Neo Brutalism.',
        'Awal: soal dari Asesmen Diagnostik RPM, interaktif.',
        'Inti: kalo ada "tampilkan video/gambar" bikin animasi HTML/JS. Clue bukan jawaban.',
        'Penutup: refleksi emoji.',
        'Evaluasi: soal sama persis Asesmen Sumatif RPM (termasuk jumlah), tanpa kunci.',
        'Sidebar navigasi, custom notif, game. Output <!DOCTYPE html> langsung.',
        'TOPIK: ' + topic,
        'RPM:', html,
      ].join('\n');
      const retry = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: short });
      websiteHtml = (retry.text || '').replace(/```[\s\S]*?```/g, '').trim();
      const m2 = websiteHtml.match(/(<!DOCTYPE[\s\S]*?<\/html>|<html[\s\S]*?<\/html>)/i);
      if (m2) websiteHtml = m2[1];
    }

    res.json({ html: websiteHtml || '<html><body><p>Gagal generate. Coba lagi.</p></body></html>' });
  } catch (error: any) {
    console.error('Generate Website Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal: ' + (error.message || '') });
  }
}