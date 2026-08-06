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

TUGAS: Buat 3 tabel kisi-kisi soal dalam format HTML berdasarkan RPM berikut. Setiap tabel harus memiliki kop surat sendiri dan berada di halaman terpisah.

DATA RPM:
- Sekolah: ${formData?.school || 'SMP Negeri 58 Palembang'}
- Mata Pelajaran: ${formData?.subject}
- Fase/Kelas: ${formData?.phase}
- Guru: ${formData?.teacher}
- Kepala Sekolah: ${formData?.headmaster}
- Tanggal: ${formattedDate}

RPM HTML:
${rpmHtml}

ATURAN PENTING:
1. Ekstrak informasi dari bagian "Asesmen Sumatif" dan "Lampiran 2" di RPM
2. Gunakan Capaian Pembelajaran (CP) yang sesuai dengan Kurikulum Merdeka untuk mapel ${formData?.subject} dan fase ${formData?.phase}
3. Setiap tabel HARUS memiliki kop surat yang sama persis dengan RPM
4. Gunakan page-break-between untuk memisahkan setiap tabel
5. Output HANYA kode HTML, TANPA markdown code block

FORMAT KOPT SURAT (gunakan persis ini untuk setiap tabel):
<div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 15px;">
    <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/Logo_Palembang.png" alt="Logo Kiri" style="height: 90px; width: auto;">
    <div style="text-align: center; flex: 1; padding: 0 15px;">
        <h3 style="margin: 0; font-size: 14pt; font-family: 'IBM Plex Sans', sans-serif;">PEMERINTAH KOTA PALEMBANG</h3>
        <h3 style="margin: 0; font-size: 14pt; font-family: 'IBM Plex Sans', sans-serif;">DINAS PENDIDIKAN</h3>
        <h3 style="margin: 0; font-size: 16pt; font-weight: bold; font-family: 'IBM Plex Sans', sans-serif;">SMP NEGERI 58 PALEMBANG</h3>
        <p style="margin: 5px 0 0 0; font-size: 8pt; font-style: italic;">Jl. Komering II, Kel. Demang Lebar Daun, Kec. Ilir Barat I, Kota Palembang 30137</p>
    </div>
    <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/logo58.png" alt="Logo Kanan" style="height: 90px; width: auto;">
</div>

TABEL 1: KISI-KISI SOAL
Judul: "KISI-KISI SOAL ${formData?.subject?.toUpperCase()} ${formData?.phase}"
Tabel dengan kolom: No | CP (Capaian Pembelajaran) | TP (Tujuan Pembelajaran) | Materi | Jumlah Soal | Indikator Soal
- Isi berdasarkan data dari Asesmen Sumatif di RPM
- CP harus sesuai standar Kurikulum Merdeka untuk mapel ${formData?.subject}
- TP diambil dari bagian Desain Pembelajaran
- Materi diambil dari RPM
- Jumlah soal sesuai dengan yang ada di RPM
- Indikator soal dibuat berdasarkan soal yang ada

TABEL 2: INDIKATOR SOAL
Judul: "INDIKATOR SOAL ${formData?.subject?.toUpperCase()} ${formData?.phase}"
Tabel dengan kolom: No | CP | Materi | Indikator Soal | Nomor Soal
- Kelompokkan soal berdasarkan indikator
- Cantumkan nomor soal yang sesuai dengan indikatornya

TABEL 3: KARTU SOAL
Judul: "KARTU SOAL ${formData?.subject?.toUpperCase()} ${formData?.phase}"
Tabel dengan kolom: No | CP | TP | Soal | Kunci Jawaban
- Tuliskan soal lengkap dari Asesmen Sumatif
- Sertakan kunci jawaban untuk setiap soal

GUNAKAN STYLE BERIKUT:
- Font: 'Space Grotesk', sans-serif
- Font size: 10.5pt
- Border tabel: 1px solid #000
- Border-collapse: collapse
- Padding cell: 6px 8px
- Header background: #1a4185
- Header text: white, bold
- Page break setelah setiap tabel menggunakan: <div style="page-break-after: always;"></div>

MULAI DARI TABEL 1, GUNAKAN FORMAT HTML LENGKAP DENGAN KOP SURAT.`;

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
