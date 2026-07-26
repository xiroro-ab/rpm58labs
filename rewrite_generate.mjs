import fs from 'fs';

let code = fs.readFileSync('api/generate.ts', 'utf8');

// I just need to fix the prompt string where the backticks broke.
// Let's rewrite the whole thing again safely.
