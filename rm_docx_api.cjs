const fs = require('fs');

if (fs.existsSync('api/docx.ts')) {
    fs.unlinkSync('api/docx.ts');
}

let code = fs.readFileSync('server.ts', 'utf8');

const routeStart = code.indexOf('app.post("/api/docx", async (req, res) => {');
const routeEnd = code.indexOf('// Vite middleware for development');
if (routeStart !== -1 && routeEnd !== -1) {
    code = code.substring(0, routeStart) + code.substring(routeEnd);
}

// Remove html-to-docx import
code = code.replace(/import htmlToDocx from 'html-to-docx';\n?/g, '');

fs.writeFileSync('server.ts', code);
console.log('Removed Word API from server.ts');
