const fs = require('fs');

const fileUtils = 'src/utils/printUtils.ts';
let codeUtils = `
import html2pdf from 'html2pdf.js';

export function printInNewWindow(html: string, title = 'Print') {
  const container = document.createElement('div');
  container.innerHTML = html;
  
  const opt = {
    margin:       0.5,
    filename:     \`\${title.replace(/\\s+/g, '_')}.pdf\`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(container).save();
}
`;
fs.writeFileSync(fileUtils, codeUtils);

const fileBill = 'src/utils/printBill.ts';
let codeBill = fs.readFileSync(fileBill, 'utf8');

// Replace the end of printBillHtml
const injectionStart = "const printRoot = document.createElement('div');";
const idx = codeBill.indexOf(injectionStart);
if (idx !== -1) {
  codeBill = codeBill.substring(0, idx);
  codeBill += `
  const container = document.createElement('div');
  container.innerHTML = html;
  
  import('html2pdf.js').then((html2pdfModule) => {
    const html2pdf = html2pdfModule.default || html2pdfModule;
    const opt = {
      margin:       0.5,
      filename:     \`Bill_\${billData.billNumber || billData.id}.pdf\`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(container).save();
  });
}`;
}
fs.writeFileSync(fileBill, codeBill);
