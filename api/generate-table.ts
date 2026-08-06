import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

// ============================================================
// TEMPLATE TETAP - dibangun di server, AI hanya mengisi data
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

const TH_STYLE = 'border: 1px solid #000; padding: 6px 8px; background-color: #1a4185; color: white; font-weight: bold; text-align: center;';
const TD_STYLE = 'border: 1px solid #000; padding: 6px 8px; vertical-align: top;';

function buildKisiKisi(rows: any[]): string {
  // CP tampil SEKALI di atas tabel (bukan per baris) agar teks CP panjang tidak membuat sel
  // tinggi yang memaksa tabel lompat halaman di PDF.
  let firstCp = '';
  for (const r of (rows || [])) {
    const c = String(r?.cp ?? '').trim();
    if (c) { firstCp = c; break; }
  }
  const cpLine = firstCp
    ? `<div style="margin: 0 0 10px 0; font-size: 10pt;"><b>Capaian Pembelajaran:</b> ${escapeHtml(firstCp)}</div>`
    : '';

  const body = (rows || []).map((r: any, i: number) => {
    const skorText = r?.skor ? ` (Skor: ${escapeHtml(r.skor)})` : '';
    return `
      <tr>
        <td style="${TD_STYLE} text-align: center;">${i + 1}</td>
        <td style="${TD_STYLE}">${escapeHtml(r?.materi)}</td>
        <td style="${TD_STYLE}">${escapeHtml(r?.tp)}</td>
        <td style="${TD_STYLE} text-align: center;">${escapeHtml(r?.levelKognitif)}</td>
        <td style="${TD_STYLE}">${escapeHtml(r?.indikator)}</td>
        <td style="${TD_STYLE} text-align: center;">${escapeHtml(r?.bentukSoal)}</td>
        <td style="${TD_STYLE} text-align: center;"><b>${escapeHtml(r?.kunciJawaban)}</b>${skorText}</td>
      </tr>`;
  }).join('');
  return `
${cpLine}
  <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; border: 1px solid #000;">
    <thead>
      <tr>
        <th style="${TH_STYLE} width: 3%;">No</th>
        <th style="${TH_STYLE} width: 14%;">Materi Pokok</th>
        <th style="${TH_STYLE} width: 15%;">TP</th>
        <th style="${TH_STYLE} width: 8%;">Level Kognitif</th>
        <th style="${TH_STYLE}">Indikator Soal</th>
        <th style="${TH_STYLE} width: 9%;">Bentuk Soal</th>
        <th style="${TH_STYLE} width: 11%;">Kunci Jawaban & Skor</th>
      </tr>
    </thead>
    <tbody>${body}
    </tbody>
  </table>`;
}

function buildKartuSoal(rows: any[]): string {
  // Format KARTU SOAL: satu kartu berbingkai per butir soal (standar Kemdikbud). Setiap kartu
  // berisi identitas soal (Materi Pokok, No. Soal, TP, Level Kognitif, Indikator), Butir Soal,
  // dan Kunci Jawaban. page-break-inside: avoid membuat setiap kartu utuh tanpa terpotong.
  let firstCp = '';
  for (const r of (rows || [])) {
    const c = String(r?.cp ?? '').trim();
    if (c) { firstCp = c; break; }
  }
  const cpLine = firstCp
    ? `<div style="margin: 0 0 12px 0; font-size: 10pt;"><b>Capaian Pembelajaran:</b> ${escapeHtml(firstCp)}</div>`
    : '';

  const LBL = `width: 18%; font-weight: bold; border: 1px solid #000; border-collapse: collapse; padding: 5px 8px; vertical-align: top;`;
  const VAL = `border: 1px solid #000; padding: 5px 8px; vertical-align: top;`;

  const cards = (rows || []).map((r: any, i: number) => `
  <div style="border: 1px solid #000; padding: 8px; margin-bottom: 12px; page-break-inside: avoid;">
    <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt;">
      <tr>
        <td style="${LBL}">Materi Pokok</td>
        <td style="${VAL}">${escapeHtml(r?.materi)}</td>
        <td style="${LBL}">No. Soal</td>
        <td style="${VAL} text-align: center;">${i + 1}</td>
      </tr>
      <tr>
        <td style="${LBL}">TP</td>
        <td style="${VAL}" colspan="3">${escapeHtml(r?.tp)}</td>
      </tr>
      <tr>
        <td style="${LBL}">Level Kognitif</td>
        <td style="${VAL}" colspan="3">${escapeHtml(r?.levelKognitif)}</td>
      </tr>
      <tr>
        <td style="${LBL}">Indikator</td>
        <td style="${VAL}" colspan="3">${escapeHtml(r?.indikator)}</td>
      </tr>
    </table>
    <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px 0; margin: 6px 0;">
      <b>Butir Soal:</b>
      <div style="margin-top: 4px;">${escapeHtml(r?.soal)}</div>
    </div>
    <div><b>Kunci Jawaban: </b><span style="font-weight: bold; text-decoration: underline;">${escapeHtml(r?.kunciJawaban)}</span></div>
  </div>`).join('');

  return `${cpLine}
${cards}`;
}

function cleanJson(text: string): string {
  if (!text) return '';
  let t = text.trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    t = t.slice(start, end + 1);
  }
  return t;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let rpmHtml: string;
    let formData: any;
    let customApiKey: string;
    let aiProvider: string;

    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        rpmHtml = parsed.rpmHtml;
        formData = parsed.formData;
        customApiKey = parsed.customApiKey;
        aiProvider = parsed.aiProvider;
      } catch (e) {
        return res.status(400).json({ error: 'Format request tidak valid.' });
      }
    } else {
      rpmHtml = req.body?.rpmHtml;
      formData = req.body?.formData;
      customApiKey = req.body?.customApiKey;
      aiProvider = req.body?.aiProvider;
    }

    if (!rpmHtml) {
      return res.status(400).json({ error: 'RPM HTML diperlukan.' });
    }

    const defaultGeminiKey = process.env.GEMINI_API_KEY;
    const provider = aiProvider || 'gemini';
    const keyToUse = customApiKey || defaultGeminiKey;

    if (!keyToUse) {
      return res.status(400).json({ error: 'API Key diperlukan.' });
    }

    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const docDate = formData?.documentDate ? new Date(formData.documentDate) : new Date();
    const formattedDate = `Palembang, ${docDate.getDate()} ${months[docDate.getMonth()]} ${docDate.getFullYear()}`;

    const prompt = `Anda adalah asisten AI yang mengekstrak data dari RPM untuk membuat tabel kisi-kisi soal.

ANALISIS RPM HTML berikut:
- Sekolah: ${formData?.school || ''}
- Mata Pelajaran: ${formData?.subject || ''}
- Fase/Kelas: ${formData?.phase || ''}
- Guru: ${formData?.teacher || ''}
- Kepala Sekolah: ${formData?.headmaster || ''}

RPM HTML:
${rpmHtml}

TUGAS ANDA:
Baca seluruh isi RPM, terutama bagian "II. DESAIN PEMBELAJARAN" (untuk CP dan TP) dan bagian Asesmen Sumatif / "Lampiran 2: Instrumen Asesmen" (untuk soal dan kunci jawaban).

HITUNG JUMLAH SOAL dengan teliti. Jumlah soal Asesmen Sumatif = (jumlah pertemuan x 10 soal). Contoh: 4 pertemuan = 40 soal. JANGAN MENGURANGI JUMLAH SOAL.

KELUARKAN HANYA SATU OBJEK JSON (TANPA markdown block, TANPA teks lain):

{
  "kisiKisi": [
    {
      "cp": "CP (isi pada BARIS PERTAMA saja; untuk baris berikutnya biarkan kosong \"\" jika CP-nya sama)",
      "materi": "Materi pokok yang diuji (dari RPM)",
      "tp": "Tujuan Pembelajaran dari RPM yang relevan dengan indikator ini",
      "levelKognitif": "Level kognitif sesuai Taksonomi Bloom, contoh: C1 Mengingat, C2 Memahami, C3 Menerapkan, C4 Menganalisis, C5 Mengevaluasi, C6 Mencipta",
      "indikator": "Rumusan indikator soal lengkap dengan konsep ABCD (Audience, Behavior, Condition, Degree)",
      "bentukSoal": "Bentuk soal, contoh: Pilihan Ganda / Uraian",
      "kunciJawaban": "Kunci jawaban untuk indikator ini",
      "skor": "Skor/nilai untuk indikator ini, contoh: 1"
    }
  ],
  "kartuSoal": [
    {
      "cp": "CP (isi pada SOAL PERTAMA saja; untuk soal berikutnya biarkan kosong \"\" jika CP-nya sama)",
      "materi": "Materi pokok yang diuji (dari RPM)",
      "tp": "TP spesifik yang menjadi acuan soal ini (bisa berbeda antar soal)",
      "levelKognitif": "Level kognitif sesuai Taksonomi Bloom (C1-C6)",
      "indikator": "Rumusan indikator soal ABCD untuk soal ini",
      "soal": "Butir soal LENGKAP dari RPM dengan penomoran \"1. \" dst. Untuk soal PILIHAN GANDA, tuliskan setiap opsi pada BARIS TERPISAH dengan memisahkannya memakai tag <br>. Contoh format: \"1. Pertanyaan... <br>A. Opsi A <br>B. Opsi B <br>C. Opsi C <br>D. Opsi D\". JANGAN menggabungkan opsi A, B, C, D dalam satu baris menyamping.",
      "kunciJawaban": "Kunci jawaban soal ini, contoh: B"
    }
  ]
}

ATURAN KETAT:
1. kartuSoal WAJIB berisi SEMUA soal Asesmen Sumatif yang ada di RPM. Jika RPM punya 40 soal, kartuSoal harus punya 40 objek. JANGAN dikurangi!
2. JANGAN mengulang CP yang sama di setiap soal/baris! CP hanya ditulis SATU KALI, yaitu di objek/baris PERTAMA. Untuk yang berikutnya dengan CP sama, isi "cp": "". TP tetap ditulis lengkap di setiap soal/baris karena TP dapat berbeda (TP-lah yang membedakan setiap soal, bukan CP).
2b. KERAPIAN SOAL: Untuk soal pilihan ganda, setiap opsi jawaban (A, B, C, D) WAJIB berada pada BARIS TERPISAH yang dipisahkan tag <br> di dalam field "soal". JANGAN menyusun opsi menyamping dalam satu baris karena akan terlihat menumpuk.
2c. INDIKATOR ABCD: Setiap field "indikator" (di kisiKisi maupun kartuSoal) WAJIB dirumuskan lengkap dengan konsep ABCD — Audience (peserta didik), Behavior (perilaku yang dapat diukur), Condition (kondisi/situasi/tugas), Degree (tingkat keberhasilan). Contoh: "Peserta didik mampu menentukan himpunan bagian dari suatu himpunan berdasarkan diagram Venn dengan tepat." JANGAN menulis indikator generik seperti "Siswa memahami materi".
2d. LEVEL KOGNITIF: Setiap field "levelKognitif" WAJIB diisi level sesuai Taksonomi Bloom (C1 Mengingat, C2 Memahami, C3 Menerapkan, C4 Menganalisis, C5 Mengevaluasi, C6 Mencipta) yang paling sesuai dengan tingkat berpikir yang dituntut soal/indikator.
3. Jumlah objek kisiKisi harus konsisten dengan kartuSoal: total soal di kartuSoal = jumlah soal Asesmen Sumatif.
4. Semua isi harus diambil/mengikuti RPM. JANGAN menambah soal baru.
5. Output HANYA JSON. Tidak ada kata pengantar atau penutup.`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache, no-transform');

    // Tulis progres AI langsung ke klien (streaming), lalu kirim HTML final setelah marker.
    // Marker dipakai frontend: teks sebelum marker = progres, setelah marker = HTML final.
    const FINAL_MARKER = '@@@FINAL@@@';

    let aiText = '';
    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey: keyToUse });
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });
      for await (const chunk of responseStream) {
        if (chunk.text) {
          aiText += chunk.text;
          res.write(chunk.text);
        }
      }
    } else {
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
        stream: true,
      });
      for await (const chunk of responseStream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          aiText += content;
          res.write(content);
        }
      }
    }

    let data: any;
    try {
      data = JSON.parse(cleanJson(aiText));
    } catch (e) {
      console.error('Failed to parse AI JSON for tables:', e);
      console.error('Raw AI output:', aiText.slice(0, 500));
      res.write('\n' + FINAL_MARKER + '\n');
      res.write('@@ERROR@@' + JSON.stringify({ error: 'Gagal memproses respons AI untuk tabel. Silakan coba lagi.' }));
      res.end();
      return;
    }

    const subjectUpper = escapeHtml(formData?.subject || 'MAPEL').toUpperCase();
    const phaseLabel = escapeHtml(formData?.phase || '');

    const pageBreak = '<div style="page-break-after: always; margin: 0; padding: 0;"></div>';

    const fullHtml = `
<div style="font-family: 'Space Grotesk', sans-serif; font-size: 10.5pt; line-height: 1.35; color: #000; text-align: justify;">
${kopSurat()}
${identitas(formData, formattedDate)}

<h2 style="text-align: center; margin: 0 0 12px 0; font-size: 12pt; text-transform: uppercase;">KISI-KISI SOAL ${subjectUpper} ${phaseLabel}</h2>
${buildKisiKisi(data.kisiKisi)}
</div>

${pageBreak}

<div style="font-family: 'Space Grotesk', sans-serif; font-size: 10.5pt; line-height: 1.35; color: #000; text-align: justify;">
${kopSurat()}
${identitas(formData, formattedDate)}

<h2 style="text-align: center; margin: 0 0 12px 0; font-size: 12pt; text-transform: uppercase;">KARTU SOAL ${subjectUpper} ${phaseLabel}</h2>
${buildKartuSoal(data.kartuSoal)}
</div>`;

    res.write('\n' + FINAL_MARKER + '\n');
    res.write(fullHtml);
    res.end();
  } catch (error: any) {
    console.error('Error generating table:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Gagal membuat tabel kisi-kisi. Silakan coba lagi. Detail: ' + (error.message || 'Unknown error') });
    } else {
      res.write('\n@@@FINAL@@@\n');
      res.write('@@ERROR@@' + JSON.stringify({ error: 'Gagal membuat tabel kisi-kisi. Silakan coba lagi.' }));
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
