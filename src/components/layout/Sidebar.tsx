import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, ShoppingCart, Smartphone, TrendingUp, Zap, Receipt, 
  CreditCard, BookOpen, Package, Settings
} from 'lucide-react';
import { SHOP_CONFIG } from '../../config/shopConfig';

const sections = [
  {
    title: null,
    items: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    title: 'Inventory',
    items: [
      { path: '/purchase-mobile', icon: ShoppingCart, label: 'Purchase Mobile' },
      { path: '/mobiles-stock', icon: Smartphone, label: 'Mobiles in Stock' },
    ]
  },
  {
    title: 'Sales',
    items: [
      { path: '/mobile-sales', icon: TrendingUp, label: 'Mobile Sales Record' },
      { path: '/quick-sale', icon: Zap, label: 'Quick Sale' },
      { path: '/bills-history', icon: Receipt, label: 'Bills History' },
    ]
  },
  {
    title: 'Finance',
    items: [
      { path: '/expenses', icon: CreditCard, label: 'Expenses' },
      { path: '/khata', icon: BookOpen, label: 'Khata / Ledger' },
    ]
  },
  {
    title: 'Reports',
    items: [
      { path: '/inventory-valuation', icon: Package, label: 'Inventory Valuation' },
    ]
  },
  {
    title: null,
    items: [
      { path: '/settings', icon: Settings, label: 'Settings' },
    ]
  },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className="h-full bg-forest text-white flex flex-col overflow-hidden">
      <div className="h-16 flex items-center px-4 sm:px-5 border-b border-white/10 shrink-0 bg-obsidian-dark">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white p-0.5 border border-amber-500/30 flex items-center justify-center shadow-md">
            <img src={SHOP_CONFIG.logoUrl} alt={SHOP_CONFIG.shortName} className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-white text-sm tracking-tight truncate leading-tight">
              {SHOP_CONFIG.name}
            </span>
            <span className="text-[10px] text-gold font-bold tracking-wider uppercase">
              {SHOP_CONFIG.subTitle}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="px-4 space-y-6">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.title && (
                <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-white/45 uppercase">
                  {section.title}
                </div>
              )}
              
              {section.items.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative group
                      ${isActive 
                        ? 'bg-gradient-to-r from-amber-500/20 to-white/10 text-white font-semibold border border-amber-500/30 shadow-sm' 
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute left-0 top-2 bottom-2 w-1.5 bg-gold rounded-r-full shadow-[0_0_12px_rgba(245,158,11,0.8)]"
                      />
                    )}
                    <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-gold' : 'text-white/80 group-hover:text-white'}`} />
                    <span className="text-sm font-medium whitespace-nowrap">
                      {item.label}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
