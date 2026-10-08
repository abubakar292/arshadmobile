import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Store, User, LogOut } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { SHOP_CONFIG } from '../config/shopConfig';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  
  const [shopName, setShopName] = useState(SHOP_CONFIG.name);
  const [ownerName, setOwnerName] = useState('Admin');
  const [phone, setPhone] = useState(SHOP_CONFIG.phone);
  const [address, setAddress] = useState(SHOP_CONFIG.address);
  
  const handleSaveShopInfo = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate saving settings (could store in Firestore under a 'settings' collection later)
    addToast('success', 'Shop settings saved successfully.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* SHOP INFO */}
        <div className="md:col-span-2 space-y-6">
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
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-forest resize-none text-gray-900"
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
    </div>
  );
}
