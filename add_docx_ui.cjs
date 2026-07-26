const fs = require('fs');
let code = fs.readFileSync('src/components/ResultRPM.tsx', 'utf8');

// Ensure FileCode or FileText is used for Word (lucide-react)
code = code.replace(/import \{ Download, Printer, X, FileText, Play \} from 'lucide-react';/, "import { Download, Printer, X, FileText, Play, FileCheck } from 'lucide-react';");

const docxFunc = `  const handleDownloadDOCX = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('/api/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: markdown,
          filename: \`RPM_\${formData?.subject || 'Kurikulum'}_Kelas_\${formData?.phase || ''}.docx\`
        })
      });

      if (!response.ok) throw new Error('Gagal dari server');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`RPM_\${formData?.subject || 'Kurikulum'}_Kelas_\${formData?.phase || ''}.docx\`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate DOCX', error);
      alert('Gagal membuat DOCX. Coba lagi.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintPDF`;

code = code.replace(/const handlePrintPDF/, docxFunc);

const docxBtn = `          <button
            onClick={handleDownloadDOCX}
            disabled={isDownloading}
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-md shadow-sm transition-colors bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            title="Download sebagai Word (DOCX)"
          >
            <FileCheck className="w-4 h-4" />
            Word
          </button>
          
          <button
            onClick={handlePrintPDF}`;

code = code.replace(/<button\s*onClick=\{handlePrintPDF\}/, docxBtn);

fs.writeFileSync('src/components/ResultRPM.tsx', code);
console.log('Added DOCX button to ResultRPM.tsx');
