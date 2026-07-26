import fs from 'fs';
let code = fs.readFileSync('api/generate.ts', 'utf8');

// The keepAlive is stuck there! Let's just remove it.
code = code.replace(
  "  // Keep-alive mechanism to prevent Vercel 504 timeouts\n  const keepAlive = setInterval(() => {\n    if (!res.headersSent) {\n      res.write(' ');\n    }\n  }, 5000);\n\n  try {\n    let data;\n    if (typeof req.body === 'string') {\n      try {\n        const parsed = JSON.parse(req.body);\n        data = parsed.data;\n        var customApiKey = parsed.customApiKey;\n        var aiProvider = parsed.aiProvider;\n      } catch (e) {\n        return res.status(400).json({ error: 'Format request tidak valid.' });\n      }\n    } else {\n      data = req.body.data;\n      var customApiKey = req.body.customApiKey;\n      var aiProvider = req.body.aiProvider;\n    }",
  "  try {\n    const parsed = await req.json();\n    const data = parsed.data;\n    const customApiKey = parsed.customApiKey;\n    const aiProvider = parsed.aiProvider;"
);

// If there's an issue with variables being block-scoped
code = code.replace(
  "    let data;\n    if (typeof req.body === 'string') {",
  ""
);

fs.writeFileSync('api/generate.ts', code);
console.log("Fixed edge");
