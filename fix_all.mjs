import fs from 'fs';

let genCode = fs.readFileSync('api/generate.ts', 'utf8');

genCode = genCode.replace(
  "export default async function handler(req: Request) {",
  "export default async function handler(req: any, res: any) {"
);

genCode = genCode.replace(
  "    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });",
  "    return res.status(405).json({ error: 'Method Not Allowed' });"
);

genCode = genCode.replace(
  "  try {\n    const parsed = await req.json();\n    const data = parsed.data;\n    const customApiKey = parsed.customApiKey;\n    const aiProvider = parsed.aiProvider;\n\n    if (!data) {\n      return new Response(JSON.stringify({ error: 'Data form tidak ditemukan.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });\n    }",
  `  // Keep-alive mechanism to prevent Vercel 504 timeouts
  const keepAlive = setInterval(() => {
    if (!res.headersSent) {
      res.write(' ');
    }
  }, 5000);

  try {
    let data;
    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        data = parsed.data;
        var customApiKey = parsed.customApiKey;
        var aiProvider = parsed.aiProvider;
      } catch (e) {
        return res.status(400).json({ error: 'Format request tidak valid.' });
      }
    } else {
      data = req.body?.data;
      var customApiKey = req.body?.customApiKey;
      var aiProvider = req.body?.aiProvider;
    }

    if (!data) {
      return res.status(400).json({ error: 'Data form tidak ditemukan.' });
    }`
);

genCode = genCode.replace(
  "      return new Response(JSON.stringify({ error: 'API Key diperlukan.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });",
  "      return res.status(400).json({ error: 'API Key diperlukan.' });"
);

genCode = genCode.replace(
  "      return new Response(JSON.stringify({ error: 'Custom API Key diperlukan untuk provider ' + provider + '.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });",
  "      return res.status(400).json({ error: 'Custom API Key diperlukan untuk provider ' + provider + '.' });"
);

genCode = genCode.replace(
  "    return new Response(JSON.stringify({ result: resultText }), { status: 200, headers: { 'Content-Type': 'application/json' } });",
  `    clearInterval(keepAlive);
    if (!res.headersSent) {
      res.json({ result: resultText });
    } else {
      res.write(JSON.stringify({ result: resultText }));
      res.end();
    }`
);

genCode = genCode.replace(
  "    const errorMessage = 'Gagal membuat RPM. Silakan coba lagi. Detail: ' + (error.message || 'Unknown error');\n    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });",
  `    clearInterval(keepAlive);
    const errorMessage = 'Gagal membuat RPM. Silakan coba lagi. Detail: ' + (error.message || 'Unknown error');
    if (!res.headersSent) {
      res.status(500).json({ error: errorMessage });
    } else {
      res.write(JSON.stringify({ error: errorMessage }));
      res.end();
    }`
);

fs.writeFileSync('api/generate.ts', genCode);

let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace(
  "  app.post('/api/generate', async (req, res) => {\n    try {\n      const protocol = req.protocol || 'http';\n      const host = req.headers.host || 'localhost:3000';\n      const url = new URL(req.originalUrl || req.url, `${protocol}://${host}`);\n      \n      const fetchReq = new Request(url.href, {\n        method: req.method,\n        headers: new Headers(req.headers as any),\n        body: JSON.stringify(req.body)\n      });\n      \n      const fetchRes = await generateHandler(fetchReq);\n      res.status(fetchRes.status);\n      fetchRes.headers.forEach((value, key) => {\n        res.setHeader(key, value);\n      });\n      const text = await fetchRes.text();\n      res.send(text);\n    } catch (e: any) {\n      res.status(500).json({ error: e.message });\n    }\n  });",
  "  app.post('/api/generate', async (req, res) => {\n    // Vercel handlers take (req, res) where req.body is already parsed\n    await generateHandler(req, res);\n  });"
);

fs.writeFileSync('server.ts', serverCode);
console.log("Restored Node.js API format");
