import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let data;
    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        data = parsed.data;
        var customApiKey = parsed.customApiKey;
        var aiProvider = parsed.aiProvider;
      } catch (e) {
        return res.status(400).json({ error: 'Format request tidak valid.' });
      }
    } else {
      data = req.body?.data;
    const customApiKey = req.body?.customApiKey;
    const aiProvider = req.body?.aiProvider;
    }

    if (!data) {
      return res.status(400).json({ error: 'Data form tidak ditemukan.' });
    }
    
    const defaultGeminiKey = process.env.GEMINI_API_KEY;
    const provider = (typeof aiProvider !== 'undefined' ? aiProvider : null) || (typeof req.body === 'string' ? JSON.parse(req.body).aiProvider : req.body?.aiProvider) || 'gemini';
    const cApiKey = (typeof customApiKey !== 'undefined' ? customApiKey : null) || (typeof req.body === 'string' ? JSON.parse(req.body).customApiKey : req.body?.customApiKey);

    if (!cApiKey && !defaultGeminiKey && provider === 'gemini') {
      return res.status(400).json({ error: 'API Key diperlukan.' });
    }
    if (!cApiKey && provider !== 'gemini') {
      return res.status(400).json({ error: 'Custom API Key diperlukan untuk provider ' + provider + '.' });
    }
    const keyToUse = cApiKey || defaultGeminiKey;

    
    
    const isDaring = data.learningMode?.includes('Daring');
    const isBlended = data.learningMode?.includes('Blended');
    const meetingCount = parseInt(data.meetingCount) || 1; 

    // Date formatting
    const docDate = data.documentDate ? new Date(data.documentDate) : new Date();
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const formattedDate = `Palembang, ${docDate.getDate()} ${months[docDate.getMonth()]} ${docDate.getFullYear()}`;

    const isAutoModel = data.learningModel === 'Auto (Biar AI yang memilih)';
    const modelInstruction = isAutoModel 
      ? `Karena guru memilih "Auto", kamu BEBAS MEMILIH model pembelajaran yang paling cocok dengan materi (misalnya PBL, PjBL, Discovery, dll). Tuliskan nama model yang kamu pilih pada tabel DESAIN PEMBELAJARAN di bagian "Model Pembelajaran". Tuliskan SEMUA fasenya secara utuh. Jangan dikurangi.`
      : `Kamu menggunakan model ${data.learningModel}. Tuliskan SEMUA fasenya secara utuh. Jangan dikurangi.`;

    let pengalamanBelajarHTML = '';
    for(let i = 1; i <= meetingCount; i++) {
        const borderColor = i % 3 === 1 ? '#8b5cf6' : (i % 3 === 2 ? '#3b82f6' : '#10b981'); // Purple, Blue, Green
        pengalamanBelajarHTML += `
<div style="border: 1px solid #cbd5e1; border-left: 5px solid ${borderColor}; border-radius: 4px; margin-bottom: 8px; background-color: #fdfdfd; box-shadow: 0 1px 3px rgba(0,0,0,0.05);  padding: 12px;">
  <div style="border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px; margin-bottom: 6px;">
    <p style="font-weight: bold; color: #1e293b; font-size: 10.5pt; margin: 0; text-transform: uppercase;">PERTEMUAN ${i}: [Topik Spesifik Pertemuan ${i}]</p>
  </div>
  
  <p style="font-weight: bold; margin-bottom: 8px; font-size: 10.5pt; color: #0ea5e9;">A. Kegiatan Awal (... Menit)</p>
  <div style="padding-left: 5px; font-size: 10.5pt; margin-bottom: 8px;">
    <ul style="list-style-type: none; margin: 8px 0; padding-left: 0;">
      <li style="margin-bottom: 12px;">
        <div style="margin-bottom: 4px;">
          <b>[Tuliskan Nama Aktivitas Utama]</b>
        </div>
        <ul style="margin: 8px 0 0 0; padding-left: 20px; list-style-type: disc;">
          <li style="margin-bottom: 8px;">Berdoa <b>(... Menit)</b> <span style="background-color: #0ea5e9; color: white; padding: 2px 6px 3px; border-radius: 4px; font-size: 0.85em; font-weight: bold; margin-left: 4px; display: inline-block; white-space: nowrap; vertical-align: middle; line-height: 1;">Mindful Readiness</span></li>
          <li style="margin-bottom: 8px;">Mengisi Absensi <b>(... Menit)</b></li>
          <li style="margin-bottom: 8px;">[Aktivitas apersepsi/pemanasan lain secara spesifik] <b>(... Menit)</b> <span style="background-color: #f97316; color: white; padding: 2px 6px 3px; border-radius: 4px; font-size: 0.85em; font-weight: bold; margin-left: 4px; display: inline-block; white-space: nowrap; vertical-align: middle; line-height: 1;">[Jika relevan, tambahkan label: Joyful / Meaningful / Mindful beserta alasannya, misal: Joyful Gamification]</span></li>
        </ul>
      </li>
    </ul>
  </div>

  <p style="font-weight: bold; margin-bottom: 8px; font-size: 10.5pt; color: #10b981;">B. Kegiatan Inti (... Menit)</p>
  <div style="padding-left: 5px; font-size: 10.5pt; margin-bottom: 8px;">
    <ul style="list-style-type: none; margin: 8px 0; padding-left: 0;">
      [GANTI BAGIAN INI DENGAN SEMUA FASE DARI MODEL PEMBELAJARAN. JABARKAN SETIAP FASE DALAM <li style="margin-bottom: 12px;"> YANG TERPISAH SECARA BERURUTAN.]
      <li style="margin-bottom: 12px;">
        <div style="margin-bottom: 4px;">
          <span style="background-color: #10b981; color: white; padding: 2px 6px 3px; border-radius: 4px; font-size: 0.85em; font-weight: bold; margin-right: 4px; display: inline-block; white-space: nowrap; vertical-align: middle; line-height: 1;">Fase 1: [Nama Fase Pendekatan]</span>
          <b>[Nama Fase Model Pembelajaran]</b>
        </div>
        <ul style="margin: 8px 0 0 0; padding-left: 20px; list-style-type: disc;">
          <li style="margin-bottom: 8px;">[Langkah aktivitas spesifik pertama pada fase ini] <b>(... Menit)</b> <span style="background-color: #f59e0b; color: white; padding: 2px 6px 3px; border-radius: 4px; font-size: 0.85em; font-weight: bold; margin-left: 4px; display: inline-block; white-space: nowrap; vertical-align: middle; line-height: 1;">[Label: Joyful / Meaningful / Mindful (pilih yang paling relevan dengan aktivitas ini)]</span></li>
          <li style="margin-bottom: 8px;">[Langkah aktivitas spesifik kedua pada fase ini] <b>(... Menit)</b></li>
        </ul>
      </li>
      [... Fase-fase berikutnya ...]
    </ul>
  </div>

  <p style="font-weight: bold; margin-bottom: 8px; font-size: 10.5pt; color: #f97316;">C. Kegiatan Penutup (... Menit)</p>
  <div style="padding-left: 5px; font-size: 10.5pt;">
    <ul style="list-style-type: none; margin: 8px 0; padding-left: 0;">
      <li style="margin-bottom: 12px;">
        <div style="margin-bottom: 4px;">
          <b>[Tuliskan Nama Aktivitas Utama Penutup]</b>
        </div>
        <ul style="margin: 8px 0 0 0; padding-left: 20px; list-style-type: disc;">
          <li style="margin-bottom: 8px;">Refleksi pembelajaran <b>(... Menit)</b> <span style="background-color: #f97316; color: white; padding: 2px 6px 3px; border-radius: 4px; font-size: 0.85em; font-weight: bold; margin-left: 4px; display: inline-block; white-space: nowrap; vertical-align: middle; line-height: 1;">Joyful Reflection</span></li>
          <li style="margin-bottom: 8px;">Kesimpulan <b>(... Menit)</b></li>
          <li style="margin-bottom: 8px;">[Tindak lanjut / doa penutup] <b>(... Menit)</b></li>
        </ul>
      </li>
    </ul>
  </div>
</div>
`;
    }

    const prompt = `Bertindaklah sebagai Pakar Pedagogik dan Guru Penggerak. Buatlah Rencana Pembelajaran Mendalam (RPM) berdasarkan data berikut:

- Sekolah: ${data.school}
- Guru: ${data.teacher}
- Mapel: ${data.subject}
- Fase/Kelas: ${data.phase}
- Alokasi Waktu: ${data.duration}
- Materi: ${data.topic}
- Karakteristik Siswa: ${data.studentCharacteristics}
- Moda Pembelajaran: ${data.learningMode}
- Jumlah Pertemuan: ${data.meetingCount}
- Model Pembelajaran: ${data.learningModel}${data.additionalContext ? `\n- Konteks Tambahan: ${data.additionalContext}` : ''}

Kamu WAJIB menyusun dokumen menggunakan HTML murni yang rapi dengan struktur dan styling seperti di bawah ini.
PERHATIAN KETAT: 
1. MENGISI: Isi bagian di dalam kurung siku [...] secara mendetail dan spesifik sesuai dengan materi "${data.topic}". JANGAN HANYA MENYALIN KURUNG SIKU! 
2. FASE MODEL PEMBELAJARAN: Pada bagian "Kegiatan Inti", WAJIB menuliskan SEMUA fase dari model yang dipilih secara mendetail! ${modelInstruction}
3. FORMAT MATEMATIKA: DILARANG MENGGUNAKAN FORMAT LATEX ($\\dots$ ATAU $$\\dots$$) SAMA SEKALI DALAM OUTPUT!! Jika ada rumus matematika atau himpunan, tulis menggunakan karakter teks biasa atau tag HTML (seperti <sub>, <sup>). Hal ini sangat penting karena platform tidak merender LaTeX.
4. MODA PEMBELAJARAN: Karena guru memilih Moda "${data.learningMode}", kamu WAJIB menyesuaikan setting kelas, alat digital, dan interaksinya. ${isDaring ? "Wajib tekankan penggunaan Zoom/Gmeet, Breakout room, atau platform e-learning, materi harus digital interaktif." : ""} ${isBlended ? "Gabungkan pertemuan maya/digital dan mandiri/luring." : ""}
5. JUMLAH PERTEMUAN: Karena guru memilih ${data.meetingCount}, saya SUDAH MENYEDIAKAN kerangka kotak HTML khusus untuk setiap pertemuan. JANGAN DISINGKAT! JABARKAN aktivitas setiap pertemuan secara komprehensif.
6. EMBED VISUAL — WAJIB:
   Di bagian paling bawah RPM (setelah Refleksi), buat bagian khusus:
   <div class="rpm-section-title">LAMPIRAN 3: BAHAN BACAAN & REFERENSI VISUAL</div>
   <p>Berikut referensi visual untuk mendukung kegiatan pembelajaran:</p>

   Untuk SETIAP aktivitas yang mengandung "guru menampilkan gambar/ilustrasi/foto" atau "pertanyaan pemantik":
   <div class="rpm-embed-visual">
     <p><strong>📌 [Nama Aktivitas]</strong></p>
     <p>🔍 <a href="https://www.google.com/search?tbm=isch&q=KEYWORD" target="_blank">Google Images</a></p>
     <p>🎨 <a href="https://www.bing.com/images/create?q=PROMPT" target="_blank">Bing Image Creator</a></p>
     <p><em>Prompt: "PROMPT"</em></p>
   </div>

   Untuk SETIAP aktivitas "guru menayangkan video":
   <div class="rpm-embed-visual">
     <p><strong>▶️ [Nama Aktivitas]</strong></p>
     <p><a href="https://www.youtube.com/results?search_query=KEYWORD" target="_blank">YouTube</a></p>
   </div>

   JANGAN buat untuk aktivitas rutin (salam, doa, absensi). INI ATURAN WAJIB!
6. STRUKTUR PERTEMUAN & MANAJEMEN WAKTU: Di bagian III. PENGALAMAN BELAJAR, saya sudah menyediakan kerangka kotak-kotak. GANTI teks instruksinya dengan aktivitas nyata yang mendetail! Alokasikan waktu dalam hitungan Menit untuk Kegiatan Awal, Inti, dan Penutup secara logis menyesuaikan dengan total alokasi waktu JP. Tulis angkanya di bagian (... Menit)!
7. SINKRONISASI MODEL PEMBELAJARAN: Pada Kegiatan Inti di "Pengalaman Belajar", kamu WAJIB menggunakan Fase/Sintaks dari model pembelajaran ${isAutoModel ? 'yang kamu pilih' : data.learningModel}. Gantikan "[Nama Fase Model]" dengan fase yang sebenarnya, dan urutkan sesuai standar model tersebut. Jika fase lebih dari 3, tambahkan ke dalam HTML dengan format yang serupa.
8. SINKRONISASI ASESMEN & KEGIATAN (SANGAT KRUSIAL!): Asesmen Diagnostik WAJIB SAMA PERSIS (PLEK KETIPLEK) dengan "Pertanyaan Pemantik" yang ada di Kegiatan Awal. Tuliskan ulang pertanyaan pemantik tersebut sebagai soal Asesmen Diagnostik. Asesmen Formatif WAJIB MENGUKUR aktivitas yang sedang dilakukan pada Kegiatan Inti. Asesmen Sumatif (10 Soal per pertemuan, total ${data.meetingCount * 10} soal) WAJIB MENGUJI materi pada Kegiatan Inti. JANGAN ADA YANG BEDA! Masukkan semua soal tersebut ke dalam "Lampiran 2: Instrumen Asesmen dan Rubrik".
9. DEEP LEARNING LABELS: Kamu WAJIB menyematkan label span warna-warni (Joyful / Meaningful / Mindful) SECARA SELEKTIF di sebelah kanan teks menit <b>(... Menit)</b> pada aktivitas yang relevan di Kegiatan Awal, Inti, dan Penutup. Jangan taruh di semua aktivitas, pilih aktivitas yang benar-benar menggambarkan salah satu elemen tersebut.
10. FORMAT KELUARAN: KELUARKAN LANGSUNG KODE HTML-NYA TANPA BUNGKUSAN MARKDOWN (JANGAN GUNAKAN \`\`\`html ATAU \`\`\`). KELUARKAN RAW HTML SECARA LANGSUNG.
11. STYLE & FONT: Pastikan setiap elemen HTML mengikuti style yang diberikan. Jangan menggunakan HURUF KAPITAL SEMUA pada isi materi (gunakan huruf kapital hanya pada awal kalimat, nama diri, atau judul utama). Cukup bungkus awal jawabanmu dengan div font Arial 10.5pt dan berikan border solid hitam 1px pada tabel dengan border-collapse.
12. FORMAT LIST: WAJIB gunakan tag HTML <ul> dan <li> atau <ol> dan <li> untuk membuat daftar/list (bullet/number) dengan rapi, berikan spasi margin-left secukupnya jika bersarang. JANGAN menggunakan tanda bintang (*) atau strip (-) sebagai bullet point manual.${data.additionalContext ? `\n13. KONTEKS TAMBAHAN (SANGAT PENTING): ${data.additionalContext}. Seluruh hasil generate Rencana Pembelajaran Mendalam (RPM) ini HARUS mengintegrasikan konteks tambahan tersebut. Ini TIDAK HANYA mencakup pertanyaan pemantik, TETAPI JUGA seluruh materi pembelajaran, studi kasus, skenario, contoh-contoh kehidupan sehari-hari yang diberikan, aktivitas pada kegiatan inti, hingga butir soal asesmen formatif dan sumatif. Pastikan keseluruhan RPM terasa sangat kontekstual dengan kejadian di sekitar siswa.` : ''}

Gunakan persis kerangka HTML ini, dan JANGAN tambahkan markdown code block (\`\`\`html) di awal atau akhir jawaban:

<div style="font-family: 'Space Grotesk', sans-serif; font-size: 10.5pt; line-height: 1.35; color: #000; text-align: justify;">
<div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 8px;">
    <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/Logo_Palembang.png" alt="Logo Kiri" style="height: 90px; width: auto; object-fit: contain;">
    <div style="text-align: center; flex: 1; padding: 0 15px;">
        <h3 style="margin: 0; font-size: 1.2em; font-family: 'IBM Plex Sans', sans-serif;">PEMERINTAH KOTA PALEMBANG</h3>
        <h3 style="margin: 0; font-size: 1.2em; font-family: 'IBM Plex Sans', sans-serif;">DINAS PENDIDIKAN</h3>
        <h3 style="margin: 0; font-size: 1.4em; font-weight: bold; font-family: 'IBM Plex Sans', sans-serif;">SMP NEGERI 58 PALEMBANG</h3>
        <p style="margin: 5px 0 0 0; font-size: 8pt;"><i>Alamat: Jl. Komering II, Kel. Demang Lebar Daun, Kec. Ilir Barat I, Kota Palembang 30137</i></p>
    </div>
    <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/logo58.png" alt="Logo Kanan" style="height: 90px; width: auto; object-fit: contain;">
</div>

<div style="background-color: #2c3e50; color: white; padding: 12px; text-align: center; font-weight: bold; margin-bottom: 8px; font-size: 1.1em; border-radius: 4px; font-family: 'IBM Plex Sans', sans-serif;">
    RENCANA PEMBELAJARAN MODUL (RPM) / MODUL AJAR DARING<br/>
    BERBASIS DEEP LEARNING (MINDFUL, MEANINGFUL, JOYFUL LEARNING)
</div>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10.5pt; border: 1px solid #000;">
  <tr>
    <td style="font-weight: bold; padding: 4px 6px; border: 1px solid #000; width: 18%;">Satuan Pendidikan</td>
    <td style="padding: 4px 6px; border: 1px solid #000; width: 32%;">${data.school}</td>
    <td style="font-weight: bold; padding: 4px 6px; border: 1px solid #000; width: 18%;">Mata Pelajaran</td>
    <td style="padding: 4px 6px; border: 1px solid #000; width: 32%;">${data.subject}</td>
  </tr>
  <tr>
    <td style="font-weight: bold; padding: 4px 6px; border: 1px solid #000;">Fase / Kelas</td>
    <td style="padding: 4px 6px; border: 1px solid #000;">${data.phase}</td>
    <td style="font-weight: bold; padding: 4px 6px; border: 1px solid #000;">Semester / TA</td>
    <td style="padding: 4px 6px; border: 1px solid #000;">Ganjil / 2026/2027</td>
  </tr>
  <tr>
    <td style="font-weight: bold; padding: 4px 6px; border: 1px solid #000;">Nama Guru</td>
    <td style="padding: 4px 6px; border: 1px solid #000;">${data.teacher}</td>
    <td style="font-weight: bold; padding: 4px 6px; border: 1px solid #000;">NIP Guru</td>
    <td style="padding: 4px 6px; border: 1px solid #000;">${data.teacherNip}</td>
  </tr>
  <tr>
    <td style="font-weight: bold; padding: 4px 6px; border: 1px solid #000;">Kepala Sekolah</td>
    <td style="padding: 4px 6px; border: 1px solid #000;">${data.headmaster}</td>
    <td style="font-weight: bold; padding: 4px 6px; border: 1px solid #000;">NIP Kepala Sekolah</td>
    <td style="padding: 4px 6px; border: 1px solid #000;">${data.headmasterNip}</td>
  </tr>
  <tr>
    <td style="font-weight: bold; padding: 4px 6px; border: 1px solid #000;">Elemen Utama</td>
    <td style="padding: 4px 6px; border: 1px solid #000;">${data.topic}</td>
    <td style="font-weight: bold; padding: 4px 6px; border: 1px solid #000;">Alokasi Waktu</td>
    <td style="padding: 4px 6px; border: 1px solid #000;">${data.duration} (${data.meetingCount}x Pertemuan)</td>
  </tr>
  <tr>
    <td style="font-weight: bold; padding: 4px 6px; border: 1px solid #000;">Moda Pembelajaran</td>
    <td style="padding: 4px 6px; border: 1px solid #000;">${data.learningMode}</td>
    <td style="font-weight: bold; padding: 4px 6px; border: 1px solid #000;">Tanggal Dokumen</td>
    <td style="padding: 4px 6px; border: 1px solid #000;">${formattedDate}</td>
  </tr>
</table>
</div>

<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  I. IDENTIFIKASI
</div>
<div style="overflow-x: auto; margin-bottom: 8px;">
<table style="width: 100%; border-collapse: collapse; min-width: 600px; border: 1px solid #000; font-size: 10.5pt;">
  <tr style="border-bottom: 1px solid #000;">
    <td style="font-weight: bold; width: 30%; background-color: #f8fafc; padding: 4px 6px; border-right: 1px solid #000;">Peserta Didik</td>
    <td style="padding: 4px 6px;">${data.studentCharacteristics}</td>
  </tr>
  <tr style="border-bottom: 1px solid #000;">
    <td style="font-weight: bold; background-color: #f8fafc; padding: 4px 6px; border-right: 1px solid #000;">Materi Pelajaran</td>
    <td style="padding: 4px 6px;">${data.topic}</td>
  </tr>
  <tr>
    <td style="font-weight: bold; background-color: #f8fafc; padding: 4px 6px; border-right: 1px solid #000;">Dimensi Profil Lulusan</td>
    <td style="padding: 4px 6px;">[Sebutkan Dimensi Profil Pelajar Pancasila yang relevan]</td>
  </tr>
</table>
</div>

<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  II. DESAIN PEMBELAJARAN
</div>
<div style="overflow-x: auto; margin-bottom: 8px;">
<table style="width: 100%; border-collapse: collapse; min-width: 600px; border: 1px solid #000; font-size: 10.5pt;">
  <tr style="border-bottom: 1px solid #000;">
    <td style="font-weight: bold; width: 30%; background-color: #f8fafc; padding: 4px 6px; border-right: 1px solid #000;">Capaian Pembelajaran</td>
    <td style="padding: 4px 6px;">[Uraikan Capaian Pembelajaran]</td>
  </tr>
  <tr style="border-bottom: 1px solid #000;">
    <td style="font-weight: bold; background-color: #f8fafc; padding: 4px 6px; border-right: 1px solid #000;">Lintas Disiplin Ilmu</td>
    <td style="padding: 4px 6px;">[Sebutkan Lintas Disiplin Ilmu yang terkait]</td>
  </tr>
  <tr style="border-bottom: 1px solid #000;">
    <td style="font-weight: bold; background-color: #f8fafc; padding: 4px 6px; border-right: 1px solid #000;">Tujuan Pembelajaran</td>
    <td style="padding: 4px 6px;">[Tuliskan Tujuan Pembelajaran]</td>
  </tr>
  <tr style="border-bottom: 1px solid #000;">
    <td style="font-weight: bold; background-color: #f8fafc; padding: 4px 6px; border-right: 1px solid #000;">Topik Pembelajaran</td>
    <td style="padding: 4px 6px;">${data.topic}</td>
  </tr>
  <tr style="border-bottom: 1px solid #000;">
    <td style="font-weight: bold; background-color: #f8fafc; padding: 4px 6px; border-right: 1px solid #000; vertical-align: top;">Praktek Pedagogis</td>
    <td style="padding: 4px 6px;">
      <b>a. Model:</b> ${isAutoModel ? '[Tuliskan model pembelajaran yang AI pilih di sini]' : data.learningModel}<br/>
      <b>b. Strategi:</b> [Sebutkan Strategi]<br/>
      <b>c. Metode:</b> [Sebutkan Metode]
    </td>
  </tr>
  <tr style="border-bottom: 1px solid #000;">
    <td style="font-weight: bold; background-color: #f8fafc; padding: 4px 6px; border-right: 1px solid #000;">Kemitraan Pembelajaran</td>
    <td style="padding: 4px 6px;">[Jelaskan Kemitraan Pembelajaran]</td>
  </tr>
  <tr style="border-bottom: 1px solid #000;">
    <td style="font-weight: bold; background-color: #f8fafc; padding: 4px 6px; border-right: 1px solid #000;">Lingkungan Pembelajaran</td>
    <td style="padding: 4px 6px;">[Jelaskan setting yang digunakan yang spesifik untuk moda ${data.learningMode}]</td>
  </tr>
  <tr>
    <td style="font-weight: bold; background-color: #f8fafc; padding: 4px 6px; border-right: 1px solid #000;">Pemanfaatan Digital</td>
    <td style="padding: 4px 6px;">[Alat digital spesifik yang digunakan, sesuaikan dengan moda ${data.learningMode}]</td>
  </tr>
</table>
</div>

<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  III. PENGALAMAN BELAJAR
</div>
${pengalamanBelajarHTML}

<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  IV. ASESMEN PEMBELAJARAN
</div>
<div style="overflow-x: auto; margin-bottom: 8px;">
<table style="width: 100%; border-collapse: collapse; min-width: 600px; border: 2px solid #000;">
  <tr style="background-color: #f8fafc;">
    <th style="padding: 6px 8px; text-align: left; border: 1px solid #000;">Jenis Asesmen</th>
    <th style="padding: 6px 8px; text-align: left; border: 1px solid #000;">Bentuk Asesmen</th>
    <th style="padding: 6px 8px; text-align: left; border: 1px solid #000;">Keterangan</th>
  </tr>
  <tr>
    <td style="padding: 6px 8px; border: 1px solid #000;">Asesmen Awal (Diagnostik)</td>
    <td style="padding: 6px 8px; border: 1px solid #000;">[Bentuk asesmen awal]</td>
    <td style="padding: 6px 8px; border: 1px solid #000;">[Tujuan asesmen awal]</td>
  </tr>
  <tr>
    <td style="padding: 6px 8px; border: 1px solid #000;">Asesmen Proses (Formatif)</td>
    <td style="padding: 6px 8px; border: 1px solid #000;">[Bentuk asesmen proses]</td>
    <td style="padding: 6px 8px; border: 1px solid #000;">[Fokus observasi/rubrik]</td>
  </tr>
  <tr>
    <td style="padding: 6px 8px; border: 1px solid #000;">Asesmen Akhir (Sumatif)</td>
    <td style="padding: 6px 8px; border: 1px solid #000;">[Bentuk asesmen akhir]</td>
    <td style="padding: 6px 8px; border: 1px solid #000;">[Mengukur ketercapaian TP]</td>
  </tr>
</table>
</div>

<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  V. REFLEKSI
</div>
<p><b>A. Refleksi Pendidik</b></p>
<ol style="margin-bottom: 8px;">
  <li>[Pertanyaan refleksi kritis 1 untuk guru]</li>
  <li>[Pertanyaan refleksi kritis 2 untuk guru]</li>
</ol>
<p><b>B. Refleksi Peserta Didik</b></p>
<ol style="margin-bottom: 8px;">
  <li>[Pertanyaan refleksi 1 untuk siswa]</li>
  <li>[Pertanyaan refleksi 2 untuk siswa]</li>
</ol>

<div style="display: flex; justify-content: space-between; margin-top: 20px; margin-bottom: 10px; text-align: center; padding: 0 20px; page-break-inside: avoid;">
  <div>
    <p style="margin: 0;">Mengetahui,</p>
    <p style="margin: 0;"><b>Kepala ${data.school}</b></p>
    <div style="height: 70px;"></div>
    <p style="text-decoration: underline; font-weight: bold; margin: 0;">${data.headmaster || '_____________________'}</p>
    <p style="margin: 0;">NIP. ${data.headmasterNip || '__________________'}</p>
  </div>
  <div>
    <p style="margin: 0;">Palembang, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
    <p style="margin: 0;"><b>Guru Mata Pelajaran</b></p>
    <div style="height: 70px;"></div>
    <p style="text-decoration: underline; font-weight: bold; margin: 0;">${data.teacher}</p>
    <p style="margin: 0;">NIP. ${data.teacherNip || '__________________'}</p>
  </div>
</div>

<div style="page-break-before: always; margin-top: 40px;"></div>

<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  Lampiran 1: Lembar Kerja Peserta Didik (LKPD)
</div>
<div style="border: 1px solid #000; padding: 15px; margin-bottom: 8px;">
  <p style="text-align: center; font-weight: bold; font-size: 1.1em; margin-bottom: 8px;">LEMBAR KERJA PESERTA DIDIK (LKPD)</p>
  <p><b>Topik:</b> ${data.topic}</p>
  <p><b>Tujuan:</b> [Tuliskan tujuan LKPD]</p>
  <p><b>Instruksi Kerja:</b></p>
  <ol style="margin-bottom: 8px;">
    <li>[Instruksi 1]</li>
    <li>[Instruksi 2]</li>
    <li>[Instruksi 3]</li>
  </ol>
  <p><b>Tugas:</b></p>
  <p>[Uraikan tugas/soal/aktivitas yang harus dikerjakan siswa secara mendetail]</p>
</div>

<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  Lampiran 2: Instrumen Asesmen dan Rubrik
</div>
[GANTI BAGIAN INI DENGAN INSTRUMEN ASESMEN YANG SANGAT LENGKAP SESUAI INSTRUKSI!
PENTING UNTUK LAMPIRAN 2: Kamu WAJIB membagi Lampiran 2 menjadi 3 sub-bagian (A. Asesmen Diagnostik, B. Asesmen Formatif, C. Asesmen Sumatif). 
SETIAP sub-bagian WAJIB dibungkus dengan kotak bergaris hitam dan judul teks berwarna biru. Gunakan struktur HTML berikut untuk setiap sub-bagian:
<div style="border: 1px solid #000; padding: 15px; margin-bottom: 15px; border-radius: 0 0 4px 4px;">
  <h4 style="color: #1a4185; margin-top: 0; margin-bottom: 10px; font-family: 'IBM Plex Sans', sans-serif; text-transform: uppercase;">A. INSTRUMEN ASESMEN DIAGNOSTIK</h4>
  [Isi asesmen diagnostik...]
</div>
(Lakukan hal yang sama untuk B. RUBRIK ASESMEN FORMATIF dan C. INSTRUMEN ASESMEN SUMATIF)

- Tuliskan soal Asesmen Diagnostik.
- Tuliskan Rubrik/Soal Asesmen Formatif untuk MASING-MASING pertemuan (Pertemuan 1, Pertemuan 2, dst). Gunakan <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;"> untuk rubrik agar rapi (pastikan SEMUA <th> dan <td> memiliki style="border: 1px solid #000; padding: 6px 8px;"), dan WAJIB tambahkan penjelasan rumus/cara perhitungan nilainya di bawah setiap tabel rubrik.
- Tuliskan Asesmen Sumatif (TOTAL ${data.meetingCount * 10} SOAL, yaitu 10 Soal per Pertemuan). UNTUK SOAL PILIHAN GANDA: Pastikan penomoran soal menggunakan tag <ol> atau format "1. " yang jelas agar angkanya muncul. Opsi jawaban (A, B, C, D) WAJIB disusun menurun (vertikal) per baris (misal menggunakan <ol type="A">), JANGAN dicampur menyamping dari kiri ke kanan. WAJIB sertakan KUNCI JAWABAN (dicetak tebal) di bagian akhir daftar soal pilihan ganda. Kunci jawaban INI WAJIB DIBUNGKUS DALAM <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;"> TERSENDIRI (dengan <th> dan <td> bergaris border solid 1px #000) agar terlihat rapi dan berkotak.
Gunakan tag HTML seperti <b>, <p>, <ul>, <ol>, <table> untuk menatanya agar rapi. PASTIKAN SEMUA <table> memiliki <div style="overflow-x: auto;"> di luarnya agar responsif dan memiliki atribut border yang jelas!]

<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  Lampiran 3: Bahan Bacaan / Materi Pengayaan
</div>
<div style="border: 1px solid #000; padding: 15px; margin-bottom: 8px;">
  <p>[Tuliskan ringkasan materi singkat atau tautan sumber belajar tambahan untuk guru/siswa]</p>
</div>

<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  Lampiran 4: Jurnal Refleksi Diri
</div>
<table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
  <tr>
    <td style="padding: 15px; text-align: center; font-style: italic;">
      [Buat kotak isian / skala emotikon / pertanyaan singkat agar siswa bisa menuliskan refleksinya]
    </td>
  </tr>
</table>
</div>`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('Cache-Control', 'no-cache, no-transform');

      if (provider === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: keyToUse });
        const responseStream = await ai.models.generateContentStream({
          model: 'gemini-3.6-flash',
          contents: prompt,
        });
        for await (const chunk of responseStream) {
          if (chunk.text) {
            res.write(chunk.text);
          }
        }
      } else if (provider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': keyToUse,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 4000,
            messages: [{ role: 'user', content: prompt }],
            stream: true
          })
        });
        
        if (!response.ok) {
          const text = await response.text();
          throw new Error('Anthropic API error: ' + text);
        }
        
        const reader = response.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'content_block_delta' && data.delta?.text) {
                    res.write(data.delta.text);
                  }
                } catch (e) {}
              }
            }
          }
        }
      } else {
        // OpenAI-compatible providers
        let baseURL = undefined;
        let modelName = '';
        
        if (provider === 'groq') {
          baseURL = 'https://api.groq.com/openai/v1';
          modelName = 'llama-3.3-70b-versatile';
        } else if (provider === 'openai') {
          modelName = 'gpt-4o-mini';
        } else if (provider === 'deepseek') {
          baseURL = 'https://api.deepseek.com/v1';
          modelName = 'deepseek-chat';
        } else if (provider === 'odysseus') {
          baseURL = 'https://api.odysseus.ai/v1';
          modelName = 'odysseus-model';
        } else if (provider === 'grok') {
          baseURL = 'https://api.x.ai/v1';
          modelName = 'grok-2-latest';
        } else if (provider === 'qwen') {
          baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
          modelName = 'qwen-plus';
        }
        
        const openai = new OpenAI({ apiKey: keyToUse, baseURL });
        const responseStream = await openai.chat.completions.create({
          model: modelName,
          messages: [{ role: 'user', content: prompt }],
          stream: true
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
    console.error('Error generating RPM:', error);
    res.status(500).json({ error: 'Gagal membuat RPM. Silakan coba lagi. Detail: ' + (error.message || 'Unknown error') });
  }
}


export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
