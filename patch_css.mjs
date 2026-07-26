import fs from 'fs';
let code = fs.readFileSync('src/index.css', 'utf8');

if (!code.includes('.rpm-content-wrapper {')) {
  code += `\n
.rpm-content-wrapper {
  text-align: justify;
  font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif;
}
.rpm-content-wrapper h1,
.rpm-content-wrapper h2,
.rpm-content-wrapper h3,
.rpm-content-wrapper h4,
.rpm-content-wrapper h5,
.rpm-content-wrapper h6,
.rpm-content-wrapper div[style*="background-color: #1a4185"] {
  font-family: 'IBM Plex Sans', sans-serif !important;
}
img.emoji {
  height: 1em;
  width: 1em;
  margin: 0 .05em 0 .1em;
  vertical-align: -0.1em;
}
`;
}
fs.writeFileSync('src/index.css', code);
console.log("Patched src/index.css");
