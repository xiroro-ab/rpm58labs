import fs from 'fs';
let code = fs.readFileSync('api/generate.ts', 'utf8');

// The file currently has:
// export default async function handler(req: Request) {
// ...
//  try {
//      try {
//        const parsed = JSON.parse(req.body);
//        data = parsed.data;

// We need to replace the entire try block down to the assignment of apiKey!
const tryIndex = code.indexOf("  try {\n      try {\n        const parsed = JSON.parse(req.body);");
const providerIndex = code.indexOf("    const apiKey = customApiKey");

if (tryIndex !== -1 && providerIndex !== -1) {
  const replacement = `  try {
    const parsed = await req.json();
    const data = parsed.data;
    const customApiKey = parsed.customApiKey;
    const aiProvider = parsed.aiProvider;

`;
  code = code.substring(0, tryIndex) + replacement + code.substring(providerIndex);
  fs.writeFileSync('api/generate.ts', code);
  console.log("Fixed top");
} else {
  console.log("Could not find blocks");
  // Let's just do a regex replace
  const match = code.match(/try \{\s*try \{\s*const parsed = JSON\.parse\(req\.body\);[\s\S]*?var aiProvider = req\.body\.aiProvider;\n\s*\}/);
  if (match) {
    code = code.replace(match[0], "try {\n    const parsed = await req.json();\n    const data = parsed.data;\n    const customApiKey = parsed.customApiKey;\n    const aiProvider = parsed.aiProvider;");
    fs.writeFileSync('api/generate.ts', code);
    console.log("Fixed top with regex");
  }
}
