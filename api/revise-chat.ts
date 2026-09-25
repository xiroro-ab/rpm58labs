import { GoogleGenAI } from '@google/genai';
import { createOpenRouterClient, getApiKey, getOpenRouterModel, isOpenRouterProvider, normalizeProvider, OPENROUTER_MAX_TOKENS } from './_ai-provider.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const { html, instruction, chatHistory, sectionOnly, customApiKey, aiProvider } = body;
    if (!html || !instruction) {
      return res.status(400).json({ error: 'HTML and instruction are required' });
    }

    const provider = normalizeProvider(aiProvider);
    const key = getApiKey(customApiKey, isOpenRouterProvider(provider) ? provider : 'gemini');
    if (!key) {
      return res.status(400).json({ error: 'API key untuk provider ' + provider + ' diperlukan.' });
    }

    const ai = new GoogleGenAI({ apiKey: key });

    let historyContext = '';
    if (chatHistory && chatHistory.length > 0) {
      historyContext = 'RIWAYAT PERCAKAPAN:\n' + 
        chatHistory.map((m: any) => `${m.role === 'user' ? 'USER' : 'AI'}: ${m.content}`).join('\n') + '\n\n';
    }

    const prompt = `Anda adalah asisten AI yang membantu guru merevisi dokumen Rencana Pembelajaran Mendalam (RPM).

KEMAMPUAN ANDA:
- Mengubah teks, soal, atau bagian tertentu dalam dokumen
- Mengganti jawaban soal, menambah/menghapus soal
- Memperbaiki tata bahasa dan ejaan
- Menyesuaikan alokasi waktu, model pembelajaran, dll
- Jawab dalam bahasa Indonesia dengan gaya membantu dan santai

ATURAN:
1. ${body.sectionOnly ? 'Output HANYA HTML bagian yang direvisi (fragment), BUKAN seluruh dokumen. Output langsung HTML fragment, tanpa tag pembungkus.' : 'Output HANYA kode HTML lengkap yang sudah direvisi'}
2. JANGAN gunakan markdown code block
3. Jangan ubah struktur di luar yang diminta instruksi
4. Jika instruksi spesifik (contoh: "ubah soal nomor 3"), lakukan tepat pada bagian itu
5. Pertahankan semua inline style dan class yang sudah ada
6. EMBED VISUAL: Jika instruksi meminta gambar/visual, gunakan <div class="rpm-embed-visual"><p><strong>🖼 Visual:</strong></p><p>📌 <a href="https://www.google.com/search?tbm=isch&q=KEYWORD" target="_blank">Google Images</a></p><p>🎨 <a href="https://www.bing.com/images/create?q=PROMPT" target="_blank">Bing AI</a></p><p><em>Prompt: "PROMPT"</em></p></div>

${historyContext}INSTRUKSI PENGGUNA:
${instruction}

DOKUMEN RPM SAAT INI:
${html}`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache, no-transform');

    if (isOpenRouterProvider(provider)) {
      const responseStream = await createOpenRouterClient(key).chat.completions.create({
        model: getOpenRouterModel(provider),
         messages: [{ role: 'user', content: prompt }],
         stream: true,
         max_tokens: OPENROUTER_MAX_TOKENS,
      });
      for await (const chunk of responseStream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) res.write(text);
      }
    } else {
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(chunk.text);
        }
      }
    }

    res.end();
  } catch (error: any) {
    console.error('Revise Chat Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Gagal: ' + (error.message || '') });
    } else {
      res.end();
    }
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: '10mb' },
  },
};
