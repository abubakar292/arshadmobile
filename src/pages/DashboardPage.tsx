import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Package, DollarSign,
  Plus, BarChart3, Clock, Smartphone, ShoppingCart, BookOpen
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { parseDateSafe } from '../utils/dateUtils';
import { useNavigate } from 'react-router-dom';

function AnimatedCounter({ value, prefix = '', suffix = '' }: { value: number, prefix?: string, suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const duration = 1000;
    
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOut * value));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [value]);

  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    netProfit: 0,
    totalStock: 0,
    todaySales: 0,
    totalStockValue: 0,
  });
  const [chartData, setChartData] = useState<{ name: string, profit: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    // 1. Real-time Stock Listener (Mobiles collection)
    const stockQuery = query(collection(db, 'mobiles'));
    // 2. Real-time Sales Listener (Sales collection)
    const salesQuery = query(collection(db, 'sales'), orderBy('createdAt', 'desc'));

    let currentMobiles: any[] = [];
    let currentSales: any[] = [];
    let mobilesLoaded = false;
    let salesLoaded = false;

    const recalculateDashboard = () => {
      const today = new Date();
      const startOfToday = startOfDay(today);
      const sevenDaysAgo = startOfDay(subDays(today, 6));

      // Calculate stock stats (only quantity > 0)
      let totalStock = 0;
      let totalStockValue = 0;
      currentMobiles.forEach(m => {
        const q = Number(m.quantity) || 0;
        if (q > 0) {
          totalStock += q;
          totalStockValue += (Number(m.basePrice) || 0) * q;
        }
      });

      // Filter active (non-returned) sales
      let todaySales = 0;
      let todayProfit = 0;

      // 7-day profit trend buckets
      const dailyData = Array.from({ length: 7 }).map((_, i) => {
        const d = subDays(today, 6 - i);
        return {
          date: d,
          name: format(d, 'EEE'),
          profit: 0
        };
      });

      const activities: any[] = [];

      currentSales.forEach(s => {
        const saleDate = parseDateSafe(s.date || s.createdAt) || new Date();
        const isReturned = s.status === 'returned';

        // Include in activities list (shows returned tag if returned)
        activities.push({
          id: s.id,
          type: 'sale',
          desc: isReturned ? `Returned ${s.itemName || 'Mobile'}` : `Sold ${s.itemName || 'Mobile'}`,
          amount: isReturned ? -(s.sellPrice || 0) : (s.sellPrice || 0),
          isReturned,
          date: saleDate,
          icon: Smartphone,
          color: isReturned ? 'text-rose-500' : 'text-emerald-500'
        });

        // IMPORTANT: Exclude returned sales from revenue and profit!
        if (!isReturned) {
          // If sold today
          if (saleDate >= startOfToday) {
            todaySales += Number(s.sellPrice) || 0;
            todayProfit += Number(s.profit) || 0;
          }

          // If within the last 7 days for the chart
          if (saleDate >= sevenDaysAgo) {
            const dayData = dailyData.find(x => isSameDay(x.date, saleDate));
            if (dayData) {
              dayData.profit += Number(s.profit) || 0;
            }
          }
        }
      });

      setStats({
        netProfit: todayProfit,
        totalStock,
        todaySales,
        totalStockValue,
      });

      setChartData(dailyData.map(d => ({ name: d.name, profit: d.profit })));

      // Sort activities newest first and take top 5
      activities.sort((a, b) => b.date.getTime() - a.date.getTime());
      setRecentActivity(activities.slice(0, 5));

      if (mobilesLoaded && salesLoaded) {
        setLoading(false);
      }
    };

    const unsubStock = onSnapshot(stockQuery, (snapshot) => {
      currentMobiles = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      mobilesLoaded = true;
      recalculateDashboard();
    }, (err) => {
      console.error("Error listening to mobiles stock:", err);
      mobilesLoaded = true;
      setLoading(false);
    });

    const unsubSales = onSnapshot(salesQuery, (snapshot) => {
      currentSales = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      salesLoaded = true;
      recalculateDashboard();
    }, (err) => {
      console.error("Error listening to sales:", err);
      salesLoaded = true;
      setLoading(false);
    });

    return () => {
      unsubStock();
      unsubSales();
    };
  }, []);

  const formatTimeAgo = (date: Date) => {
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 60000);
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const hasChartData = chartData.some(d => d.profit !== 0);

  return (
    <div className="space-y-6 sm:space-y-8 pb-8">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Here's what's happening in your shop today.</p>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: "Today's Profit", 
            value: stats.netProfit, 
            prefix: 'Rs. ', 
            icon: TrendingUp, 
            color: 'bg-forest',
            trend: '+0%',
            isPositive: stats.netProfit >= 0,
            note: 'Mobile Sales Profit'
          },
          { 
            label: 'Total Stock Items', 
            value: stats.totalStock, 
            icon: Package, 
            color: 'bg-emerald-600',
            trend: '+0',
            isPositive: true
          },
          { 
            label: "Today's Sales", 
            value: stats.todaySales, 
            prefix: 'Rs. ', 
            icon: DollarSign, 
            color: 'bg-green-500',
            trend: '+0%',
            isPositive: true
          },
          { 
            label: 'Total Stock Valuation', 
            value: stats.totalStockValue, 
            prefix: 'Rs. ', 
            icon: BarChart3, 
            color: 'bg-amber-500',
            trend: '0',
            isPositive: true,
            note: 'Cost value of stock'
          }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="bg-white rounded-2xl p-4 sm:p-6 shadow-card hover:shadow-card-hover transition-shadow relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-md text-white ${stat.color}`}>
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-gray-500 text-xs sm:text-sm font-medium">{stat.label}</h3>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                <AnimatedCounter value={stat.value} prefix={stat.prefix} />
              </p>
              {stat.note && (
                <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wide truncate">{stat.note}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* CHART */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 shadow-card"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">7-Day Profit Trend</h2>
          </div>
          
          <div className="h-[250px] sm:h-[300px] w-full flex items-center justify-center relative">
            {!hasChartData && !loading ? (
              <div className="text-center text-gray-400 flex flex-col items-center">
                <BarChart3 className="w-12 h-12 mb-3 opacity-20" />
                <p>No sales yet — profit trend will appear here</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `Rs.${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1B4332', borderRadius: '12px', border: 'none', color: 'white', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}
                    itemStyle={{ color: '#10B981' }}
                    formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Profit']}
                  />
                  <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* ACTIVITY FEED */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-white rounded-2xl p-4 sm:p-6 shadow-card flex flex-col"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-6">Recent Activity</h2>
          
          <div className="flex-1 space-y-6">
            {recentActivity.length === 0 && !loading ? (
              <p className="text-sm text-gray-400 text-center py-8">No recent activity.</p>
            ) : (
              recentActivity.map((activity, i) => (
                <motion.div 
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + (i * 0.1) }}
                  className="flex items-start gap-4"
                >
                  <div className={`w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 ${activity.color}`}>
                    <activity.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{activity.desc}</p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatTimeAgo(activity.date)}
                    </p>
                  </div>
                  <div className={`text-sm font-bold whitespace-nowrap ${activity.amount >= 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {activity.amount >= 0 ? '+' : ''}Rs. {Math.abs(activity.amount).toLocaleString()}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <button onClick={() => navigate('/mobile-sales')} className="w-full mt-6 py-2.5 text-sm font-medium text-forest bg-surface-3 hover:bg-forest/10 rounded-xl transition-colors">
            View All Activity
          </button>
        </motion.div>

      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Purchase Mobile', icon: Plus, color: 'bg-forest', path: '/purchase-mobile' },
          { label: 'Stock & Sell', icon: Smartphone, color: 'bg-emerald-600', path: '/mobiles-stock' },
          { label: 'Sales Record', icon: TrendingUp, color: 'bg-amber-600', path: '/mobile-sales' },
          { label: 'Khata Ledger', icon: BookOpen, color: 'bg-gray-800', path: '/khata' },
        ].map((action, i) => (
          <motion.div
            key={i}
            onClick={() => navigate(action.path)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + (i * 0.1) }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`cursor-pointer rounded-xl p-4 ${action.color} shadow-lg hover:shadow-xl transition-all flex items-center gap-3 text-white`}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <action.icon className="w-5 h-5" />
            </div>
            <span className="font-semibold text-sm">{action.label}</span>
          </motion.div>
        ))}
      </div>

    </div>
  );
}

