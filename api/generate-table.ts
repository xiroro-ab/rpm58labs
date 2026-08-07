import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

// ============================================================
// KISI-KISI & KARTU SOAL - streaming hasil AI langsung seperti RPM.
// Server menulis KOP + IDENTITAS + JUDUL halaman pertama,
// lalu AI melanjutkan menulis bagian isi (tabel kisi-kisi,
// halaman kartu soal, dan kartu per butir) secara streaming.
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
      <td style="padding: 5px 8px; border: 1px solid #000;">${val(formData?.duration)} (${val(formData?.meetingCount)}x Pertemuan)</td>
    </tr>
    <tr>
      <td style="font-weight: bold; padding: 5px 8px; border: 1px solid #000; background-color: #f8fafc;">Nama Guru</td>
      <td style="padding: 5px 8px; border: 1px solid #000;">${val(formData?.teacher)}</td>
      <td style="font-weight: bold; padding: 5px 8px; border: 1px solid #000; background-color: #f8fafc;">NIP Guru</td>
      <td style="padding: 5px 8px; border: 1px solid #000;">${val(formData?.teacherNip)}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; padding: 5px 8px; border: 1px solid #000; background-color: #f8fafc;">Kepala Sekolah</td>
      <td style="padding: 5px 8px; border: 1px solid #000;">${val(formData?.headmaster)}</td>
      <td style="font-weight: bold; padding: 5px 8px; border: 1px solid #000; background-color: #f8fafc;">NIP Kepala Sekolah</td>
      <td style="padding: 5px 8px; border: 1px solid #000;">${val(formData?.headmasterNip)}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; padding: 5px 8px; border: 1px solid #000; background-color: #f8fafc;">Moda Pembelajaran</td>
      <td style="padding: 5px 8px; border: 1px solid #000;">${val(formData?.learningMode)}</td>
      <td style="font-weight: bold; padding: 5px 8px; border: 1px solid #000; background-color: #f8fafc;">Tanggal Dokumen</td>
      <td style="padding: 5px 8px; border: 1px solid #000;">${val(formattedDate)}</td>
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
    // kop + identitas halaman 1 + judul kisi-kisi. AI hanya menyambung.
    const header1 = `
<div style="font-family: 'Space Grotesk', sans-serif; font-size: 10.5pt; line-height: 1.35; color: #000; text-align: justify;">
${kopSurat()}
${identitas(formData, formattedDate)}

<h2 style="text-align: center; margin: 0 0 12px 0; font-size: 12pt; text-transform: uppercase;">KISI-KISI SOAL ${subjectUpper} ${phaseLabel}</h2>
`;

    // Blok halaman 2 yang WAJIB disalin PERSIS oleh AI di antara tabel kisi dan kartu soal.
    const part2 = `
<div style="page-break-after: always; margin: 0; padding: 0;"></div>
<div style="font-family: 'Space Grotesk', sans-serif; font-size: 10.5pt; line-height: 1.35; color: #000; text-align: justify;">
${kopSurat()}
${identitas(formData, formattedDate)}
<h2 style="text-align: center; margin: 0 0 12px 0; font-size: 12pt; text-transform: uppercase;">KARTU SOAL ${subjectUpper} ${phaseLabel}</h2>
`;

    const cardExample = `
<div style="border: 1px solid #000; padding: 8px; margin-bottom: 12px;">
  <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt;">
    <tr>
      <td style="width: 18%; font-weight: bold; border: 1px solid #000; padding: 5px 8px; vertical-align: top;">Materi Pokok</td>
      <td style="border: 1px solid #000; padding: 5px 8px; vertical-align: top;">[materi pokok]</td>
      <td style="width: 18%; font-weight: bold; border: 1px solid #000; padding: 5px 8px; vertical-align: top;">No. Soal</td>
      <td style="border: 1px solid #000; padding: 5px 8px; vertical-align: top; text-align: center;">[nomor urut]</td>
    </tr>
    <tr>
      <td style="font-weight: bold; border: 1px solid #000; padding: 5px 8px; vertical-align: top;">TP</td>
      <td style="border: 1px solid #000; padding: 5px 8px; vertical-align: top;" colspan="3">[tujuan pembelajaran]</td>
    </tr>
    <tr>
      <td style="font-weight: bold; border: 1px solid #000; padding: 5px 8px; vertical-align: top;">Level Kognitif</td>
      <td style="border: 1px solid #000; padding: 5px 8px; vertical-align: top;" colspan="3">[C1-C6]</td>
    </tr>
    <tr>
      <td style="font-weight: bold; border: 1px solid #000; padding: 5px 8px; vertical-align: top;">Indikator</td>
      <td style="border: 1px solid #000; padding: 5px 8px; vertical-align: top;" colspan="3">[indikator ABCD]</td>
    </tr>
  </table>
  <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px 0; margin: 6px 0;">
    <b>Butir Soal:</b>
    <div style="margin-top: 4px;">[pertanyaan + opsi A, B, C, D di baris terpisah]</div>
  </div>
  <div><b>Kunci Jawaban: </b><span style="font-weight: bold; text-decoration: underline;">[jawaban]</span></div>
</div>`;

    const prompt = `Anda adalah asisten ahli penyusun perangkat soal (kisi-kisi & kartu soal) berbasis kurikulum Merdeka.

Sebuah server SUDAH menuliskan bagian awal dokumen HTML berikut (kop surat, identitas, judul KISI-KISI) dan TIDAK ditulis ulang oleh Anda:

<DOCTYPE_MULAI_YANG_SUDAH_DITULIS>
${header1}
</DOCTYPE_MULAI_YANG_SUDAH_DITULIS>

Tugas Anda: LANJUTKAN menulis dokumen HTML yang sama (tanpa mengulang blok di atas, tanpa markdown, tanpa kode html yang tidak valid). Susun langkah berikut secara berurutan:

LANGKAH 1 — TABEL KISI-KISI:
Buat satu <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; border: 1px solid #000;"> dengan kolom:
1. No
2. Materi Pokok
3. TP
4. Level Kognitif
5. Indikator Soal
6. Bentuk Soal
7. Kunci Jawaban & Skor

Isi berasal dari RPM: materi pokok, tujuan pembelajaran, dan indikator yang sesuai. Untuk header kolom gunakan: <th style="border: 1px solid #000; padding: 6px 8px; background-color: #1a4185; color: white; font-weight: bold; text-align: center;"> dan sel <td style="border: 1px solid #000; padding: 6px 8px; vertical-align: top;">.

PENGGABUNGAN (MERGE) — WAJIB: Jika ada dua baris atau lebih YANG BERURUTAN dengan Materi Pokok DAN TP yang sama persis, gabungkan sel Materi Pokok dan sel TP dengan atribut rowspan="N". N = jumlah baris yang sama, MAKSIMUM 4 (sel gabungan yang terlalu besar tidak bisa dibelah halaman PDF). Jika lebih dari 4, mulai grup baru lagi dari baris ke-5. Untuk sel yang tergabung, tulis teksnya SEKALI di baris pertama. Jika Materi Pokok atau TP-nya BERBEDA, baris dipisah seperti biasa. Jangan menambah properti page-break-inside: avoid pada tabel kisi-kisi maupun membungkusnya dengan elemen yang punya page-break-inside: avoid (biarkan mengalir lintas halaman; tidak boleh menyisakan halaman kosong).

- Indikator Soal WAJIB rumusan ABCD (Audience, Behavior, Condition, Degree).
- Level Kognitif sesuai Taksonomi Bloom C1-C6.
- Bentuk Soal: contoh "Pilihan Ganda".
- Kunci Jawaban & Skor contoh: "B (Skor: 1)".

LANGKAH 2 — GANTI HALAMAN & HEADER KARTU:
Setelah tabel kisi-kisi selesai, SALINGAN PERSIS teks sederhana (menambahkan tanpa diubah termasuk styling "style="):

${part2}

LANGKAH 3 — KARTU SOAL (format kartu):
Untuk SETIAP butir soal (total = jumlah pertanyaan asesmen sumatif: jumlah pertemuan x 10 soal), buat SATU kotak kartu berbingkai seperti pola berikut. Ulangi pola ini sebanyak jumlah soal, ubah isi [kurung] sesuai data masing-masing soal. Nomor Soal dipakai penomoran (1, 2, 3, ...):

${cardExample}

Butir soal: tuliskan pertanyaan; untuk pilihan ganda, opsi A, B, C, D pada BARIS TERPISAH dengan tag <br> (<br>A. ... <br>B. ... <br>C. ... <br>D. ...).

TERAKHIR: tutup elemen dengan dua tag penutup </div>.

ATURAN WAJIB:
- Output LANGSUNG HTML (tanpa blok markdown / blok kode).
- JANGAN mengulang konten awal (header1).
- JANGAN mengubah kop surat / identitas / ukuran font.
- Ambil semua data (materi, TP, soal, jawaban) dari RPM di bawah.
- Pada baris PALING AKHIR jawaban, tulis komentar HTML ini persis: <!--AKHIR-->
- JANGAN pakai page-break-inside: avoid pada kartu soal atau tabel (membuat banyak halaman kosong di PDF). Biarkan konten mengalir dan berpindah halaman secara alami; hanya ganti halaman saat pindah dari kisi-kisi ke kartu soal.

RPM:
${rpmHtml}
`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache, no-transform');

    // Header (kop+identitas) DITAHAN dulu: baru dikirim saat token AI pertama tiba, sehingga
    // popup "berpikir" hilang tepat ketika AI benar-benar mulai menulis, bukan saat request.
    let started = false;
    let totalText = '';

    // Auto-lanjut bila stream terpotong (rate-limit/kuota/model): AI diinstruksikan menulis
    // komentar <!--AKHIR--> di akhir. Jika stream selesai TANPA marker itu berarti terpotong
    // dan dilakukan 1x percobaan lanjut "sambung dari posisi terakhir". Jalan normal (marker
    // ada) tetap satu pass, tanpa perubahan.
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

    // Bila masih belum ada penanda selesai setelah semua percobaan → beri tahu klien
    // bahwa hasil terpotong (bukan diam-diam).
    if (started && !totalText.includes(END_MARK)) {
      res.write('<!--TERPOTONG-->');
    }

    if (!started) {
      return res.status(500).json({ error: 'AI tidak menghasilkan respons. Silakan coba lagi.' });
    }

    res.end();
  } catch (error: any) {
    console.error('Error generating table:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Gagal membuat tabel kisi-kisi. Silakan coba lagi. Detail: ' + (error.message || 'Unknown error') });
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