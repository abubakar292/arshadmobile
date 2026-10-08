const fs = require('fs');
let code = fs.readFileSync('src/pages/MobilesStockPage.tsx', 'utf8');

// 1. Add khata states
if (!code.includes('khataCustomers')) {
  code = code.replace(
    /const \[showAddModal, setShowAddModal\] = useState\(false\);/,
    `const [showAddModal, setShowAddModal] = useState(false);\n  const [khataCustomers, setKhataCustomers] = useState<any[]>([]);\n  const [selectedKhataId, setSelectedKhataId] = useState('');\n  const [multiSelectedKhataId, setMultiSelectedKhataId] = useState('');\n  const [totalProfit, setTotalProfit] = useState<number>(0);`
  );
  
  // Fetch Khata Customers on mount
  code = code.replace(
    /useEffect\(\(\) => \{\n    fetchMobiles\(\);\n  \}, \[\]\);/,
    `useEffect(() => {\n    fetchMobiles();\n    fetchKhataCustomers();\n  }, []);\n\n  const fetchKhataCustomers = async () => {\n    const snap = await getDocs(query(collection(db, 'khata'), orderBy('name')));\n    setKhataCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));\n  };`
  );
}

// Ensure orderBy is imported
if (!code.includes('orderBy')) {
  code = code.replace(/import \{ collection, query, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, increment, writeBatch, where \} from 'firebase\/firestore';/, `import { collection, query, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, increment, writeBatch, where, orderBy, getDoc } from 'firebase/firestore';`);
}

// 2. MultiItem interface updates
code = code.replace(
  /interface MultiItem \{\n  id: string;\n  mobileId: string;\n  modelName: string;\n  basePrice: number;\n  sellPrice: string | number;\n  imei1: string;\n  imei2: string;\n  ramRom: string;\n  company: string;\n\}/g,
  `interface MultiItem {\n  id: string;\n  mobileId: string;\n  modelName: string;\n  basePrice: number;\n  imei1: string;\n  imei2: string;\n  ramRom: string;\n  company: string;\n}`
);

// 3. Remove sellPrice from multiItem initialization
code = code.replace(/sellPrice: '', /g, '');
code = code.replace(/sellPrice: mobile\?\.basePrice \|\| ''/g, '');


// 4. Update multiSell save logic
code = code.replace(/const handleMultiSellSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?catch \(err: any\) \{/m, `const handleMultiSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!multiCustomer) {
      error("Customer name is required");
      return;
    }
    const validItems = multiItems.filter(i => i.mobileId && i.imei1);
    if (validItems.length === 0) {
      error("Add at least one valid item");
      return;
    }
    if (multiPaymentMethod === 'Udhar' && !multiSelectedKhataId) {
      error("Please select a Khata customer for Udhar payment");
      return;
    }

    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      const totalBaseCost = validItems.reduce((sum, i) => sum + (i.basePrice || 0), 0);
      const totalSellAmount = totalBaseCost + (Number(totalProfit) || 0);
      
      const billRef = doc(collection(db, 'bills'));
      const billData = {
        billNumber: generateBillNumber(),
        customerName: multiCustomer,
        customerPhone: multiPhone,
        paymentMethod: multiPaymentMethod,
        khataCustomerId: multiPaymentMethod === 'Udhar' ? multiSelectedKhataId : null,
        khataCustomerName: multiPaymentMethod === 'Udhar' ? khataCustomers.find(c => c.id === multiSelectedKhataId)?.name : null,
        items: validItems.map(item => ({
          mobileId: item.mobileId,
          modelName: item.modelName,
          company: item.company,
          imei1: item.imei1,
          imei2: item.imei2,
          basePrice: item.basePrice,
          ramRom: item.ramRom
        })),
        totalBaseCost,
        totalProfit: Number(totalProfit) || 0,
        totalSellAmount,
        date: new Date(),
        createdAt: serverTimestamp(),
      };
      batch.set(billRef, billData);

      // Decrement quantities
      validItems.forEach(item => {
        const mobRef = doc(db, 'mobiles', item.mobileId);
        batch.update(mobRef, { quantity: increment(-1) });
      });

      // Handle Udhar
      if (multiPaymentMethod === 'Udhar' && multiSelectedKhataId) {
        const khataRef = doc(db, 'khata', multiSelectedKhataId);
        const khataSnap = await getDoc(khataRef);
        if (khataSnap.exists()) {
          const currentBalance = khataSnap.data().totalBalance || 0;
          const newBalance = currentBalance + totalSellAmount;
          
          batch.update(khataRef, { totalBalance: newBalance });
          
          const txnRef = doc(collection(db, 'khataTransactions'));
          batch.set(txnRef, {
            khataId: multiSelectedKhataId,
            customerName: khataSnap.data().name,
            transactionType: 'udhar',
            amount: totalSellAmount,
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
        success(\`Rs. \${totalSellAmount.toLocaleString()} added to \${khataName}'s Khata\`);
      }
      
      setPrintPromptData({ isOpen: true, billData: { id: billRef.id, ...billData }, profit: Number(totalProfit) || 0 });
      setShowMultiModal(false);
      fetchMobiles();
      setMultiCustomer('');
      setMultiPhone('');
      setTotalProfit(0);
      setMultiSelectedKhataId('');
      setMultiItems([{ id: '1', mobileId: '', modelName: '', basePrice: 0, imei1: '', imei2: '', ramRom: '', company: '' }]);
    } catch (err: any) {`);


// 5. Update Single Sell save logic
code = code.replace(/const handleSingleSellSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?catch \(err: any\) \{/m, `const handleSingleSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sellPrice = Number(singleSellModal.sellPrice);
    if (!sellPrice || sellPrice <= 0) {
      error("Enter valid selling price");
      return;
    }
    if (singleSellModal.paymentMethod === 'Udhar' && !selectedKhataId) {
      error("Please select a Khata customer for Udhar payment");
      return;
    }

    setLoading(true);
    try {
      const basePrice = singleSellModal.basePrice;
      const profit = sellPrice - basePrice;
      
      const billRef = doc(collection(db, 'bills'));
      const billData = {
        billNumber: generateBillNumber(),
        customerName: singleSellModal.customerName,
        customerPhone: singleSellModal.customerPhone,
        paymentMethod: singleSellModal.paymentMethod,
        khataCustomerId: singleSellModal.paymentMethod === 'Udhar' ? selectedKhataId : null,
        khataCustomerName: singleSellModal.paymentMethod === 'Udhar' ? khataCustomers.find(c => c.id === selectedKhataId)?.name : null,
        items: [{
          mobileId: singleSellModal.mobileId,
          modelName: singleSellModal.modelName,
          company: singleSellModal.company,
          imei1: singleSellModal.imei1,
          imei2: singleSellModal.imei2,
          basePrice,
          sellPrice,
          ramRom: singleSellModal.ramRom
        }],
        totalBaseCost: basePrice,
        totalProfit: profit,
        totalSellAmount: sellPrice,
        date: new Date(),
        createdAt: serverTimestamp(),
      };
      
      const batch = writeBatch(db);
      batch.set(billRef, billData);
      
      const mobRef = doc(db, 'mobiles', singleSellModal.mobileId);
      batch.update(mobRef, { quantity: increment(-1) });

      // Handle Udhar
      if (singleSellModal.paymentMethod === 'Udhar' && selectedKhataId) {
        const khataRef = doc(db, 'khata', selectedKhataId);
        const khataSnap = await getDoc(khataRef);
        if (khataSnap.exists()) {
          const currentBalance = khataSnap.data().totalBalance || 0;
          const newBalance = currentBalance + sellPrice;
          
          batch.update(khataRef, { totalBalance: newBalance });
          
          const txnRef = doc(collection(db, 'khataTransactions'));
          batch.set(txnRef, {
            khataId: selectedKhataId,
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
        const khataName = khataCustomers.find(c => c.id === selectedKhataId)?.name;
        success(\`Rs. \${sellPrice.toLocaleString()} added to \${khataName}'s Khata\`);
      }

      setPrintPromptData({ isOpen: true, billData: { id: billRef.id, ...billData }, profit });
      setSingleSellModal({ isOpen: false, mobileId: '', modelName: '', basePrice: 0, sellPrice: '', imei1: '', imei2: '', ramRom: '', company: '', customerName: '', customerPhone: '', paymentMethod: 'Cash' });
      setSelectedKhataId('');
      fetchMobiles();
    } catch (err: any) {`);


// UI Patches: Single Sell payment method UI
const singleSellPaymentUI = `              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Cash', 'Bank Transfer', 'Udhar'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => {
                        setSingleSellModal({...singleSellModal, paymentMethod: method});
                        if (method !== 'Udhar') setSelectedKhataId('');
                      }}
                      className={\`py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all \${
                        singleSellModal.paymentMethod === method
                          ? method === 'Cash'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : method === 'Bank Transfer'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
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
                  <div className="mt-3">
                    <label className="block text-xs text-gray-500 mb-1">Select Customer (Khata) *</label>
                    {khataCustomers.length === 0 ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                        ⚠️ No customers in Khata. <a href="/khata" className="underline font-medium">Add a customer first</a>.
                      </div>
                    ) : (
                      <select
                        value={selectedKhataId}
                        onChange={(e) => setSelectedKhataId(e.target.value)}
                        required
                        className="w-full border border-amber-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                      >
                        <option value="">-- Select Customer --</option>
                        {khataCustomers.map(c => (
                          <option key={c.id} value={c.id}>{c.name} {c.totalBalance > 0 ? \` (Owes: Rs. \${c.totalBalance.toLocaleString()})\` : ''}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>`;

code = code.replace(/<div className="col-span-2">[\s\S]*?<label className="block text-sm font-medium text-gray-700 mb-1">Payment Method<\/label>[\s\S]*?<\/Select>[\s\S]*?<\/div>/m, singleSellPaymentUI);


// Multi sell UI updates
const multiSellPaymentUI = `              <div className="mb-4">
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
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
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
                  <div className="mt-3">
                    <label className="block text-xs text-gray-500 mb-1">Select Customer (Khata) *</label>
                    {khataCustomers.length === 0 ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                        ⚠️ No customers in Khata. <a href="/khata" className="underline font-medium">Add a customer first</a>.
                      </div>
                    ) : (
                      <select
                        value={multiSelectedKhataId}
                        onChange={(e) => setMultiSelectedKhataId(e.target.value)}
                        required
                        className="w-full border border-amber-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                      >
                        <option value="">-- Select Customer --</option>
                        {khataCustomers.map(c => (
                          <option key={c.id} value={c.id}>{c.name} {c.totalBalance > 0 ? \` (Owes: Rs. \${c.totalBalance.toLocaleString()})\` : ''}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>`;

code = code.replace(/<div className="col-span-2">[\s\S]*?<label className="block text-sm font-medium text-gray-700 mb-1">Payment Method<\/label>[\s\S]*?<\/Select>[\s\S]*?<\/div>/m, multiSellPaymentUI);


// Remove individual sellPrice input from multi modal
code = code.replace(/<div>[\s\S]*?<label className="block text-xs text-gray-500 mb-1">Sell Price \*<\/label>[\s\S]*?<input type="number" value=\{item\.sellPrice\}[\s\S]*?<\/div>/m, '');

// Total Profit UI for Multi Sell
const multiTotalProfitUI = `            <div className="bg-surface-2 rounded-xl p-4 mb-4 border border-forest/10">
              <h4 className="font-semibold text-sm text-gray-700 mb-3">Pricing Summary</h4>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Total Base Cost (all mobiles):</span>
                <span className="font-medium">Rs. {multiItems.reduce((sum, i) => sum + (i.basePrice || 0), 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <label className="text-sm text-gray-500 flex-shrink-0">Total Profit:</label>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    value={totalProfit || ''}
                    onChange={(e) => setTotalProfit(parseFloat(e.target.value) || 0)}
                    placeholder="Enter total profit earned"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-forest focus:border-forest"
                  />
                </div>
              </div>
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Total Sale Amount:</span>
                  <span className="text-xl font-bold text-forest">
                    Rs. {(multiItems.reduce((sum, i) => sum + (i.basePrice || 0), 0) + (Number(totalProfit) || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>`;

// Replace the old summary block
code = code.replace(/<div className="flex justify-between items-center p-3 bg-forest\/5 rounded-lg border border-forest\/10">[\s\S]*?<\/div>[\s\S]*?<\/div>/m, multiTotalProfitUI);


fs.writeFileSync('src/pages/MobilesStockPage.tsx', code);
