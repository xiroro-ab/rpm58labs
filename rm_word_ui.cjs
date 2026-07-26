const fs = require('fs');
let code = fs.readFileSync('src/components/ResultRPM.tsx', 'utf8');

// Remove isDownloadingWord state
code = code.replace(/const \[isDownloadingWord, setIsDownloadingWord\] = useState\(false\);\n?/g, '');

// Remove handleDownloadWord
const wordFnStart = code.indexOf('const handleDownloadWord');
const wordFnEndStr = '  return (\n';
const wordFnEnd = code.indexOf(wordFnEndStr);
code = code.substring(0, wordFnStart) + code.substring(wordFnEnd);

// Remove Word button
code = code.replace(/<button\s*onClick=\{handleDownloadWord\}[\s\S]*?<\/button>/, '');

// Update LoadingOverlay
code = code.replace(/isVisible=\{isDownloading \|\| isDownloadingWord\} message=\{isDownloading \? "Menyiapkan PDF\.\.\." : "Mengkonversi ke Word\.\.\."\}/g, 'isVisible={isDownloading} message="Menyiapkan PDF..."');

fs.writeFileSync('src/components/ResultRPM.tsx', code);
console.log('Removed Word UI from ResultRPM.tsx');
