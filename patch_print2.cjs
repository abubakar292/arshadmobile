const fs = require('fs');
const fileBill = 'src/utils/printBill.ts';
let codeBill = fs.readFileSync(fileBill, 'utf8');

if (!codeBill.includes("import html2pdf from 'html2pdf.js';")) {
  codeBill = "import html2pdf from 'html2pdf.js';\n" + codeBill;
  
  codeBill = codeBill.replace(
    "import('html2pdf.js').then((html2pdfModule) => {\n    const html2pdf = html2pdfModule.default || html2pdfModule;",
    "{"
  );
  codeBill = codeBill.replace(/  \}\);\n\}$/, "  }\n}");
  fs.writeFileSync(fileBill, codeBill);
}
