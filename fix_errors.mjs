import fs from 'fs';
let code = fs.readFileSync('api/generate.ts', 'utf8');

code = code.replace(
  "    const cApiKey = (typeof customApiKey !== 'undefined' ? customApiKey : null) || (typeof req.body === 'string' ? JSON.parse(req.body).customApiKey : req.body?.customApiKey);",
  "    const cApiKey = customApiKey;"
);

code = code.replace(
  "      return res.status(400).json({ error: 'API Key diperlukan.' });",
  "      return new Response(JSON.stringify({ error: 'API Key diperlukan.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });"
);

code = code.replace(
  "      return res.status(400).json({ error: 'Custom API Key diperlukan untuk provider ' + provider + '.' });",
  "      return new Response(JSON.stringify({ error: 'Custom API Key diperlukan untuk provider ' + provider + '.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });"
);

fs.writeFileSync('api/generate.ts', code);
console.log("Fixed errors");
