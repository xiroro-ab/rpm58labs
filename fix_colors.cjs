const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// The original lines in pengalamanBelajarHTML:
// Mindful Readiness -> #0ea5e9
// Mindful Sensing -> #0ea5e9
// Meaningful Grouping -> #10b981
// Joyful Showcase -> #f97316
// Joyful Reflection -> #f97316

code = code.replace(/Mindful Readiness/g, 'Mindful Readiness'); // Just to find them
code = code.replace(/<span style="background-color: #0ea5e9;([^>]+)>Mindful Readiness<\/span>/g, '<span style="background-color: #ef4444;$1>Mindful Readiness</span>');
code = code.replace(/<span style="background-color: #0ea5e9;([^>]+)>Mindful Sensing<\/span>/g, '<span style="background-color: #ef4444;$1>Mindful Sensing</span>');
code = code.replace(/<span style="background-color: #10b981;([^>]+)>Meaningful Grouping<\/span>/g, '<span style="background-color: #eab308;$1>Meaningful Grouping</span>');
code = code.replace(/<span style="background-color: #f97316;([^>]+)>Joyful Showcase<\/span>/g, '<span style="background-color: #3b82f6;$1>Joyful Showcase</span>');
code = code.replace(/<span style="background-color: #f97316;([^>]+)>Joyful Reflection<\/span>/g, '<span style="background-color: #3b82f6;$1>Joyful Reflection</span>');

// Also update the prompt rules slightly to enforce these colors if the AI adds more labels:
const newRule = "7. WARNA LABEL: Jika kamu membuat atau menyebutkan label 'Joyful' wajib gunakan background biru (#3b82f6), 'Meaningful' wajib gunakan background kuning (#eab308), dan 'Mindful' wajib gunakan background merah (#ef4444). Semua font text labelnya putih (color: white).\n";
code = code.replace(/6\. ASESMEN PER PERTEMUAN: [^\n]+/, match => match + '\n' + newRule);

fs.writeFileSync('server.ts', code);
console.log('Fixed colors');
