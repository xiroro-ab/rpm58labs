import fs from 'fs';
let code = fs.readFileSync('api/generate.ts', 'utf8');

// Remove edge runtime config
code = code.replace(
  "export const config = {\n  runtime: 'edge',\n};\n",
  ""
);
code = code.replace(
  "export const config = {  runtime: 'edge',};",
  ""
);

fs.writeFileSync('api/generate.ts', code);
console.log("Removed edge config from api/generate.ts");
