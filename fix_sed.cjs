const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// I broke buffer.split('\\n') into buffer.split('\\n\\n') basically
code = code.replace(/buffer\.split\('\n'\)/g, "buffer.split('\\n')");

// Also check for any other \n that got replaced
// I'll just check if there are unterminated strings.
fs.writeFileSync('server.ts', code);
