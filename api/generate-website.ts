import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method Not Allowed' }); }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) {} }

    const { html, topic } = body;
    if (!html) return res.status(400).json({ error: 'HTML RPM diperlukan' });
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi' });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = [
      'Anda adalah web developer yang membuat website pembelajaran interaktif dari Rencana Pembelajaran Mendalam (RPM).',
      'Buat SATU file HTML LENGKAP dengan tema **NEO BRUTALISM**.',
      '',
      'KARAKTERISTIK NEO BRUTALISM:',
      '- Border hitam TEBAL (4-6px)',
      '- Box-shadow offset: 6px 6px 0 #000 atau 8px 8px 0 #000',
      '- Background: putih (#fff), kuning (#FFD700), merah salmon (#FF6B6B), tosca (#4ECDC4), hitam (#000)',
      '- Font bold sans-serif atau monospace',
      '- Gak usah rounded corners (atau minimal)',
      '- High contrast, typography besar (2rem-3rem untuk judul)',
      '- Tampilan "unpolished" yang disengaja, asimetris',
      '- Bisa pake icon Font Awesome atau emoji',
      '',
      'STRUKTUR WEBSITE:',
      '- Header: judul mapel, kelas, guru, sekolah',
      '- Navigasi sidebar kiri dengan link ke setiap section',
      '- Section: Identitas, Desain Pembelajaran, Pengalaman Belajar (tiap pertemuan), Asesmen, Lampiran Referensi Visual',
      '- Footer: nama guru, tahun',
      '',
      'ATURAN:',
      '- SATU FILE HTML utuh, inline CSS, inline JS. NO external dependencies kecuali Google Font & Font Awesome CDN.',
      '- Responsive mobile-friendly',
      '- Semua konten dari RPM harus muncul LENGKAP',
      '- Output LANGSUNG HTML, tanpa markdown block, tanpa teks tambahan',
      '- Gunakan format tabel, list, dan heading yang rapi',
      '',
      'TOPIK: ' + topic,
      '',
      'RPM:',
      html,
    ].join('\n');

    res.setHeader('Content-Type', 'application/json');
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    const websiteHtml = response.text || '';
    res.json({ html: websiteHtml });
  } catch (error: any) {
    console.error('Generate Website Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal: ' + (error.message || '') });
  }
}