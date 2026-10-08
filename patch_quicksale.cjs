const fs = require('fs');
let code = fs.readFileSync('src/pages/QuickSalePage.tsx', 'utf8');

// 1. Add khata states and fetch
if (!code.includes('khataCustomers')) {
  code = code.replace(
    /const \[loading, setLoading\] = useState\(false\);/,
    `const [loading, setLoading] = useState(false);\n  const [khataCustomers, setKhataCustomers] = useState<any[]>([]);\n  const [selectedKhataId, setSelectedKhataId] = useState('');`
  );
  
  code = code.replace(
    /export default function QuickSalePage\(\) \{/,
    `export default function QuickSalePage() {\n  React.useEffect(() => {\n    const fetchKhataCustomers = async () => {\n      const snap = await getDocs(query(collection(db, 'khata'), import('firebase/firestore').then(m => m.orderBy('name')) as any));\n      setKhataCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));\n    };\n    fetchKhataCustomers();\n  }, []);`
  );
}

// Ensure orderBy and getDoc is imported
if (!code.includes('orderBy')) {
  code = code.replace(/import \{ collection, doc, serverTimestamp, writeBatch, getDocs, query \} from 'firebase\/firestore';/, `import { collection, doc, serverTimestamp, writeBatch, getDocs, query, orderBy, getDoc } from 'firebase/firestore';`);
  code = code.replace(/import\('firebase\/firestore'\)\.then\(m => m\.orderBy\('name'\)\) as any/, "orderBy('name')");
}

// 2. Update save logic
code = code.replace(/const handleSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?catch \(err: any\) \{/m, `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemName) {
      error("Item name is required");
      return;
    }
    const sellPrice = Number(formData.sellPrice);
    if (!sellPrice || sellPrice <= 0) {
      error("Enter valid selling price");
      return;
    }
    
    if (formData.paymentMethod === 'Udhar' && !selectedKhataId) {
      error("Please select a Khata customer for Udhar payment");
      return;
    }

    setLoading(true);
    try {
      const basePrice = Number(formData.basePrice) || 0;
      const profit = sellPrice - basePrice;

      const billRef = doc(collection(db, 'bills'));
      const billData = {
        billNumber: generateBillNumber(),
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        paymentMethod: formData.paymentMethod,
        khataCustomerId: formData.paymentMethod === 'Udhar' ? selectedKhataId : null,
        khataCustomerName: formData.paymentMethod === 'Udhar' ? khataCustomers.find(c => c.id === selectedKhataId)?.name : null,
        items: [{
          modelName: formData.itemName,
          company: formData.company,
          imei1: formData.imei1,
          imei2: formData.imei2,
          basePrice,
          sellPrice,
          isQuickSale: true
        }],
        totalBaseCost: basePrice,
        totalProfit: profit,
        totalSellAmount: sellPrice,
        date: new Date(),
        createdAt: serverTimestamp(),
        isQuickSale: true
      };

      const batch = writeBatch(db);
      batch.set(billRef, billData);

      if (formData.paymentMethod === 'Udhar' && selectedKhataId) {
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
            description: \`Quick sale - \${formData.itemName}\`,
            runningBalance: newBalance,
            date: new Date(),
            createdAt: serverTimestamp(),
            linkedSaleId: billRef.id
          });
        }
      }

      await batch.commit();

      if (formData.paymentMethod === 'Udhar') {
        const khataName = khataCustomers.find(c => c.id === selectedKhataId)?.name;
        success(\`Rs. \${sellPrice.toLocaleString()} added to \${khataName}'s Khata\`);
      } else {
        success("Quick sale recorded successfully");
      }

      setPrintPromptData({ isOpen: true, billData: { id: billRef.id, ...billData }, profit });
      
      setFormData({
        customerName: '', customerPhone: '', itemName: '', company: '',
        basePrice: '', sellPrice: '', imei1: '', imei2: '', paymentMethod: 'Cash'
      });
      setSelectedKhataId('');
    } catch (err: any) {`);


// 3. UI Patches: Payment method UI
const paymentUI = `            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
              <div className="grid grid-cols-3 gap-2">
                {['Cash', 'Bank Transfer', 'Udhar'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      setFormData({...formData, paymentMethod: method});
                      if (method !== 'Udhar') setSelectedKhataId('');
                    }}
                    className={\`py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all \${
                      formData.paymentMethod === method
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
              
              {formData.paymentMethod === 'Udhar' && (
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
                  <p className="text-xs text-amber-600 mt-1">
                    💡 Sale amount will be added to this customer's Khata as Udhar
                  </p>
                </div>
              )}
            </div>`;

code = code.replace(/<div className="md:col-span-2">[\s\S]*?<label className="block text-sm font-medium text-gray-700 mb-1">[\s\S]*?Payment Method \*[\s\S]*?<\/div>/m, paymentUI);

fs.writeFileSync('src/pages/QuickSalePage.tsx', code);
