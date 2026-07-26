import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const fetchStart = code.indexOf("const response = await fetch('/api/generate'");
const fetchEnd = code.indexOf("setResult(json.result);");

if (fetchStart !== -1 && fetchEnd !== -1) {
  const replacement = `const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data, customApiKey, aiProvider }),
      });
      
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = 'Terjadi kesalahan.';
        try {
          const json = JSON.parse(text);
          errorMessage = json.error || errorMessage;
        } catch(e) {
          errorMessage = text.substring(0, 100);
        }
        if (typeof errorMessage === 'string' && errorMessage.includes('429')) {
          errorMessage = 'Batas limit penggunaan API harian telah habis. Silakan gunakan API Key Anda sendiri di menu Settings.';
        } else if (typeof errorMessage === 'string' && errorMessage.includes('quota')) {
          errorMessage = 'Batas limit penggunaan API harian telah habis. Silakan gunakan API Key Anda sendiri di menu Settings.';
        }
        throw new Error(errorMessage);
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is null');
      const decoder = new TextDecoder();
      let resultText = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        resultText += decoder.decode(value, { stream: true });
        setResult(resultText);
      }
      `;
  
  code = code.substring(0, fetchStart) + replacement + code.substring(fetchEnd + "setResult(json.result);".length);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched App.tsx for streaming!");
} else {
  console.log("Could not find fetch block in App.tsx");
}
