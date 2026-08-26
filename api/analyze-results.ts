import { GoogleGenAI } from '@google/genai';

const SOLO_LEVELS = ['prestructural', 'unistructural', 'multistructural', 'relational', 'extended'];
const SOLO_LABELS: Record<string, string> = {
  prestructural: 'Prestruktural',
  unistructural: 'Unistruktural',
  multistructural: 'Multistruktural',
  relational: 'Relasional',
  extended: 'Abstrak Diperluas',
};

function pgLetter(v: string): string {
  const s = String(v || '').trim().toUpperCase();
  const m = s.match(/^\(?([A-F])[\)\.\:\s]/);
  if (m) return m[1];
  if (/^[A-F]$/.test(s)) return s;
  return '';
}

async function callAI(ai: any, prompt: string): Promise<string> {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt });
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

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function buildReportHtml(data: any): string {
  const { results, stats, itemAnalysis, narrative, meta } = data;
  const tgl = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const soloRows = SOLO_LEVELS
    .map((k) => {
      const label = SOLO_LABELS[k];
      const n = stats.soloDist[k] || 0;
      const pct = stats.count ? Math.round((n / stats.count) * 100) : 0;
      const colors: Record<string, string> = {
        prestructural: '#ef4444', unistructural: '#f97316',
        multistructural: '#eab308', relational: '#10b981', extended: '#1a4185',
      };
      return `<tr>
        <td style="padding:4px 6px;border:1px solid #000;font-weight:bold;">${label}</td>
        <td style="padding:4px 6px;border:1px solid #000;text-align:center;">${n}</td>
        <td style="padding:4px 6px;border:1px solid #000;">
          <div style="background-color:${colors[k] || '#94a3b8'};color:#fff;padding:2px 6px;border-radius:3px;width:${Math.max(pct, n > 0 ? 8 : 0)}%;min-width:${n > 0 ? '30px' : '0'};text-align:right;font-size:9pt;">${pct}%</div>
        </td>
      </tr>`;
    })
    .join('');

  const nilaiRows = results
    .map((r: any, i: number) => `<tr>
        <td style="padding:4px 6px;border:1px solid #000;text-align:center;">${i + 1}</td>
        <td style="padding:4px 6px;border:1px solid #000;">${r.name}</td>
        <td style="padding:4px 6px;border:1px solid #000;text-align:center;">${r.pgCorrect}/${r.pgTotal}</td>
        <td style="padding:4px 6px;border:1px solid #000;text-align:center;">${r.pgTotal ? Math.round((r.pgCorrect / r.pgTotal) * 100) : 0}</td>
        <td style="padding:4px 6px;border:1px solid #000;text-align:center;">${Object.keys(r.essayScores).length}</td>
        <td style="padding:4px 6px;border:1px solid #000;text-align:center;font-weight:bold;color:${r.value >= stats.kkm ? '#166534' : '#b91c1c'};">${r.value}</td>
        <td style="padding:4px 6px;border:1px solid #000;text-align:center;background-color:${r.tuntas ? '#dcfce7' : '#fee2e2'};font-weight:bold;">${r.tuntas ? 'Tuntas' : 'Belum'}</td>
        <td style="padding:4px 6px;border:1px solid #000;text-align:center;">${SOLO_LABELS[r.solo] || r.solo}</td>
      </tr>`)
    .join('');

  const itemRows = itemAnalysis
    .map((it: any) => `<tr>
        <td style="padding:4px 6px;border:1px solid #000;text-align:center;">${it.number}</td>
        <td style="padding:4px 6px;border:1px solid #000;text-align:center;">${it.type === 'pg' ? 'PG' : 'Uraian'}</td>
        <td style="padding:4px 6px;border:1px solid #000;">${it.question.slice(0, 120)}</td>
        <td style="padding:4px 6px;border:1px solid #000;text-align:center;font-weight:bold;color:${it.correctPct >= 75 ? '#166534' : it.correctPct >= 50 ? '#a16207' : '#b91c1c'};">${it.correctPct}%</td>
        <td style="padding:4px 6px;border:1px solid #000;text-align:center;background-color:${it.correctPct >= 75 ? '#dcfce7' : it.correctPct >= 50 ? '#fef9c3' : '#fee2e2'};">${it.status}</td>
      </tr>`)
    .join('');

  const catatanSoal = (narrative.catatanSoal || [])
    .map((c: any) => `<li style="margin-bottom:6px;"><b>Soal ${c.number}:</b> ${c.catatan}</li>`)
    .join('');

  return `<div style="font-family:'Space Grotesk',Arial,sans-serif;font-size:10.5pt;line-height:1.35;color:#000;text-align:justify;">
<div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px double #000;padding-bottom:10px;margin-bottom:8px;">
  <div style="text-align:center;flex:1;">
    <h3 style="margin:0;font-size:1.2em;">LAPORAN ANALISIS HASIL BELAJAR</h3>
    <h3 style="margin:2px 0 0;font-size:1.05em;">Koreksi Otomatis &amp; Analisis Taksonomi SOLO</h3>
  </div>
</div>

<table style="width:100%;border-collapse:collapse;margin-bottom:10px;font-size:10.5pt;border:1px solid #000;">
  <tr>
    <td style="font-weight:bold;padding:4px 6px;border:1px solid #000;width:22%;">Satuan Pendidikan</td><td style="padding:4px 6px;border:1px solid #000;">${meta.school || '-'}</td>
    <td style="font-weight:bold;padding:4px 6px;border:1px solid #000;width:18%;">Mata Pelajaran</td><td style="padding:4px 6px;border:1px solid #000;">${meta.subject || '-'}</td>
  </tr>
  <tr>
    <td style="font-weight:bold;padding:4px 6px;border:1px solid #000;">Fase / Kelas</td><td style="padding:4px 6px;border:1px solid #000;">${meta.phase || '-'}</td>
    <td style="font-weight:bold;padding:4px 6px;border:1px solid #000;">Guru</td><td style="padding:4px 6px;border:1px solid #000;">${meta.teacher || '-'}</td>
  </tr>
  <tr>
    <td style="font-weight:bold;padding:4px 6px;border:1px solid #000;">Jumlah Siswa</td><td style="padding:4px 6px;border:1px solid #000;">${stats.count}</td>
    <td style="font-weight:bold;padding:4px 6px;border:1px solid #000;">KKM / Tanggal</td><td style="padding:4px 6px;border:1px solid #000;">${stats.kkm} / ${tgl}</td>
  </tr>
</table>

<div style="background-color:#1a4185;color:#fff;padding:4px 8px;font-weight:bold;margin-bottom:6px;border-radius:4px;">I. RINGKASAN KLASIKAL</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:10px;font-size:10.5pt;border:1px solid #000;">
  <tr>
    <td style="padding:4px 6px;border:1px solid #000;"><b>Rata-rata:</b> ${stats.average}</td>
    <td style="padding:4px 6px;border:1px solid #000;"><b>Tertinggi:</b> ${stats.highest}</td>
    <td style="padding:4px 6px;border:1px solid #000;"><b>Terendah:</b> ${stats.lowest}</td>
    <td style="padding:4px 6px;border:1px solid #000;"><b>Tuntas:</b> ${stats.tuntasCount}/${stats.count} (${stats.count ? Math.round((stats.tuntasCount / stats.count) * 100) : 0}%)</td>
  </tr>
</table>

<div style="background-color:#1a4185;color:#fff;padding:4px 8px;font-weight:bold;margin-bottom:6px;border-radius:4px;">II. DAFTAR NILAI SISWA</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:10px;font-size:9.5pt;border:1px solid #000;">
  <tr style="background-color:#f8fafc;">
    <th style="padding:4px 6px;border:1px solid #000;">No</th>
    <th style="padding:4px 6px;border:1px solid #000;">Nama</th>
    <th style="padding:4px 6px;border:1px solid #000;">PG Benar</th>
    <th style="padding:4px 6px;border:1px solid #000;">% PG</th>
    <th style="padding:4px 6px;border:1px solid #000;">Jml Uraian</th>
    <th style="padding:4px 6px;border:1px solid #000;">Nilai</th>
    <th style="padding:4px 6px;border:1px solid #000;">KKM</th>
    <th style="padding:4px 6px;border:1px solid #000;">Level SOLO</th>
  </tr>
  ${nilaiRows}
</table>

<div style="background-color:#1a4185;color:#fff;padding:4px 8px;font-weight:bold;margin-bottom:6px;border-radius:4px;">III. DISTRIBUSI LEVEL TAKSONOMI SOLO</div>
<p style="margin:0 0 6px;font-size:9.5pt;"><b>Keterangan:</b> Prestruktural (belum punya konsep) → Unistruktural (1 konsep) → Multistruktural (beberapa konsep terpisah) → Relasional (konsep terhubung) → Abstrak Diperluas (menerapkan ke situasi baru).</p>
<table style="width:100%;border-collapse:collapse;margin-bottom:10px;font-size:10.5pt;border:1px solid #000;">
  <tr style="background-color:#f8fafc;"><th style="padding:4px 6px;border:1px solid #000;">Level</th><th style="padding:4px 6px;border:1px solid #000;">Jumlah</th><th style="padding:4px 6px;border:1px solid #000;">Proporsi</th></tr>
  ${soloRows}
</table>

<div style="background-color:#1a4185;color:#fff;padding:4px 8px;font-weight:bold;margin-bottom:6px;border-radius:4px;">IV. ANALISIS BUTIR SOAL</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:10px;font-size:9.5pt;border:1px solid #000;">
  <tr style="background-color:#f8fafc;">
    <th style="padding:4px 6px;border:1px solid #000;">No</th>
    <th style="padding:4px 6px;border:1px solid #000;">Jenis</th>
    <th style="padding:4px 6px;border:1px solid #000;">Soal</th>
    <th style="padding:4px 6px;border:1px solid #000;">% Ketepatan</th>
    <th style="padding:4px 6px;border:1px solid #000;">Status</th>
  </tr>
  ${itemRows}
</table>

<div style="background-color:#1a4185;color:#fff;padding:4px 8px;font-weight:bold;margin-bottom:6px;border-radius:4px;">V. CATATAN BUTIR SOAL &amp; REKOMENDASI</div>
<ul style="margin:0 0 10px;padding-left:20px;">${catatanSoal}</ul>
<p style="margin:0 0 6px;"><b>A. Analisis Klasikal:</b></p><p style="margin:0 0 8px;">${narrative.analisisKlasikal || '-'}</p>
<p style="margin:0 0 6px;"><b>B. Program Remedial:</b></p><p style="margin:0 0 8px;">${narrative.remedial || '-'}</p>
<p style="margin:0 0 6px;"><b>C. Program Pengayaan:</b></p><p style="margin:0 0 8px;">${narrative.pengayaan || '-'}</p>
<p style="margin:0 0 6px;"><b>D. Saran Tindak Lanjut Pembelajaran:</b></p><p style="margin:0 0 8px;">${narrative.saranTindakLanjut || '-'}</p>

<div style="display:flex;justify-content:space-between;margin-top:24px;text-align:center;padding:0 40px;page-break-inside:avoid;">
  <div>
    <p style="margin:0;">Mengetahui,</p>
    <p style="margin:0;"><b>Kepala ${meta.school || 'Sekolah'}</b></p>
    <div style="height:60px;"></div>
    <p style="text-decoration:underline;font-weight:bold;margin:0;">${meta.headmaster || '(.........................)'}</p>
  </div>
  <div>
    <p style="margin:0;">${tgl}</p>
    <p style="margin:0;"><b>Guru Mata Pelajaran</b></p>
    <div style="height:60px;"></div>
    <p style="text-decoration:underline;font-weight:bold;margin:0;">${meta.teacher || '(.........................)'}</p>
  </div>
</div>
</div>`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method Not Allowed' }); }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) {} }

    const { questions, students, kkm, meta, customApiKey } = body;
    if (!Array.isArray(questions) || questions.length === 0 || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'Bank soal dan jawaban siswa diperlukan.' });
    }
    const kkmNum = parseInt(kkm) || 75;

    const pgQs = questions.filter((q: any) => q.type === 'pg');
    const essayQs = questions.filter((q: any) => q.type !== 'pg');

    // Koreksi PG deterministik
    interface Res { name: string; pgCorrect: number; pgTotal: number; essayScores: Record<string, number>; essayFeedback: Record<string, string>; value: number; tuntas: boolean; solo: string; soloReason: string; }
    const results: Res[] = students.map((s: any) => {
      let correct = 0;
      for (const q of pgQs) {
        if (pgLetter(s.answers?.[String(q.number)] || '') !== '' && pgLetter(s.answers?.[String(q.number)]) === pgLetter(q.answer)) correct++;
      }
      return {
        name: String(s.name || 'Tanpa Nama'),
        pgCorrect: correct,
        pgTotal: pgQs.length,
        essayScores: {},
        essayFeedback: {},
        value: 0,
        tuntas: false,
        solo: '',
        soloReason: '',
      };
    });

    // Koreksi uraian + SOLO via AI (paralel per chunk)
    if (essayQs.length > 0) {
      const key = customApiKey || process.env.GEMINI_API_KEY;
      if (!key) return res.status(500).json({ error: 'API Key diperlukan untuk mengoreksi soal uraian.' });
      const ai = new GoogleGenAI({ apiKey: key });

      const essayDesc = essayQs.map((q: any) => `No ${q.number} [uraian]: ${q.question}\nKunci: ${q.answer}`).join('\n\n');
      const chunks = chunk(results, 8);

      await Promise.all(chunks.map(async (grp) => {
        const siswaDesc = grp.map((r) => {
          const orig = students.find((s: any) => String(s.name) === r.name);
          const ansText = essayQs.map((q: any) => `No ${q.number}: ${(orig?.answers?.[String(q.number)] || '(tidak dijawab)').toString().slice(0, 600)}`).join('\n');
          return `SISWA: ${r.name}\n${ansText}`;
        }).join('\n\n');

        const prompt = `Anda guru ahli yang mengoreksi jawaban URAIAN siswa berikut secara adil dan konsisten.

SOAL URAIAN & KUNCI:
${essayDesc}

JAWABAN SISWA:
${siswaDesc}

ATURAN:
- Skor tiap soal uraian: 0-100 (70 = cukup/mencapai kompetensi minimal). Nilai kelengkapan konsep dan kedekatan makna dengan kunci, bukan kemiripan kata persis.
- feedback maksimal 1 kalimat spesifik (kelebihan/kekurangan utama).
- Tentukan level Taksonomi SOLO dari SELURUH jawaban siswa ini: prestructural | unistructural | multistructural | relational | extended.
- soloReason maksimal 1 kalimat.

Balas HANYA JSON valid tanpa markdown:
{"students":[{"name":"...","essays":{"11":{"score":80,"feedback":"..."}},"solo":"relational","soloReason":"..."}]}`;

        try {
          const raw = await callAI(ai, prompt);
          const m = raw.match(/\{[\s\S]*\}/);
          if (!m) return;
          const parsed = JSON.parse(m[0]);
          for (const ps of parsed.students || []) {
            const r = grp.find(g => g.name.toLowerCase() === String(ps.name || '').toLowerCase());
            if (!r) continue;
            for (const [num, e] of Object.entries<any>(ps.essays || {})) {
              r.essayScores[String(num)] = Math.max(0, Math.min(100, parseInt(e.score) || 0));
              r.essayFeedback[String(num)] = String(e.feedback || '').slice(0, 200);
            }
            if (SOLO_LEVELS.includes(String(ps.solo))) r.solo = String(ps.solo);
            r.soloReason = String(ps.soloReason || '').slice(0, 200);
          }
        } catch (e) {
          console.error('Essay grading chunk failed:', e);
        }
      }));
    }

    for (const r of results) {
      const earned = r.pgCorrect + Object.values(r.essayScores).reduce((a: number, b: any) => a + Number(b || 0), 0) / 100;
      r.value = Math.round((earned / questions.length) * 100);
      r.tuntas = r.value >= kkmNum;
      // ponytail: tanpa soal uraian, level SOLO dipetakan heuristik dari % PG. Upgrade: panggil AI klasifikasi bila butuh presisi.
      if (!r.solo) {
        const p = r.pgTotal ? (r.pgCorrect / r.pgTotal) * 100 : r.value;
        r.solo = p >= 85 ? 'extended' : p >= 70 ? 'relational' : p >= 55 ? 'multistructural' : p >= 30 ? 'unistructural' : 'prestructural';
        r.soloReason = 'Dipetakan dari ketepatan pilihan ganda (' + Math.round(p) + '%).';
      }
    }

    // Statistik klasikal + analisis butir soal (deterministik)
    const values = results.map(r => r.value);
    const soloDist: Record<string, number> = {};
    for (const lv of SOLO_LEVELS) soloDist[lv] = results.filter(r => r.solo === lv).length;
    const stats = {
      count: results.length,
      average: values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0,
      highest: values.length ? Math.max(...values) : 0,
      lowest: values.length ? Math.min(...values) : 0,
      tuntasCount: results.filter(r => r.tuntas).length,
      kkm: kkmNum,
      soloDist,
    };

    const itemAnalysis = questions.map((q: any) => {
      let tepat = 0;
      for (const s of students) {
        const ans = s.answers?.[String(q.number)] || '';
        if (q.type === 'pg') {
          if (pgLetter(ans) !== '' && pgLetter(ans) === pgLetter(q.answer)) tepat++;
        } else {
          const sc = results.find(r => r.name.toLowerCase() === String(s.name).toLowerCase())?.essayScores[String(q.number)] || 0;
          if (sc >= 70) tepat++;
        }
      }
      const pct = results.length ? Math.round((tepat / results.length) * 100) : 0;
      return {
        number: q.number,
        type: q.type,
        question: String(q.question || ''),
        correctPct: pct,
        status: pct >= 75 ? 'Baik' : pct >= 50 ? 'Sedang' : 'Perlu Remedial',
      };
    });

    // Narasi rekomendasi via AI
    let narrative = { analisisKlasikal: '', remedial: '', pengayaan: '', saranTindakLanjut: '', catatanSoal: [] as any[] };
    try {
      const key = customApiKey || process.env.GEMINI_API_KEY;
      if (key) {
        const ai = new GoogleGenAI({ apiKey: key });
        const ringkas = results.map(r => `${r.name}: nilai ${r.value}, SOLO ${r.solo}`).join('; ');
        const butir = itemAnalysis.map((it: any) => `Soal ${it.number}${it.type === 'pg' ? '(PG)' : '(Uraian)'}: ${it.correctPct}%`).join(', ');
        const nr = await callAI(ai, `Analisis hasil belajar kelas berikut (KKM ${kkmNum}).

DATA SISWA: ${ringkas}
KETEPATAN BUTIR SOAL: ${butir}

Tulis dalam Bahasa Indonesia untuk laporan guru, profesional namun mudah dibaca:
- analisisKlasikal: 2-3 kalimat kondisi capaian kelas.
- remedial: strategi konkret untuk siswa di bawah KKM (sebutkan jumlahnya).
- pengayaan: strategi untuk siswa yang tuntas/berlevel tinggi.
- saranTindakLanjut: 1-2 kalimat saran pembelajaran berikutnya.
- catatanSoal: HANYA untuk soal dengan ketepatan < 60%, catatan 1 kalimat indikasi kesulitan materi.

Balas HANYA JSON valid:
{"analisisKlasikal":"","remedial":"","pengayaan":"","saranTindakLanjut":"","catatanSoal":[{"number":1,"catatan":""}]}`);
        const nm = nr.match(/\{[\s\S]*\}/);
        if (nm) {
          const p = JSON.parse(nm[0]);
          narrative = {
            analisisKlasikal: String(p.analisisKlasikal || ''),
            remedial: String(p.remedial || ''),
            pengayaan: String(p.pengayaan || ''),
            saranTindakLanjut: String(p.saranTindakLanjut || ''),
            catatanSoal: Array.isArray(p.catatanSoal) ? p.catatanSoal.slice(0, 15) : [],
          };
        }
      }
    } catch (e) {
      console.error('Narrative failed:', e);
    }

    const payload = { results, stats, itemAnalysis, narrative };
    res.json({ ...payload, reportHtml: buildReportHtml({ ...payload, meta: meta || {} }) });
  } catch (error: any) {
    console.error('Analyze Results Error:', error);
    res.status(500).json({ error: 'Gagal menganalisis hasil: ' + (error.message || '') });
  }
}
