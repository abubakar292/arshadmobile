const fs = require('fs');
let code = fs.readFileSync('src/pages/MobilesStockPage.tsx', 'utf8');

// 1. Add Khata state to MobilesStockPage
code = code.replace(
  /const \[search, setSearch\] = useState\(''\);/,
  `const [search, setSearch] = useState('');
  const [khataCustomers, setKhataCustomers] = useState<any[]>([]);
  const [singleSelectedKhataId, setSingleSelectedKhataId] = useState('');
  const [multiSelectedKhataId, setMultiSelectedKhataId] = useState('');
  const [multiTotalProfit, setMultiTotalProfit] = useState<number>(0);`
);

// 2. Fetch Khata customers
code = code.replace(
  /const q = query\(collection\(db, 'mobiles'\), orderBy\('createdAt', 'desc'\)\);/,
  `const fetchKhata = async () => {
      const snap = await getDocs(query(collection(db, 'khata'), orderBy('name')));
      setKhataCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchKhata();
    const q = query(collection(db, 'mobiles'), orderBy('createdAt', 'desc'));`
);

// Add getDoc to imports
if (!code.includes('getDoc,')) {
    code = code.replace(/import \{ collection, /g, "import { collection, getDoc, ");
}


// 3. handleSingleSell 
const oldSingleSell = `const handleSingleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleSellModal) return;
    try {
      const sellPrice = Number(singleSellModal.sellPrice);
      const basePrice = singleSellModal.basePrice;
      const profit = sellPrice - basePrice;
      const batch = writeBatch(db);
      
      // 1. Decrease quantity
      const mobileRef = doc(db, 'mobiles', singleSellModal.id);
      batch.update(mobileRef, { quantity: singleSellModal.quantity - 1 });

      // 2. Create Sale Record
      const saleRef = doc(collection(db, 'sales'));
      const saleData = {
        itemType: 'mobile',
        itemId: singleSellModal.id,
        itemName: \`\${singleSellModal.company} \${singleSellModal.modelName}\`,
        company: singleSellModal.company,
        imei1: singleSellModal.imei1,
        imei2: singleSellModal.imei2,
        customerName: singleSellModal.customerName,
        customerPhone: singleSellModal.customerPhone,
        basePrice,
        sellPrice,
        profit,
        paymentMethod: singleSellModal.paymentMethod,
        date: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      batch.set(saleRef, saleData);

      // 3. Create Bill Record
      const billRef = doc(collection(db, 'bills'));
      // Find bill number
      const billsSnap = await getDocs(query(collection(db, 'bills')));
      const billNumber = \`ZM-\${new Date().getFullYear()}-\${String(billsSnap.size + 1).padStart(4, '0')}\`;
      
      const billData = {
        billNumber,
        customerName: singleSellModal.customerName,
        customerPhone: singleSellModal.customerPhone,
        items: [{
          mobileId: singleSellModal.id,
          modelName: \`\${singleSellModal.company} \${singleSellModal.modelName}\`,
          ramRom: singleSellModal.ramRom,
          imei1: singleSellModal.imei1,
          imei2: singleSellModal.imei2,
          sellPrice,
          basePrice,
          profit
        }],
        totalSellPrice: sellPrice,
        totalProfit: profit,
        paymentMethod: singleSellModal.paymentMethod,
        date: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      batch.set(billRef, billData);
      
      batch.update(saleRef, { billId: billRef.id });

      await batch.commit();

      setSingleSellModal(null);
      setPrintPromptData({ isOpen: true, billData: { id: billRef.id, ...billData }, profit });
      
    } catch (err: any) {
      error(err.message || 'Error processing sale');
    }
  };`;

const newSingleSell = `const handleSingleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleSellModal) return;

    if (singleSellModal.paymentMethod === 'Udhar' && !singleSelectedKhataId) {
      return error("Please select a Khata customer for Udhar payment");
    }

    try {
      const sellPrice = Number(singleSellModal.sellPrice);
      const basePrice = singleSellModal.basePrice;
      const profit = sellPrice - basePrice;
      const batch = writeBatch(db);
      
      // 1. Decrease quantity
      const mobileRef = doc(db, 'mobiles', singleSellModal.id);
      batch.update(mobileRef, { quantity: singleSellModal.quantity - 1 });

      // 2. Create Sale Record
      const saleRef = doc(collection(db, 'sales'));
      const saleData = {
        itemType: 'mobile',
        itemId: singleSellModal.id,
        itemName: \`\${singleSellModal.company} \${singleSellModal.modelName}\`,
        company: singleSellModal.company,
        imei1: singleSellModal.imei1,
        imei2: singleSellModal.imei2,
        customerName: singleSellModal.customerName,
        customerPhone: singleSellModal.customerPhone,
        basePrice,
        sellPrice,
        profit,
        paymentMethod: singleSellModal.paymentMethod,
        khataCustomerId: singleSellModal.paymentMethod === 'Udhar' ? singleSelectedKhataId : null,
        khataCustomerName: singleSellModal.paymentMethod === 'Udhar' ? khataCustomers.find(c => c.id === singleSelectedKhataId)?.name : null,
        date: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      batch.set(saleRef, saleData);

      // 3. Create Bill Record
      const billRef = doc(collection(db, 'bills'));
      const billsSnap = await getDocs(query(collection(db, 'bills')));
      const billNumber = \`ZM-\${new Date().getFullYear()}-\${String(billsSnap.size + 1).padStart(4, '0')}\`;
      
      const billData = {
        billNumber,
        customerName: singleSellModal.customerName,
        customerPhone: singleSellModal.customerPhone,
        items: [{
          mobileId: singleSellModal.id,
          modelName: \`\${singleSellModal.company} \${singleSellModal.modelName}\`,
          ramRom: singleSellModal.ramRom,
          imei1: singleSellModal.imei1,
          imei2: singleSellModal.imei2,
          sellPrice,
          basePrice,
          profit
        }],
        totalSellPrice: sellPrice,
        totalProfit: profit,
        paymentMethod: singleSellModal.paymentMethod,
        khataCustomerId: singleSellModal.paymentMethod === 'Udhar' ? singleSelectedKhataId : null,
        khataCustomerName: singleSellModal.paymentMethod === 'Udhar' ? khataCustomers.find(c => c.id === singleSelectedKhataId)?.name : null,
        date: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      batch.set(billRef, billData);
      batch.update(saleRef, { billId: billRef.id });

      // Handle Udhar
      if (singleSellModal.paymentMethod === 'Udhar' && singleSelectedKhataId) {
        const khataRef = doc(db, 'khata', singleSelectedKhataId);
        const khataSnap = await getDoc(khataRef);
        if (khataSnap.exists()) {
          const currentBalance = khataSnap.data().totalBalance || 0;
          const newBalance = currentBalance + sellPrice;
          
          batch.update(khataRef, { totalBalance: newBalance });
          
          const txnRef = doc(collection(db, 'khataTransactions'));
          batch.set(txnRef, {
            khataId: singleSelectedKhataId,
            customerName: khataSnap.data().name,
            transactionType: 'udhar',
            amount: sellPrice,
            description: \`Mobile sale - \${singleSellModal.modelName}\`,
            runningBalance: newBalance,
            date: new Date(),
            createdAt: serverTimestamp(),
            linkedSaleId: billRef.id
          });
        }
      }

      await batch.commit();

      if (singleSellModal.paymentMethod === 'Udhar') {
        const khataName = khataCustomers.find(c => c.id === singleSelectedKhataId)?.name;
        success(\`Rs. \${sellPrice.toLocaleString()} added to \${khataName}'s Khata\`);
      } else {
        success("Sale completed");
      }

      setSingleSellModal(null);
      setSingleSelectedKhataId('');
      setPrintPromptData({ isOpen: true, billData: { id: billRef.id, ...billData }, profit });
      
    } catch (err: any) {
      error(err.message || 'Error processing sale');
    }
  };`;

code = code.replace(oldSingleSell, newSingleSell);


// 4. handleMultiSell
const oldMultiSell = `const handleMultiSell = async () => {
    // Validate
    if (!multiCustomerName) return error("Customer name is required");
    const validItems = multiItems.filter(i => i.mobileId && i.imei1 && Number(i.sellPrice) > 0);
    if (validItems.length === 0) return error("Please complete at least one valid mobile entry with IMEI 1");

    try {
      const batch = writeBatch(db);
      
      let totalSellPrice = 0;
      let totalProfit = 0;

      // Group quantity reductions to check stock (simplified approach: assuming user won't pick same mobile > quantity)
      const qtyMap: Record<string, number> = {};
      validItems.forEach(i => {
        qtyMap[i.mobileId] = (qtyMap[i.mobileId] || 0) + 1;
      });
      
      for (const mobileId of Object.keys(qtyMap)) {
        const m = mobiles.find(x => x.id === mobileId);
        if (m && m.quantity < qtyMap[mobileId]) {
          throw new Error(\`Not enough stock for \${m.modelName}\`);
        }
        const mobileRef = doc(db, 'mobiles', mobileId);
        batch.update(mobileRef, { quantity: m.quantity - qtyMap[mobileId] });
      }

      // Create Bill
      const billRef = doc(collection(db, 'bills'));
      const billsSnap = await getDocs(query(collection(db, 'bills')));
      const billNumber = \`ZM-\${new Date().getFullYear()}-\${String(billsSnap.size + 1).padStart(4, '0')}\`;
      
      const billItems = validItems.map(item => {
        const sPrice = Number(item.sellPrice);
        const bPrice = item.basePrice;
        const profit = sPrice - bPrice;
        totalSellPrice += sPrice;
        totalProfit += profit;
        return {
          mobileId: item.mobileId,
          modelName: item.modelName,
          company: item.company,
          ramRom: item.ramRom,
          imei1: item.imei1,
          imei2: item.imei2,
          sellPrice: sPrice,
          basePrice: bPrice,
          profit
        };
      });

      const billData = {
        billNumber,
        customerName: multiCustomerName,
        customerPhone: multiCustomerPhone,
        items: billItems,
        totalSellPrice,
        totalProfit,
        paymentMethod: multiPaymentMethod,
        date: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      
      batch.set(billRef, billData);

      // Create Sale records
      billItems.forEach(item => {
        const saleRef = doc(collection(db, 'sales'));
        batch.set(saleRef, {
          itemType: 'mobile',
          itemId: item.mobileId,
          itemName: \`\${item.company} \${item.modelName}\`,
          company: item.company,
          imei1: item.imei1,
          imei2: item.imei2,
          customerName: multiCustomerName,
          customerPhone: multiCustomerPhone,
          basePrice: item.basePrice,
          sellPrice: item.sellPrice,
          profit: item.profit,
          paymentMethod: multiPaymentMethod,
          billId: billRef.id,
          date: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      });

      await batch.commit();
      setMultiSellModalOpen(false);
      setPrintPromptData({ isOpen: true, billData: { id: billRef.id, ...billData }, profit: totalProfit });
    
    } catch (err: any) {
      error(err.message || 'Error processing sale');
    }
  };`;

const newMultiSell = `const handleMultiSell = async () => {
    // Validate
    if (!multiCustomerName) return error("Customer name is required");
    const validItems = multiItems.filter(i => i.mobileId && i.imei1);
    if (validItems.length === 0) return error("Please complete at least one valid mobile entry with IMEI 1");

    if (multiPaymentMethod === 'Udhar' && !multiSelectedKhataId) {
      return error("Please select a Khata customer for Udhar payment");
    }

    try {
      const batch = writeBatch(db);
      
      const totalBasePrice = validItems.reduce((acc, item) => acc + (item.basePrice || 0), 0);
      const totalProfit = Number(multiTotalProfit) || 0;
      const totalSellPrice = totalBasePrice + totalProfit;

      // Group quantity reductions to check stock
      const qtyMap: Record<string, number> = {};
      validItems.forEach(i => {
        qtyMap[i.mobileId] = (qtyMap[i.mobileId] || 0) + 1;
      });
      
      for (const mobileId of Object.keys(qtyMap)) {
        const m = mobiles.find(x => x.id === mobileId);
        if (m && m.quantity < qtyMap[mobileId]) {
          throw new Error(\`Not enough stock for \${m.modelName}\`);
        }
        const mobileRef = doc(db, 'mobiles', mobileId);
        batch.update(mobileRef, { quantity: m.quantity - qtyMap[mobileId] });
      }

      // Create Bill
      const billRef = doc(collection(db, 'bills'));
      const billsSnap = await getDocs(query(collection(db, 'bills')));
      const billNumber = \`ZM-\${new Date().getFullYear()}-\${String(billsSnap.size + 1).padStart(4, '0')}\`;
      
      const billItems = validItems.map(item => {
        return {
          mobileId: item.mobileId,
          modelName: item.modelName,
          company: item.company,
          ramRom: item.ramRom,
          imei1: item.imei1,
          imei2: item.imei2,
          basePrice: item.basePrice,
        };
      });

      const billData = {
        billNumber,
        customerName: multiCustomerName,
        customerPhone: multiCustomerPhone,
        items: billItems,
        totalSellPrice,
        totalProfit,
        totalBaseCost: totalBasePrice,
        paymentMethod: multiPaymentMethod,
        khataCustomerId: multiPaymentMethod === 'Udhar' ? multiSelectedKhataId : null,
        khataCustomerName: multiPaymentMethod === 'Udhar' ? khataCustomers.find(c => c.id === multiSelectedKhataId)?.name : null,
        date: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      
      batch.set(billRef, billData);

      // Create Sale records
      billItems.forEach(item => {
        const saleRef = doc(collection(db, 'sales'));
        batch.set(saleRef, {
          itemType: 'mobile',
          itemId: item.mobileId,
          itemName: \`\${item.company} \${item.modelName}\`,
          company: item.company,
          imei1: item.imei1,
          imei2: item.imei2,
          customerName: multiCustomerName,
          customerPhone: multiCustomerPhone,
          basePrice: item.basePrice,
          paymentMethod: multiPaymentMethod,
          billId: billRef.id,
          date: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      });

      // Handle Udhar
      if (multiPaymentMethod === 'Udhar' && multiSelectedKhataId) {
        const khataRef = doc(db, 'khata', multiSelectedKhataId);
        const khataSnap = await getDoc(khataRef);
        if (khataSnap.exists()) {
          const currentBalance = khataSnap.data().totalBalance || 0;
          const newBalance = currentBalance + totalSellPrice;
          
          batch.update(khataRef, { totalBalance: newBalance });
          
          const txnRef = doc(collection(db, 'khataTransactions'));
          batch.set(txnRef, {
            khataId: multiSelectedKhataId,
            customerName: khataSnap.data().name,
            transactionType: 'udhar',
            amount: totalSellPrice,
            description: \`Multiple Sale - \${validItems.length} mobiles\`,
            runningBalance: newBalance,
            date: new Date(),
            createdAt: serverTimestamp(),
            linkedSaleId: billRef.id
          });
        }
      }

      await batch.commit();

      if (multiPaymentMethod === 'Udhar') {
        const khataName = khataCustomers.find(c => c.id === multiSelectedKhataId)?.name;
        success(\`Rs. \${totalSellPrice.toLocaleString()} added to \${khataName}'s Khata\`);
      } else {
        success("Multiple sale completed");
      }

      setMultiSellModalOpen(false);
      setPrintPromptData({ isOpen: true, billData: { id: billRef.id, ...billData }, profit: totalProfit });
      setMultiSelectedKhataId('');
      setMultiTotalProfit(0);
    
    } catch (err: any) {
      error(err.message || 'Error processing sale');
    }
  };`;

code = code.replace(oldMultiSell, newMultiSell);

// UI For single sell payment method
code = code.replace(
  /<Select\s*label="Payment Method \*"\s*value=\{singleSellModal\.paymentMethod\}\s*onChange=\{e => setSingleSellModal\(\{\.\.\.singleSellModal, paymentMethod: e\.target\.value\}\)\}\s*options=\{\[\{ value: 'Cash', label: 'Cash' \}, \{ value: 'Bank Transfer', label: 'Bank Transfer' \}\]\}\s*\/>/m,
  `
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
            <div className="grid grid-cols-3 gap-2">
              {['Cash', 'Bank Transfer', 'Udhar'].map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => {
                    setSingleSellModal({...singleSellModal, paymentMethod: method});
                    if (method !== 'Udhar') setSingleSelectedKhataId('');
                  }}
                  className={\`py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all \${
                    singleSellModal.paymentMethod === method
                      ? method === 'Cash'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : method === 'Bank Transfer'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }\`}
                >
                  {method === 'Cash' && '💵 '}
                  {method === 'Bank Transfer' && '🏦 '}
                  {method === 'Udhar' && '📋 '}
                  {method}
                </button>
              ))}
            </div>
            
            {singleSellModal.paymentMethod === 'Udhar' && (
              <div className="mt-3 p-4 bg-amber-50/50 border border-amber-200 rounded-xl">
                <label className="block text-xs font-semibold text-amber-800 mb-1.5 uppercase tracking-wide">Select Customer (Khata) *</label>
                {khataCustomers.length === 0 ? (
                  <div className="text-sm text-amber-700">
                    ⚠️ No customers in Khata. <a href="/khata" className="underline font-medium">Add a customer first</a>.
                  </div>
                ) : (
                  <select
                    value={singleSelectedKhataId}
                    onChange={(e) => setSingleSelectedKhataId(e.target.value)}
                    required
                    className="w-full border-2 border-amber-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  >
                    <option value="">-- Select Customer --</option>
                    {khataCustomers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.totalBalance > 0 ? \` (Owes: Rs. \${c.totalBalance.toLocaleString()})\` : ''}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
  `
);

// UI for multi sell payment method
code = code.replace(
  /<Select\s*className="mb-6"\s*label="Payment Method \*"\s*value=\{multiPaymentMethod\}\s*onChange=\{e => setMultiPaymentMethod\(e\.target\.value\)\}\s*options=\{\[\{ value: 'Cash', label: 'Cash' \}, \{ value: 'Bank Transfer', label: 'Bank Transfer' \}\]\}\s*\/>/m,
  `
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
          <div className="grid grid-cols-3 gap-2">
            {['Cash', 'Bank Transfer', 'Udhar'].map(method => (
              <button
                key={method}
                type="button"
                onClick={() => {
                  setMultiPaymentMethod(method);
                  if (method !== 'Udhar') setMultiSelectedKhataId('');
                }}
                className={\`py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all \${
                  multiPaymentMethod === method
                    ? method === 'Cash'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : method === 'Bank Transfer'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }\`}
              >
                {method === 'Cash' && '💵 '}
                {method === 'Bank Transfer' && '🏦 '}
                {method === 'Udhar' && '📋 '}
                {method}
              </button>
            ))}
          </div>
          
          {multiPaymentMethod === 'Udhar' && (
            <div className="mt-3 p-4 bg-amber-50/50 border border-amber-200 rounded-xl">
              <label className="block text-xs font-semibold text-amber-800 mb-1.5 uppercase tracking-wide">Select Customer (Khata) *</label>
              {khataCustomers.length === 0 ? (
                <div className="text-sm text-amber-700">
                  ⚠️ No customers in Khata. <a href="/khata" className="underline font-medium">Add a customer first</a>.
                </div>
              ) : (
                <select
                  value={multiSelectedKhataId}
                  onChange={(e) => setMultiSelectedKhataId(e.target.value)}
                  required
                  className="w-full border-2 border-amber-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                >
                  <option value="">-- Select Customer --</option>
                  {khataCustomers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.totalBalance > 0 ? \` (Owes: Rs. \${c.totalBalance.toLocaleString()})\` : ''}</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
  `
);

// Delete individual sell price input from multiItems map
code = code.replace(
  /<div>\s*<label className="text-xs text-slate-500 mb-1 block">Sell Price \*<\/label>\s*<input type="number" value=\{item\.sellPrice\}.*?\s*.*?\s*\{Number\(item\.sellPrice\) > 0 && \([\s\S]*?\}<\/div>\s*<\/div>\s*<div>/m,
  "<div>"
);


// Replace footer summary with Total Profit UI
code = code.replace(
  /<div className="bg-gradient-to-r from-primary-600 to-accent-cyan rounded-xl p-4 text-white mb-6 shadow-glow-sm">[\s\S]*?<\/div>/m,
  `
        <div className="bg-gradient-to-r from-primary-600 to-accent-cyan rounded-xl p-4 text-white mb-6 shadow-glow-sm">
          <div className="flex justify-between text-sm mb-2 pb-2 border-b border-white/20">
            <span>Total Base Cost (all mobiles):</span>
            <span className="opacity-90">Rs. {multiItems.reduce((s, i) => s + (i.basePrice || 0), 0).toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium">Total Profit Expected:</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/80">Rs.</span>
              <input
                type="number"
                min="0"
                value={multiTotalProfit || ''}
                onChange={(e) => setMultiTotalProfit(parseFloat(e.target.value) || 0)}
                placeholder="Profit"
                className="w-32 bg-white/20 border-white/30 text-white placeholder:text-white/50 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-white"
              />
            </div>
          </div>

          <div className="flex justify-between font-bold text-xl pt-2">
            <span>Total Final Sale Amount:</span>
            <span>Rs. {(multiItems.reduce((s, i) => s + (i.basePrice || 0), 0) + (multiTotalProfit || 0)).toLocaleString()}</span>
          </div>
        </div>
  `
);

fs.writeFileSync('src/pages/MobilesStockPage.tsx', code);
