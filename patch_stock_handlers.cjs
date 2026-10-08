const fs = require('fs');
let code = fs.readFileSync('src/pages/MobilesStockPage.tsx', 'utf8');

const sIdx = code.indexOf('const handleSingleSell = async');
const mIdx = code.indexOf('const openMultiSell = () =>');

if (sIdx !== -1 && mIdx !== -1) {
  const replacement = `const handleSingleSell = async (e: React.FormEvent) => {
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
  };

  `;
  code = code.substring(0, sIdx) + replacement + code.substring(mIdx);
} else {
  console.log('Could not find handleSingleSell');
}

const multiIdx = code.indexOf('const handleMultiSell = async () =>');
const scanIdx = code.indexOf('const handleScan = (imei: string) =>');

if (multiIdx !== -1 && scanIdx !== -1) {
  const replacement = `const handleMultiSell = async () => {
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
          sellPrice: item.basePrice + (totalProfit / validItems.length), // Distribute profit evenly for bill items
          profit: totalProfit / validItems.length
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
          sellPrice: item.sellPrice,
          profit: item.profit,
          paymentMethod: multiPaymentMethod,
          khataCustomerId: multiPaymentMethod === 'Udhar' ? multiSelectedKhataId : null,
          khataCustomerName: multiPaymentMethod === 'Udhar' ? khataCustomers.find(c => c.id === multiSelectedKhataId)?.name : null,
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
  };

  `;
  code = code.substring(0, multiIdx) + replacement + code.substring(scanIdx);
} else {
  console.log('Could not find handleMultiSell');
}

fs.writeFileSync('src/pages/MobilesStockPage.tsx', code);
