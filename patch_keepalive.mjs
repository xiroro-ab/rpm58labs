import fs from 'fs';
let code = fs.readFileSync('api/generate.ts', 'utf8');

if (!code.includes('const keepAlive = setInterval')) {
  // Insert keepAlive at the beginning of the handler
  code = code.replace(
    "export default async function handler(req: any, res: any) {\n  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });",
    "export default async function handler(req: any, res: any) {\n  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });\n\n  // Keep-alive mechanism to prevent Vercel 504 timeouts\n  const keepAlive = setInterval(() => {\n    if (!res.headersSent) {\n      res.write(' ');\n    }\n  }, 5000);"
  );
  
  // Replace res.json at the end with the keepAlive cleanup
  code = code.replace(
    "    res.json({ result: resultText });\n  } catch (error: any) {",
    "    clearInterval(keepAlive);\n    if (!res.headersSent) {\n      res.json({ result: resultText });\n    } else {\n      res.write(JSON.stringify({ result: resultText }));\n      res.end();\n    }\n  } catch (error: any) {"
  );

  // Replace res.status(500).json in the catch block
  code = code.replace(
    "    res.status(500).json({ error: 'Gagal membuat RPM. Silakan coba lagi. Detail: ' + (error.message || 'Unknown error') });\n  }",
    "    clearInterval(keepAlive);\n    const errorMessage = 'Gagal membuat RPM. Silakan coba lagi. Detail: ' + (error.message || 'Unknown error');\n    if (!res.headersSent) {\n      res.status(500).json({ error: errorMessage });\n    } else {\n      res.write(JSON.stringify({ error: errorMessage }));\n      res.end();\n    }\n  }"
  );

  fs.writeFileSync('api/generate.ts', code);
  console.log("Patched api/generate.ts with keepAlive");
} else {
  console.log("keepAlive already exists in api/generate.ts");
}
