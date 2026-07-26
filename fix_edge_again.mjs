import fs from 'fs';
let code = fs.readFileSync('api/generate.ts', 'utf8');

// 1. Remove Anthropic import
code = code.replace("import Anthropic from '@anthropic-ai/sdk';\n", "");
code = code.replace("import Anthropic from '@anthropic-ai/sdk';", "");

// 2. Make it an Edge function
code = code.replace(
  "export default async function handler(req: any, res: any) {",
  "export const config = {\n  runtime: 'edge',\n};\n\nexport default async function handler(req: Request) {"
);

// 3. Replace Express-like req parsing with req.json()
code = code.replace(
  /  \/\/ Keep-alive mechanism[\s\S]*?if \(!data\) \{/m,
  `  try {
    const parsed = await req.json();
    const data = parsed.data;
    const customApiKey = parsed.customApiKey;
    const aiProvider = parsed.aiProvider;

    if (!data) {`
);

// 4. Replace Anthropic SDK usage with fetch
const anthropicSdkCode = `      const anthropic = new Anthropic({ apiKey: keyToUse });
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });
      resultText = (response.content[0] as any).text || '';`;

const anthropicFetchCode = `      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': keyToUse,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const anthropicData = await anthropicResponse.json();
      if (!anthropicResponse.ok) throw new Error(anthropicData.error?.message || 'Anthropic API error');
      resultText = anthropicData.content[0].text || '';`;

code = code.replace(anthropicSdkCode, anthropicFetchCode);

// 5. Replace Express res.status().json() with new Response()
code = code.replace(
  "    return res.status(405).json({ error: 'Method Not Allowed' });",
  "    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });"
);
code = code.replace(
  "      return res.status(400).json({ error: 'Data form tidak ditemukan.' });",
  "      return new Response(JSON.stringify({ error: 'Data form tidak ditemukan.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });"
);
code = code.replace(
  "      return res.status(400).json({ error: 'API Key diperlukan.' });",
  "      return new Response(JSON.stringify({ error: 'API Key diperlukan.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });"
);
code = code.replace(
  "      return res.status(400).json({ error: 'Custom API Key diperlukan untuk provider ' + provider + '.' });",
  "      return new Response(JSON.stringify({ error: 'Custom API Key diperlukan untuk provider ' + provider + '.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });"
);

code = code.replace(
  /    clearInterval\(keepAlive\);\n    if \(!res\.headersSent\) \{\n      res\.json\(\{ result: resultText \}\);\n    \} else \{\n      res\.write\(JSON\.stringify\(\{ result: resultText \}\)\);\n      res\.end\(\);\n    \}/,
  "    return new Response(JSON.stringify({ result: resultText }), { status: 200, headers: { 'Content-Type': 'application/json' } });"
);

code = code.replace(
  /    clearInterval\(keepAlive\);\n    const errorMessage = 'Gagal membuat RPM\. Silakan coba lagi\. Detail: ' \+ \(error\.message \|\| 'Unknown error'\);\n    if \(!res\.headersSent\) \{\n      res\.status\(500\)\.json\(\{ error: errorMessage \}\);\n    \} else \{\n      res\.write\(JSON\.stringify\(\{ error: errorMessage \}\)\);\n      res\.end\(\);\n    \}/,
  "    const errorMessage = 'Gagal membuat RPM. Silakan coba lagi. Detail: ' + (error.message || 'Unknown error');\n    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });"
);

fs.writeFileSync('api/generate.ts', code);
console.log("Edge function refactored");
