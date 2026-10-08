import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Smartphone, Zap, BookOpen, Menu, Sparkles } from 'lucide-react';

interface BottomNavProps {
  onOpenMenu: () => void;
  onOpenInstallGuide: () => void;
}

export function BottomNav({ onOpenMenu, onOpenInstallGuide }: BottomNavProps) {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { path: '/mobiles-stock', icon: Smartphone, label: 'Stock' },
    { path: '/quick-sale', icon: Zap, label: 'Sale', highlight: true },
    { path: '/khata', icon: BookOpen, label: 'Khata' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-2 py-1 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);

          if (item.highlight) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center -mt-5 relative group"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                  isActive 
                    ? 'bg-gradient-to-tr from-amber-500 to-amber-400 text-obsidian-dark ring-4 ring-amber-100'
                    : 'bg-obsidian-dark text-gold ring-4 ring-white'
                }`}>
                  <Zap className="w-6 h-6 fill-current" />
                </div>
                <span className={`text-[10px] mt-1 font-extrabold ${isActive ? 'text-amber-600' : 'text-gray-600'}`}>
                  {item.label}
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 active:scale-95 ${
                isActive 
                  ? 'text-amber-600 font-bold' 
                  : 'text-gray-500 hover:text-gray-900 font-medium'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] mt-1 tracking-tight">
                {item.label}
              </span>
            </NavLink>
          );
        })}

        {/* More / Menu Drawer Toggle */}
        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-gray-500 hover:text-gray-900 transition-all duration-150 active:scale-95"
          aria-label="More navigation items"
        >
          <Menu className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] mt-1 tracking-tight font-medium">
            Menu
          </span>
        </button>
      </div>
    </div>
  );
}
