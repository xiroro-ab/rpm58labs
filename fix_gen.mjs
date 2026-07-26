import fs from 'fs';
let code = fs.readFileSync('api/generate.ts', 'utf8');

code = code.replace(
  "4. Jangan gunakan markdown code block (```html) di awal atau akhir jawaban. Langsung berikan HTML-nya.",
  "4. Jangan gunakan markdown code block (```html) di awal atau akhir jawaban. Langsung berikan HTML-nya.".replace(/`/g, '\\`')
);

// We also need to fix `<li style="margin-bottom: 12px;"><b>Fase X: [Nama Fase]</b><br/>[Penjelasan aktivitas guru dan siswa]</li>`
// and `<ol>` and `<table>`. Wait, `<` and `>` are fine inside template literals. 
// But if there are any other unescaped backticks, we should escape them.
// Let's just fix the backticks in the instructions.
code = code.replace(/`<li/g, '\\`<li');
code = code.replace(/<\/li>`/g, '</li>\\`');
code = code.replace(/`<ol>`/g, '\\`<ol>\\`');

// There are other backticks at the bottom:
// `\n\n[ERROR] ${error.message || 'Unknown error'}`
// That one is correct in my script because I escaped it in the script using \`\\n\\n[ERROR] \${error.message || 'Unknown error'}\`. So it outputted correctly.

fs.writeFileSync('api/generate.ts', code);
console.log("Fixed generate.ts");
