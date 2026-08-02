import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';
import {
  FiDollarSign, FiShoppingBag, FiInbox, FiTrendingUp,
  FiUsers, FiAlertCircle, FiTrendingDown, FiPackage, FiArrowRight
} from 'react-icons/fi';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { TableSkeleton } from '../../components/Skeleton';

// Register ChartJS plugins
ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend
);

const Dashboard = () => {
  const { settings } = useSettings();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/analytics');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const currency = settings?.currency || '₹';

  if (loading || !stats) return <TableSkeleton rows={5} cols={4} />;

  // Sales Trend line graph datasets
  const trendData = {
    labels: stats.salesTrend.map(t => t.date),
    datasets: [
      {
        label: 'Daily Sales Amount',
        data: stats.salesTrend.map(t => t.sales),
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const cardsList = [
    {
      title: "Today's Sales",
      value: `${currency}${stats.today.sales.toFixed(2)}`,
      icon: <FiDollarSign />,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      link: '/admin/orders'
    },
    {
      title: "Today's Orders",
      value: stats.today.orders,
      icon: <FiShoppingBag />,
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      link: '/admin/orders'
    },
    {
      title: "Awaiting Pickups",
      value: stats.today.ready,
      icon: <FiTrendingUp />,
      color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      link: '/admin/orders?status=Ready for Pickup'
    },
    {
      title: "Wholesale Requests",
      value: stats.today.wholesale,
      icon: <FiInbox />,
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      link: '/admin/wholesale'
    },
    {
      title: "Total Customers",
      value: stats.today.customers,
      icon: <FiUsers />,
      color: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
      link: '/admin/audit-logs' // placeholder links
    },
    {
      title: "Low Stock Items",
      value: stats.today.lowStock,
      icon: <FiAlertCircle />,
      color: stats.today.lowStock > 0 ? 'bg-red-500/10 text-red-600 border-red-500/20 animate-pulse' : 'bg-slate-500/10 text-slate-600 border-slate-500/20',
      link: '/admin/inventory'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">Dashboard Overview</h1>
        <p className="text-xs text-slate-400">Welcome back! Here is a summary of today's poultry sales aggregates.</p>
      </div>

      {/* Stats Widgets Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {cardsList.map((card, idx) => (
          <Link
            key={idx}
            to={card.link}
            className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between h-36 shadow-sm hover:shadow-md transition-shadow ${card.color}`}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.title}</span>
              <span className="text-xl p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-800">{card.icon}</span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mt-3">
              {card.value}
            </h3>
          </Link>
        ))}
      </div>

      {/* Main Charts & Top list split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Graph bar panel */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">7-Day Sales Aggregate Trend</h3>
          <div className="h-64 flex items-center justify-center">
            <Line data={trendData} options={chartOptions} />
          </div>
        </div>

        {/* Top selling items panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top Selling Products</h3>
            
            {stats.topProducts.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-3">
                {stats.topProducts.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="h-6 w-6 rounded-lg bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <strong className="text-slate-800 dark:text-white">{p._id}</strong>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-bold text-slate-800 dark:text-white">{currency}{p.totalSales.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-400">{p.totalQuantity} units sold</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-12 text-center select-none">No sales recorded yet.</p>
            )}
          </div>
          
          <Link
            to="/admin/products"
            className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 mt-4 justify-end hover:underline"
          >
            Manage Products <FiArrowRight />
          </Link>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
