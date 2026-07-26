import fs from 'fs';
let serverCode = fs.readFileSync('server.ts', 'utf8');

serverCode = serverCode.replace(
  "  app.post('/api/generate', async (req, res) => {\n    await generateHandler(req, res);\n  });",
  `  app.post('/api/generate', async (req, res) => {
    try {
      const protocol = req.protocol || 'http';
      const host = req.headers.host || 'localhost:3000';
      const url = new URL(req.originalUrl || req.url, \`\${protocol}://\${host}\`);
      
      const fetchReq = new Request(url.href, {
        method: req.method,
        headers: new Headers(req.headers as any),
        body: JSON.stringify(req.body)
      });
      
      const fetchRes = await generateHandler(fetchReq);
      res.status(fetchRes.status);
      fetchRes.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      if (fetchRes.body) {
        // Stream the response back to Express!
        const reader = fetchRes.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
        res.end();
      } else {
        const text = await fetchRes.text();
        res.send(text);
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });`
);
fs.writeFileSync('server.ts', serverCode);
console.log("Restored server.ts");
