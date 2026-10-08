import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SearchBar } from '../components/ui/SearchBar';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { FileText, MessageCircle } from 'lucide-react';
import { format, isToday, isThisWeek, isThisMonth, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { parseDateSafe, formatDateSafe } from '../utils/dateUtils';
import { printBillHtml } from '../utils/printBill';
import { getWhatsAppSaleBillUrl } from '../config/shopConfig';

export default function BillsHistoryPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  
  const [customStart, setCustomStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    const q = query(collection(db, 'bills'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setBills(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const filteredBills = bills.filter(b => {
    const term = search.toLowerCase().trim();
    
    // Check inside items array for model name, company/brand, and IMEI
    const matchesItem = b.items?.some((item: any) => 
      (item.name && item.name.toLowerCase().includes(term)) ||
      (item.itemName && item.itemName.toLowerCase().includes(term)) ||
      (item.company && item.company.toLowerCase().includes(term)) ||
      (item.brand && item.brand.toLowerCase().includes(term)) ||
      (item.imei1 && item.imei1.includes(term)) ||
      (item.imei2 && item.imei2.includes(term))
    );

    const matchesSearch = !term || (
      (b.customerName && b.customerName.toLowerCase().includes(term)) ||
      (b.customerPhone && b.customerPhone.includes(term)) ||
      (b.billNumber && b.billNumber.toLowerCase().includes(term)) ||
      (b.id && b.id.toLowerCase().includes(term)) ||
      matchesItem
    );

    // Payment Filter
    const matchesPayment = paymentFilter === 'All' || b.paymentMethod === paymentFilter;

    // Date filter
    let matchesDate = true;
    let billDate = parseDateSafe(b.date || b.createdAt) || new Date();
    
    if (dateFilter === 'Today') {
      matchesDate = isToday(billDate);
    } else if (dateFilter === 'This Week') {
      matchesDate = isThisWeek(billDate);
    } else if (dateFilter === 'This Month') {
      matchesDate = isThisMonth(billDate);
    } else if (dateFilter === 'Custom Range') {
      matchesDate = isWithinInterval(billDate, {
        start: startOfDay(new Date(customStart)),
        end: endOfDay(new Date(customEnd))
      });
    }

    return matchesSearch && matchesPayment && matchesDate;
  });

  const handlePrint = (bill: any) => {
    printBillHtml(bill);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bills History</h1>
          <p className="text-sm text-slate-500 mt-1">View and reprint generated sales receipts</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-4">
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by Model, Brand, IMEI, Bill #, Customer..." />
          </div>
          <Select 
            className="md:max-w-[170px]"
            value={paymentFilter} 
            onChange={(e) => setPaymentFilter(e.target.value)}
            options={[
              { value: 'All', label: 'All Methods' },
              { value: 'Cash', label: 'Cash' },
              { value: 'Online', label: 'Online / Bank' },
              { value: 'Khata', label: 'Khata (Credit)' },
            ]}
          />
          <Select 
            className="md:max-w-[170px]"
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            options={[
              { value: 'All', label: 'All Time' },
              { value: 'Today', label: 'Today' },
              { value: 'This Week', label: 'This Week' },
              { value: 'This Month', label: 'This Month' },
              { value: 'Custom Range', label: 'Custom Range' },
            ]}
          />
          {dateFilter === 'Custom Range' && (
            <div className="flex items-center gap-2">
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="rounded-xl border border-primary-500/20 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2" />
              <span className="text-slate-400">to</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="rounded-xl border border-primary-500/20 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2" />
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold rounded-tl-xl">Bill #</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Total Amount</th>
                <th className="px-4 py-3 font-semibold">Method</th>
                <th className="px-4 py-3 font-semibold rounded-tr-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p>No bills found.</p>
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-primary-600">{b.billNumber || b.id.substring(0,8).toUpperCase()}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDateSafe(b.date || b.createdAt, 'dd MMM yyyy, hh:mm a')}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{b.customerName || 'Walk-in'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="info">{b.items?.length || 0} Items</Badge>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      Rs. {(b.totalSellPrice || b.totalSellAmount || b.sellPrice || (b.items?.reduce((s: number, it: any) => s + (Number(it.sellPrice) || 0), 0)) || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={b.paymentMethod === 'Cash' ? 'success' : 'cyan'}>
                        {b.paymentMethod}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.customerPhone && (
                          <a
                            href={getWhatsAppSaleBillUrl(
                              b.customerPhone,
                              b.customerName,
                              b.items?.[0]?.modelName || b.items?.[0]?.itemName || 'Mobile Purchase',
                              b.totalSellPrice || b.totalSellAmount || b.sellPrice || 0,
                              b.paymentMethod,
                              b.items?.[0]?.imei1,
                              b.billNumber || b.id.substring(0, 8).toUpperCase()
                            )}
                            target="_blank"
                            rel="noreferrer"
                            title="Send WhatsApp Bill"
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                          >
                            <MessageCircle className="w-4 h-4 fill-emerald-500/20" />
                          </a>
                        )}
                        <button 
                          onClick={() => handlePrint(b)} 
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
