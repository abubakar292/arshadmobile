const fs = require('fs');
const fileBill = 'src/utils/printBill.ts';
let codeBill = fs.readFileSync(fileBill, 'utf8');

if (!codeBill.includes("printInNewWindow(html, ")) {
  codeBill = codeBill.replace(
    "import { formatDateSafe } from './dateUtils';",
    "import { formatDateSafe } from './dateUtils';\nimport { printInNewWindow } from './printUtils';"
  );
  
  // replace html2pdf logic with printInNewWindow
  const injectionStart = "const container = document.createElement('div');";
  const idx = codeBill.indexOf(injectionStart);
  if (idx !== -1) {
    codeBill = codeBill.substring(0, idx);
    codeBill += `
  printInNewWindow(html, \`Bill_\${billData.billNumber || billData.id}\`);
}`;
  }
  
  // Clean up unused import
  codeBill = codeBill.replace("import html2pdf from 'html2pdf.js';\n", "");
  
  fs.writeFileSync(fileBill, codeBill);
}
