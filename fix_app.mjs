import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '<LoadingOverlay isVisible={isLoading} message="Membuat RPM..." />',
  ''
);
// Also remove the import if it's there
code = code.replace(
  "import { LoadingOverlay } from './components/LoadingOverlay';\n",
  ""
);

fs.writeFileSync('src/App.tsx', code);
