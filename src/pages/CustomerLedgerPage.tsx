import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MessageCircle, ArrowUpRight, ArrowDownLeft, BookOpen, X, Edit2, Trash2, AlertTriangle, PhoneCall } from 'lucide-react';
import { format } from 'date-fns';
import { parseDateSafe } from '../utils/dateUtils';
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
    <div className="max-w-3xl mx-auto pb-8">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
            <button
              onClick={() => {
                setPhoneToUpdate(customer.phone || '');
                setIsEditingPhone(true);
              }}
              title="Edit Phone Number"
              className="p-1 text-slate-400 hover:text-amber-600 rounded-md transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-sm text-gray-500">{customer.phone || 'No phone added'}</p>
        </div>
        {customer.phone ? (
          <a
            href={getWhatsAppKhataUrl(customer.phone, customer.name, customer.totalBalance || 0, customer.type)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-sm transition-all"
          >
            <MessageCircle className="w-4 h-4 fill-white/20" />
            <span>WhatsApp تقاضا</span>
          </a>
        ) : (
          <button
            onClick={() => {
              setPhoneToUpdate('');
              setIsEditingPhone(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs border border-emerald-300 shadow-xs transition-all"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>+ Add Phone for WhatsApp</span>
          </button>
        )}
      </div>

      {/* BALANCE CARD */}
      <div className={`rounded-2xl p-6 mb-4 text-white shadow-lg relative overflow-hidden ${
        customer.type === 'receivable' ? 'bg-gradient-to-r from-obsidian-dark to-obsidian border border-amber-500/30' : 'bg-amber-600'
      }`}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-300 mb-1">Total Balance</p>
            <p className="text-4xl font-extrabold mb-1 text-white">
              Rs. {(customer.totalBalance || 0).toLocaleString()}
            </p>
            <p className="text-sm font-medium text-amber-400">
              {customer.type === 'receivable' ? '⚡ Will give you (واجب الادا)' : 'You owe them'}
            </p>
          </div>
          {customer.phone && (
            <a
              href={getWhatsAppKhataUrl(customer.phone, customer.name, customer.totalBalance || 0, customer.type)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 hidden sm:flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all border border-emerald-400/40"
            >
              <MessageCircle className="w-4 h-4" />
              1-Click تقاضا میسج
            </a>
          )}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setTxModalType('udhar')}
          className="py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 font-semibold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
        >
          <ArrowUpRight className="w-5 h-5" />
          Udhar Diya
        </button>
        <button
          onClick={() => setTxModalType('wasooli')}
          className="py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 font-semibold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
        >
          <ArrowDownLeft className="w-5 h-5" />
          Wasooli Li
        </button>
      </div>

      {/* TRANSACTION HISTORY */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Transaction History</h3>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 sm:gap-4 p-4 hover:bg-gray-50 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  tx.transactionType === 'udhar' ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {tx.transactionType === 'udhar' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900">
                    {tx.transactionType === 'udhar' ? 'Udhar Diya' : 'Wasooli Li'}
                  </p>
                  {tx.description && <p className="text-xs text-gray-500 truncate">{tx.description}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(tx.date, 'dd MMM yyyy')} at {format(tx.createdAt, 'hh:mm a')}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className={`font-bold ${
                    tx.transactionType === 'udhar' ? 'text-red-500' : 'text-emerald-600'
                  }`}>
                    {tx.transactionType === 'udhar' ? '+' : '-'} Rs. {(tx.amount || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    Bal: Rs. {(tx.runningBalance || 0).toLocaleString()}
                  </p>
                </div>

                {/* WhatsApp, Edit & Delete Action Buttons for each Transaction */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {customer.phone ? (
                    <a
                      href={getWhatsAppTransactionUrl(
                        customer.phone,
                        customer.name,
                        tx.transactionType,
                        tx.amount,
                        tx.description,
                        tx.runningBalance,
                        format(tx.date, 'dd MMM yyyy')
                      )}
                      target="_blank"
                      rel="noreferrer"
                      title="Send WhatsApp update for this transaction"
                      className="p-1.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 shadow-2xs"
                    >
                      <MessageCircle className="w-4 h-4 fill-emerald-500/20" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      title="No phone number — Click to add phone for 1-Click WhatsApp"
                      onClick={() => {
                        setPhoneToUpdate('');
                        setIsEditingPhone(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 rounded-lg transition-colors border border-dashed border-slate-300"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    title="Edit Transaction"
                    onClick={() => handleOpenEditTx(tx)}
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Delete Transaction"
                    onClick={() => handleOpenDeleteTx(tx)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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

