import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Edit2, Trash2, X, AlertCircle, CreditCard,
  Zap, Users, Wrench, Building2, Car, Package, Settings, MessageCircle
} from 'lucide-react';
import { format, startOfMonth, startOfYear } from 'date-fns';
import { parseDateSafe } from '../utils/dateUtils';

type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: Date;
  notes: string;
  createdAt: Date;
};

const CATEGORIES = [
  { id: 'Rent', icon: Building2, color: 'bg-red-100 text-red-600', badge: 'bg-red-100 text-red-700' },
  { id: 'Electricity', icon: Zap, color: 'bg-amber-100 text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  { id: 'Salary', icon: Users, color: 'bg-blue-100 text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  { id: 'Transportation', icon: Car, color: 'bg-cyan-100 text-cyan-600', badge: 'bg-cyan-100 text-cyan-700' },
  { id: 'Supplies', icon: Package, color: 'bg-emerald-100 text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  { id: 'Repairs', icon: Wrench, color: 'bg-orange-100 text-orange-600', badge: 'bg-orange-100 text-orange-700' },
  { id: 'Marketing', icon: MessageCircle, color: 'bg-pink-100 text-pink-600', badge: 'bg-pink-100 text-pink-700' },
  { id: 'Other', icon: Settings, color: 'bg-gray-100 text-gray-600', badge: 'bg-gray-100 text-gray-700' },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [salesProfit, setSalesProfit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');

  // Edit / Delete State
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Expenses
      const expSnap = await getDocs(query(collection(db, 'expenses'), orderBy('date', 'desc')));
      const exps: Expense[] = [];
      expSnap.forEach((d) => {
        const data = d.data();
        exps.push({
          id: d.id,
          title: data.title,
          amount: data.amount,
          category: data.category,
          date: parseDateSafe(data.date) || new Date(),
          notes: data.notes || '',
          createdAt: parseDateSafe(data.createdAt) || new Date(),
        });
      });
      setExpenses(exps);

      // Fetch Sales for Profit calc
      const salesSnap = await getDocs(collection(db, 'sales'));
      let totalSalesProfit = 0;
      salesSnap.forEach((d) => {
        totalSalesProfit += (d.data().profit || 0);
      });
      setSalesProfit(totalSalesProfit);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const netProfit = salesProfit - totalExpenses;

  const thisMonthExpenses = useMemo(() => {
    const start = startOfMonth(new Date());
    return expenses.filter(e => e.date >= start).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const thisYearExpenses = useMemo(() => {
    const start = startOfYear(new Date());
    return expenses.filter(e => e.date >= start).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'All' || e.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !category || !date) return;
    setFormLoading(true);
    try {
      if (expenseToEdit) {
        await updateDoc(doc(db, 'expenses', expenseToEdit.id), {
          title,
          amount: Number(amount),
          category,
          date: new Date(date),
          notes,
        });
      } else {
        const newExpense = {
          title,
          amount: Number(amount),
          category,
          date: new Date(date),
          notes,
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, 'expenses'), newExpense);
      }
      setShowAddModal(false);
      setExpenseToEdit(null);
      setTitle(''); setAmount(''); setNotes(''); setCategory('Other'); setDate(format(new Date(), 'yyyy-MM-dd'));
      fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (expenseToDelete) {
      await deleteDoc(doc(db, 'expenses', expenseToDelete));
      setExpenseToDelete(null);
      fetchData();
    }
  };

  const openEditModal = (exp: Expense) => {
    setExpenseToEdit(exp);
    setTitle(exp.title);
    setAmount(exp.amount.toString());
    setCategory(exp.category);
    setDate(format(exp.date, 'yyyy-MM-dd'));
    setNotes(exp.notes);
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Add Expense
        </Button>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-card mb-6 border border-gray-100">
        <h3 className="font-semibold text-gray-700 mb-4">Expense Impact on Profit</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-surface-2 rounded-lg border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Mobile Sales Profit</p>
            <p className="text-xl font-bold text-emerald-600">Rs. {salesProfit.toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-surface-2 rounded-lg border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Total Expenses</p>
            <p className="text-xl font-bold text-red-500">- Rs. {totalExpenses.toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-forest rounded-lg shadow-md">
            <p className="text-xs text-white/70 mb-1">Net Profit</p>
            <p className="text-xl font-bold text-white">Rs. {netProfit.toLocaleString()}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
           <div className="text-center">
             <p className="text-xs text-gray-500 mb-1">This Month Expenses</p>
             <p className="font-semibold text-gray-800">Rs. {thisMonthExpenses.toLocaleString()}</p>
           </div>
           <div className="text-center">
             <p className="text-xs text-gray-500 mb-1">This Year Expenses</p>
             <p className="font-semibold text-gray-800">Rs. {thisYearExpenses.toLocaleString()}</p>
           </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1 overflow-x-auto pb-2 -mb-2 scrollbar-none">
          <div className="flex gap-2 min-w-max">
            {['All', ...CATEGORIES.map(c => c.id)].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-forest text-white shadow-sm' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="w-full sm:w-64 shrink-0 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:border-forest focus:ring-1 focus:ring-forest outline-none text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-surface-3 border-b border-gray-200 text-left text-xs font-semibold text-forest uppercase tracking-wider">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3">Notes</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading...</td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">No expenses found</td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const cat = CATEGORIES.find(c => c.id === exp.category) || CATEGORIES[CATEGORIES.length - 1];
                  return (
                    <tr key={exp.id} className="hover:bg-green-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(exp.date, 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {exp.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cat.badge}`}>
                          <cat.icon className="w-3 h-3 mr-1" />
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                        Rs. {exp.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {exp.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => openEditModal(exp)} className="text-gray-400 hover:text-forest transition-colors p-2 rounded-lg hover:bg-forest/10 mr-1">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setExpenseToDelete(exp.id)} className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:max-w-md bg-white sm:rounded-2xl shadow-2xl flex flex-col max-h-screen overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
                <h3 className="text-lg font-bold text-gray-900">Record Expense</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <Input
                    label="Title / Description"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                  <Input
                    label="Amount (Rs.)"
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition-all focus:border-forest focus:ring-1 focus:ring-forest/20"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>{c.id}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Date"
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Notes (Optional)</label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition-all focus:border-forest focus:ring-1 focus:ring-forest/20 resize-none"
                    />
                  </div>
                  <Button type="submit" className="w-full mt-4" isLoading={formLoading}>
                    {expenseToEdit ? 'Update Expense' : 'Save Expense'}
                  </Button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {expenseToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpenseToDelete(null)}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:max-w-sm bg-white sm:rounded-2xl shadow-2xl flex flex-col p-6 text-center"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Expense</h3>
              <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this expense? This action cannot be undone.</p>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setExpenseToDelete(null)}>Cancel</Button>
                <Button variant="danger" className="flex-1" onClick={handleDelete}>Delete</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
