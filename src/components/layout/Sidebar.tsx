import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Smartphone, TrendingUp, Receipt, 
  BookOpen, Package, Settings, X 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ShopBrandBadge } from '../../utils/brandIdentity';

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
    title: 'Sales & Invoices',
    items: [
      { path: '/mobile-sales', icon: TrendingUp, label: 'Mobile Sales Record' },
      { path: '/bills-history', icon: Receipt, label: 'Bills History' },
    ]
  },
  {
    title: 'Khata & Ledgers',
    items: [
      { path: '/khata', icon: BookOpen, label: 'Khata / Ledger' },
    ]
  },
  {
    title: 'Valuation & Audit',
    items: [
      { path: '/inventory-valuation', icon: Package, label: 'Inventory Valuation' },
    ]
  },
  {
    title: 'Preferences',
    items: [
      { path: '/settings', icon: Settings, label: 'Settings & Cloud Backup' },
    ]
  },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const location = useLocation();
  const { shopProfile } = useAuth();

  return (
    <aside className="h-full bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* Header with Dynamic Shop Brand Badge */}
      <div className="pt-[env(safe-area-inset-top,0px)] min-h-[calc(4rem+env(safe-area-inset-top,0px))] flex items-center justify-between px-4 sm:px-5 border-b border-white/10 shrink-0 bg-slate-900/90">
        <div className="flex items-center gap-3 min-w-0">
          <ShopBrandBadge 
            name={shopProfile.shopName} 
            shortName={shopProfile.shortName} 
            size="sm" 
          />
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-white text-sm tracking-tight truncate leading-tight">
              {shopProfile.shopName}
            </span>
            <span className="text-[10px] text-amber-400 font-bold tracking-wider uppercase truncate">
              {shopProfile.subTitle || 'Mobile Center'}
            </span>
          </div>
        </div>

        {/* Mobile Close X button */}
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="lg:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="px-3.5 space-y-5">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.title && (
                <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-white/40 uppercase">
                  {section.title}
                </div>
              )}
              
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                      isActive 
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-obsidian-darker shadow-md font-extrabold ring-1 ring-amber-400/40' 
                        : 'text-slate-300 hover:text-white hover:bg-white/5 font-semibold'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 stroke-[2.2]" />
                    <span className="truncate">{item.label}</span>
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
