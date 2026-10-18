import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { 
  Store, User, LogOut, Download, 
  RefreshCw, HardDrive, Cloud, AlertTriangle,
  ExternalLink, Sparkles, Receipt, CheckCircle2
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { Modal } from '../components/ui/Modal';
import { ShopBrandBadge, getInitials } from '../utils/brandIdentity';
import { 
  syncShopBackupToGoogleDrive, 
  downloadShopBackupLocally, 
  BackupSyncResult 
} from '../utils/googleDriveBackup';
import { restoreShopBackup, ShopBackupData } from '../utils/backupService';
import { format } from 'date-fns';

export default function SettingsPage() {
  const { 
    user, 
    logout, 
    shopProfile, 
    updateProfileData, 
    connectGoogleDrive, 
    currentShopId 
  } = useAuth();
  const { success, error, toast } = useToast();
  
  // Shop Branding & Identity State
  const [shopName, setShopName] = useState(shopProfile.shopName || '');
  const [shortName, setShortName] = useState(shopProfile.shortName || '');
  const [ownerName, setOwnerName] = useState(shopProfile.ownerName || '');
  const [phone, setPhone] = useState(shopProfile.phone || '');
  const [secondaryPhone, setSecondaryPhone] = useState(shopProfile.secondaryPhone || '');
  const [address, setAddress] = useState(shopProfile.address || '');
  const [subTitle, setSubTitle] = useState(shopProfile.subTitle || '');
  const [receiptNote, setReceiptNote] = useState(shopProfile.receiptNote || '');
  const [whatsappFooter, setWhatsappFooter] = useState(shopProfile.whatsappFooter || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Google Drive Sync State
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [driveSyncResult, setDriveSyncResult] = useState<BackupSyncResult | null>(null);
  const [isDownloadingLocal, setIsDownloadingLocal] = useState(false);

  // Local Restore State
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreCandidate, setRestoreCandidate] = useState<ShopBackupData | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shopProfile) {
      setShopName(shopProfile.shopName || '');
      setShortName(shopProfile.shortName || '');
      setOwnerName(shopProfile.ownerName || '');
      setPhone(shopProfile.phone || '');
      setSecondaryPhone(shopProfile.secondaryPhone || '');
      setAddress(shopProfile.address || '');
      setSubTitle(shopProfile.subTitle || '');
      setReceiptNote(shopProfile.receiptNote || '');
      setWhatsappFooter(shopProfile.whatsappFooter || '');
    }
  }, [shopProfile]);

  // Auto-suggest monogram initials when shop name changes
  const handleShopNameChange = (val: string) => {
    setShopName(val);
    if (!shortName || shortName === getInitials(shopName)) {
      setShortName(getInitials(val));
    }
  };

  const handleSaveShopProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const initials = shortName.trim() || getInitials(shopName);
      await updateProfileData({
        shopName: shopName.trim(),
        shortName: initials.toUpperCase(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        secondaryPhone: secondaryPhone.trim(),
        address: address.trim(),
        subTitle: subTitle.trim(),
        receiptNote: receiptNote.trim(),
        whatsappFooter: whatsappFooter.trim(),
      });
      success('Shop profile and brand icon updated successfully!');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      error(err.message || 'Error updating shop profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSyncToGoogleDrive = async () => {
    setIsSyncingDrive(true);
    try {
      toast('Connecting to Google Drive...', 'info');
      const token = await connectGoogleDrive();
      toast('Uploading shop backup to Google Drive...', 'info');
      
      const res = await syncShopBackupToGoogleDrive(shopProfile, token);
      setDriveSyncResult(res);
      await updateProfileData({
        lastBackupTime: res.modifiedTime,
        googleDriveBackupFileId: res.fileId,
      });
      success(`Successfully synced "${res.fileName}" (${res.totalRecords} records) to Google Drive!`);
    } catch (err: any) {
      console.error('Google Drive sync error:', err);
      error(err.message || 'Failed to sync with Google Drive.');
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleDownloadLocalBackup = async () => {
    setIsDownloadingLocal(true);
    try {
      const total = await downloadShopBackupLocally(shopProfile);
      success(`Downloaded offline backup (${total} records).`);
    } catch (err: any) {
      console.error('Local backup download error:', err);
      error('Failed to export local backup file.');
    } finally {
      setIsDownloadingLocal(false);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawJson = event.target?.result as string;
        const parsed = JSON.parse(rawJson) as ShopBackupData;
        if (!parsed.data) {
          throw new Error('Invalid backup file structure: missing collections data.');
        }
        setRestoreCandidate(parsed);
        setShowRestoreModal(true);
      } catch (err: any) {
        error(err.message || 'Invalid or corrupted backup JSON file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const executeRestore = async () => {
    if (!restoreCandidate) return;
    setIsRestoring(true);
    try {
      const res = await restoreShopBackup(restoreCandidate, 'clear_and_replace');
      if (res.success) {
        const total = Object.values(res.restoredCount).reduce((a, b) => a + b, 0);
        success(`Restored ${total} records into ${shopProfile.shopName}!`);
        setShowRestoreModal(false);
        setRestoreCandidate(null);
      } else {
        error(res.message || 'Failed to restore backup records.');
      }
    } catch (err: any) {
      error(err.message || 'Failed to restore backup.');
    } finally {
      setIsRestoring(false);
    }
  };

  const displayInitials = shortName.trim() || getInitials(shopName);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="pb-4 border-b border-gray-200/80">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          <span>Shop Settings & Branding</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your store information, auto-generated brand monogram, print invoice policy, and Google Drive backups.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: SHOP PROFILE & BRANDING + GOOGLE DRIVE */}
        <div className="xl:col-span-7 space-y-8">

          {/* ── 1. SHOP BRANDING & IDENTITY ── */}
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-base">Store Identity & Details</h2>
                  <p className="text-xs text-gray-500">Configure how your shop appears on invoices, screen headers, and icons</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveShopProfile} className="p-6 sm:p-7 space-y-6">
              {/* Dynamic Live Monogram Preview Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-obsidian-dark to-obsidian-light text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-5 border border-white/10">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <ShopBrandBadge 
                    name={shopName || 'Shop'} 
                    shortName={displayInitials} 
                    size="lg" 
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-lg sm:text-xl text-white tracking-tight truncate">
                        {shopName || 'Your Shop Name'}
                      </span>
                      <span className="text-xs bg-amber-500/20 text-gold font-black px-2 py-0.5 rounded border border-amber-400/30 shrink-0">
                        {displayInitials}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 truncate">
                      {subTitle || address || 'Mobile Sales & Services'}
                    </p>
                    <p className="text-[11px] text-amber-400/90 font-medium mt-0.5">
                      {phone ? `WhatsApp: ${phone}` : 'No phone set'}
                    </p>
                  </div>
                </div>

                <div className="sm:text-right text-[11px] text-slate-300 bg-white/5 p-3 rounded-xl border border-white/10 w-full sm:w-auto">
                  <span className="inline-flex items-center gap-1.5 text-gold font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-gold" />
                    Auto Brand Icon
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                    Created dynamically from name & used across bills, navbar, and mobile screen.
                  </p>
                </div>
              </div>

              {/* Spacious Input Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Shop Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={e => handleShopNameChange(e.target.value)}
                    placeholder="e.g. Usman Afridi Mobile Center"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Official title shown on invoices and headers.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Brand Monogram / Short Name
                  </label>
                  <input
                    type="text"
                    value={shortName}
                    maxLength={4}
                    onChange={e => setShortName(e.target.value.toUpperCase())}
                    placeholder="e.g. UA"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white uppercase font-extrabold tracking-wider focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">2-3 initials for your app icon and receipt logo.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Shop Owner / Contact Person
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    placeholder="e.g. Usman Afridi"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Market Subtitle / Branch
                  </label>
                  <input
                    type="text"
                    value={subTitle}
                    onChange={e => setSubTitle(e.target.value)}
                    placeholder="e.g. Bara Bazar, Khyber"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Primary Phone / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Secondary Phone (Optional)
                  </label>
                  <input
                    type="text"
                    value={secondaryPhone}
                    onChange={e => setSecondaryPhone(e.target.value)}
                    placeholder="0312-9876543"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Physical Shop Address
                </label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-y min-h-[72px]"
                  placeholder="e.g. Shop #45, 1st Floor, Mobile Plaza, Bara Market, Khyber Agency"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Printed Receipt Warranty & Terms Note
                </label>
                <textarea
                  value={receiptNote}
                  onChange={e => setReceiptNote(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-y min-h-[72px]"
                  placeholder="e.g. Please check phone and accessories thoroughly before leaving. 3 days checking warranty. No cash refund."
                />
              </div>

              <div className="flex items-center justify-end pt-2">
                <Button 
                  type="submit" 
                  disabled={isSavingProfile} 
                  className="bg-amber-500 hover:bg-amber-600 text-obsidian-dark font-extrabold px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
                >
                  {isSavingProfile ? 'Saving Changes...' : 'Save Shop Information'}
                </Button>
              </div>
            </form>
          </div>

          {/* ── 2. GOOGLE DRIVE BACKUP & CLOUD SYNC ── */}
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-base">Google Drive Cloud Backup</h2>
                  <p className="text-xs text-gray-500">Securely sync your shop's inventory, sales, and khata records to your Google Drive</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Cloud Sync Ready
              </span>
            </div>

            <div className="p-6 sm:p-7 space-y-5">
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-950">Backup File:</span>
                    <span className="text-xs font-mono font-bold bg-white text-amber-900 px-2.5 py-0.5 rounded border border-amber-300">
                      {shopProfile.shopName.trim()} Backup.json
                    </span>
                  </div>
                  <p className="text-xs text-amber-900/80">
                    {shopProfile.lastBackupTime ? (
                      <>Last synced: <span className="font-semibold text-amber-950">{format(new Date(shopProfile.lastBackupTime), 'PPpp')}</span></>
                    ) : (
                      'No backup uploaded yet. Click the button below to upload your store backup file.'
                    )}
                  </p>
                </div>
                
                {driveSyncResult?.webViewLink && (
                  <a
                    href={driveSyncResult.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 underline bg-white px-3 py-1.5 rounded-lg border border-amber-200 shadow-2xs shrink-0"
                  >
                    <span>Open in Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button 
                  onClick={handleSyncToGoogleDrive}
                  disabled={isSyncingDrive}
                  className="bg-amber-500 hover:bg-amber-600 text-obsidian-dark font-extrabold px-5 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isSyncingDrive ? 'animate-spin' : ''}`} />
                  {isSyncingDrive ? 'Syncing to Drive...' : 'Sync Backup to Google Drive'}
                </Button>

                <Button 
                  variant="outline"
                  onClick={handleDownloadLocalBackup}
                  disabled={isDownloadingLocal}
                  className="font-bold text-gray-700 px-4 py-2.5 rounded-xl border-gray-300 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 mr-2 text-gray-500" />
                  {isDownloadingLocal ? 'Exporting...' : 'Download Offline JSON File'}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl"
                >
                  <HardDrive className="w-4 h-4 mr-1.5 text-gray-500" />
                  Restore from JSON File
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".json" 
                  className="hidden" 
                  onChange={handleFileSelected} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RECEIPT PREVIEW & USER ACCOUNT */}
        <div className="xl:col-span-5 space-y-8">
          {/* Live Receipt Slip Mockup */}
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-gray-900 text-sm">Printed Bill Receipt Preview</h3>
              </div>
              <span className="text-[11px] font-semibold text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-200">
                80mm Thermal Slip
              </span>
            </div>

            <div className="p-6 bg-slate-50/70">
              <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm text-center space-y-2 font-mono text-xs max-w-sm mx-auto">
                <div className="flex justify-center mb-1">
                  <ShopBrandBadge 
                    name={shopName} 
                    shortName={displayInitials} 
                    size="sm" 
                  />
                </div>
                <h4 className="font-black text-gray-900 text-base tracking-tight leading-tight">
                  {shopName || 'Shop Name'}
                </h4>
                <p className="text-[11px] text-gray-600 font-medium">
                  {subTitle || 'Bara Bazar, Khyber'}
                </p>
                <p className="text-[11px] text-gray-600">
                  Tel: {phone || '0300-0000000'} {secondaryPhone ? `| ${secondaryPhone}` : ''}
                </p>
                {address && (
                  <p className="text-[10px] text-gray-500 leading-snug">
                    {address}
                  </p>
                )}
                
                <div className="border-t border-dashed border-gray-300 my-3" />
                
                <div className="flex justify-between text-[11px] text-gray-500 font-sans">
                  <span>INVOICE #{shopProfile.shortName}-2026-0042</span>
                  <span>{format(new Date(), 'dd/MM/yyyy')}</span>
                </div>
                
                <div className="border-t border-dashed border-gray-300 my-2" />
                
                <div className="space-y-1 text-left text-[11px]">
                  <div className="flex justify-between font-bold text-gray-800">
                    <span>Samsung Galaxy S23 Ultra</span>
                    <span>Rs. 185,000</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>IMEI: 358942109841235</span>
                    <span>1 Unit</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-300 my-2" />

                <div className="flex justify-between text-xs font-black text-gray-900 pt-0.5">
                  <span>TOTAL AMOUNT:</span>
                  <span>Rs. 185,000</span>
                </div>

                <div className="border-t border-dashed border-gray-300 my-3" />
                
                <p className="text-[10px] text-gray-600 italic leading-relaxed text-center px-1">
                  "{receiptNote || 'Thank you for your business! 3 days checking warranty.'}"
                </p>
              </div>
            </div>
          </div>

          {/* User Account Card */}
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/60">
              <User className="w-4 h-4 text-amber-600" />
              <h2 className="font-bold text-gray-900 text-sm">Account Profile</h2>
            </div>
            
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Account Email</label>
                <p className="font-bold text-gray-900 text-sm mt-0.5 truncate">{user?.email || 'N/A'}</p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active Store</label>
                <p className="font-bold text-gray-900 text-sm mt-0.5 truncate">{shopProfile.shopName}</p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <Button onClick={logout} variant="danger" className="w-full text-xs font-bold py-2.5">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RESTORE CONFIRMATION MODAL */}
      <Modal
        isOpen={showRestoreModal}
        onClose={() => !isRestoring && setShowRestoreModal(false)}
        title="Restore Shop Data Backup"
        size="md"
      >
        {restoreCandidate && (
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-amber-950">Confirm Database Import</p>
                <p className="mt-1 text-amber-900 leading-relaxed">
                  This will import documents from the selected backup file into your store account ({shopProfile.shopName}).
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl space-y-1.5 text-xs">
              <p className="text-gray-600">Backup Store Name: <span className="font-bold text-gray-900">{restoreCandidate.meta?.shopName || 'Unknown'}</span></p>
              <p className="text-gray-600">Backup Date: <span className="font-bold text-gray-900">{restoreCandidate.meta?.exportedAt ? format(new Date(restoreCandidate.meta.exportedAt), 'PPpp') : 'N/A'}</span></p>
              <p className="text-gray-600">Total Records: <span className="font-bold text-gray-900">{restoreCandidate.meta?.totalRecords || 'N/A'}</span></p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowRestoreModal(false)} disabled={isRestoring}>
                Cancel
              </Button>
              <Button onClick={executeRestore} disabled={isRestoring} className="bg-amber-500 hover:bg-amber-600 text-obsidian-dark font-extrabold">
                {isRestoring ? 'Restoring...' : 'Confirm Restore'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
