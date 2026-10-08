const fs = require('fs');
const file = 'src/pages/InventoryValuationPage.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes("import html2pdf from 'html2pdf.js';")) {
  code = code.replace(
    "import { format } from 'date-fns';",
    "import { format } from 'date-fns';\nimport html2pdf from 'html2pdf.js';"
  );
}

// Remove printInNewWindow import if present
code = code.replace(/import \{ printInNewWindow \} from '\.\.\/utils\/printUtils';\n?/, '');

const handleExportReplacement = `  const handleExportPDF = () => {
    const html = \`
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; color: #0f0a1e; padding: 20px; background: white;">
        <div style="text-align: center; margin-bottom: 20px; background: #1B4332; color: white; padding: 20px; border-radius: 8px;">
          <h1 style="margin: 0; font-size: 24px;">ZAMZAM MOBILE CENTER</h1>
          <h2 style="margin: 5px 0 0 0; font-size: 16px; font-weight: normal; opacity: 0.9;">Inventory Valuation Report</h2>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding: 0 10px;">
          <div><strong>Date:</strong> \${new Date().toLocaleDateString()}</div>
          <div><strong>Total Units:</strong> \${totalUnits}</div>
        </div>
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background: #f0fdf4; border-bottom: 2px solid #bbf7d0;">
              <th style="padding: 10px; color: #166534;">Model</th>
              <th style="padding: 10px; color: #166534;">Company</th>
              <th style="padding: 10px; text-align: right; color: #166534;">Qty</th>
              <th style="padding: 10px; text-align: right; color: #166534;">Base Price</th>
              <th style="padding: 10px; text-align: right; color: #166534;">Total Value</th>
            </tr>
          </thead>
          <tbody>
            \${stock.map(item => \`
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">\${item.modelName} \${item.ramRom ? \`(\${item.ramRom})\` : ''}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">\${item.companyName}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">\${item.quantity || 1}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">Rs. \${(item.basePrice || 0).toLocaleString()}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: bold;">
                  Rs. \${((item.quantity || 1) * (item.basePrice || 0)).toLocaleString()}
                </td>
              </tr>
            \`).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f8fafc; font-weight: bold;">
              <td colspan="4" style="padding: 15px 10px; text-align: right;">GRAND TOTAL VALUE:</td>
              <td style="padding: 15px 10px; text-align: right; color: #059669; font-size: 16px;">Rs. \${totalValue.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    \`;

    const container = document.createElement('div');
    container.innerHTML = html;
    
    const opt = {
      margin:       0.5,
      filename:     'Inventory_Valuation.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(container).save();
  };`;

// We need to replace the old handleExportPDF
code = code.replace(/  const handleExportPDF = \(\) => \{[\s\S]*?printInNewWindow\(html, 'Inventory Valuation'\);\n  \};/m, handleExportReplacement);

// If there was an old printInNewWindow usage inside handleExportPDF that looked different:
if (!code.includes('html2pdf().set(opt).from(container).save();')) {
  const fallbackRegex = /  const handleExportPDF = \(\) => \{[\s\S]*?printInNewWindow[\s\S]*?\};/m;
  code = code.replace(fallbackRegex, handleExportReplacement);
}

fs.writeFileSync(file, code);
