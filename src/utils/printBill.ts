import { format } from 'date-fns';
import { formatDateSafe } from './dateUtils';
import { printInNewWindow } from './printUtils';
import { SHOP_CONFIG } from '../config/shopConfig';

export function generateBillNumber(sequence?: number): string {
  const year = new Date().getFullYear();
  if (sequence !== undefined && sequence > 0) {
    return `AMZ-${year}-${String(sequence).padStart(4, '0')}`;
  }
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `AMZ-${year}-${randomPart}`;
}

export function getBillHtml(billData: any): string {
  const isMultiple = billData.items && billData.items.length > 0;
  
  const itemsHtml = isMultiple 
    ? billData.items.map((item: any, i: number) => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${i + 1}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0;">
          <strong>${item.company || ''} ${item.modelName || item.itemName || ''}</strong><br/>
          <span style="font-size: 12px; color: #64748b;">${item.ramRom || ''}</span>
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">
          ${item.imei1 || (item.imei2 ? '' : '-')}
          ${item.imei2 ? `<br/><span style="font-size: 12px; color: #64748b;">IMEI2: ${item.imei2}</span>` : ''}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">Rs. ${(item.sellPrice || 0).toLocaleString()}</td>
      </tr>
    `).join('')
    : `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">1</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0;">
          <strong>${billData.company || ''} ${billData.itemName || billData.modelName || ''}</strong>
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">
          ${billData.imei1 || (billData.imei2 ? '' : '-')}
          ${billData.imei2 ? `<br/><span style="font-size: 12px; color: #64748b;">IMEI2: ${billData.imei2}</span>` : ''}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">Rs. ${(billData.sellPrice || billData.totalSellPrice || 0).toLocaleString()}</td>
      </tr>
    `;

  // Robustly determine the total sale price
  let calculatedTotal = 0;
  if (billData.totalSellPrice !== undefined && billData.totalSellPrice !== null && Number(billData.totalSellPrice) > 0) {
    calculatedTotal = Number(billData.totalSellPrice);
  } else if (billData.totalSellAmount !== undefined && billData.totalSellAmount !== null && Number(billData.totalSellAmount) > 0) {
    calculatedTotal = Number(billData.totalSellAmount);
  } else if (billData.sellPrice !== undefined && billData.sellPrice !== null && Number(billData.sellPrice) > 0) {
    calculatedTotal = Number(billData.sellPrice);
  } else if (billData.items && billData.items.length > 0) {
    calculatedTotal = billData.items.reduce((sum: number, it: any) => sum + (Number(it.sellPrice) || 0), 0);
  }

  const totalHtml = `Rs. ${calculatedTotal.toLocaleString()}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bill #${billData.billNumber || billData.id}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; margin: 0; padding: 12px; color: #0f0a1e; background: #fff; }
        .bill-container { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #fff; }
        .header { background: #12141D; color: white; padding: 20px; text-align: center; border-bottom: 3px solid #F59E0B; }
        .header-inner { display: flex; align-items: center; justify-content: center; gap: 14px; }
        .header-logo { width: 48px; height: 48px; border-radius: 50%; background: white; padding: 2px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        .title-band { background: #F59E0B; color: #12141D; text-align: center; padding: 8px; font-weight: 800; letter-spacing: 2px; font-size: 12px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px; border-bottom: 2px solid #e2e8f0; font-size: 13px; }
        .info-col p { margin: 4px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
        .items-table th { background: #F1F5F9; padding: 10px 8px; text-align: left; border-bottom: 2px solid #CBD5E1; color: #0F172A; font-weight: 700; }
        .total-row { display: flex; justify-content: space-between; padding: 16px; font-size: 18px; font-weight: bold; background: #FFFBEB; border-bottom: 1px solid #FDE68A; color: #B45309; }
        .footer { text-align: center; padding: 16px; color: #64748b; font-size: 12px; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 0; }
          .bill-container { border: none; }
        }
      </style>
    </head>
    <body>
      <div class="bill-container">
        <div class="header">
          <div class="header-inner">
            <img src="/logo.svg" alt={SHOP_CONFIG.shortName} class="header-logo" />
            <div>
              <h1 style="margin:0; font-size: 22px; font-weight: 800; letter-spacing: 1px;">${SHOP_CONFIG.name.toUpperCase()}</h1>
              <p style="margin:4px 0 0 0; color: #F59E0B; font-weight: 700; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">${SHOP_CONFIG.subTitle.toUpperCase()} • ${SHOP_CONFIG.shortName}</p>
            </div>
          </div>
        </div>
        <div class="title-band">SALE RECEIPT #${billData.billNumber || (billData.id ? billData.id.substring(0,8).toUpperCase() : '')}</div>
        
        <div class="info-grid">
          <div class="info-col">
            <p><strong>Customer:</strong> ${billData.customerName || 'Walk-in'}</p>
            <p><strong>Phone:</strong> ${billData.customerPhone || 'N/A'}</p>
            <p><strong>Method:</strong> ${billData.paymentMethod || 'Cash'}</p>
          </div>
          <div class="info-col" style="text-align: right;">
            <p><strong>Date:</strong> ${formatDateSafe(billData.date || new Date(), 'dd/MM/yyyy')}</p>
            <p><strong>Time:</strong> ${formatDateSafe(billData.date || new Date(), 'hh:mm a')}</p>
            <p><strong>Bill #:</strong> ${billData.billNumber || (billData.id ? billData.id.substring(0,8).toUpperCase() : '')}</p>
          </div>
        </div>
        <div style="padding: 16px;">
          <h3 style="margin-top: 0; color: #12141D; font-size: 14px;">ITEMS PURCHASED</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th style="text-align: center; width: 40px;">#</th>
                <th>Item</th>
                <th>IMEI</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>
        <div class="total-row">
          <span>TOTAL AMOUNT:</span>
          <span>${totalHtml}</span>
        </div>
        <div class="footer">
          Thank you for your business! Visit Again 😊<br>
          <strong>${SHOP_CONFIG.name}</strong> • ${SHOP_CONFIG.address}
        </div>
      </div>
    </body>
    </html>
  `;
}

export function printBillHtml(billData: any) {
  const html = getBillHtml(billData);
  printInNewWindow(html, `Bill_${billData.billNumber || billData.id}`);
}