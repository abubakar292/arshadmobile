import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Package, Download, Printer, Search, Smartphone, Layers, TrendingUp, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/ui/SearchBar';
import { SHOP_CONFIG } from '../config/shopConfig';
import { BillPreviewModal } from '../components/ui/BillPreviewModal';
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
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

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
    setPreviewHtml(html);
    setShowPrintPreview(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-16 sm:pb-8">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold shrink-0 border border-amber-500/25">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">
                Inventory Valuation
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time stock valuation for <strong className="text-gray-700 font-semibold">{SHOP_CONFIG.name}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: 3 Column Grid on Mobile, Neat Flex Row on Desktop */}
        <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
          <Button 
            onClick={fetchStock} 
            variant="secondary" 
            size="sm" 
            className="h-10 text-xs sm:text-sm justify-center active:scale-95 px-2.5"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:mr-1.5 shrink-0" />
            <span className="hidden xs:inline">Refresh</span>
          </Button>
          <Button 
            onClick={handlePrint} 
            variant="secondary" 
            size="sm" 
            className="h-10 text-xs sm:text-sm justify-center active:scale-95 px-2.5"
          >
            <Printer className="w-3.5 h-3.5 sm:mr-1.5 shrink-0" />
            <span className="hidden xs:inline">Print</span>
          </Button>
          <Button 
            onClick={handleExportPDF} 
            size="sm" 
            className="h-10 text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-obsidian-dark font-extrabold hover:brightness-105 justify-center shadow-xs active:scale-95 px-2.5"
          >
            <Download className="w-3.5 h-3.5 sm:mr-1.5 shrink-0" />
            <span>PDF (AMZ)</span>
          </Button>
        </div>
      </div>

      {/* ── KPI STATS CARDS (Spacious & Non-Squeezed on Mobile) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Inventory Value (Featured Hero Card) */}
        <div className="sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-obsidian-dark via-obsidian to-surface text-white p-4 sm:p-5 rounded-2xl border border-amber-500/30 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-amber-200/80 font-bold uppercase tracking-wider">
                Total Stock Valuation
              </p>
              <p className="text-2xl sm:text-3xl font-black text-gold mt-1 tracking-tight">
                Rs. {totalValue.toLocaleString()}
              </p>
              <p className="text-[11px] text-white/50 mt-1">
                {totalUnits} units across {stock.length} models
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-gold flex items-center justify-center shrink-0 border border-amber-500/30 shadow-inner">
              <TrendingUp className="w-6 h-6 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Total Stock Units */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total Units</p>
            <p className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">
              {totalUnits} <span className="text-xs font-normal text-gray-400">units</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Total Models Count */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Distinct Models</p>
            <p className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">
              {stock.length} <span className="text-xs font-normal text-gray-400">models</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Average Unit Cost */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Avg Unit Cost</p>
            <p className="text-lg sm:text-xl font-black text-emerald-700 mt-0.5">
              Rs. {totalUnits > 0 ? Math.round(totalValue / totalUnits).toLocaleString() : 0}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR (Full Width on Mobile) ── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex-1">
            <SearchBar 
              value={search} 
              onChange={setSearch} 
              placeholder="Search model, brand, RAM/ROM..." 
            />
          </div>

          {/* Tab Selector: 50/50 Grid on Mobile */}
          <div className="grid grid-cols-2 bg-gray-100 p-1 rounded-xl w-full sm:w-auto shrink-0">
            <button
              onClick={() => setActiveTab('units')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                activeTab === 'units'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Units Breakdown
            </button>
            <button
              onClick={() => setActiveTab('value')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center ${
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
          <span className="text-gray-400 font-bold mr-1 text-[11px] shrink-0 uppercase tracking-wider">Company:</span>
          {companies.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCompany(c)}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors text-xs ${
                selectedCompany === c
                  ? 'bg-amber-500 text-obsidian-dark shadow-xs'
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
            {/* ── DESKTOP TABLE VIEW (Visible on tablet & desktop) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50/90 border-b border-gray-200 text-xs font-bold text-gray-700 uppercase tracking-wider">
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
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
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

            {/* ── MOBILE CARD LIST VIEW (Spacious, Beautiful & Non-Squeezed for Phones) ── */}
            <div className="md:hidden p-3 space-y-3 bg-gray-50/50">
              {filteredStock.map(item => (
                <div 
                  key={item.id} 
                  className="p-4 bg-white rounded-2xl border border-gray-100 shadow-xs hover:border-amber-200 transition-all space-y-3"
                >
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500/15 text-amber-900 border border-amber-500/25">
                        {item.company}
                      </span>
                      {item.ramRom && (
                        <span className="px-2 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 font-mono">
                          {item.ramRom}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-200">
                        {item.condition}
                      </span>
                    </div>

                    {/* Stock Qty Badge */}
                    <div className="shrink-0">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-slate-900 text-amber-400 border border-amber-500/30 shadow-2xs">
                        <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                        {item.quantity} {item.quantity === 1 ? 'Unit' : 'Units'}
                      </span>
                    </div>
                  </div>

                  {/* Model Name: Full Width & Prominent */}
                  <div>
                    <h3 className="text-base font-black text-gray-900 tracking-tight leading-snug">
                      {item.modelName}
                    </h3>
                  </div>

                  {/* Value Grid Boxes (Never Squeezed) */}
                  {activeTab === 'value' ? (
                    <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-gray-100">
                      <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                        <p className="text-[11px] font-medium text-gray-500">Base Unit Cost</p>
                        <p className="text-sm font-extrabold text-gray-800 mt-0.5">
                          Rs. {item.basePrice.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/90">
                        <p className="text-[11px] font-bold text-emerald-700">Total Valuation</p>
                        <p className="text-sm font-black text-emerald-800 mt-0.5">
                          Rs. {item.totalValue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                      <span>Per Unit Cost: <strong className="text-gray-800 font-bold">Rs. {item.basePrice.toLocaleString()}</strong></span>
                      <span className="text-emerald-700 font-bold">In Stock</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Mobile Summary Footnote */}
              <div className="p-4 bg-gradient-to-r from-obsidian-dark to-surface text-white rounded-2xl border border-amber-500/30 flex items-center justify-between text-xs sm:text-sm font-bold shadow-md">
                <div>
                  <p className="text-amber-200/80 text-[11px] font-semibold uppercase">Total Stock</p>
                  <p className="text-white font-extrabold text-sm">{filteredUnits} Units</p>
                </div>
                {activeTab === 'value' && (
                  <div className="text-right">
                    <p className="text-amber-200/80 text-[11px] font-semibold uppercase">Grand Total</p>
                    <p className="text-gold font-black text-base">Rs. {filteredValue.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* IN-APP PREVIEW MODAL */}
      <BillPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        htmlContent={previewHtml}
        title="Inventory Valuation Report"
      />
    </div>
  );
}
