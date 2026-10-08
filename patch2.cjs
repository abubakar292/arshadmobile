const fs = require('fs');

// QUICK SALE UI FIX
let qs = fs.readFileSync('src/pages/QuickSalePage.tsx', 'utf8');
qs = qs.replace(
  /<Select\s*label="Payment Method \*"\s*value=\{formData\.paymentMethod\}\s*onChange=\{e => setFormData\(\{\.\.\.formData, paymentMethod: e\.target\.value\}\)\}\s*options=\{\[\{ value: 'Cash', label: 'Cash' \}, \{ value: 'Bank Transfer', label: 'Bank Transfer' \}\]\}\s*\/>/m,
  `
          <div>
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
            
            {formData.paymentMethod === 'Udhar' && (
              <div className="mt-3 p-4 bg-amber-50/50 border border-amber-200 rounded-xl">
                <label className="block text-xs font-semibold text-amber-800 mb-1.5 uppercase tracking-wide">Select Customer (Khata) *</label>
                {khataCustomers.length === 0 ? (
                  <div className="text-sm text-amber-700">
                    ⚠️ No customers in Khata. <a href="/khata" className="underline font-medium">Add a customer first</a>.
                  </div>
                ) : (
                  <select
                    value={selectedKhataId}
                    onChange={(e) => setSelectedKhataId(e.target.value)}
                    required
                    className="w-full border-2 border-amber-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  >
                    <option value="">-- Select Customer --</option>
                    {khataCustomers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.totalBalance > 0 ? \` (Owes: Rs. \${c.totalBalance.toLocaleString()})\` : ''}</option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <span className="text-[10px]">💡</span> Sale amount will be added to this customer's Udhar balance
                </p>
              </div>
            )}
          </div>
  `
);
fs.writeFileSync('src/pages/QuickSalePage.tsx', qs);

// MOBILE SALES BADGE FIX
let ms = fs.readFileSync('src/pages/MobileSalesPage.tsx', 'utf8');
ms = ms.replace(
  /<Badge variant=\{s\.paymentMethod === 'Cash' \? 'success' : 'cyan'\}>/g,
  `<Badge variant={s.paymentMethod === 'Cash' ? 'success' : s.paymentMethod === 'Udhar' ? 'warning' : 'cyan'}>`
);
fs.writeFileSync('src/pages/MobileSalesPage.tsx', ms);

