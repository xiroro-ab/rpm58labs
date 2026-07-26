import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace("resultText = response.content[0].text;", "resultText = (response.content[0] as any).text;");

code = code.replace("defaultViewport: chromium.defaultViewport,", "defaultViewport: (chromium as any).defaultViewport,");
code = code.replace("headless: chromium.headless,", "headless: (chromium as any).headless,");
code = code.replace("ignoreHTTPSErrors: true,", "// ignoreHTTPSErrors: true,");

code = code.replace("{ waitUntil: 'networkidle0' }", "{ waitUntil: 'networkidle0' as any }");

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts types");
