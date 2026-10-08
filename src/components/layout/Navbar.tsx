import { Bell, LogOut, User as UserIcon, Menu, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SHOP_CONFIG } from '../../config/shopConfig';

interface NavbarProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function Navbar({ onMenuClick, showMenuButton }: NavbarProps) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  
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

      
      {/* Hamburger (mobile only) */}
      {showMenuButton && onMenuClick && (
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-forest transition-colors lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Logo / Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-white p-0.5 border border-amber-500/20 shadow-sm flex items-center justify-center flex-shrink-0">
          <img src={SHOP_CONFIG.logoUrl} alt={SHOP_CONFIG.shortName} className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight truncate flex items-center gap-1.5">
            {SHOP_CONFIG.name}
            <span className="hidden sm:inline-block text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-200">
              {SHOP_CONFIG.shortName}
            </span>
          </span>
          <span className="text-[10px] text-gray-500 font-medium tracking-wider -mt-0.5 hidden xs:block truncate">
            {SHOP_CONFIG.subTitle}
          </span>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
                {/* Notification Bell */}
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
        </div>

        {/* User Avatar */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors border border-transparent"
          >
            <div className="w-7 h-7 rounded-full bg-forest flex items-center justify-center text-white text-xs font-bold overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
              ) : (
                user?.displayName?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-24 truncate">
              {user?.displayName || 'User'}
            </span>
            <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block" />
          </button>
          
          <AnimatePresence>
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-card border border-gray-100 z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-gray-100 sm:hidden">
                    <p className="text-sm font-semibold text-gray-700 truncate">{user?.displayName || 'Admin'}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={logout}
                      className="w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
