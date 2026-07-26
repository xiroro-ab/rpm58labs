import fs from 'fs';
let code = fs.readFileSync('api/generate.ts', 'utf8');

code = code.replace(
  "    const provider = (typeof aiProvider !== 'undefined' ? aiProvider : null) || (typeof req.body === 'string' ? JSON.parse(req.body).aiProvider : req.body?.aiProvider) || 'gemini';",
  "    const provider = aiProvider || 'gemini';"
);

fs.writeFileSync('api/generate.ts', code);
console.log("Fixed provider");
