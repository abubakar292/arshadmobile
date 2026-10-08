const fs = require('fs');
const file = 'src/components/layout/Navbar.tsx';
let code = fs.readFileSync(file, 'utf8');

if (code.includes('Notification Bell')) {
  // we'll replace the notification bell with a functional one
  code = code.replace(
    "import { useState } from 'react';",
    "import { useState, useEffect } from 'react';\nimport { collection, query, where, onSnapshot } from 'firebase/firestore';\nimport { db } from '../../lib/firebase';"
  );
  
  const replacement = `
  const [showNotifications, setShowNotifications] = useState(false);
  const [lowStockMobiles, setLowStockMobiles] = useState<any[]>([]);

  useEffect(() => {
    // Listen for low stock (quantity <= 2)
    const q = query(collection(db, 'mobiles'), where('quantity', '<=', 2));
    const unsub = onSnapshot(q, (snap) => {
      setLowStockMobiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 sm:px-6 gap-4 flex-shrink-0 z-30">
`;

  code = code.replace(
    "return (\n    <header className=\"h-16 bg-white border-b border-gray-100 flex items-center px-4 sm:px-6 gap-4 flex-shrink-0 z-30\">",
    replacement
  );

  const navBell = `        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-forest transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {lowStockMobiles.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse-slow" />
            )}
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-card border border-gray-100 z-50 overflow-hidden"
                >
                  <div className="p-3 border-b border-gray-100 font-semibold text-sm text-gray-700 bg-gray-50">
                    Notifications
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {lowStockMobiles.length > 0 ? (
                      lowStockMobiles.map(m => (
                        <div key={m.id} className="p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <p className="text-sm font-medium text-gray-800">{m.company} {m.modelName}</p>
                          <p className="text-xs text-red-500 font-medium mt-0.5">Low Stock: Only {m.quantity} left!</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No new notifications
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>`;

  code = code.replace(
    /\{\/\* Notification Bell \*\/\}[\s\S]*?<\/button>/,
    navBell
  );
  
  fs.writeFileSync(file, code);
}

