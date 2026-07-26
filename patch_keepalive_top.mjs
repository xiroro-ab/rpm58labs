import fs from 'fs';
let code = fs.readFileSync('api/generate.ts', 'utf8');

if (!code.includes('const keepAlive = setInterval')) {
  code = code.replace(
    "  try {\n    let data;",
    "  // Keep-alive mechanism to prevent Vercel 504 timeouts\n  const keepAlive = setInterval(() => {\n    if (!res.headersSent) {\n      res.write(' ');\n    }\n  }, 5000);\n\n  try {\n    let data;"
  );
  fs.writeFileSync('api/generate.ts', code);
  console.log("Patched api/generate.ts with keepAlive at the top");
} else {
  console.log("already patched top");
}
