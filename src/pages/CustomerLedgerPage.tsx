import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MessageCircle, ArrowUpRight, ArrowDownLeft, BookOpen, X, Edit2, Trash2, AlertTriangle, PhoneCall } from 'lucide-react';
import { format } from 'date-fns';
import { parseDateSafe, formatDateSafe } from '../utils/dateUtils';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';
import { getWhatsAppKhataUrl, getWhatsAppTransactionUrl } from '../config/shopConfig';

export default function CustomerLedgerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  // Quick Customer Phone Edit
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneToUpdate, setPhoneToUpdate] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  
  // Modal State for New Transaction
  const [txModalType, setTxModalType] = useState<'udhar' | 'wasooli' | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Edit Transaction State
  const [txToEdit, setTxToEdit] = useState<any>(null);
  const [editTxType, setEditTxType] = useState<'udhar' | 'wasooli'>('udhar');
  const [editTxAmount, setEditTxAmount] = useState('');
  const [editTxDescription, setEditTxDescription] = useState('');
  const [editTxDate, setEditTxDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Transaction State
  const [txToDelete, setTxToDelete] = useState<any>(null);
  const [isDeletingTx, setIsDeletingTx] = useState(false);

  useEffect(() => {
    if (id) fetchLedgerData();
  }, [id]);

  const fetchLedgerData = async () => {
    if (!id) return;
    try {
      const docRef = doc(db, 'khata', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) setCustomer({ id: snap.id, ...snap.data() });

      const txQuery = query(collection(db, 'khataTransactions'), where('khataId', '==', id));
      const txSnap = await getDocs(txQuery);
      const txs: any[] = [];
      txSnap.forEach(d => {
        const data = d.data();
        txs.push({
          id: d.id,
          ...data,
          date: parseDateSafe(data.date) || new Date(),
          createdAt: parseDateSafe(data.createdAt) || new Date(),
        });
      });
      // Sort by date descending client-side
      txs.sort((a, b) => b.date.getTime() - a.date.getTime());
      setTransactions(txs);
    } catch (e: any) {
      console.error(e);
      error(e.message || 'Error fetching ledger data');
    } finally {
      setLoading(false);
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !amount || !txModalType || !customer) return;
    
    try {
      const amt = Number(amount);
      const currentBalance = customer.totalBalance || 0;
      const newBalance = txModalType === 'udhar' ? currentBalance + amt : currentBalance - amt;

      const newTx = {
        khataId: id,
        customerName: customer.name,
        transactionType: txModalType,
        amount: amt,
        description,
        runningBalance: newBalance,
        date: new Date(date),
        createdAt: serverTimestamp(),
      };

      // Save transaction
      const docRef = await addDoc(collection(db, 'khataTransactions'), newTx);
      
      // Update customer balance
      await updateDoc(doc(db, 'khata', id), { totalBalance: newBalance });

      // Optimistic UI Update
      setCustomer({ ...customer, totalBalance: newBalance });
      setTransactions([{
        id: docRef.id,
        ...newTx,
        date: newTx.date,
        createdAt: new Date(),
      }, ...transactions].sort((a, b) => b.date.getTime() - a.date.getTime()));

      setTxModalType(null);
      setAmount('');
      setDescription('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      success('Transaction recorded');
    } catch (err: any) {
      console.error(err);
      error(err.message || 'Error saving transaction');
    }
  };

  // Open Edit Modal for a Transaction
  const handleOpenEditTx = (tx: any) => {
    setTxToEdit(tx);
    setEditTxType(tx.transactionType);
    setEditTxAmount(String(tx.amount || ''));
    setEditTxDescription(tx.description || '');
    setEditTxDate(format(tx.date, 'yyyy-MM-dd'));
  };

  // Save Edited Transaction & Recalculate Balance
  const handleSaveEditTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !customer || !txToEdit || !editTxAmount) return;

    setIsSavingEdit(true);
    try {
      const newAmount = Number(editTxAmount);
      const oldAmount = Number(txToEdit.amount) || 0;
      const oldType = txToEdit.transactionType;

      // Calculate balance delta
      // Previously: if old was 'udhar', it added +oldAmount; if 'wasooli', it subtracted -oldAmount
      // Now: if new is 'udhar', +newAmount; if 'wasooli', -newAmount
      const oldDelta = oldType === 'udhar' ? oldAmount : -oldAmount;
      const newDelta = editTxType === 'udhar' ? newAmount : -newAmount;
      const balanceChange = newDelta - oldDelta;

      const currentBalance = customer.totalBalance || 0;
      const updatedTotalBalance = currentBalance + balanceChange;

      // Update the transaction in Firestore
      const txRef = doc(db, 'khataTransactions', txToEdit.id);
      await updateDoc(txRef, {
        transactionType: editTxType,
        amount: newAmount,
        description: editTxDescription,
        date: new Date(editTxDate),
        runningBalance: updatedTotalBalance,
        updatedAt: serverTimestamp()
      });

      // Update customer totalBalance
      await updateDoc(doc(db, 'khata', id), { totalBalance: updatedTotalBalance });

      success('Transaction updated successfully');
      setTxToEdit(null);
      fetchLedgerData();
    } catch (err: any) {
      console.error(err);
      error(err.message || 'Error updating transaction');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Open Delete Confirmation for a Transaction
  const handleOpenDeleteTx = (tx: any) => {
    setTxToDelete(tx);
  };

  // Delete Transaction & Revert its impact on customer balance
  const handleConfirmDeleteTx = async () => {
    if (!id || !customer || !txToDelete) return;

    setIsDeletingTx(true);
    try {
      const txAmt = Number(txToDelete.amount) || 0;
      const currentBalance = customer.totalBalance || 0;
      // Revert the transaction:
      // If deleted tx was 'udhar', it had added to balance, so subtract it now.
      // If deleted tx was 'wasooli', it had subtracted from balance, so add it back now.
      const updatedTotalBalance = txToDelete.transactionType === 'udhar'
        ? currentBalance - txAmt
        : currentBalance + txAmt;

      // Delete transaction doc
      await deleteDoc(doc(db, 'khataTransactions', txToDelete.id));

      // Update customer totalBalance
      await updateDoc(doc(db, 'khata', id), { totalBalance: updatedTotalBalance });

      success('Transaction deleted');
      setTxToDelete(null);
      fetchLedgerData();
    } catch (err: any) {
      console.error(err);
      error(err.message || 'Error deleting transaction');
    } finally {
      setIsDeletingTx(false);
    }
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !customer) return;
    setIsSavingPhone(true);
    try {
      await updateDoc(doc(db, 'khata', id), {
        phone: phoneToUpdate.trim(),
        updatedAt: serverTimestamp()
      });
      setCustomer({ ...customer, phone: phoneToUpdate.trim() });
      success('Customer phone updated successfully');
      setIsEditingPhone(false);
    } catch (err: any) {
      error(err.message || 'Error updating phone');
    } finally {
      setIsSavingPhone(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading ledger...</div>;
  if (!customer) return <div className="p-8 text-center text-red-500">Customer not found</div>;

  return (
    <div className="max-w-3xl mx-auto pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors shrink-0 active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight truncate">
                {customer.name}
              </h1>
              <button
                onClick={() => {
                  setPhoneToUpdate(customer.phone || '');
                  setIsEditingPhone(true);
                }}
                title="Edit Phone Number"
                className="p-1 text-gray-400 hover:text-amber-600 rounded-md transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-mono mt-0.5">
              {customer.phone || 'No phone added'}
            </p>
          </div>
        </div>

        {/* WhatsApp Top Button */}
        <div className="shrink-0 self-stretch sm:self-auto">
          {customer.phone ? (
            <a
              href={getWhatsAppKhataUrl(customer.phone, customer.name, customer.totalBalance || 0, customer.type)}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-transform active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white/20" />
              <span>WhatsApp تقاضا میسج</span>
            </a>
          ) : (
            <button
              onClick={() => {
                setPhoneToUpdate('');
                setIsEditingPhone(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 shadow-2xs transition-all"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>+ Add Phone for WhatsApp</span>
            </button>
          )}
        </div>
      </div>

      {/* BALANCE CARD */}
      <div className={`rounded-2xl p-5 sm:p-6 mb-5 text-white shadow-lg relative overflow-hidden ${
        customer.type === 'receivable' ? 'bg-gradient-to-r from-obsidian-dark to-surface border border-amber-500/30' : 'bg-gradient-to-r from-amber-600 to-amber-700 border border-amber-400/30'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs sm:text-sm text-gray-300 uppercase tracking-wider font-semibold">
              Current Total Balance
            </p>
            <p className="text-3xl sm:text-4xl font-black mt-1 text-white tracking-tight">
              Rs. {(customer.totalBalance || 0).toLocaleString()}
            </p>
            <p className="text-xs sm:text-sm font-semibold text-amber-400 mt-1">
              {customer.type === 'receivable' ? '⚡ Will give you (آپ نے وصول کرنا ہے)' : '🤝 You owe them (آپ نے ادا کرنا ہے)'}
            </p>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          onClick={() => setTxModalType('udhar')}
          className="py-3 px-2 rounded-xl bg-red-50 border border-red-200 text-red-600 font-bold text-sm sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-red-100 transition-colors shadow-2xs active:scale-95"
        >
          <ArrowUpRight className="w-5 h-5 shrink-0 stroke-[2.5]" />
          <span>Udhar Diya (ادھار)</span>
        </button>
        <button
          onClick={() => setTxModalType('wasooli')}
          className="py-3 px-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-emerald-100 transition-colors shadow-2xs active:scale-95"
        >
          <ArrowDownLeft className="w-5 h-5 shrink-0 stroke-[2.5]" />
          <span>Wasooli Li (وصولی)</span>
        </button>
      </div>

      {/* TRANSACTION HISTORY */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
            Transaction History
          </h3>
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {transactions.length} Records
          </span>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No transactions recorded yet</p>
            <p className="text-xs text-gray-400 mt-1">Record Udhar or Wasooli using buttons above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
                className="p-4 hover:bg-amber-50/20 transition-colors space-y-2.5"
              >
                {/* ── CARD TOP ROW: Icon + Title & Date (Left) | Amount & Running Balance (Right) ── */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                      tx.transactionType === 'udhar' 
                        ? 'bg-red-50 text-red-600 border border-red-200' 
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {tx.transactionType === 'udhar' ? (
                        <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm sm:text-base font-extrabold ${
                          tx.transactionType === 'udhar' ? 'text-red-700' : 'text-emerald-800'
                        }`}>
                          {tx.transactionType === 'udhar' ? 'ادھار دیا (Udhar)' : 'وصولی لی (Wasooli)'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDateSafe(tx.date, 'dd MMM yyyy')} • {formatDateSafe(tx.createdAt, 'hh:mm a')}
                      </p>
                    </div>
                  </div>

                  {/* Amount & Balance */}
                  <div className="text-right shrink-0">
                    <p className={`text-base sm:text-lg font-black tracking-tight ${
                      tx.transactionType === 'udhar' ? 'text-red-600' : 'text-emerald-700'
                    }`}>
                      {tx.transactionType === 'udhar' ? '+' : '-'} Rs. {(tx.amount || 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] font-semibold text-gray-400 mt-0.5">
                      Bal: <span className="text-gray-800 font-bold">Rs. {(tx.runningBalance || 0).toLocaleString()}</span>
                    </p>
                  </div>
                </div>

                {/* ── CARD MIDDLE: Description Note (Full Width Bubble) ── */}
                {tx.description && (
                  <div className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-700 font-medium break-words">
                    <span className="text-gray-400 mr-1.5 font-normal">تفصیل / Note:</span>
                    {tx.description}
                  </div>
                )}

                {/* ── CARD BOTTOM: Action Bar (WhatsApp, Edit, Delete) ── */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                  {/* WhatsApp Action Button */}
                  {customer.phone ? (
                    <a
                      href={getWhatsAppTransactionUrl(
                        customer.phone,
                        customer.name,
                        tx.transactionType,
                        tx.amount,
                        tx.description,
                        tx.runningBalance,
                        formatDateSafe(tx.date, 'dd MMM yyyy')
                      )}
                      target="_blank"
                      rel="noreferrer"
                      title="Send WhatsApp update for this transaction"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-transform active:scale-95"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-white/20" />
                      <span>WhatsApp رسید</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      title="No phone number — Click to add phone for 1-Click WhatsApp"
                      onClick={() => {
                        setPhoneToUpdate('');
                        setIsEditingPhone(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 text-xs font-semibold border border-dashed border-gray-300 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
                      <span>+ فون درج کریں (WhatsApp)</span>
                    </button>
                  )}

                  {/* Edit and Delete Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Edit Transaction"
                      onClick={() => handleOpenEditTx(tx)}
                      className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-gray-500 hover:text-amber-700 hover:bg-amber-50 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">Edit</span>
                    </button>
                    <button
                      type="button"
                      title="Delete Transaction"
                      onClick={() => handleOpenDeleteTx(tx)}
                      className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-gray-500 hover:text-red-700 hover:bg-red-50 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">Delete</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* NEW TRANSACTION MODAL */}
      <AnimatePresence>
        {txModalType && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
              onClick={() => setTxModalType(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:max-w-md bg-white sm:rounded-2xl shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">
                  {txModalType === 'udhar' ? 'Record Udhar Diya' : 'Record Wasooli Li'}
                </h3>
                <button onClick={() => setTxModalType(null)}><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="p-6">
                <form onSubmit={handleTransaction} className="space-y-4">
                  <Input label="Amount (Rs.)" type="number" required min="1" value={amount} onChange={e => setAmount(e.target.value)} />
                  <Input label="Date" type="date" required value={date} onChange={e => setDate(e.target.value)} />
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Description (Optional)</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-forest resize-none"
                    />
                  </div>
                  <Button type="submit" className="w-full" variant={txModalType === 'udhar' ? 'danger' : 'primary'}>
                    Save Transaction
                  </Button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* EDIT TRANSACTION MODAL */}
      <Modal isOpen={!!txToEdit} onClose={() => setTxToEdit(null)} title="Edit Transaction" size="md">
        {txToEdit && (
          <form onSubmit={handleSaveEditTx} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Transaction Type</label>
              <select
                value={editTxType}
                onChange={e => setEditTxType(e.target.value as any)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-forest"
              >
                <option value="udhar">Udhar Diya (Debit / Customer owes you)</option>
                <option value="wasooli">Wasooli Li (Credit / Received from customer)</option>
              </select>
            </div>
            <Input label="Amount (Rs.)" type="number" required min="1" value={editTxAmount} onChange={e => setEditTxAmount(e.target.value)} />
            <Input label="Date" type="date" required value={editTxDate} onChange={e => setEditTxDate(e.target.value)} />
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Description (Optional)</label>
              <textarea
                value={editTxDescription}
                onChange={e => setEditTxDescription(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-forest resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setTxToEdit(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="flex-1" disabled={isSavingEdit}>
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* DELETE TRANSACTION CONFIRMATION MODAL */}
      <Modal isOpen={!!txToDelete} onClose={() => setTxToDelete(null)} title="Delete Transaction" size="sm">
        {txToDelete && (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-base">Delete this transaction?</h4>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete the <span className="font-semibold text-gray-800">{txToDelete.transactionType === 'udhar' ? 'Udhar Diya' : 'Wasooli Li'}</span> transaction of <span className="font-bold text-gray-900">Rs. {Number(txToDelete.amount || 0).toLocaleString()}</span>? The customer balance will automatically update.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setTxToDelete(null)} disabled={isDeletingTx}>
                Cancel
              </Button>
              <Button type="button" variant="danger" className="flex-1" onClick={handleConfirmDeleteTx} disabled={isDeletingTx}>
                {isDeletingTx ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* EDIT CUSTOMER PHONE MODAL */}
      <Modal isOpen={isEditingPhone} onClose={() => setIsEditingPhone(false)} title="Customer WhatsApp Number" size="sm">
        <form onSubmit={handleSavePhone} className="space-y-4">
          <div className="text-center pb-1">
            <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <MessageCircle className="w-6 h-6 fill-emerald-500/20" />
            </div>
            <p className="text-xs text-slate-500">
              Enter phone number for <strong className="text-slate-800">{customer?.name}</strong> to enable 1-Click WhatsApp reminders and receipts.
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mobile / WhatsApp Number *
            </label>
            <Input
              type="text"
              placeholder="03001234567 or 923001234567"
              value={phoneToUpdate}
              onChange={e => setPhoneToUpdate(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsEditingPhone(false)} disabled={isSavingPhone}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isSavingPhone}>
              Save Number
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

