import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Package, Download } from 'lucide-react';
import { Button } from '../components/ui/Button';
import html2pdf from 'html2pdf.js';

export default function InventoryValuationPage() {
  const [activeTab, setActiveTab] = useState<'units' | 'value'>('units');
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'mobiles'), where('quantity', '>', 0)));
      const items: any[] = [];
      snap.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setStock(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalUnits = stock.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalValue = stock.reduce((sum, item) => sum + ((item.quantity || 1) * (item.basePrice || 0)), 0);

  const handleExportPDF = () => {
    const html = `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; color: #0f0a1e; padding: 20px; background: white;">
        <div style="text-align: center; margin-bottom: 20px; background: #12141D; color: white; padding: 22px; border-radius: 8px; border-bottom: 3px solid #F59E0B;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">ARSHAD MOBILE ZONE (AMZ)</h1>
          <p style="margin: 4px 0 0 0; color: #F59E0B; font-weight: bold; font-size: 13px;">BARA BAZAR KHYBER</p>
          <h2 style="margin: 6px 0 0 0; font-size: 15px; font-weight: normal; opacity: 0.85;">Inventory Valuation Report</h2>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding: 0 10px;">
          <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
          <div><strong>Total Units:</strong> ${totalUnits}</div>
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
            ${stock.map(item => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.modelName} ${item.ramRom ? `(${item.ramRom})` : ''}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.companyName}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">${item.quantity || 1}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">Rs. ${(item.basePrice || 0).toLocaleString()}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: bold;">
                  Rs. ${((item.quantity || 1) * (item.basePrice || 0)).toLocaleString()}
                </td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f8fafc; font-weight: bold;">
              <td colspan="4" style="padding: 15px 10px; text-align: right;">GRAND TOTAL VALUE:</td>
              <td style="padding: 15px 10px; text-align: right; color: #059669; font-size: 16px;">Rs. ${totalValue.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = html;
    
    const opt = {
      margin:       0.5,
      filename:     'Inventory_Valuation.pdf',
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' as const }
    };
    
    html2pdf().set(opt).from(container).save();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Valuation</h1>
        <Button onClick={handleExportPDF} variant="secondary">
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-100">
        <div className="border-b border-gray-100 flex gap-4 px-4 pt-4">
          <button
            onClick={() => setActiveTab('units')}
            className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'units' ? 'border-forest text-forest' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Mobile Units
          </button>
          <button
            onClick={() => setActiveTab('value')}
            className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'value' ? 'border-forest text-forest' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Mobile Stock Value
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'units' ? (
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-surface-3 border-b border-gray-200 text-left text-xs font-semibold text-forest uppercase tracking-wider">
                  <th className="px-6 py-3">Model</th>
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">RAM/ROM</th>
                  <th className="px-6 py-3">Condition</th>
                  <th className="px-6 py-3 text-right">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? <tr><td colSpan={5} className="p-6 text-center text-gray-400">Loading...</td></tr> : 
                  stock.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{item.modelName}</td>
                      <td className="px-6 py-4 text-gray-500">{item.companyName}</td>
                      <td className="px-6 py-4 text-gray-500">{item.ramRom || '-'}</td>
                      <td className="px-6 py-4 text-gray-500">{item.condition || 'New'}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">{item.quantity || 1}</td>
                    </tr>
                  ))
                }
              </tbody>
              <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-gray-700">Total Units in Stock</td>
                  <td className="px-6 py-4 text-right text-gray-900">{totalUnits} units</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-surface-3 border-b border-gray-200 text-left text-xs font-semibold text-forest uppercase tracking-wider">
                  <th className="px-6 py-3">Model</th>
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3 text-right">Qty</th>
                  <th className="px-6 py-3 text-right">Base Price</th>
                  <th className="px-6 py-3 text-right">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? <tr><td colSpan={5} className="p-6 text-center text-gray-400">Loading...</td></tr> : 
                  stock.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{item.modelName} {item.ramRom ? `(${item.ramRom})` : ''}</td>
                      <td className="px-6 py-4 text-gray-500">{item.companyName}</td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">{item.quantity || 1}</td>
                      <td className="px-6 py-4 text-right text-gray-500">Rs. {(item.basePrice || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">Rs. {((item.quantity || 1) * (item.basePrice || 0)).toLocaleString()}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )}
        </div>
      </div>

      {activeTab === 'value' && (
        <div className="bg-forest text-white rounded-xl p-6 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/70 text-sm">Total Inventory Value</p>
              <p className="text-3xl font-bold">Rs. {totalValue.toLocaleString()}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-sm">Total Mobiles</p>
            <p className="text-xl font-bold">{totalUnits} units</p>
          </div>
        </div>
      )}
    </div>
  );
}
