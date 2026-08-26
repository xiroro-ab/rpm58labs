import { GoogleGenAI } from '@google/genai';

export const config = {
  api: {
    bodyParser: { sizeLimit: '10mb' },
  },
};

function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === delim && !inQuotes) {
      out.push(cur.trim()); cur = '';
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

// ponytail: CSV/TXT saja (Google Sheets bisa download CSV). Upgrade: tambah lib xlsx bila perlu .xlsx asli.
function parseCsv(text: string): { name: string; answers: Record<string, string> }[] | null {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 1) return null;

  const delimCounts = ['\t', ';', ','].map(d => ({
    d,
    n: (lines[0].match(new RegExp('\\' + d, 'g')) || []).length,
  }));
  delimCounts.sort((a, b) => b.n - a.n);
  const delim = delimCounts[0].n > 0 ? delimCounts[0].d : '\t';

  const first = splitCsvLine(lines[0], delim).map(c => c.toLowerCase());
  const hasHeader = first.some(c => c.includes('nama') || c.includes('name'));

  let rows = lines.map(l => splitCsvLine(l, delim));
  let nameCol = 0;
  let qCols: { idx: number; num: number }[] = [];

  if (hasHeader) {
    rows = rows.slice(1);
    first.forEach((c, idx) => {
      if (c.includes('nama') || c.includes('name')) { nameCol = idx; return; }
      const m = c.match(/(\d+)\s*[\).\:]?\s*$/);
      if (m) qCols.push({ idx, num: parseInt(m[1]) });
    });
    // header tanpa angka (misal kolom soal tidak berjudul angka): pakai urutan kolom setelah nama
    if (qCols.length === 0) {
      let q = 1;
      first.forEach((c, idx) => {
        if (idx !== nameCol && !/waktu|timestamp|skor|score|nilai|kelas|no\b/.test(c)) {
          qCols.push({ idx, num: q++ });
        }
      });
    }
  } else {
    const width = rows[0]?.length || 0;
    for (let i = 1; i < width; i++) qCols.push({ idx: i, num: i });
  }

  const students: { name: string; answers: Record<string, string> }[] = [];
  for (const row of rows) {
    const name = (row[nameCol] || '').trim();
    if (!name) continue;
    if (/^nama$/i.test(name)) continue;
    const answers: Record<string, string> = {};
    for (const qc of qCols) {
      const v = (row[qc.idx] || '').trim();
      if (v) answers[String(qc.num)] = v;
    }
    students.push({ name, answers });
  }
  return students.length > 0 ? students : null;
}

async function callAI(ai: any, parts: any[]): Promise<string> {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: [{ role: 'user', parts }] });
      return (r.text || '').trim();
    } catch (e: any) {
      if ((e.message?.includes('503') || e.status === 503) && i < 2) {
        await new Promise(r => setTimeout(r, (i + 1) * 2000));
        continue;
      }
      throw e;
    }
  }
  return '';
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method Not Allowed' }); }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) {} }

    const { csvText, text, imageBase64, imageMime, customApiKey } = body;

    if (csvText && csvText.trim()) {
      const students = parseCsv(csvText);
      if (students) return res.json({ students, source: 'csv' });
    }

    if (!text && !imageBase64) {
      return res.status(400).json({ error: 'Data jawaban siswa diperlukan (file CSV, teks, atau foto).' });
    }

    const key = customApiKey || process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: 'API Key diperlukan.' });
    const ai = new GoogleGenAI({ apiKey: key });

    const parts: any[] = [];
    if (imageBase64) parts.push({ inlineData: { mimeType: imageMime || 'image/jpeg', data: imageBase64 } });
    if (text && text.trim()) parts.push({ text: 'DATA JAWABAN:\n' + text });

    parts.push({ text: `Baca data jawaban siswa di atas (bisa berupa foto lembar jawaban, rekap ketikan, atau teks bebas).

ATURAN:
- Identifikasi NAMA setiap siswa dan jawaban-jawabannya.
- Jawaban dinomori sesuai nomor soalnya. Untuk pilihan ganda cukup HURUF opsi saja (contoh "A"), buang teks opsinya. Untuk uraian, tulis apa adanya.
- Jika ada kolom tambahan seperti No/Kelas/NIS abaikan sebagai soal. Kelas boleh disertakan di akhir nama jika terlihat jelas (contoh: "Budi - 8A") hanya jika ada lebih dari satu kelas.
- Jangan mengarang nama atau jawaban yang tidak ada.

Balas HANYA JSON valid tanpa markdown:
{"students":[{"name":"Budi Santoso","answers":{"1":"A","2":"C","3":"teks jawaban uraian"}}]}` });

    const raw = await callAI(ai, parts);
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Format respons AI tidak valid');
    const parsed = JSON.parse(m[0]);
    if (!parsed.students || !Array.isArray(parsed.students) || parsed.students.length === 0) {
      throw new Error('Tidak ada jawaban siswa terdeteksi.');
    }
    const students = parsed.students
      .map((s: any) => ({ name: String(s.name || 'Tanpa Nama'), answers: s.answers && typeof s.answers === 'object' ? s.answers : {} }))
      .filter((s: any) => Object.keys(s.answers).length > 0);
    if (students.length === 0) throw new Error('Semua baris jawaban kosong.');
    res.json({ students, source: 'ai' });
  } catch (error: any) {
    console.error('Parse Answers Error:', error);
    res.status(500).json({ error: 'Gagal membaca jawaban siswa: ' + (error.message || '') });
  }
}
