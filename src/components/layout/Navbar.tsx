import { Bell, LogOut, User as UserIcon, Menu, ChevronDown, Download, Smartphone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SHOP_CONFIG } from '../../config/shopConfig';

interface NavbarProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  onInstallClick?: () => void;
}

export function Navbar({ onMenuClick, showMenuButton, onInstallClick }: NavbarProps) {
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
    <header className="bg-white border-b border-gray-100 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 flex-shrink-0 z-30 pt-[env(safe-area-inset-top,0px)] min-h-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:min-h-[calc(4rem+env(safe-area-inset-top,0px))]">
      {/* Hamburger (mobile only) */}
      {showMenuButton && onMenuClick && (
        <button
          onClick={onMenuClick}
          className="p-2 -ml-1 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-forest transition-colors lg:hidden active:scale-95"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Logo / Title */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white p-0.5 border border-amber-500/25 shadow-xs flex items-center justify-center shrink-0">
          <img src={SHOP_CONFIG.logoUrl} alt={SHOP_CONFIG.shortName} className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-extrabold text-xs sm:text-base text-gray-900 tracking-tight truncate flex items-center gap-1">
            {SHOP_CONFIG.name}
            <span className="text-[10px] bg-amber-100 text-amber-900 font-black px-1.5 py-0.2 rounded border border-amber-200 shrink-0">
              {SHOP_CONFIG.shortName}
            </span>
          </span>
          <span className="text-[10px] text-gray-400 font-medium tracking-wide -mt-0.5 truncate hidden sm:block">
            {SHOP_CONFIG.subTitle}
          </span>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Install App Button */}
        {onInstallClick && (
          <button
            onClick={onInstallClick}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 text-xs font-bold border border-amber-500/25 transition-all active:scale-95 shadow-2xs"
            title="Install AMZ App on Phone"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden xs:inline">Install App</span>
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-forest transition-colors relative"
            aria-label="Notifications"
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
                  className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-card border border-gray-100 z-50 overflow-hidden"
                >
                  <div className="p-3 border-b border-gray-100 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 flex items-center justify-between">
                    <span>Notifications</span>
                    {lowStockMobiles.length > 0 && (
                      <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {lowStockMobiles.length} Low Stock
                      </span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {lowStockMobiles.length > 0 ? (
                      lowStockMobiles.map(m => (
                        <div key={m.id} className="p-3 hover:bg-gray-50 transition-colors">
                          <p className="text-sm font-semibold text-gray-800">{m.company} {m.modelName}</p>
                          <p className="text-xs text-red-500 font-medium mt-0.5">Low Stock: Only {m.quantity} left in shop!</p>
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
            className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg hover:bg-gray-100 transition-colors border border-transparent"
          >
            <div className="w-7 h-7 rounded-full bg-forest flex items-center justify-center text-white text-xs font-bold overflow-hidden shadow-2xs">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
              ) : (
                user?.displayName?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <span className="hidden md:block text-xs font-semibold text-gray-700 max-w-24 truncate">
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
                  className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-card border border-gray-100 z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900 truncate">{user?.displayName || 'Admin'}</p>
                    <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    {onInstallClick && (
                      <button
                        onClick={() => { setShowDropdown(false); onInstallClick(); }}
                        className="w-full px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                        Install App on Phone
                      </button>
                    )}
                    <button
                      onClick={logout}
                      className="w-full px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-gray-50"
                    >
                      <LogOut className="w-3.5 h-3.5" />
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
