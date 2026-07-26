import fs from 'fs';
console.log(fs.readFileSync('api/generate.ts', 'utf8').substring(0, 1000));
