const fs = require('fs');
let serverTs = fs.readFileSync('server.ts', 'utf8');

// Undo the literal \n
serverTs = serverTs.replace(/app\.post\("\/api\/docx", async \(req, res\) => \{\\n/g, 'app.post("/api/docx", async (req, res) => {\n');
serverTs = serverTs.replace(/\\n  \}\);\\n\\n  \/\/ Vite middleware for development/g, '\n  });\n\n  // Vite middleware for development');

fs.writeFileSync('server.ts', serverTs);
console.log('Fixed server.ts');
