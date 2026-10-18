import { Bell, LogOut, Menu, ChevronDown, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { isDocForShop } from '../../utils/multiTenantService';
import { ShopBrandBadge } from '../../utils/brandIdentity';

interface NavbarProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function Navbar({ onMenuClick, showMenuButton }: NavbarProps) {
  const navigate = useNavigate();
  const { user, logout, shopProfile, currentShopId } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lowStockMobiles, setLowStockMobiles] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      setLowStockMobiles([]);
      return;
    }
    // Listen for low stock mobiles across shop inventory
    const q = collection(db, 'mobiles');
    const unsub = onSnapshot(q, (snap) => {
      const lowStock = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((m: any) => 
          isDocForShop(m, currentShopId) && 
          (Number(m.quantity) || 0) <= 2 && 
          (Number(m.quantity) || 0) > 0
        );
      setLowStockMobiles(lowStock);
    });
    return unsub;
  }, [user, currentShopId]);

  return (
    <header className="bg-white border-b border-gray-100 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 flex-shrink-0 z-30 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-2 min-h-[calc(3.75rem+env(safe-area-inset-top,0px))] sm:min-h-[calc(4.25rem+env(safe-area-inset-top,0px))]">
      {/* Hamburger (mobile only) */}
      {showMenuButton && onMenuClick && (
        <button
          onClick={onMenuClick}
          className="p-1.5 -ml-1 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors lg:hidden active:scale-95 shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 stroke-[2.2]" />
        </button>
      )}

      {/* Shop Brand Monogram & Name */}
      <div 
        onClick={() => navigate('/settings')}
        className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 cursor-pointer group"
        title="Shop Settings"
      >
        {shopProfile.logoUrl ? (
          <img 
            src={shopProfile.logoUrl} 
            alt={shopProfile.shortName} 
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-contain border border-amber-500/20 p-0.5"
          />
        ) : (
          <ShopBrandBadge 
            name={shopProfile.shopName} 
            shortName={shopProfile.shortName} 
            size="md" 
            className="group-hover:scale-105 transition-transform"
          />
        )}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-extrabold text-xs sm:text-base text-gray-900 tracking-tight truncate group-hover:text-amber-600 transition-colors">
              {shopProfile.shopName}
            </span>
            <span className="text-[10px] bg-amber-50 text-amber-900 font-extrabold px-1.5 py-0.2 rounded border border-amber-200/80 shrink-0">
              {shopProfile.shortName}
            </span>
          </div>
          <span className="text-[11px] text-gray-400 font-medium tracking-wide truncate hidden sm:block">
            {shopProfile.subTitle || shopProfile.address || 'Mobile Management System'}
          </span>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 sm:p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-amber-600 transition-colors relative active:scale-95"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {lowStockMobiles.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 text-left"
                >
                  <h4 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-2 mb-2 flex items-center justify-between">
                    <span>Low Stock Alerts</span>
                    <span className="text-[10px] text-gray-500">{lowStockMobiles.length} items</span>
                  </h4>
                  {lowStockMobiles.length === 0 ? (
                    <p className="text-xs text-gray-500 py-3 text-center">All mobile stocks are healthy</p>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {lowStockMobiles.map((m) => (
                        <div key={m.id} className="flex items-center justify-between text-xs p-2 bg-rose-50/60 rounded-lg border border-rose-100">
                          <div>
                            <p className="font-semibold text-gray-900">{m.brand || m.company} {m.modelName || m.model}</p>
                            <p className="text-[10px] text-gray-500">Remaining stock: {m.quantity}</p>
                          </div>
                          <button 
                            onClick={() => { setShowNotifications(false); navigate('/purchase-mobile'); }}
                            className="text-[10px] bg-rose-600 text-white font-bold px-2 py-1 rounded hover:bg-rose-700"
                          >
                            Restock
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User Account / Shop Profile Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-lg hover:bg-gray-100 transition-colors active:scale-95"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full bg-forest text-gold flex items-center justify-center font-black text-xs uppercase shadow-xs border border-amber-500/30">
              {shopProfile.shortName.slice(0, 2)}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          <AnimatePresence>
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 text-left"
                >
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900 truncate">{shopProfile.shopName}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user?.email || 'Logged In'}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => { setShowDropdown(false); navigate('/settings'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-amber-50 hover:text-amber-800 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-500" />
                      <span>Shop Settings</span>
                    </button>
                    <button
                      onClick={() => { setShowDropdown(false); logout(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
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
