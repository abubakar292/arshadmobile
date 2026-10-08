import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Package, Download, Printer, Search, Smartphone, Layers, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/ui/SearchBar';
import { SHOP_CONFIG } from '../config/shopConfig';
import { printInNewWindow } from '../utils/printUtils';
import html2pdf from 'html2pdf.js';

interface MobileStockItem {
  id: string;
  modelName: string;
  company: string;
  ramRom?: string;
  condition?: string;
  quantity: number;
  basePrice: number;
  totalValue: number;
  color?: string;
  storage?: string;
}

export default function InventoryValuationPage() {
  const [activeTab, setActiveTab] = useState<'units' | 'value'>('units');
  const [stock, setStock] = useState<MobileStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('All');

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'mobiles')));
      const items: MobileStockItem[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        const qty = Number(data.quantity) || 0;
        // Include any mobile with stock quantity > 0
        if (qty > 0) {
          const basePrice = Number(data.basePrice ?? data.purchasePrice ?? data.costPrice ?? 0);
          const modelName = data.modelName || data.model || data.itemName || 'Unnamed Mobile';
          const company = data.company || data.companyName || data.brand || 'Other';
          const ramRom = data.ramRom || data.storage || '';
          const condition = data.condition || 'New';

          items.push({
            id: docSnap.id,
            modelName,
            company,
            ramRom,
            condition,
            quantity: qty,
            basePrice,
            totalValue: qty * basePrice,
            color: data.color || '',
            storage: data.storage || ''
          });
        }
      });
      // Sort by value descending
      items.sort((a, b) => b.totalValue - a.totalValue);
      setStock(items);
    } catch (e) {
      console.error('Error fetching inventory stock:', e);
    } finally {
      setLoading(false);
    }
  };

  const companies = useMemo(() => {
    const list = Array.from(new Set(stock.map(s => s.company).filter(Boolean)));
    return ['All', ...list.sort()];
  }, [stock]);

  const filteredStock = useMemo(() => {
    return stock.filter(item => {
      const matchesCompany = selectedCompany === 'All' || item.company.toLowerCase() === selectedCompany.toLowerCase();
      const term = search.toLowerCase().trim();
      const matchesSearch = !term || 
        item.modelName.toLowerCase().includes(term) ||
        item.company.toLowerCase().includes(term) ||
        (item.ramRom && item.ramRom.toLowerCase().includes(term));
      return matchesCompany && matchesSearch;
    });
  }, [stock, selectedCompany, search]);

  const totalUnits = useMemo(() => stock.reduce((sum, item) => sum + item.quantity, 0), [stock]);
  const totalValue = useMemo(() => stock.reduce((sum, item) => sum + item.totalValue, 0), [stock]);
  const filteredUnits = useMemo(() => filteredStock.reduce((sum, item) => sum + item.quantity, 0), [filteredStock]);
  const filteredValue = useMemo(() => filteredStock.reduce((sum, item) => sum + item.totalValue, 0), [filteredStock]);

  const generateReportHtml = () => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    return `
      <div style="font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; color: #0f172a; padding: 24px; background: #ffffff; max-width: 900px; margin: 0 auto;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 24px; background: #12141D; color: #ffffff; padding: 24px; border-radius: 12px; border-bottom: 4px solid #F59E0B;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 1px; color: #ffffff;">
            ${SHOP_CONFIG.name.toUpperCase()} (${SHOP_CONFIG.shortName})
          </h1>
          <p style="margin: 6px 0 0 0; color: #F59E0B; font-weight: 700; font-size: 13px; letter-spacing: 2px; text-transform: uppercase;">
            ${SHOP_CONFIG.subTitle.toUpperCase()} • TEL: ${SHOP_CONFIG.phone}
          </p>
          <div style="margin-top: 10px; display: inline-block; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); padding: 4px 16px; border-radius: 20px;">
            <span style="font-size: 13px; font-weight: 600; color: #FBBF24;">INVENTORY VALUATION & AUDIT REPORT</span>
          </div>
        </div>

        <!-- Meta Summary -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 14px 20px; border-radius: 8px; margin-bottom: 20px;">
          <div>
            <div style="font-size: 12px; color: #64748B;">REPORT DATE & TIME</div>
            <div style="font-size: 14px; font-weight: 700; color: #0F172A;">${dateStr} at ${timeStr}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #64748B; text-align: center;">TOTAL STOCK UNITS</div>
            <div style="font-size: 16px; font-weight: 800; color: #1E293B; text-align: center;">${totalUnits} Units</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; color: #64748B;">TOTAL INVENTORY VALUE</div>
            <div style="font-size: 18px; font-weight: 800; color: #059669;">Rs. ${totalValue.toLocaleString()}</div>
          </div>
        </div>

        <!-- Table -->
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
          <thead>
            <tr style="background: #12141D; color: #ffffff;">
              <th style="padding: 10px 12px; width: 40px; text-align: center; border-radius: 6px 0 0 0;">#</th>
              <th style="padding: 10px 12px;">Mobile Model</th>
              <th style="padding: 10px 12px;">Company</th>
              <th style="padding: 10px 12px; text-align: center;">RAM / ROM</th>
              <th style="padding: 10px 12px; text-align: center;">Qty</th>
              <th style="padding: 10px 12px; text-align: right;">Base Price</th>
              <th style="padding: 10px 12px; text-align: right; border-radius: 0 6px 0 0;">Total Value</th>
            </tr>
          </thead>
          <tbody>
            ${stock.map((item, idx) => `
              <tr style="border-bottom: 1px solid #E2E8F0; background: ${idx % 2 === 0 ? '#ffffff' : '#F8FAFC'};">
                <td style="padding: 10px 12px; text-align: center; color: #64748B;">${idx + 1}</td>
                <td style="padding: 10px 12px; font-weight: 600; color: #0F172A;">${item.modelName}</td>
                <td style="padding: 10px 12px; color: #475569;">${item.company}</td>
                <td style="padding: 10px 12px; text-align: center; color: #64748B;">${item.ramRom || '-'}</td>
                <td style="padding: 10px 12px; text-align: center; font-weight: 700; color: #0F172A;">${item.quantity}</td>
                <td style="padding: 10px 12px; text-align: right; color: #475569;">Rs. ${item.basePrice.toLocaleString()}</td>
                <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #0F172A;">Rs. ${item.totalValue.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #FFFBEB; border-top: 2px solid #F59E0B; font-weight: 800;">
              <td colspan="4" style="padding: 14px 12px; text-align: right; color: #78350F; font-size: 14px;">GRAND TOTAL:</td>
              <td style="padding: 14px 12px; text-align: center; color: #78350F; font-size: 14px;">${totalUnits}</td>
              <td style="padding: 14px 12px; text-align: right; color: #78350F;">-</td>
              <td style="padding: 14px 12px; text-align: right; color: #059669; font-size: 16px;">Rs. ${totalValue.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Footer -->
        <div style="margin-top: 30px; padding-top: 14px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 11px; color: #64748B;">
          <p style="margin: 0;">Generated by <strong>${SHOP_CONFIG.name} (${SHOP_CONFIG.shortName})</strong> Management System • ${SHOP_CONFIG.address}</p>
          <p style="margin: 4px 0 0 0;">Confidential inventory document for shop accounting & audit purposes.</p>
        </div>
      </div>
    `;
  };

  const handleExportPDF = () => {
    const html = generateReportHtml();
    const container = document.createElement('div');
    container.innerHTML = html;
    
    const opt = {
      margin: 0.3,
      filename: `AMZ_Inventory_Valuation_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const }
    };
    
    html2pdf().set(opt).from(container).save();
  };

  const handlePrint = () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${SHOP_CONFIG.shortName} Inventory Valuation Report</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { margin: 0; padding: 10px; background: white; font-family: system-ui, sans-serif; }
            @media print {
              body { padding: 0; }
              @page { margin: 1cm; size: portrait; }
            }
          </style>
        </head>
        <body>
          ${generateReportHtml()}
        </body>
      </html>
    `;
    printInNewWindow(html, `${SHOP_CONFIG.shortName} Inventory Valuation`);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 sm:pb-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Inventory Valuation
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time stock valuation and inventory assessment for <strong className="text-gray-700">{SHOP_CONFIG.name}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={fetchStock} variant="secondary" size="sm" className="h-10 text-xs sm:text-sm">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button onClick={handlePrint} variant="secondary" size="sm" className="h-10 text-xs sm:text-sm">
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print
          </Button>
          <Button 
            onClick={handleExportPDF} 
            size="sm" 
            className="h-10 text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-obsidian-dark font-bold hover:brightness-105"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export PDF (AMZ)
          </Button>
        </div>
      </div>

      {/* ── KPI STATS CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Stock Units */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium">Total Mobile Units</p>
            <p className="text-lg sm:text-2xl font-black text-gray-900 truncate">
              {totalUnits} <span className="text-xs font-normal text-gray-400">units</span>
            </p>
          </div>
        </div>

        {/* Total Inventory Value */}
        <div className="bg-gradient-to-br from-obsidian-dark to-surface text-white p-4 rounded-2xl border border-amber-500/20 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-gold flex items-center justify-center shrink-0 border border-amber-500/30">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-amber-200/80 font-medium">Total Stock Value</p>
            <p className="text-base sm:text-2xl font-black text-gold truncate">
              Rs. {totalValue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Total Models Count */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium">Distinct Models</p>
            <p className="text-lg sm:text-2xl font-black text-gray-900 truncate">
              {stock.length} <span className="text-xs font-normal text-gray-400">models</span>
            </p>
          </div>
        </div>

        {/* Average Unit Cost */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium">Avg Unit Value</p>
            <p className="text-base sm:text-2xl font-black text-emerald-600 truncate">
              Rs. {totalUnits > 0 ? Math.round(totalValue / totalUnits).toLocaleString() : 0}
            </p>
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <SearchBar 
              value={search} 
              onChange={setSearch} 
              placeholder="Search model, brand, RAM/ROM..." 
            />
          </div>

          {/* Tab Selector */}
          <div className="flex bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('units')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'units'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Units Breakdown
            </button>
            <button
              onClick={() => setActiveTab('value')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'value'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Valuation Value
            </button>
          </div>
        </div>

        {/* Company Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-gray-400 font-medium mr-1 text-[11px] shrink-0">Company:</span>
          {companies.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCompany(c)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCompany === c
                  ? 'bg-amber-500 text-obsidian-dark font-bold shadow-xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/60'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT CONTAINER ── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2 text-amber-500" />
            <p className="text-sm font-medium">Calculating Inventory Valuation...</p>
          </div>
        ) : filteredStock.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-600">No matching mobiles in stock</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search or company filter</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (hidden on small phones) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <th className="px-5 py-3.5">Model</th>
                    <th className="px-5 py-3.5">Company</th>
                    <th className="px-5 py-3.5 text-center">RAM / ROM</th>
                    <th className="px-5 py-3.5 text-center">Condition</th>
                    <th className="px-5 py-3.5 text-center">Stock Qty</th>
                    {activeTab === 'value' && (
                      <>
                        <th className="px-5 py-3.5 text-right">Base Price</th>
                        <th className="px-5 py-3.5 text-right">Total Valuation</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStock.map(item => (
                    <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-gray-900">
                        {item.modelName}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                          {item.company}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center text-gray-500 font-mono text-xs">
                        {item.ramRom || '-'}
                      </td>
                      <td className="px-5 py-3.5 text-center text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          item.condition === 'New' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.condition}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-gray-900">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-900 border border-amber-500/20 font-black">
                          {item.quantity}
                        </span>
                      </td>
                      {activeTab === 'value' && (
                        <>
                          <td className="px-5 py-3.5 text-right text-gray-600 font-medium">
                            Rs. {item.basePrice.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right font-black text-emerald-700 text-base">
                            Rs. {item.totalValue.toLocaleString()}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-200 text-sm">
                  <tr>
                    <td colSpan={4} className="px-5 py-4 text-right text-gray-700 font-extrabold uppercase tracking-wide">
                      Filtered Totals:
                    </td>
                    <td className="px-5 py-4 text-center font-black text-gray-900 text-base">
                      {filteredUnits} units
                    </td>
                    {activeTab === 'value' && (
                      <>
                        <td className="px-5 py-4 text-right text-gray-500">-</td>
                        <td className="px-5 py-4 text-right text-emerald-700 text-lg font-black">
                          Rs. {filteredValue.toLocaleString()}
                        </td>
                      </>
                    )}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Card List View (Optimized for Phones) */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredStock.map(item => (
                <div key={item.id} className="p-4 space-y-2 hover:bg-amber-50/20 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug">
                        {item.modelName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                          {item.company}
                        </span>
                        {item.ramRom && (
                          <span className="text-[11px] text-gray-500 font-mono">
                            {item.ramRom}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">
                          {item.condition}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-gray-500 block">Stock</span>
                      <span className="text-sm font-black px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-900 border border-amber-500/20">
                        {item.quantity} pcs
                      </span>
                    </div>
                  </div>

                  {activeTab === 'value' && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-xs">
                      <span className="text-gray-500">
                        Base: <strong className="text-gray-700">Rs. {item.basePrice.toLocaleString()}</strong>
                      </span>
                      <span className="text-right">
                        Total: <strong className="text-emerald-700 text-sm font-black">Rs. {item.totalValue.toLocaleString()}</strong>
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* Mobile Summary Footnote */}
              <div className="p-4 bg-amber-50/60 border-t border-amber-200/50 flex items-center justify-between text-xs sm:text-sm font-bold text-amber-950">
                <span>Total Units: {filteredUnits}</span>
                {activeTab === 'value' && (
                  <span className="text-emerald-800 font-black text-sm">
                    Total: Rs. {filteredValue.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
