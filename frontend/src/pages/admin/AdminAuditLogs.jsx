import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiClipboard, FiClock, FiUser, FiInfo } from 'react-icons/fi';
import { TableSkeleton } from '../../components/Skeleton';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/audit-logs?search=${searchTerm}`);
      setLogs(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadAuditLogs();
  };

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionBadge = (act) => {
    if (act.includes('CREATED')) return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    if (act.includes('DELETED')) return 'bg-red-50 text-red-600 border border-red-100';
    if (act.includes('PRICE')) return 'bg-amber-50 text-amber-600 border border-amber-100';
    if (act.includes('STOCK')) return 'bg-purple-50 text-purple-600 border border-purple-100';
    return 'bg-slate-50 text-slate-600 border border-slate-200';
  };

  return (
    <div className="space-y-6 text-xs">
      
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">System Audit Logs</h1>
        <p className="text-xs text-slate-400">Chronological trail of catalog changes, price updates, stock transactions and role modifications</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 border p-4 rounded-xl text-xs font-bold">{error}</div>}

      {/* Search box logs */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter details (e.g. Broiler)..."
          className="flex-1 px-3 py-2 border rounded-xl dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none"
        />
        <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl uppercase">
          Filter
        </button>
      </form>

      {/* Logs timeline list */}
      {loading ? (
        <TableSkeleton rows={5} cols={3} />
      ) : logs.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-4">
            {logs.map((log) => (
              <div key={log._id} className="pt-4 first:pt-0 flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wide ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-450 flex items-center gap-1"><FiClock /> {formatDateTime(log.createdAt)}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-350 text-xs font-semibold leading-relaxed">
                    {log.details}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-[10px] shrink-0 text-slate-500">
                  <FiUser className="text-primary-600" />
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300">{log.performedBy?.name}</strong>
                    <p className="uppercase text-[8px] font-black tracking-wide text-slate-400">{log.performedBy?.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400 py-12 text-center select-none bg-white rounded-3xl border border-dashed">No audit logs match current search parameters.</p>
      )}

    </div>
  );
};

export default AdminAuditLogs;
