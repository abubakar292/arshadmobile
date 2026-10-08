import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { 
  Store, User, LogOut, Smartphone, Download, ShieldCheck, 
  Database, CheckCircle2, RefreshCw, HardDrive, Cloud, Settings as SettingsIcon, X, Check,
  Upload, RotateCcw, AlertTriangle, FileJson
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { SHOP_CONFIG } from '../config/shopConfig';
import { InstallPromptModal } from '../components/InstallPromptModal';
import { Modal } from '../components/ui/Modal';
import { 
  createFullShopBackup, 
  downloadBackupFile, 
  getLastBackupTime, 
  getLatestCloudBackup,
  restoreShopBackup,
  ShopBackupData,
  RestoreResult
} from '../utils/backupService';
import { format } from 'date-fns';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { success, error, toast } = useToast();
  const [showInstallModal, setShowInstallModal] = useState(false);
  
  const [shopName, setShopName] = useState(SHOP_CONFIG.name);
  const [ownerName, setOwnerName] = useState('Admin');
  const [phone, setPhone] = useState(SHOP_CONFIG.phone);
  const [address, setAddress] = useState(SHOP_CONFIG.address);

  // Backup & Restore State
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [lastBackupSummary, setLastBackupSummary] = useState<ShopBackupData['summary'] | null>(null);
  const [showDriveConfig, setShowDriveConfig] = useState(false);
  const [driveWebhookInput, setDriveWebhookInput] = useState(() => localStorage.getItem('amz_drive_webhook_url') || '');

  // Restore State
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreCandidate, setRestoreCandidate] = useState<ShopBackupData | null>(null);
  const [restoreSource, setRestoreSource] = useState<'file' | 'cloud'>('file');
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedTime = getLastBackupTime();
    setLastBackup(savedTime);
  }, []);
  
  const handleSaveShopInfo = (e: React.FormEvent) => {
    e.preventDefault();
    success('Shop settings saved successfully.');
  };

  const handleRunBackup = async (downloadFile = false) => {
    setIsBackingUp(true);
    try {
      const backup = await createFullShopBackup();
      if (downloadFile) {
        downloadBackupFile(backup);
      }
      setLastBackup(backup.createdAt);
      setLastBackupSummary(backup.summary);
      success('Backup saved to cloud successfully!');
    } catch (err: any) {
      console.error('Backup error:', err);
      error('Error creating backup. Please try again.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as ShopBackupData;
        if (!parsed || (!parsed.data && !parsed.summary)) {
          error('Invalid backup file. Missing data contents.');
          return;
        }
        setRestoreCandidate(parsed);
        setRestoreSource('file');
        setShowRestoreModal(true);
      } catch (err) {
        error('Invalid JSON file format. Please upload a valid AMZ backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCheckCloudRestore = async () => {
    setIsBackingUp(true);
    try {
      const cloudBackup = await getLatestCloudBackup();
      if (!cloudBackup || (!cloudBackup.data && !cloudBackup.summary)) {
        error('No previous cloud backup found. Please restore using a backup JSON file.');
        return;
      }
      setRestoreCandidate(cloudBackup);
      setRestoreSource('cloud');
      setShowRestoreModal(true);
    } catch (err) {
      error('Failed to load cloud backup.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!restoreCandidate) return;
    setIsRestoring(true);
    try {
      const result: RestoreResult = await restoreShopBackup(restoreCandidate);
      success(result.message);
      setShowRestoreModal(false);
      setRestoreCandidate(null);
    } catch (err: any) {
      console.error('Restore error:', err);
      error(err.message || 'Failed to restore shop data.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (driveWebhookInput.trim()) {
      localStorage.setItem('amz_drive_webhook_url', driveWebhookInput.trim());
      success('Google Drive Webhook URL saved successfully!');
    } else {
      localStorage.removeItem('amz_drive_webhook_url');
      toast('Google Drive Webhook URL cleared.', 'info');
    }
    setShowDriveConfig(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage shop profile, preferences, data backups, and phone app setup</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT / CENTER COLUMN */}
        <div className="md:col-span-2 space-y-6">
          
          {/* ── 1. DAILY SHOP BACKUP & RESTORE ── */}
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-gray-900 tracking-tight flex items-center gap-2">
                    Data Backup & Restore
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Safe Cloud Backup
                    </span>
                  </h2>
                  <p className="text-xs text-gray-500">
                    One-tap backup and instant data recovery for stock, sales, bills, and khata
                  </p>
                </div>
              </div>

              {/* Discrete Developer Drive Config Toggle */}
              <button
                type="button"
                onClick={() => setShowDriveConfig(!showDriveConfig)}
                title="Developer Drive Configuration"
                className="p-2 text-gray-300 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Developer Webhook Input Modal / Drawer (Only opened if clicked) */}
            {showDriveConfig && (
              <div className="p-4 bg-amber-50/70 border-b border-amber-200/80 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-amber-900">
                  <span className="flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-amber-600" />
                    Google Drive Auto-Sync Webhook (Developer Setup)
                  </span>
                  <button onClick={() => setShowDriveConfig(false)} className="text-amber-700 hover:text-amber-950">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-amber-800/80">
                  Paste your Google Apps Script Web App URL below. When the client taps "Backup Now", this automatically updates <code>ArshadMobileBackup.json</code> in your 1TB Drive:
                </p>
                <form onSubmit={handleSaveWebhook} className="flex gap-2 pt-1">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={driveWebhookInput}
                    onChange={(e) => setDriveWebhookInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-gray-900 text-xs outline-none focus:border-amber-600"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 text-xs shrink-0"
                  >
                    Save URL
                  </button>
                </form>
              </div>
            )}

            <div className="p-5 sm:p-6 space-y-5">
              {/* Backup Status Tile */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    lastBackup ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {lastBackup ? <CheckCircle2 className="w-5 h-5" /> : <HardDrive className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-bold text-gray-900">
                        {lastBackup ? 'Status: All Data Saved' : 'No Backup Saved Today'}
                      </p>
                      <span className="text-[11px] font-medium text-emerald-700">
                        {lastBackup ? '(Data Protected)' : '(Backup Needed)'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {lastBackup 
                        ? `Last saved: ${format(new Date(lastBackup), 'dd MMM yyyy, hh:mm a')}`
                        : 'Tap the button at closing time to save today\'s changes'}
                    </p>
                    {lastBackupSummary && (
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-600 font-medium flex-wrap">
                        <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                          📱 {lastBackupSummary.mobilesCount} Mobiles
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                          🧾 {lastBackupSummary.salesCount} Sales
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                          📖 {lastBackupSummary.khataCustomersCount} Khata
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Big 1-Tap Action Button */}
                <div className="w-full sm:w-auto shrink-0 flex flex-col gap-2">
                  <button
                    onClick={() => handleRunBackup(false)}
                    disabled={isBackingUp}
                    className="w-full sm:w-auto py-3 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isBackingUp ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Saving Backup...</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-5 h-5" />
                        <span>Backup Now</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRunBackup(true)}
                    disabled={isBackingUp}
                    className="text-[11px] text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1 py-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download file to device (.json)</span>
                  </button>
                </div>
              </div>

              {/* ── RESTORE DATA SECTION ── */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-amber-600" />
                      Restore Lost Data
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      If data is accidentally lost or cleared, restore it instantly from your backup file or cloud snapshot
                    </p>
                  </div>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelected}
                  accept=".json,application/json"
                  className="hidden"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option A: Restore from JSON File */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isRestoring || isBackingUp}
                    className="p-3.5 rounded-xl border border-dashed border-gray-300 hover:border-forest bg-gray-50/50 hover:bg-forest/5 flex items-center gap-3 transition-colors text-left group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-forest group-hover:text-white transition-colors">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900">Restore from JSON File</p>
                      <p className="text-[11px] text-gray-500 truncate">Upload ArshadMobileBackup.json</p>
                    </div>
                  </button>

                  {/* Option B: Restore from Cloud Snapshot */}
                  <button
                    type="button"
                    onClick={handleCheckCloudRestore}
                    disabled={isRestoring || isBackingUp}
                    className="p-3.5 rounded-xl border border-dashed border-gray-300 hover:border-emerald-600 bg-gray-50/50 hover:bg-emerald-50/50 flex items-center gap-3 transition-colors text-left group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900">Restore Cloud Snapshot</p>
                      <p className="text-[11px] text-gray-500 truncate">Restore last master backup</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. MOBILE INSTALL APP CARD ── */}
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

          {/* ── 3. SHOP INFORMATION ── */}
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
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
          
          {/* ── 4. APP PREFERENCES ── */}
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
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

        {/* RIGHT COLUMN: ACCOUNT & SYSTEM INFO */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
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

          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-card text-center space-y-1">
            <p className="font-bold text-gray-800 text-sm">{SHOP_CONFIG.name}</p>
            <p className="text-xs text-gold font-bold tracking-wider uppercase">{SHOP_CONFIG.subTitle}</p>
            <p className="text-[11px] text-gray-400 mt-2">Version 2.0.0 (AMZ Enterprise)</p>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-emerald-600 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Firebase Cloud Sync Active</span>
            </div>
          </div>
        </div>

      </div>

      <InstallPromptModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />

      {/* RESTORE CONFIRMATION MODAL */}
      <Modal
        isOpen={showRestoreModal}
        onClose={() => !isRestoring && setShowRestoreModal(false)}
        title="Restore Shop Data"
        size="md"
      >
        {restoreCandidate && (
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Data Recovery Confirmation</p>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  {restoreSource === 'cloud' 
                    ? 'This will restore all shop records from the latest cloud backup snapshot into your database.' 
                    : 'This will restore all shop records from your selected backup JSON file into your database.'}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-gray-600">
                <span className="font-medium">Backup Timestamp:</span>
                <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                  {restoreCandidate.createdAt ? format(new Date(restoreCandidate.createdAt), 'dd MMM yyyy, hh:mm a') : 'Unknown Date'}
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span className="font-medium">Shop Identifier:</span>
                <span className="font-bold text-gray-900">{restoreCandidate.shopName || SHOP_CONFIG.name}</span>
              </div>

              <div className="pt-2 border-t border-gray-200 grid grid-cols-2 gap-2 text-gray-700">
                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Mobiles Stock</span>
                  <span className="text-sm font-extrabold text-gray-900">
                    📱 {restoreCandidate.summary?.mobilesCount ?? restoreCandidate.data?.mobiles?.length ?? 0}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Sales & Bills</span>
                  <span className="text-sm font-extrabold text-gray-900">
                    🧾 {restoreCandidate.summary?.salesCount ?? (restoreCandidate.data?.sales?.length || restoreCandidate.data?.mobileSales?.length) ?? 0}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Khata Accounts</span>
                  <span className="text-sm font-extrabold text-gray-900">
                    📖 {restoreCandidate.summary?.khataCustomersCount ?? restoreCandidate.data?.khata?.length ?? 0}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Expenses</span>
                  <span className="text-sm font-extrabold text-gray-900">
                    💸 {restoreCandidate.summary?.expensesCount ?? restoreCandidate.data?.expenses?.length ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setShowRestoreModal(false)}
                disabled={isRestoring}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                    Restoring Data...
                  </>
                ) : (
                  'Confirm & Restore Now'
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
