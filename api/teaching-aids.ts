import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const { html, topic } = body;
    if (!html) {
      return res.status(400).json({ error: 'HTML RPM diperlukan' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = [
      'Anda membantu guru menyiapkan referensi visual UNTUK KEGIATAN AWAL DAN INTI. LEWATI Kegiatan Penutup, ice breaking, doa, absensi.',
      '',
      'Untuk setiap aktivitas, output dengan TEMPLATE EXACT berikut (ganti [isi]):',
      '',
      '<div class="aid-item">',
      '  <div class="aid-header">',
      '    <span class="aid-label">[Kegiatan Awal / Inti]</span>',
      '    <span class="aid-meeting">Pertemuan [n]</span>',
      '  </div>',
      '  <div class="aid-card">',
      '    <p class="aid-title">[nama aktivitas]</p>',
      '    <p class="aid-visual-script"><strong>Saran Visual Guru:</strong> [deskripsi APA yang harus ditampilkan guru]</p>',
      '    <p class="aid-detail"><strong>Referensi Visual:</strong></p>',
      '    <p class="aid-keywords"> Gambar Google: <a href="https://www.google.com/search?tbm=isch&q=[keyword]" target="_blank">[keyword bahasa indonesia]</a></p>',
      '    <p class="aid-keywords"> Video YouTube: <a href="https://www.youtube.com/results?search_query=[keyword]" target="_blank">[keyword bahasa indonesia]</a></p>',
      '    <p class="aid-keywords"> Buat Gambar AI (gratis): <a href="https://www.bing.com/images/create?q=[prompt+inggris]" target="_blank">Buka Bing Image Creator</a></p>',
      '  </div>',
      '</div>',
      '',
      'CONTOH: aktivitas "guru menampilkan proses antrian tiket LRT"',
      'Hasil: <div class="aid-item"><div class="aid-header"><span class="aid-label">Kegiatan Inti</span><span class="aid-meeting">Pertemuan 1</span></div><div class="aid-card"><p class="aid-title">Mengamati Proses Antrian Tiket LRT</p><p class="aid-visual-script"><strong>Saran Visual Guru:</strong> Tampilkan foto stasiun LRT dan ilustrasi alur antrian. Minta siswa mengamati langkah-langkahnya.</p><p class="aid-detail"><strong>Referensi Visual:</strong></p><p class="aid-keywords"> Gambar Google: <a href="https://www.google.com/search?tbm=isch&q=stasiun+LRT+Palembang+antrian" target="_blank">stasiun LRT Palembang antrian</a></p><p class="aid-keywords"> Video YouTube: <a href="https://www.youtube.com/results?search_query=cara+naik+LRT+Palembang" target="_blank">cara naik LRT Palembang</a></p><p class="aid-keywords"> Buat Gambar AI (gratis): <a href="https://www.bing.com/images/create?q=simple+illustration+people+queuing+ticket+machine+train+station+educational" target="_blank">Buka Bing Image Creator</a></p></div></div>',
      '',
      'ATURAN:',
      '- Keyword Bahasa Indonesia SPESIFIK',
      '- Prompt Bing dalam Bahasa Inggris, spasi diganti +',
      '- OUTPUT LANGSUNG HTML, tanpa markdown, tanpa teks tambahan',
      '',
      'TOPIK: ' + topic,
      '',
      'RPM:',
      html,
    ].join('\n');

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
  } catch (error) {
    console.error('Teaching Aids Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal membuat alat bantu visual' });
    else res.end();
  }
}