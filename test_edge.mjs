import fs from 'fs';

let generateCode = fs.readFileSync('api/generate.ts', 'utf8');

// Replace the handler signature
generateCode = generateCode.replace(
  "export default async function handler(req: any, res: any) {",
  "export const config = {\n  runtime: 'edge',\n};\n\nexport default async function handler(req: Request) {"
);

// Replace req.body parsing
generateCode = generateCode.replace(
  "  // Keep-alive mechanism to prevent Vercel 504 timeouts\n  res.setHeader('Content-Type', 'application/json');\n  if (typeof res.flushHeaders === 'function') res.flushHeaders();\n  const keepAlive = setInterval(() => {\n    res.write(' ');\n  }, 3000);\n\n  try {\n    let data;\n    if (typeof req.body === 'string') {\n      try {\n        const parsed = JSON.parse(req.body);\n        data = parsed.data;\n        var customApiKey = parsed.customApiKey;\n        var aiProvider = parsed.aiProvider;\n      } catch (e) {\n        return res.status(400).json({ error: 'Format request tidak valid.' });\n      }\n    } else {\n      data = req.body.data;\n      var customApiKey = req.body.customApiKey;\n      var aiProvider = req.body.aiProvider;\n    }",
  "  try {\n    const parsed = await req.json();\n    const data = parsed.data;\n    const customApiKey = parsed.customApiKey;\n    const aiProvider = parsed.aiProvider;"
);

// Fallback if the keepAlive was already patched differently
generateCode = generateCode.replace(
  "  // Keep-alive mechanism to prevent Vercel 504 timeouts\n  const keepAlive = setInterval(() => {\n    if (!res.headersSent) {\n      res.write(' ');\n    }\n  }, 5000);\n\n  try {\n    let data;\n    if (typeof req.body === 'string') {\n      try {\n        const parsed = JSON.parse(req.body);\n        data = parsed.data;\n        var customApiKey = parsed.customApiKey;\n        var aiProvider = parsed.aiProvider;\n      } catch (e) {\n        return res.status(400).json({ error: 'Format request tidak valid.' });\n      }\n    } else {\n      data = req.body.data;\n      var customApiKey = req.body.customApiKey;\n      var aiProvider = req.body.aiProvider;\n    }",
  "  try {\n    const parsed = await req.json();\n    const data = parsed.data;\n    const customApiKey = parsed.customApiKey;\n    const aiProvider = parsed.aiProvider;"
);

// Replace res.status(405)
generateCode = generateCode.replace(
  "    return res.status(405).json({ error: 'Method Not Allowed' });",
  "    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });"
);

// Replace success response
generateCode = generateCode.replace(
  "    clearInterval(keepAlive);\n    if (!res.headersSent) {\n      res.json({ result: resultText });\n    } else {\n      res.write(JSON.stringify({ result: resultText }));\n      res.end();\n    }",
  "    return new Response(JSON.stringify({ result: resultText }), { status: 200, headers: { 'Content-Type': 'application/json' } });"
);

// Replace error response
generateCode = generateCode.replace(
  "    clearInterval(keepAlive);\n    const errorMessage = 'Gagal membuat RPM. Silakan coba lagi. Detail: ' + (error.message || 'Unknown error');\n    if (!res.headersSent) {\n      res.status(500).json({ error: errorMessage });\n    } else {\n      res.write(JSON.stringify({ error: errorMessage }));\n      res.end();\n    }",
  "    const errorMessage = 'Gagal membuat RPM. Silakan coba lagi. Detail: ' + (error.message || 'Unknown error');\n    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });"
);

fs.writeFileSync('api/generate.ts', generateCode);

let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace(
  "  app.post('/api/generate', async (req, res) => {\n    // Vercel handlers take (req, res) where req.body is already parsed\n    await generateHandler(req, res);\n  });",
  "  app.post('/api/generate', async (req, res) => {\n    try {\n      const protocol = req.protocol || 'http';\n      const host = req.headers.host || 'localhost:3000';\n      const url = new URL(req.originalUrl || req.url, `${protocol}://${host}`);\n      \n      const fetchReq = new Request(url.href, {\n        method: req.method,\n        headers: new Headers(req.headers as any),\n        body: JSON.stringify(req.body)\n      });\n      \n      const fetchRes = await generateHandler(fetchReq);\n      res.status(fetchRes.status);\n      fetchRes.headers.forEach((value, key) => {\n        res.setHeader(key, value);\n      });\n      const text = await fetchRes.text();\n      res.send(text);\n    } catch (e: any) {\n      res.status(500).json({ error: e.message });\n    }\n  });"
);
fs.writeFileSync('server.ts', serverCode);
