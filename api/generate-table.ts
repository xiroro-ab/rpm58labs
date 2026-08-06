import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

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

    const prompt = `Anda adalah asisten AI yang membantu membuat tabel kisi-kisi soal berdasarkan RPM yang sudah ada.

TUGAS: Buat 3 tabel kisi-kisi soal dalam format HTML berdasarkan RPM berikut.

DATA RPM:
- Sekolah: ${formData?.school || 'SMP Negeri 58 Palembang'}
- Mata Pelajaran: ${formData?.subject}
- Fase/Kelas: ${formData?.phase}
- Guru: ${formData?.teacher}
- Kepala Sekolah: ${formData?.headmaster}
- Tanggal: ${formattedDate}

RPM HTML:
${rpmHtml}

ATURAN SANGAT PENTING:

1. EKSTRAK SEMUA SOAL DARI RPM:
   - Cari bagian "Asesmen Sumatif" atau "Lampiran 2: Instrumen Asesmen"
   - Hitung JUMLAH TOTAL SOAL yang ada di RPM (biasanya 10 soal per pertemuan)
   - Jika ada 4 pertemuan, berarti 40 soal total
   - JANGAN mengurangi jumlah soal!

2. KONSISTENSI DATA ANTAR TABEL:
   - TABEL 1: Kisi-Kisi - daftar indikator dan jumlah soal per indikator
   - TABEL 2: Indikator Soal - kelompokkan soal berdasarkan indikator, cantumkan NOMOR SOAL yang tepat
   - TABEL 3: Kartu Soal - TULIS SEMUA SOAL dari RPM dengan kunci jawaban
   
   CONTOH: Jika di RPM ada soal nomor 1-40, maka di Tabel 3 harus ada 40 baris kartu soal!

3. PAGE BREAK:
   - HANYA di antara tabel (setelah Tabel 1 selesai, setelah Tabel 2 selesai)
   - JANGAN buat page break di dalam tabel
   - Tabel harus utuh dalam satu halaman, jika panjang biarkan lanjut ke halaman berikutnya secara natural

4. STRUKTUR HTML:

<!-- TABEL 1 -->
<div style="font-family: 'Space Grotesk', sans-serif; font-size: 10.5pt;">
  <!-- KOP SURAT -->
  <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 15px;">
    <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/Logo_Palembang.png" style="height: 90px; width: auto;">
    <div style="text-align: center; flex: 1; padding: 0 15px;">
      <h3 style="margin: 0; font-size: 14pt;">PEMERINTAH KOTA PALEMBANG</h3>
      <h3 style="margin: 0; font-size: 14pt;">DINAS PENDIDIKAN</h3>
      <h3 style="margin: 0; font-size: 16pt; font-weight: bold;">SMP NEGERI 58 PALEMBANG</h3>
      <p style="margin: 5px 0 0 0; font-size: 8pt; font-style: italic;">Jl. Komering II, Kel. Demang Lebar Daun, Kec. Ilir Barat I, Kota Palembang 30137</p>
    </div>
    <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/logo58.png" style="height: 90px; width: auto;">
  </div>
  
  <h2 style="text-align: center; margin-bottom: 15px;">KISI-KISI SOAL ${formData?.subject?.toUpperCase()} ${formData?.phase}</h2>
  
  <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 10pt;">
    <thead>
      <tr style="background-color: #1a4185; color: white;">
        <th style="border: 1px solid #000; padding: 8px; text-align: center;">No</th>
        <th style="border: 1px solid #000; padding: 8px;">CP (Capaian Pembelajaran)</th>
        <th style="border: 1px solid #000; padding: 8px;">TP (Tujuan Pembelajaran)</th>
        <th style="border: 1px solid #000; padding: 8px;">Materi</th>
        <th style="border: 1px solid #000; padding: 8px; text-align: center;">Jumlah Soal</th>
        <th style="border: 1px solid #000; padding: 8px;">Indikator Soal</th>
      </tr>
    </thead>
    <tbody>
      <!-- Isi data dari RPM -->
    </tbody>
  </table>
</div>

<!-- PAGE BREAK ANTARA TABEL 1 DAN 2 -->
<div style="page-break-after: always; margin: 0; padding: 0;"></div>

<!-- TABEL 2 -->
<div style="font-family: 'Space Grotesk', sans-serif; font-size: 10.5pt;">
  <!-- KOP SURAT SAMA PERSIS -->
  ...
  <h2 style="text-align: center; margin-bottom: 15px;">INDIKATOR SOAL ${formData?.subject?.toUpperCase()} ${formData?.phase}</h2>
  
  <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 10pt;">
    <thead>
      <tr style="background-color: #1a4185; color: white;">
        <th style="border: 1px solid #000; padding: 8px; text-align: center;">No</th>
        <th style="border: 1px solid #000; padding: 8px;">CP</th>
        <th style="border: 1px solid #000; padding: 8px;">Materi</th>
        <th style="border: 1px solid #000; padding: 8px;">Indikator Soal</th>
        <th style="border: 1px solid #000; padding: 8px; text-align: center;">Nomor Soal</th>
      </tr>
    </thead>
    <tbody>
      <!-- Kelompokkan soal berdasarkan indikator, contoh: 1, 2, 3, 4 -->
    </tbody>
  </table>
</div>

<!-- PAGE BREAK ANTARA TABEL 2 DAN 3 -->
<div style="page-break-after: always; margin: 0; padding: 0;"></div>

<!-- TABEL 3 -->
<div style="font-family: 'Space Grotesk', sans-serif; font-size: 10.5pt;">
  <!-- KOP SURAT SAMA PERSIS -->
  ...
  <h2 style="text-align: center; margin-bottom: 15px;">KARTU SOAL ${formData?.subject?.toUpperCase()} ${formData?.phase}</h2>
  
  <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 10pt;">
    <thead>
      <tr style="background-color: #1a4185; color: white;">
        <th style="border: 1px solid #000; padding: 8px; text-align: center;">No</th>
        <th style="border: 1px solid #000; padding: 8px;">CP</th>
        <th style="border: 1px solid #000; padding: 8px;">TP</th>
        <th style="border: 1px solid #000; padding: 8px;">Soal</th>
        <th style="border: 1px solid #000; padding: 8px; text-align: center;">Kunci Jawaban</th>
      </tr>
    </thead>
    <tbody>
      <!-- TULIS SEMUA SOAL DARI RPM! Jika 40 soal, harus 40 baris! -->
    </tbody>
  </table>
</div>

TABEL 1: KISI-KISI SOAL
- Kolom: No | CP | TP | Materi | Jumlah Soal | Indikator Soal
- CP harus sesuai Kurikulum Merdeka mapel ${formData?.subject} fase ${formData?.phase}
- TP dari bagian Desain Pembelajaran di RPM
- Materi dari RPM
- Jumlah soal sesuai jumlah soal per indikator
- Indikator dibuat berdasarkan soal yang ada

TABEL 2: INDIKATOR SOAL
- Kolom: No | CP | Materi | Indikator Soal | Nomor Soal
- Kelompokkan soal berdasarkan indikator yang sama
- Nomor Soal: tulis nomor soal yang memiliki indikator tersebut (contoh: 1, 2, 3 atau 5, 8, 12)
- PASTIKAN nomor soal sesuai dengan soal di RPM!

TABEL 3: KARTU SOAL
- Kolom: No | CP | TP | Soal | Kunci Jawaban
- TULIS SEMUA SOAL dari Asesmen Sumatif di RPM
- Jika RPM punya 40 soal, Tabel 3 harus punya 40 baris
- Soal ditulis lengkap dengan opsi jawaban (jika PG)
- Kunci jawaban harus sesuai dengan yang ada di RPM

MULAI DARI TABEL 1, OUTPUT LANGSUNG HTML TANPA MARKDOWN BLOCK.`;

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
    console.error('Error generating table:', error);
    res.status(500).json({ error: 'Gagal membuat tabel kisi-kisi. Silakan coba lagi. Detail: ' + (error.message || 'Unknown error') });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
