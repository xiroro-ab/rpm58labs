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
4. Output HANYA kode HTML, TANPA markdown code block

STRUKTUR SETIAP TABEL (SANGAT PENTING):
Setiap tabel dibungkus dalam satu container div. Kop surat dan tabel harus dalam SATU CONTAINER yang sama. Page break diletakkan SETELAH container tersebut selesai.

CONTOH STRUKTUR YANG BENAR:
<div style="font-family: 'Space Grotesk', sans-serif; font-size: 10.5pt;">
  <!-- KOP SURAT -->
  <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 15px;">
      <img src="..." style="height: 90px;">
      <div style="text-align: center; flex: 1;">
          <h3>PEMERINTAH KOTA PALEMBANG</h3>
          ...
      </div>
      <img src="..." style="height: 90px;">
  </div>
  
  <!-- JUDUL TABEL -->
  <h2 style="text-align: center; margin-bottom: 10px;">KISI-KISI SOAL ...</h2>
  
  <!-- TABEL -->
  <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
    ...
  </table>
</div>
<!-- PAGE BREAK SETELAH TABEL SELESAI -->
<div style="page-break-after: always;"></div>

<!-- LANJUT TABEL 2 DENGAN STRUCTURE YANG SAMA -->
<div style="font-family: 'Space Grotesk', sans-serif; font-size: 10.5pt;">
  <!-- KOP SURAT LAGI -->
  ...
  <!-- TABEL 2 -->
  ...
</div>
<div style="page-break-after: always;"></div>

<!-- LANJUT TABEL 3 -->
...

TABEL 1: KISI-KISI SOAL
Judul: "KISI-KISI SOAL ${formData?.subject?.toUpperCase()} ${formData?.phase}"
Tabel dengan kolom: No | CP (Capaian Pembelajaran) | TP (Tujuan Pembelajaran) | Materi | Jumlah Soal | Indikator Soal

TABEL 2: INDIKATOR SOAL
Judul: "INDIKATOR SOAL ${formData?.subject?.toUpperCase()} ${formData?.phase}"
Tabel dengan kolom: No | CP | Materi | Indikator Soal | Nomor Soal

TABEL 3: KARTU SOAL
Judul: "KARTU SOAL ${formData?.subject?.toUpperCase()} ${formData?.phase}"
Tabel dengan kolom: No | CP | TP | Soal | Kunci Jawaban

STYLE TABEL:
- Border: 1px solid #000
- Border-collapse: collapse
- Padding cell: 6px 8px
- Header background: #1a4185
- Header text: white, bold

MULAI DARI TABEL 1, GUNAKAN FORMAT HTML LENGKAP.`;

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
