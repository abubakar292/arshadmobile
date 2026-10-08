import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Store, User, LogOut, Smartphone, Download, ShieldCheck } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { SHOP_CONFIG } from '../config/shopConfig';
import { InstallPromptModal } from '../components/InstallPromptModal';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const [showInstallModal, setShowInstallModal] = useState(false);
  
  const [shopName, setShopName] = useState(SHOP_CONFIG.name);
  const [ownerName, setOwnerName] = useState('Admin');
  const [phone, setPhone] = useState(SHOP_CONFIG.phone);
  const [address, setAddress] = useState(SHOP_CONFIG.address);
  
  const handleSaveShopInfo = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('success', 'Shop settings saved successfully.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage shop profile, preferences, and phone app setup</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* SHOP INFO */}
        <div className="md:col-span-2 space-y-6">
          {/* Mobile Install App Card */}
          <div className="bg-gradient-to-r from-obsidian-dark to-surface text-white p-5 rounded-2xl border border-amber-500/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-gold flex items-center justify-center shrink-0 border border-amber-500/30">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  Install AMZ on Phone
                  <span className="text-[10px] bg-amber-500 text-obsidian-dark font-black px-1.5 py-0.5 rounded uppercase">
                    PWA App
                  </span>
                </h3>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  Install on Android or iPhone like a native app (no Play Store / App Store needed)
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowInstallModal(true)}
              className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-obsidian-dark font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 shrink-0 flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              How to Install
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <Store className="w-5 h-5 text-forest" />
              <h2 className="font-bold text-gray-900">Shop Information</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSaveShopInfo} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Shop Name" required value={shopName} onChange={e => setShopName(e.target.value)} />
                  <Input label="Owner Name" value={ownerName} onChange={e => setOwnerName(e.target.value)} />
                </div>
                <Input label="Phone Number" required value={phone} onChange={e => setPhone(e.target.value)} />
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Address</label>
                  <textarea
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-forest resize-none text-gray-900 text-sm"
                  />
                </div>
                <Button type="submit">Save Changes</Button>
              </form>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">App Preferences</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Currency Symbol" value="Rs." readOnly />
                <Input label="Low Stock Alert Threshold" type="number" value="3" readOnly />
              </div>
            </div>
          </div>
        </div>

        {/* ACCOUNT */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <User className="w-5 h-5 text-forest" />
              <h2 className="font-bold text-gray-900">Account</h2>
            </div>
            <div className="p-6 space-y-4">
              <Input label="Email" value={user?.email || ''} readOnly className="bg-gray-50 text-gray-500" />
              <Input label="Display Name" value={user?.displayName || 'Admin'} readOnly className="bg-gray-50 text-gray-500" />
              
              <div className="pt-4 border-t border-gray-100">
                <Button onClick={logout} variant="danger" className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-400">
            <p className="font-bold text-gray-700">{SHOP_CONFIG.name}</p>
            <p className="text-xs text-gold font-bold tracking-wider">{SHOP_CONFIG.subTitle}</p>
            <p className="text-[11px] text-gray-400 mt-1">Version 2.0.0 (AMZ Enterprise)</p>
          </div>
        </div>

      </div>

      <InstallPromptModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
}
