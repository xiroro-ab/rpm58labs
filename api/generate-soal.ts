import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

// ============================================================
// LEMBAR SOAL & KUNCI JAWABAN - streaming hasil AI langsung seperti RPM.
// Server menulis KOP + IDENTITAS + JUDUL + PETUNJUK halaman pertama,
// lalu AI melanjutkan menulis: soal per pertemuan (siswa), kemudian
// halaman baru untuk GURU (kunci jawaban + pedoman penskoran).
// ============================================================

function escapeHtml(s: any): string {
  if (s === null || s === undefined) return '';
  return String(s);
}

function kopSurat(): string {
  return `
  <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 12px; page-break-after: avoid;">
    <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/Logo_Palembang.png" alt="Logo Kiri" style="height: 90px; width: auto; object-fit: contain;">
    <div style="text-align: center; flex: 1; padding: 0 15px;">
      <h3 style="margin: 0; font-size: 14pt; font-family: 'IBM Plex Sans', sans-serif;">PEMERINTAH KOTA PALEMBANG</h3>
      <h3 style="margin: 0; font-size: 14pt; font-family: 'IBM Plex Sans', sans-serif;">DINAS PENDIDIKAN</h3>
      <h3 style="margin: 0; font-size: 16pt; font-weight: bold; font-family: 'IBM Plex Sans', sans-serif;">SMP NEGERI 58 PALEMBANG</h3>
      <div style="display: flex; justify-content: center; width: 100%;"><p style="margin: 5px 0 0 0; font-size: 8pt; font-style: italic;"><i>Jl. Komering II, Kel. Demang Lebar Daun, Kec. Ilir Barat I, Kota Palembang 30137</i></p></div>
    </div>
    <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/logo58.png" alt="Logo Kanan" style="height: 90px; width: auto; object-fit: contain;">
  </div>`;
}

function identitas(formData: any, formattedDate: string): string {
  const val = (v: any) => escapeHtml(v || '');
  return `
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10pt; border: 1px solid #000; page-break-inside: avoid;">
    <tr>
      <td style="font-weight: bold; padding: 5px 8px; border: 1px solid #000; width: 20%; background-color: #f8fafc;">Satuan Pendidikan</td>
      <td style="padding: 5px 8px; border: 1px solid #000; width: 30%;">${val(formData?.school)}</td>
      <td style="font-weight: bold; padding: 5px 8px; border: 1px solid #000; width: 20%; background-color: #f8fafc;">Mata Pelajaran</td>
      <td style="padding: 5px 8px; border: 1px solid #000; width: 30%;">${val(formData?.subject)}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; padding: 5px 8px; border: 1px solid #000; background-color: #f8fafc;">Fase / Kelas</td>
      <td style="padding: 5px 8px; border: 1px solid #000;">${val(formData?.phase)}</td>
      <td style="font-weight: bold; padding: 5px 8px; border: 1px solid #000; background-color: #f8fafc;">Alokasi Waktu</td>
      <td style="padding: 5px 8px; border: 1px solid #000;">${val(formData?.duration)}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; padding: 5px 8px; border: 1px solid #000; background-color: #f8fafc;">Nama Guru</td>
      <td style="padding: 5px 8px; border: 1px solid #000;">${val(formData?.teacher)}</td>
      <td style="font-weight: bold; padding: 5px 8px; border: 1px solid #000; background-color: #f8fafc;">Moda Pembelajaran</td>
      <td style="padding: 5px 8px; border: 1px solid #000;">${val(formData?.learningMode)}</td>
    </tr>
  </table>`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const { rpmHtml, formData, customApiKey, aiProvider } = body || {};
    if (!rpmHtml) return res.status(400).json({ error: 'RPM HTML diperlukan.' });

    const defaultGeminiKey = process.env.GEMINI_API_KEY;
    const provider = aiProvider || 'gemini';
    const keyToUse = customApiKey || defaultGeminiKey;
    if (!keyToUse) return res.status(500).json({ error: 'API Key diperlukan.' });

    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const docDate = formData?.documentDate ? new Date(formData.documentDate) : new Date();
    const formattedDate = `Palembang, ${docDate.getDate()} ${months[docDate.getMonth()]} ${docDate.getFullYear()}`;

    const subjectUpper = escapeHtml(formData?.subject || 'MAPEL').toUpperCase();
    const phaseLabel = escapeHtml(formData?.phase || '');

    // Bagian yang ditulis SERVER lebih dulu (stabil, tidak dikerjakan AI):
    // kop + identitas + judul + petunjuk. AI hanya menyambung menulis soal.
    const header1 = `
<div style="font-family: 'Space Grotesk', sans-serif; font-size: 10.5pt; line-height: 1.35; color: #000; text-align: justify;">
${kopSurat()}
${identitas(formData, formattedDate)}

<h2 style="text-align: center; margin: 0 0 4px 0; font-size: 12pt; text-transform: uppercase;">LEMBAR SOAL ${subjectUpper} ${phaseLabel}</h2>
<p style="text-align: center; margin: 0 0 8px 0; font-size: 10.5pt;"><b>Penilaian Sumatif ${escapeHtml(formData?.learningMode || '')}</b></p>

<div style="border: 1px solid #000; border-radius: 6px; padding: 8px 12px; margin: 0 0 16px 0; font-size: 10pt; page-break-inside: avoid;">
  <p style="margin: 0 0 4px 0; font-weight: bold;">PETUNJUK UMUM:</p>
  <ol style="margin: 4px 0 0 0; padding-left: 20px;">
    <li>Tulislah nama, kelas, dan nomor urut pada lembar jawaban!</li>
    <li>Berilah tanda silang (X) pada huruf A, B, C, atau D yang dianggap benar pada lembar jawaban!</li>
    <li>Untuk soal uraian, tuliskan jawaban pada kolom lembar jawaban yang telah disediakan!</li>
    <li>Periksa kembali pekerjaan Anda sebelum diserahkan!</li>
  </ol>
</div>
`;

    // Blok ganti halaman menuju LEMBAR GURU yang WAJIB disalin PERSIS oleh AI.
    const part2 = `
<div style="page-break-after: always; margin: 0; padding: 0;"></div>
<div style="font-family: 'Space Grotesk', sans-serif; font-size: 10.5pt; line-height: 1.35; color: #000; text-align: justify;">
${kopSurat()}
<h2 style="text-align: center; margin: 0 0 12px 0; font-size: 12pt; text-transform: uppercase;">LEMBAR JAWABAN GURU ${subjectUpper} ${phaseLabel}</h2>
`;

    const soalExample = `
<b>1.</b> [Pertanyaan pilihan ganda dari asesmen sumatif]
<table style="width: 100%; border-collapse: collapse; border: none; font-size: 10.5pt; margin: 4px 0 10px 0;">
  <tr>
    <td style="padding: 1px 6px; border: none; width: 50%;">A. [opsi A]</td>
    <td style="padding: 1px 6px; border: none;">B. [opsi B]</td>
  </tr>
  <tr>
    <td style="padding: 1px 6px; border: none;">C. [opsi C]</td>
    <td style="padding: 1px 6px; border: none;">D. [opsi D]</td>
  </tr>
</table>`;

    const prompt = `Anda adalah ahli penyusun lembar soal (penilaian sumatif) berbasis kurikulum Merdeka.

Sebuah server SUDAH menuliskan bagian awal dokumen HTML berikut (kop surat, identitas, judul LEMBAR SOAL, dan petunjuk umum) dan TIDAK ditulis ulang oleh Anda:

<DOCTYPE_MULAI_YANG_SUDAH_DITULIS>
${header1}
</DOCTYPE_MULAI_YANG_SUDAH_DITULIS>

Tugas Anda: LANJUTKAN menulis dokumen HTML yang sama (tanpa mengulang blok di atas, tanpa markdown, tanpa pembungkus kode). Susun langkah berikut secara berurutan:

LANGKAH 1 — SOAL UNTUK SISWA:
Ambil SEMUA soal dari Asesmen Sumatif yang ada di RPM (soal pilihan ganda DAN uraian/esai yang benar-benar ada di RPM; JANGAN mengarang soal baru di luar yang ada di RPM).
Tuliskan dengan PENOMORAN BERURUTAN 1, 2, 3, ... secara menerus (jangan mulai ulang per pertemuan).

Sebelum menulis soal, tulis dulu baris berikut PERSIS untuk SETIAP pertemuan yang ada di RPM (jumlah pertemuan sesuai RPM):
<div style="background-color: #1a4185; color: white; padding: 6px 10px; font-weight: bold; margin: 14px 0 8px 0; border-radius: 4px; font-size: 10.5pt;">PERTEMUAN [N]: DAFTAR SOAL</div>

FORMAT SOAL PILIHAN GANDA — salin PERSIS pola kolom opsi 2x2 (A B di baris satu, C D di baris kedua) seperti contoh berikut (jangan menulis opsi menurun satu-satu dan jangan menulis opsi menyamping dalam satu baris panjang):
${soalExample}

FORMAT SOAL URAIAN/ESAI — tuliskan nomor dan soal, lalu sisakan ruang jawaban kosong sekitar 4-5 baris kosong di bawahnya (gunakan <div style="min-height: 80px;"></div>), jangan diisi kunci jawaban:
<b>[nomor].</b> [Pertanyaan uraian]
<div style="min-height: 80px;"></div>

LANGKAH 2 — GANTI HALAMAN MENUJU LEMBAR GURU:
Setelah semua soal selesai, SALINAN PERSIS teks berikut (termasuk atribut style="-nya) untuk memulai halaman baru:

${part2}

LANGKAH 3 — LEMBAR JAWABAN GURU:
Dengan format dan style yang bisa berikut (kotak berjudul, warna biru #1a4185):
3A. KUNCI JAWABAN — buat SATU bab (sub-bagian) "A. KUNCI JAWABAN" berjudul <h3 style="color: #1a4185; text-transform: uppercase; font-size: 11pt;">A. KUNCI JAWABAN</h3> berisi satu tabel kunci jawaban untuk SEMUA nomor soal:
<table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 10pt;">
  <tr style="background-color: #f8fafc;">
    <th style="border: 1px solid #000; padding: 6px 8px; width: 10%; text-align: center;">No.</th>
    <th style="border: 1px solid #000; padding: 6px 8px; width: 20%; text-align: center;">Pertemuan</th>
    <th style="border: 1px solid #000; padding: 6px 8px; width: 15%; text-align: center;">Bentuk Soal</th>
    <th style="border: 1px solid #000; padding: 6px 8px;">Kunci Jawaban / Poin Kunci</th>
  </tr>
  <tr>
    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">[1]</td>
    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">[1]</td>
    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">PG</td>
    <td style="border: 1px solid #000; padding: 6px 8px;">[A/B/C/D]</td>
  </tr>
  ...
</table>
Untuk soal uraian, kolom "Kunci Jawaban / Poin Kunci" diisi ringkasan poin-poin kunci jawaban (bukan jawaban panjang).

3B. PEDOMAN PENSKORAN — buat sub-bagian "B. PEDOMAN PENSKORAN" berjudul <h3 style="color: #1a4185; text-transform: uppercase; font-size: 11pt;">B. PEDOMAN PENSKORAN</h3> berisi tabel berikut:
<table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 10pt;">
  <tr style="background-color: #f8fafc;">
    <th style="border: 1px solid #000; padding: 6px 8px; width: 10%; text-align: center;">No.</th>
    <th style="border: 1px solid #000; padding: 6px 8px; width: 20%; text-align: center;">Bentuk Soal</th>
    <th style="border: 1px solid #000; padding: 6px 8px; width: 15%; text-align: center;">Skor Maksimum</th>
    <th style="border: 1px solid #000; padding: 6px 8px;">Kriteria Penskoran</th>
  </tr>
  <tr>
    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">[1]</td>
    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Pilihan Ganda</td>
    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">[1]</td>
    <td style="border: 1px solid #000; padding: 6px 8px;">Benar = 1, Salah = 0</td>
  </tr>
  <tr>
    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">[uraian no. X]</td>
    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Uraian</td>
    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">[skor]</td>
    <td style="border: 1px solid #000; padding: 6px 8px;">[rubrik 3-4 tingkat, misal: jawaban lengkap & tepat = skor penuh; sebagian = skor ½; salah = 0]</td>
  </tr>
  ...
</table>
Setelah tabel, tutup dengan blok rumus VALUE (dalam <div style="border: 1px solid #000; padding: 10px; margin-top: 10px;">):
<b>Nilai Akhir = (Jumlah Skor yang Diperoleh ÷ Skor Maksimal) × 100</b>

TERAKHIR: tutup elemen dengan dua tag penutup </div>.

ATURAN WAJIB:
- Output LANGSUNG HTML (tanpa blok markdown / blok kode).
- JANGAN mengulang konten awal (header1).
- JANGAN mengubah kop surat / identitas / ukuran font.
- JANGAN menampilkan kunci jawaban di LANGKAH 1 (bagian soal siswa); kunci hanya di LEMBAR JAWABAN GURU.
- Ambil semua data (materi, soal, jawaban, skor) dari RPM di bawah.
- Pada baris PALING AKHIR jawaban, tulis komentar HTML ini persis: <!--AKHIR-->
- JANGAN pakai page-break-inside: avoid pada kotak pertanyaan atau tabel (membuat banyak halaman kosong di PDF). Biarkan konten mengalir; hanya ganti halaman saat pindah dari lembar soal ke lembar guru.

RPM:
${rpmHtml}
`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache, no-transform');

    // Header (kop+identitas) DITAHAN dulu: baru dikirim saat token AI pertama tiba.
    let started = false;
    let totalText = '';

    const END_MARK = '<!--AKHIR-->';
    const MAX_ATTEMPTS = 2;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      let gotAny = false;

      if (provider === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: keyToUse });
        const contents = attempt === 0 ? prompt : [
          { role: 'user', parts: [{ text: prompt }] },
          { role: 'model', parts: [{ text: totalText.replace(END_MARK, '') }] },
          { role: 'user', parts: [{ text: 'Lanjutkan tepat dari posisi teks yang terpotong. JANGAN mengulang dari awal. Akhiri dengan komentar <!--AKHIR--> di baris terakhir.' }] },
        ];
        const stream = await ai.models.generateContentStream({
          model: 'gemini-3.6-flash',
          contents,
          config: { maxOutputTokens: 32768 },
        });
        for await (const chunk of stream) {
          if (!chunk.text) continue;
          gotAny = true;
          if (!started) { started = true; res.write(header1); }
          res.write(chunk.text);
          totalText += chunk.text;
        }
      } else {
        let baseURL = undefined;
        let modelName = '';
        if (provider === 'openai') { modelName = 'gpt-4o-mini'; }
        else if (provider === 'groq') { baseURL = 'https://api.groq.com/openai/v1'; modelName = 'llama-3.3-70b-versatile'; }
        else if (provider === 'deepseek') { baseURL = 'https://api.deepseek.com/v1'; modelName = 'deepseek-chat'; }
        else if (provider === 'grok') { baseURL = 'https://api.x.ai/v1'; modelName = 'grok-2-latest'; }
        else if (provider === 'qwen') { baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'; modelName = 'qwen-plus'; }

        const openai = new OpenAI({ apiKey: keyToUse, baseURL });
        const messages = attempt === 0
          ? [{ role: 'user', content: prompt }]
          : [
              { role: 'user', content: prompt },
              { role: 'assistant', content: totalText.replace(END_MARK, '') },
              { role: 'user', content: 'Lanjutkan tepat dari posisi teks yang terpotong. JANGAN mengulang dari awal. Akhiri dengan komentar <!--AKHIR--> di baris terakhir.' },
            ];
        const stream = await openai.chat.completions.create({
          model: modelName,
          messages: messages as any,
          stream: true,
        });
        for await (const chunk of stream) {
          const c = chunk.choices[0]?.delta?.content || '';
          if (!c) continue;
          gotAny = true;
          if (!started) { started = true; res.write(header1); }
          res.write(c);
          totalText += c;
        }
      }

      if (!gotAny) break;
      if (totalText.includes(END_MARK)) break;
    }

    if (started && !totalText.includes(END_MARK)) {
      res.write('<!--TERPOTONG-->');
    }

    if (!started) {
      return res.status(500).json({ error: 'AI tidak menghasilkan respons. Silakan coba lagi.' });
    }

    res.end();
  } catch (error: any) {
    console.error('Error generating soal:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Gagal membuat lembar soal. Silakan coba lagi. Detail: ' + (error.message || 'Unknown error') });
    } else {
      res.end();
    }
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};