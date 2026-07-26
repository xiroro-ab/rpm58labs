import fs from 'fs';
let code = fs.readFileSync('api/pdf.ts', 'utf8');

code = `import twemoji from '@twemoji/api';\n` + code;

code = code.replace(
  '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">',
  '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Noto+Color+Emoji&display=swap" rel="stylesheet">'
);

code = code.replace(
  "body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; font-family: 'Space Grotesk', sans-serif; }",
  "body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; font-family: 'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; text-align: justify; }\n            h1, h2, h3, h4, h5, h6 { font-family: 'IBM Plex Sans', sans-serif !important; }\n            img.emoji { height: 1em; width: 1em; margin: 0 .05em 0 .1em; vertical-align: -0.1em; }\n            div[style*=\"background-color: #1a4185\"] { font-family: 'IBM Plex Sans', sans-serif !important; }\n            .kop-surat h3 { font-family: 'IBM Plex Sans', sans-serif !important; }\n            .rpm-table th, .rpm-table td { text-align: left; } /* Reset table alignment to left if needed */"
);

code = code.replace(
  "<body>${html}</body>",
  "<body>${twemoji.parse(html)}</body>"
);

fs.writeFileSync('api/pdf.ts', code);
console.log("Patched api/pdf.ts");
