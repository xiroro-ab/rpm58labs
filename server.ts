import puppeteer from 'puppeteer-core';

import chromium from '@sparticuz/chromium';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import generateTableHandler from './api/generate-table';
import generateSoalHandler from './api/generate-soal';
import enhanceRpmHandler from './api/enhance-rpm';
import generateWebsiteHandler from './api/generate-website';
import reviseWebsiteHandler from './api/revise-website';
import extractQuestionsHandler from './api/extract-questions';
import parseAnswersHandler from './api/parse-answers';
import analyzeResultsHandler from './api/analyze-results';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API route for generation
  app.post('/api/generate', async (req, res) => {
    try {
      const { data, customApiKey, aiProvider, previousOutput } = req.body;
      const defaultGeminiKey = process.env.GEMINI_API_KEY;
      const provider = aiProvider || 'gemini';
      
      if (!customApiKey && !defaultGeminiKey && provider === 'gemini') {
        return res.status(400).json({ error: 'API Key diperlukan.' });
      }
      if (!customApiKey && provider !== 'gemini') {
        return res.status(400).json({ error: 'Custom API Key diperlukan untuk provider ' + provider + '.' });
      }
      const keyToUse = customApiKey || defaultGeminiKey;

      const isDaring = data.learningMode?.includes('Daring');
      const isBlended = data.learningMode?.includes('Blended');
      const meetingCount = parseInt(data.meetingCount?.replace('x', '')) || 1; 

      let pengalamanBelajarHTML = '';
      for(let i = 1; i <= meetingCount; i++) {
          pengalamanBelajarHTML += `
<div class="pertemuan-box">
  <div class="pertemuan-header">PERTEMUAN ${i}: [Topik / Sub-Materi Spesifik]</div>
  <table class="rpm-table">
    <tr>
      <td class="bg-green-light w-1-4 font-bold">A. Kegiatan Awal<br><span class="text-xs-italic">(... Menit)</span></td>
      <td>
        <ul class="clean-list">
          <li><span class="label-mindful">Mindful Readiness</span> [Aktivitas pembuka, doa, apersepsi untuk moda ${data.learningMode}]</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td class="bg-yellow-light font-bold">B. Kegiatan Inti<br><span class="text-xs-italic">(... Menit)</span><br><span class="text-xs-italic">*Sintaks model ${data.learningModel || 'yang dipilih'}</span></td>
      <td>
        <p class="fase-title">Fase 1: [Nama Fase]</p>
        <ul class="clean-list">
          <li><span class="label-mindful">Mindful Sensing</span> [Langkah eksplorasi mendetail]</li>
        </ul>
        <p class="fase-title">Fase 2: [Nama Fase]</p>
        <ul class="clean-list">
          <li><span class="label-meaningful">Meaningful Grouping</span> [Langkah kolaborasi mendetail]</li>
        </ul>
        <p class="fase-title">Fase 3: [Nama Fase]</p>
        <ul class="clean-list">
          <li><span class="label-joyful">Joyful Experiencing</span> [Langkah kreasi/presentasi mendetail]</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td class="bg-blue-light font-bold">C. Kegiatan Penutup<br><span class="text-xs-italic">(... Menit)</span></td>
      <td>
        <ul class="clean-list">
          <li><span class="label-meaningful">Meaningful Reflection</span> [Refleksi dan kesimpulan]</li>
        </ul>
      </td>
    </tr>
  </table>
</div>
`;
      }

      const prompt = `Bertindaklah sebagai Pakar Pedagogik. Buat Rencana Pembelajaran Mendalam (RPM) berdasarkan:

- Sekolah: ${data.school}
- Guru: ${data.teacher}
- Mapel: ${data.subject}
- Fase/Kelas: ${data.phase}
- Alokasi Waktu: ${data.duration}
- Materi: ${data.topic}
- Karakteristik Siswa: ${data.studentCharacteristics}
- Moda Pembelajaran: ${data.learningMode}
- Jumlah Pertemuan: ${data.meetingCount}
- Tanggal Dokumen: ${data.documentDate || new Date().toISOString().split('T')[0]}

WAJIB susun menggunakan struktur HTML di bawah. JANGAN gunakan markdown code block (` + '```html' + `). JANGAN HANYA MENYALIN KURUNG SIKU! Isi mendetail! ${isDaring ? "Tekankan interaksi digital/Zoom." : ""} ${isBlended ? "Gabungkan luring & daring." : ""}

ATURAN PENTING:
- PERTAHANKAN struktur HTML, class, dan style attribute PERSIS seperti template di bawah. HANYA ganti konten di dalam kurung siku [...] beserta isinya.
- Jangan ubah atau hapus atribut style pada eleman manapun.

<div class="kop-surat">
    <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/Logo_Palembang.png" alt="Logo Kiri" class="logo">
    <div class="teks-kop">
        <h3>PEMERINTAH KOTA PALEMBANG</h3>
        <h3>DINAS PENDIDIKAN</h3>
        <h3 style="font-size: 1.2em; font-weight: bold;">SMP NEGERI 58 PALEMBANG</h3>
        <div style="display: flex; justify-content: center; width: 100%;"><p style="font-size: 0.8em; font-style: italic; margin: 0;">Jl. Komering II, Kel. Demang Lebar Daun, Kec. Ilir Barat I, Kota Palembang 30137</p></div>
    </div>
    <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/logo58.png" alt="Logo Kanan" class="logo">
</div>

<div class="rpm-section-title" style="text-align: center; font-size: 1.1em;">
  RENCANA PEMBELAJARAN MENDALAM (RPM)<br>BERBASIS DEEP LEARNING (MINDFUL, MEANINGFUL, JOYFUL LEARNING)
</div>

<table class="rpm-table">
  <tr>
    <td class="w-1-4 font-bold">Satuan Pendidikan</td>
    <td class="w-1-4">${data.school}</td>
    <td class="w-1-4 font-bold">Mata Pelajaran</td>
    <td class="w-1-4">${data.subject}</td>
  </tr>
  <tr>
    <td class="font-bold">Fase / Kelas</td>
    <td>${data.phase}</td>
    <td class="font-bold">Moda Pembelajaran</td>
    <td>${data.learningMode}</td>
  </tr>
  <tr>
    <td class="font-bold">Nama Guru</td>
    <td>${data.teacher}</td>
    <td class="font-bold">Alokasi Waktu</td>
    <td>${data.duration} (${data.meetingCount})</td>
  </tr>
</table>

<div class="rpm-section-title">I. IDENTIFIKASI</div>
<table class="rpm-table">
  <tr>
    <td class="w-30 font-bold">Peserta Didik</td>
    <td>[Analisis kebutuhan belajar dari: ${data.studentCharacteristics}]</td>
  </tr>
  <tr>
    <td class="font-bold">Materi Pelajaran</td>
    <td>[Deskripsi mendalam materi ${data.topic}]</td>
  </tr>
  <tr>
    <td class="font-bold">Dimensi Profil Lulusan</td>
    <td>[Sebut 2-3 dimensi Profil Pelajar Pancasila yang relevan]</td>
  </tr>
</table>

<div class="rpm-section-title">II. DESAIN PEMBELAJARAN</div>
<table class="rpm-table">
  <tr>
    <td class="w-30 font-bold">Capaian Pembelajaran</td>
    <td>[Rumuskan CP sesuai materi dan Fase]</td>
  </tr>
  <tr>
    <td class="font-bold">Lintas Disiplin Ilmu</td>
    <td>[Kaitkan dengan mapel lain]</td>
  </tr>
  <tr>
    <td class="font-bold">Tujuan Pembelajaran</td>
    <td>
      <ol class="clean-list">
        <li>[Tujuan 1]</li>
        <li>[Tujuan 2]</li>
      </ol>
    </td>
  </tr>
  <tr>
    <td class="font-bold">Topik Pembelajaran</td>
    <td>[Spesifikkan topik]</td>
  </tr>
  <tr>
    <td class="font-bold">Praktek Pedagogis</td>
    <td>
      <b>Model:</b> [Pilih model]<br>
      <b>Strategi:</b> [Strategi aktif]<br>
      <b>Metode:</b> [Metode]
    </td>
  </tr>
  <tr>
    <td class="font-bold">Kemitraan Pembelajaran</td>
    <td>[Keterlibatan orang tua/komunitas]</td>
  </tr>
  <tr>
    <td class="font-bold">Lingkungan & Digital</td>
    <td>[Setting dan alat digital spesifik untuk ${data.learningMode}]</td>
  </tr>
</table>

<div class="rpm-section-title">III. PENGALAMAN BELAJAR</div>
${pengalamanBelajarHTML}

<div class="rpm-section-title">IV. ASESMEN PEMBELAJARAN</div>
<table class="rpm-table">
  <tr>
    <th class="w-1-4">Jenis Asesmen</th>
    <th>Deskripsi dan Teknik</th>
  </tr>
  <tr>
    <td class="font-bold">Asesmen Awal</td>
    <td>[Pertanyaan pemantik]</td>
  </tr>
  <tr>
    <td class="font-bold">Asesmen Formatif</td>
    <td>[Pemantauan proses belajar]</td>
  </tr>
  <tr>
    <td class="font-bold">Asesmen Sumatif</td>
    <td>
      [Tugas akhir / Instrumen. WAJIB lampirkan minimal 3 soal PG lengkap dengan opsi A-D bersusun vertikal dan Kunci Jawaban di akhir!]
    </td>
  </tr>
</table>

<div class="rpm-section-title">V. REFLEKSI GURU DAN PESERTA DIDIK</div>
<p><b>A. Refleksi Guru</b></p>
<ol class="clean-list" style="margin-bottom: 15px !important;">
  <li>[Refleksi 1]</li>
  <li>[Refleksi 2]</li>
</ol>
<p><b>B. Refleksi Peserta Didik</b></p>
<ol class="clean-list">
  <li>[Refleksi Siswa 1]</li>
  <li>[Refleksi Siswa 2]</li>
</ol>

<!-- LAMPIRAN 4: REFERENSI VISUAL -->
<div class="rpm-section-title">Lampiran 4: Referensi Visual</div>
<p style="margin-bottom: 8px;">Berikut referensi visual untuk mendukung kegiatan pembelajaran setiap pertemuan:</p>

Untuk SETIAP aktivitas pada setiap pertemuan yang mengandung "guru menampilkan/memperlihatkan gambar/ilustrasi/foto" atau "pertanyaan pemantik/apersepsi", buat:
<div class="rpm-embed-visual">
  <p><strong>Pertemuan [N] — [Kegiatan Awal/Inti]: [Nama Aktivitas]</strong></p>
  <p>🔍 <a href="https://www.google.com/search?tbm=isch&q=KEYWORD" target="_blank">Cari gambar referensi di Google Images</a></p>
  <p>🎨 <a href="https://www.bing.com/images/create?q=PROMPT" target="_blank">Buat ilustrasi dengan Bing Image Creator</a></p>
  <p><em>Prompt: "PROMPT"</em></p>
</div>

Untuk SETIAP aktivitas "guru menayangkan video" pada setiap pertemuan, buat:
<div class="rpm-embed-visual">
  <p><strong>Pertemuan [N] — [Kegiatan Awal/Inti]: [Nama Aktivitas]</strong></p>
  <p><a href="https://www.youtube.com/results?search_query=KEYWORD" target="_blank">Cari video referensi di YouTube</a></p>
</div>

GANTI KEYWORD dengan kata kunci SPESIFIK. GANTI PROMPT dengan deskripsi Inggris + "educational illustration, flat design, colorful".
LEWATI aktivitas rutin (salam, doa, absensi).
`;


      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      let modelName = 'gemini-3.6-flash';
      let baseURL = '';
      
      if (provider === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: keyToUse });
        
        let messages = [];
        if (previousOutput) {
           messages = [
             { role: 'user', parts: [{ text: prompt }] },
             { role: 'model', parts: [{ text: previousOutput }] },
             { role: 'user', parts: [{ text: 'Lanjutkan tepat dari bagian teksmu yang terpotong. JANGAN mengulang dari awal, langsung sambung teksnya. JANGAN menambahkan pengantar atau penutup.' }] }
           ];
        } else {
           messages = [{ role: 'user', parts: [{ text: prompt }] }];
        }
        
        const responseStream = await ai.models.generateContentStream({
          model: modelName,
          contents: messages
        });
        for await (const chunk of responseStream) {
          if (chunk.text) {
            res.write(chunk.text);
          }
        }
      } else if (provider === 'anthropic') {
        const anthropic = new Anthropic({ apiKey: keyToUse });
        const systemPrompt = prompt;
        
        let messages = [];
        if (previousOutput) {
          messages = [
            { role: 'assistant', content: previousOutput },
            { role: 'user', content: 'Lanjutkan tepat dari bagian teksmu yang terpotong. JANGAN mengulang dari awal, langsung sambung teksnya. JANGAN menambahkan pengantar atau penutup.' }
          ];
        } else {
          messages = [{ role: 'user', content: 'Silakan buat RPM sesuai instruksi.' }];
        }
        
        const responseStream = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 8192,
          system: systemPrompt,
          messages: messages as any,
          stream: true
        });
        
        for await (const chunk of responseStream) {
          if (chunk.type === 'content_block_delta' && (chunk.delta as any)?.text) {
            res.write((chunk.delta as any).text);
          }
        }
      } else {
        if (provider === 'openai') {
          modelName = 'gpt-4o-mini';
        } else if (provider === 'deepseek') {
          baseURL = 'https://api.deepseek.com/v1';
          modelName = 'deepseek-chat';
        } else if (provider === 'groq') {
          baseURL = 'https://api.groq.com/openai/v1';
          modelName = 'llama-3.3-70b-versatile';
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
          messages: previousOutput ? [{ role: 'user', content: prompt }, { role: 'assistant', content: previousOutput }, { role: 'user', content: 'Lanjutkan tepat dari bagian teksmu yang terpotong. JANGAN mengulang dari awal, langsung sambung teksnya. JANGAN menambahkan pengantar atau penutup.' }] : [{ role: 'user', content: prompt }],
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
      console.error("Error generating RPM:", error);
      
      let errorMessage = 'Gagal membuat RPM. Periksa API Key atau coba lagi nanti.';
      
      if (error.message?.includes('429') || error.status === 429) {
        errorMessage = 'Kuota API Key Anda telah habis atau tidak memiliki akses ke Free Tier (limit: 0). Pastikan API Key di menu Secrets berasal dari Google Cloud project yang mendukung Free Tier, atau Anda sudah mengatur penagihan (billing).';
      } else if (error.message?.includes('404') || error.status === 404) {
        errorMessage = 'Model tidak ditemukan atau belum tersedia untuk API Key Anda.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      res.status(500).json({ error: errorMessage });
    }
  });

  app.post("/api/pdf", async (req, res) => {
try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {}
    }

    let { html, filename, footerText, orientation } = body;
        if (html) {
      html = html.replace(/✓/g, '✅').replace(/✔/g, '✅');
      html = html.replace(/<span style="[^"]*background-color:[^"]*"[^>]*>(Mindful[^<]*)<\/span>/gi, '$1');
      html = html.replace(/<span style="[^"]*background-color:[^"]*"[^>]*>(Meaningful[^<]*)<\/span>/gi, '$1');
      html = html.replace(/<span style="[^"]*background-color:[^"]*"[^>]*>(Joyful[^<]*)<\/span>/gi, '$1');
      html = html.replace(/<span class="[^"]*"(?:[^>]*)>(Mindful[^<]*)<\/span>/gi, '$1');
      html = html.replace(/<span class="[^"]*"(?:[^>]*)>(Meaningful[^<]*)<\/span>/gi, '$1');
      html = html.replace(/<span class="[^"]*"(?:[^>]*)>(Joyful[^<]*)<\/span>/gi, '$1');
      html = html.replace(/\b(Mindful(?:\s+\w+)?)\b/gi, '<span class="label-mindful">$1</span>');
      html = html.replace(/\b(Meaningful(?:\s+\w+)?)\b/gi, '<span class="label-meaningful">$1</span>');
      html = html.replace(/\b(Joyful(?:\s+\w+)?)\b/gi, '<span class="label-joyful">$1</span>');
    }
    if (!html) return res.status(400).json({ error: 'HTML is required' });

    
  const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Noto+Color+Emoji&family=Noto+Sans+Symbols&family=Noto+Sans+Symbols+2&display=swap" rel="stylesheet">
          
          <style>
            * { box-sizing: border-box; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; font-family: 'Space Grotesk', 'Noto Color Emoji', 'Noto Sans Symbols', 'Noto Sans Symbols 2', 'Segoe UI Symbol', sans-serif; }
            
            /* Page break rules */
            .page-break-before { page-break-before: always; }
            .page-break-after { page-break-after: always; }
            
            /* Keep elements together */
            h1, h2, h3, h4, h5 { page-break-after: avoid; page-break-inside: avoid; }
            img { page-break-inside: avoid; }
            
            /* Table specific - allow break inside table rows if needed, but try to avoid */
            table { page-break-inside: auto; border-collapse: collapse; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            td, th { page-break-inside: avoid; }
            
            /* Kop surat should stay with content */
            .kop-surat, [style*="border-bottom: 3px double"] { page-break-after: avoid; }
            
            img.emoji { height: 1em; width: 1em; margin: 0 .05em 0 .1em; vertical-align: -0.1em; }
          
            .label-mindful { background-color: #ef4444 !important; color: white !important; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; font-weight: bold; margin-right: 4px; display: inline-block; margin-bottom: 4px; }
            .label-meaningful { background-color: #eab308 !important; color: white !important; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; font-weight: bold; margin-right: 4px; display: inline-block; margin-bottom: 4px; }
            .label-joyful { background-color: #3b82f6 !important; color: white !important; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; font-weight: bold; margin-right: 4px; display: inline-block; margin-bottom: 4px; }

            .kop-surat { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid black; padding-bottom: 15px; margin-bottom: 20px; position: relative; }
            .kop-surat::after { content: ""; position: absolute; bottom: -6px; left: 0; right: 0; border-bottom: 1px solid black; }
            .kop-surat .logo { width: 90px; height: auto; }
            .kop-surat .teks-kop { text-align: center; flex: 1; padding: 0 15px; }
            .kop-surat h3 { margin: 0; line-height: 1.2; font-size: 1.1em; }
            .kop-surat p { margin: 2px 0 0; line-height: 1.3; text-align: center !important; }
            
            .rpm-table { width: 100% !important; border-collapse: collapse !important; margin-bottom: 8px !important; font-size: 0.9em !important; table-layout: auto !important; }
            .rpm-table th, .rpm-table td { border: 1px solid #000 !important; padding: 4px 6px !important; vertical-align: top !important; margin: 0 !important; }
            .rpm-table th { background-color: #1a4185 !important; color: white !important; text-align: left !important; font-weight: bold !important; }
            
            .rpm-section-title { background-color: #1a4185 !important; color: white !important; padding: 8px 12px !important; font-weight: bold !important; margin-top: 20px !important; margin-bottom: 10px !important; }
            .pertemuan-box { border: 1px solid #e5e7eb !important; border-radius: 8px !important; margin-bottom: 20px !important; background-color: #ffffff !important; box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important; page-break-inside: avoid !important; overflow: hidden !important; }
            .pertemuan-box:nth-of-type(3n+1) { border-left: 6px solid #10b981 !important; }
            .pertemuan-box:nth-of-type(3n+2) { border-left: 6px solid #8b5cf6 !important; }
            .pertemuan-box:nth-of-type(3n+3) { border-left: 6px solid #3b82f6 !important; }
            .pertemuan-header { background-color: #f8fafc !important; padding: 12px 15px !important; border-bottom: 1px solid #e5e7eb !important; font-weight: bold !important; color: #1e293b !important; font-size: 1.1em !important; margin: 0 !important; }
            .w-1-4 { width: 25% !important; }
            .w-30 { width: 30% !important; }
            .bg-green-light { background-color: #f0fdf4 !important; }
            .bg-yellow-light { background-color: #fefce8 !important; }
            .bg-blue-light { background-color: #eff6ff !important; }
            .font-bold { font-weight: bold !important; }
            .text-xs-italic { font-size: 0.85em !important; font-style: italic !important; font-weight: normal !important; }
            .fase-title { font-weight: bold !important; margin-bottom: 5px !important; color: #1a4185 !important; margin-top: 0 !important; }
            .clean-list { margin: 0 !important; padding-left: 20px !important; }
            .clean-list li { margin-bottom: 6px !important; }

            .rpm-embed-visual { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #1a4185; border-radius: 8px; padding: 12px 16px; margin: 10px 0; page-break-inside: avoid; }
            .rpm-embed-visual p { margin: 4px 0 !important; font-size: 10.5pt; }
            .rpm-embed-visual a { color: #1a4185 !important; font-weight: 600 !important; }
            .rpm-embed-visual a { color: #1a4185 !important; font-weight: 600 !important; }
            .rpm-embed-visual em { font-size: 0.85em; color: #64748b; }

          </style>
        </head>
        <body>${html}</body>
      </html>`;

    // Important for Vercel: set the graphics mode and headless mode
    // sparticuz/chromium handles the path for AWS Lambda / Vercel Serverless automatically.
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: (chromium as any).defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: (chromium as any).headless,
      // @ts-ignore
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' as any });
    await page.evaluateHandle('document.fonts.ready');
    
    // Parse emojis to SVG
    await page.addScriptTag({ url: 'https://unpkg.com/twemoji@latest/dist/twemoji.min.js' });
    await page.evaluate(() => {
      if ((window as any).twemoji) (window as any).twemoji.parse(document.body, { folder: 'svg', ext: '.svg' });
    });
    // Wait for the SVG images from twemoji to load
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: orientation === 'landscape',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '20mm', left: '15mm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `<div style="font-size: 8px; width: 100%; display: flex; justify-content: space-between; padding-left: 15mm; padding-right: 15mm; color: #666; font-family: sans-serif;"><span>${footerText || ''}</span><span>Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></span></div>`
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'document.pdf'}"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate PDF: ' + error.message });
  }
  });

  app.post("/api/revise", async (req, res) => {
    try {
      const { html, instruction } = req.body;
      if (!html || !instruction) {
        return res.status(400).json({ error: 'HTML and instruction are required' });
      }

      const { GoogleGenAI } = await import('@google/genai');
      // Require GEMINI_API_KEY
      if (!process.env.GEMINI_API_KEY) {
         return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on server' });
      }
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Anda adalah asisten AI untuk merevisi dokumen modul ajar (RPM).
Tugas Anda: Revisi dokumen HTML berikut HANYA pada bagian yang diminta oleh instruksi pengguna. 
- JANGAN mengubah kerangka dasar, layout, atau gaya desain (inline styles, class).
- Jika instruksi mengharuskan penambahan konten (misal: "tambah 5 soal"), buat strukturnya semirip mungkin dengan bagian sebelumnya.
- Output HANYA berupa keseluruhan kode HTML yang sudah direvisi, tanpa teks awalan/akhiran, tanpa markdown blok (seperti \`\`\`html).

INSTRUKSI PENGGUNA:
${instruction}

DOKUMEN HTML ASLI:
${html}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      let revisedHtml = response.text || html;
      // Clean up potential markdown formatting from the response
      revisedHtml = revisedHtml.replace(/^```html\n?/i, '').replace(/```$/i, '').trim();

      res.json({ revisedHtml });
    } catch (error) {
      console.error('Revise Error:', error);
      res.status(500).json({ error: 'Failed to revise HTML' });
    }
  });

  app.post("/api/revise-chat", async (req, res) => {
    try {
      const { html, instruction, chatHistory, sectionOnly } = req.body;
      if (!html || !instruction) {
        return res.status(400).json({ error: 'HTML and instruction are required' });
      }

      const { GoogleGenAI } = await import('@google/genai');
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      let historyContext = '';
      if (chatHistory?.length) {
        historyContext = 'RIWAYAT PERCAKAPAN:\n' +
          chatHistory.map((m: any) => `${m.role === 'user' ? 'USER' : 'AI'}: ${m.content}`).join('\n') + '\n\n';
      }

      const prompt = `Anda asisten AI yang membantu guru merevisi RPM.

KEMAMPUAN:
- Mengubah teks, soal, atau bagian tertentu
- Mengganti jawaban, menambah/menghapus soal
- "ubah soal nomor 3", "ganti jawaban A di soal 5", dll
- Perbaiki tata bahasa

ATURAN:
1. ${sectionOnly ? 'Output HANYA HTML bagian yang direvisi (fragment), BUKAN seluruh dokumen. Output langsung HTML fragment, tanpa tag pembungkus.' : 'Output HANYA kode HTML lengkap yang sudah direvisi'}
2. JANGAN gunakan markdown code block
3. Jangan ubah struktur di luar yang diminta
4. Pertahankan inline style dan class yang ada

${historyContext}INSTRUKSI PENGGUNA:
${instruction}

DOKUMEN RPM:
${html}`;

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('Cache-Control', 'no-cache, no-transform');

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      for await (const chunk of responseStream) {
        if (chunk.text) res.write(chunk.text);
      }
      res.end();
    } catch (error: any) {
      console.error('Revise Chat Error:', error);
      if (!res.headersSent) res.status(500).json({ error: 'Gagal: ' + (error.message || '') });
      else res.end();
    }
  });

  app.post("/api/teaching-aids", async (req, res) => {
    try {
      const { html, topic } = req.body;
      if (!html) return res.status(400).json({ error: 'HTML RPM diperlukan' });

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi' });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Anda adalah asisten pembuat alat bantu visual untuk guru. Analisis RPM berikut dan buat alat bantu visual untuk SETIAP aktivitas pembelajaran.

Untuk setiap aktivitas, buat:
1. **SVG Ilustrasi** — diagram/ilustrasi yang MENDETAIL, proporsional, estetik. Gunakan SVG murni (bukan gambar luar). Ukuran viewBox="0 0 800 400". Gunakan warna: biru (#1a4185), emas (#eab308), hijau (#10b981), merah (#ef4444), putih, abu2. Tambahkan teks, ikon, panah, dan elemen visual yang relevan.
2. **Link Google** — kata kunci pencarian yang tepat
3. **Link YouTube** — kata kunci pencarian video yang tepat  
4. **Ringkasan Aktivitas** — jelaskan aktivitas dan bagaimana visual membantu

TOPIK: ${topic}

OUTPUT dalam format HTML berikut (TANPA markdown block, LANGSUNG HTML):
${'<div class="teaching-aids-container">'}
  ${'<div class="aid-item">'}
    ${'<div class="aid-header">'}
      ${'<span class="aid-label">[Jenis Aktivitas]</span>'}
      ${'<span class="aid-meeting">Pertemuan [N]</span>'}
    ${'</div>'}
    ${'<div class="aid-svg-wrapper">'}
      ${'<!-- SVG LANGSUNG DI SINI -->'}
    ${'</div>'}
    ${'<div class="aid-card">'}
      ${'<p class="aid-desc">[Ringkasan aktivitas dan bagaimana visual membantu]</p>'}
    ${'</div>'}
    ${'<div class="aid-links">'}
      ${'<a class="aid-link aid-google" href="https://www.google.com/search?q=[kata+kunci]" target="_blank">🔍 Cari Google</a>'}
      ${'<a class="aid-link aid-youtube" href="https://www.youtube.com/results?search_query=[kata+kunci]" target="_blank">▶️ Cari YouTube</a>'}
    ${'</div>'}
  ${'</div>'}
${'</div>'}

RPM:
${html}`;

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      for await (const chunk of responseStream) {
        if (chunk.text) res.write(chunk.text);
      }
      res.end();
    } catch (error) {
      console.error('Teaching Aids Error:', error);
      res.status(500).json({ error: 'Gagal membuat alat bantu visual' });
    }
  });
  app.post("/api/generate-table", (req, res) => { generateTableHandler(req, res); });
  app.post("/api/generate-soal", (req, res) => { generateSoalHandler(req, res); });
  app.post("/api/enhance-rpm", (req, res) => { enhanceRpmHandler(req, res); });
  app.post("/api/generate-website", (req, res) => { generateWebsiteHandler(req, res); });
  app.post("/api/revise-website", (req, res) => { reviseWebsiteHandler(req, res); });
  app.post("/api/extract-questions", (req, res) => { extractQuestionsHandler(req, res); });
  app.post("/api/parse-answers", (req, res) => { parseAnswersHandler(req, res); });
  app.post("/api/analyze-results", (req, res) => { analyzeResultsHandler(req, res); });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
