import fs from 'fs';
let code = fs.readFileSync('api/generate.ts', 'utf8');

const regex = /  \/\/ Keep-alive mechanism[\s\S]*?if \(!data\) \{/m;
const replacement = `  try {
    const parsed = await req.json();
    const data = parsed.data;
    const customApiKey = parsed.customApiKey;
    const aiProvider = parsed.aiProvider;

    if (!data) {`;

code = code.replace(regex, replacement);

// Replace any remaining `res.status` with new Response
code = code.replace(
  "      return res.status(400).json({ error: 'Data form tidak ditemukan.' });",
  "      return new Response(JSON.stringify({ error: 'Data form tidak ditemukan.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });"
);

fs.writeFileSync('api/generate.ts', code);
console.log("Fixed top completely");
