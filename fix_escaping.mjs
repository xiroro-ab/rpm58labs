import fs from 'fs';

let code = fs.readFileSync('api/generate.ts', 'utf8');

// I will fix the backticks in the prompt template in generate.ts
// by finding all backticks between the start and end of the prompt and escaping them properly.
// A better way is to just read the file, extract the bad part, and fix it.
// Actually, it's easier to rewrite generate.ts again properly using stringify or careful replacement.

const newPromptTemplate = `Anda adalah seorang ahli pendidikan yang membuat Rencana Pelaksanaan Pembelajaran (RPP) atau Modul Ajar (RPM) Kurikulum Merdeka yang sangat terstruktur, profesional, dan akurat.
Buatlah RPM untuk data berikut:

- **Sekolah:** \${data.school}
- **Mata Pelajaran:** \${data.subject}
- **Fase/Kelas:** \${data.phase}
- **Semester:** \${data.semester}
- **Alokasi Waktu:** \${data.timeAllocation} (Jumlah Pertemuan: \${data.meetingCount})
- **Topik/Materi:** \${data.topic}
- **Model Pembelajaran:** \${data.learningModel}

INSTRUKSI FORMAT DAN ISI (SANGAT PENTING):
1. **STRUKTUR HARUS MENGIKUTI TEMPLATE DI BAWAH INI SECARA PERSIS**.
2. **JABARKAN SETIAP FASE MODEL PEMBELAJARAN**: Pada bagian "Kegiatan Inti", Anda WAJIB menjabarkan SETIAP fase dari model \${data.learningModel} secara utuh dan terpisah pada \\\`<li style="margin-bottom: 12px;">\\\`. Tidak boleh ada fase yang dikurangi atau digabung.
3. **ASESMEN SUMATIF (SANGAT PENTING)**:
   - Buatlah TOTAL \${data.meetingCount * 10} SOAL PILIHAN GANDA (berarti 10 soal per pertemuan).
   - **PENOMORAN WAJIB**: Menggunakan tag \\\`<ol>\\\` atau format "1. " yang jelas.
   - **OPSI JAWABAN**: (A, B, C, D) wajib menurun secara vertikal atau dibungkus dalam tag \\\`<table>\\\` jika ingin menyamping.
   - **KUNCI JAWABAN**: WAJIB menyertakan KUNCI JAWABAN (dicetak tebal) di bagian akhir daftar soal pilihan ganda.
4. Jangan gunakan markdown code block (\\\`\\\`\\\`html) di awal atau akhir jawaban. Langsung berikan HTML-nya.
5. Gunakan font 'Space Grotesk' dan 'text-align: justify;' untuk kontainer utama.
6. Pembungkus utama untuk bagian "Kegiatan Awal", "Kegiatan Inti", dan "Kegiatan Penutup" WAJIB menggunakan \\\`<ul style="list-style-type: none; margin: 8px 0; padding-left: 0;">\\\` (bukan \\\`<ol>\\\`) agar penomoran otomatis tidak bertabrakan dengan bullet/numbering di dalamnya.

TEMPLATE HTML YANG WAJIB DIGUNAKAN (Isi bagian di dalam kurung siku [...] dengan konten yang relevan):

<div class="rpm-content-wrapper" style="text-align: justify; font-family: 'Space Grotesk', sans-serif; line-height: 1.6; color: #000; font-size: 11pt;">

<div class="kop-surat" style="text-align: center; border-bottom: 3px double #000; margin-bottom: 20px; padding-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
  <div style="width: 80px;">
    <img src="\${data.logoLeft || 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Logo_Tut_Wuri_Handayani.png'}" alt="Logo 1" style="width: 70px; height: auto;" />
  </div>
  <div style="flex-1; text-align: center;">
    <h3 style="margin: 0; font-size: 8pt; font-weight: bold; text-transform: uppercase;">PEMERINTAH \${data.city || '[KOTA/KABUPATEN]'}</h3>
    <h3 style="margin: 0; font-size: 8pt; font-weight: bold; text-transform: uppercase;">DINAS PENDIDIKAN</h3>
    <h2 style="margin: 5px 0; font-size: 16pt; font-weight: bold; text-transform: uppercase;">\${data.school}</h2>
    <p style="margin: 0; font-size: 8pt;">\${data.schoolAddress || '[Alamat Sekolah, Kodepos, Telp, Website, Email]'}</p>
  </div>
  <div style="width: 80px;">
    <img src="\${data.logoRight || 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Logo_Tut_Wuri_Handayani.png'}" alt="Logo 2" style="width: 70px; height: auto; \${!data.logoRight ? 'visibility: hidden;' : ''}" />
  </div>
</div>

<h3 style="text-align: center; margin-bottom: 20px; text-decoration: underline; font-family: 'IBM Plex Sans', sans-serif;">MODUL AJAR / RENCANA PELAKSANAAN PEMBELAJARAN</h3>

<table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
  <tr><td style="width: 25%; font-weight: bold; vertical-align: top;">Nama Sekolah</td><td style="width: 2%; vertical-align: top;">:</td><td style="vertical-align: top;">\${data.school}</td></tr>
  <tr><td style="font-weight: bold; vertical-align: top;">Mata Pelajaran</td><td style="vertical-align: top;">:</td><td style="vertical-align: top;">\${data.subject}</td></tr>
  <tr><td style="font-weight: bold; vertical-align: top;">Fase / Kelas</td><td style="vertical-align: top;">:</td><td style="vertical-align: top;">\${data.phase}</td></tr>
  <tr><td style="font-weight: bold; vertical-align: top;">Semester</td><td style="vertical-align: top;">:</td><td style="vertical-align: top;">\${data.semester}</td></tr>
  <tr><td style="font-weight: bold; vertical-align: top;">Alokasi Waktu</td><td style="vertical-align: top;">:</td><td style="vertical-align: top;">\${data.timeAllocation} (\${data.meetingCount} Pertemuan)</td></tr>
  <tr><td style="font-weight: bold; vertical-align: top;">Topik / Materi</td><td style="vertical-align: top;">:</td><td style="vertical-align: top;">\${data.topic}</td></tr>
  <tr><td style="font-weight: bold; vertical-align: top;">Model Pembelajaran</td><td style="vertical-align: top;">:</td><td style="vertical-align: top;">\${data.learningModel}</td></tr>
</table>

<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  I. KOMPONEN INTI
</div>
<p><b>A. Tujuan Pembelajaran</b></p>
<ol style="margin-bottom: 8px;">
  <li>[Tuliskan tujuan pembelajaran]</li>
</ol>

<p><b>B. Profil Pelajar Pancasila</b></p>
<ul style="margin-bottom: 8px;">
  <li>[Dimensi: Penjelasan]</li>
</ul>

<p><b>C. Pemahaman Bermakna</b></p>
<p style="margin-bottom: 8px;">[Tuliskan pemahaman bermakna]</p>

<p><b>D. Pertanyaan Pemantik</b></p>
<ul style="margin-bottom: 15px;">
  <li>[Pertanyaan pemantik]</li>
</ul>

<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  II. KEGIATAN PEMBELAJARAN
</div>
[UNTUK SETIAP PERTEMUAN (Pertemuan 1 sampai \${data.meetingCount}), BUATKAN STRUKTUR BERIKUT:]
<div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 15px; border-radius: 4px;">
  <p style="font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-top: 0;">Pertemuan [X]: [Sub-Topik Spesifik]</p>
  
  <ul style="list-style-type: none; margin: 8px 0; padding-left: 0;">
    <li><b>1. Kegiatan Awal (±15 Menit)</b>
      <ul style="list-style-type: none; margin: 8px 0; padding-left: 0;">
        <li>- [Aktivitas orientasi/apersepsi/motivasi]</li>
      </ul>
    </li>
    
    <li><b>2. Kegiatan Inti (±[X] Menit)</b> - <i>Model: \${data.learningModel}</i>
      <ul style="list-style-type: none; margin: 8px 0; padding-left: 0;">
        [JABARKAN SETIAP FASE MODEL \${data.learningModel} SECARA UTUH DAN TERPISAH MENGGUNAKAN \\\`<li style="margin-bottom: 12px;">\\\`. CONTOH: <li style="margin-bottom: 12px;"><b>Fase 1: ...</b><br/>...</li>]
      </ul>
    </li>
    
    <li><b>3. Kegiatan Penutup (±15 Menit)</b>
      <ul style="list-style-type: none; margin: 8px 0; padding-left: 0;">
        <li>- [Aktivitas kesimpulan/refleksi/tindak lanjut]</li>
      </ul>
    </li>
  </ul>
</div>

<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  III. ASESMEN (PENILAIAN)
</div>
<ol style="margin-bottom: 15px;">
  <li><b>Asesmen Diagnostik:</b> [Bentuk asesmen]</li>
  <li><b>Asesmen Formatif:</b> [Bentuk asesmen]</li>
  <li><b>Asesmen Sumatif:</b> [Bentuk asesmen akhir]</li>
</ol>

<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  IV. MEDIA DAN SUMBER BELAJAR
</div>
<ul style="margin-bottom: 15px;">
  <li><b>Media:</b> [Media]</li>
  <li><b>Sumber Belajar:</b> [Sumber]</li>
</ul>

<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  V. REFLEKSI
</div>
<p><b>A. Refleksi Pendidik</b></p>
<ol style="margin-bottom: 8px;">
  <li>[Pertanyaan refleksi]</li>
</ol>
<p><b>B. Refleksi Peserta Didik</b></p>
<ol style="margin-bottom: 8px;">
  <li>[Pertanyaan refleksi]</li>
</ol>

<div style="display: flex; justify-content: space-between; margin-top: 30px; margin-bottom: 20px; text-align: center; padding: 0 20px; page-break-inside: avoid;">
  <div>
    <p style="margin: 0;">Mengetahui,</p>
    <p style="margin: 0;"><b>Kepala Sekolah</b></p>
    <div style="height: 120px;"></div>
    <p style="text-decoration: underline; font-weight: bold; margin: 0;">\${data.headmaster || '_____________________'}</p>
    <p style="margin: 0;">NIP. \${data.headmasterNip || '__________________'}</p>
  </div>
  <div>
    <p style="margin: 0;">\${data.city || '......................'}, \${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
    <p style="margin: 0;"><b>Guru Mata Pelajaran</b></p>
    <div style="height: 120px;"></div>
    <p style="text-decoration: underline; font-weight: bold; margin: 0;">\${data.teacher || '_____________________'}</p>
    <p style="margin: 0;">NIP. \${data.teacherNip || '__________________'}</p>
  </div>
</div>

<div style="page-break-before: always; margin-top: 40px;"></div>
<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  Lampiran 1: Lembar Kerja Peserta Didik (LKPD)
</div>
<div style="border: 1px solid #000; padding: 15px; margin-bottom: 8px;">
  <p style="text-align: center; font-weight: bold; font-size: 1.1em; margin-bottom: 8px;">LEMBAR KERJA PESERTA DIDIK (LKPD)</p>
  <p><b>Topik:</b> \${data.topic}</p>
  <p><b>Tujuan:</b> [Tuliskan tujuan LKPD]</p>
  <p><b>Instruksi Kerja:</b></p>
  <ol style="margin-bottom: 8px;">
    <li>[Instruksi]</li>
  </ol>
  <p><b>Tugas:</b></p>
  <p>[Uraikan tugas/soal/aktivitas yang harus dikerjakan siswa secara mendetail]</p>
</div>

<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  Lampiran 2: Instrumen Asesmen dan Rubrik
</div>
[Tuliskan Asesmen Sumatif (TOTAL \${data.meetingCount * 10} SOAL, yaitu 10 Soal per Pertemuan). UNTUK SOAL PILIHAN GANDA: Pastikan penomoran soal menggunakan tag <ol> atau format "1. " yang jelas agar angkanya muncul. Opsi jawaban (A, B, C, D) WAJIB disusun menurun (vertikal) per baris, JANGAN dicampur menyamping dari kiri ke kanan. Jika ingin menyamping, WAJIB dibungkus dalam tag <table> agar rapi. WAJIB sertakan KUNCI JAWABAN (dicetak tebal) dengan jelas di bagian akhir daftar soal pilihan ganda.]

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

</div>
`;

let startIdx = code.indexOf('const prompt = `');
let endIdx = code.indexOf('`;', startIdx);
if (startIdx !== -1 && endIdx !== -1) {
  let newCode = code.substring(0, startIdx) + 'const prompt = `' + newPromptTemplate + code.substring(endIdx);
  fs.writeFileSync('api/generate.ts', newCode);
  console.log("Replaced prompt in api/generate.ts successfully!");
} else {
  console.log("Could not find prompt boundaries.");
}
