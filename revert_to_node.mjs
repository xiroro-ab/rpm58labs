import fs from 'fs';
let code = fs.readFileSync('api/generate.ts', 'utf8');

code = code.replace(
  "export const config = {\n  runtime: 'edge',\n};\n\nexport default async function handler(req: Request) {",
  "export default async function handler(req: any, res: any) {"
);

code = code.replace(
  "  if (req.method !== 'POST') {\n    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });\n  }",
  `  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Keep-alive mechanism to prevent Vercel 504 timeouts
  res.setHeader('Content-Type', 'application/json');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();
  
  const keepAlive = setInterval(() => {
    res.write(' ');
    if (typeof res.flush === 'function') res.flush();
  }, 5000);`
);

code = code.replace(
  "  try {\n    const parsed = await req.json();",
  `  try {
    let parsed;
    if (typeof req.body === 'string') {
      parsed = JSON.parse(req.body);
    } else {
      parsed = req.body;
    }
`
);

code = code.replace(
  "      return new Response(JSON.stringify({ error: 'Data form tidak ditemukan.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });",
  "      clearInterval(keepAlive);\n      return res.status(400).json({ error: 'Data form tidak ditemukan.' });"
);

code = code.replace(
  "      return new Response(JSON.stringify({ error: 'API Key diperlukan.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });",
  "      clearInterval(keepAlive);\n      return res.status(400).json({ error: 'API Key diperlukan.' });"
);

code = code.replace(
  "      return new Response(JSON.stringify({ error: 'Custom API Key diperlukan untuk provider ' + provider + '.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });",
  "      clearInterval(keepAlive);\n      return res.status(400).json({ error: 'Custom API Key diperlukan untuk provider ' + provider + '.' });"
);

code = code.replace(
  "    return new Response(JSON.stringify({ result: resultText }), { status: 200, headers: { 'Content-Type': 'application/json' } });",
  `    clearInterval(keepAlive);
    res.write(JSON.stringify({ result: resultText }));
    res.end();`
);

code = code.replace(
  "    const errorMessage = 'Gagal membuat RPM. Silakan coba lagi. Detail: ' + (error.message || 'Unknown error');\n    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });",
  `    clearInterval(keepAlive);
    const errorMessage = 'Gagal membuat RPM. Silakan coba lagi. Detail: ' + (error.message || 'Unknown error');
    res.write(JSON.stringify({ error: errorMessage }));
    res.end();`
);

fs.writeFileSync('api/generate.ts', code);

// Revert server.ts
let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace(
  /  app\.post\('\/api\/generate', async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: e\.message \}\);\n    \}\n  \}\);/,
  "  app.post('/api/generate', async (req, res) => {\n    await generateHandler(req, res);\n  });"
);
fs.writeFileSync('server.ts', serverCode);

console.log("Reverted to Node");
