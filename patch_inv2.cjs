const fs = require('fs');
const file = 'src/pages/InventoryValuationPage.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes("import html2pdf")) {
  code = code.replace(
    "import { Button } from '../components/ui/Button';",
    "import { Button } from '../components/ui/Button';\nimport html2pdf from 'html2pdf.js';"
  );
  fs.writeFileSync(file, code);
}
