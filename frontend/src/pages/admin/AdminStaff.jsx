import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiEdit2, FiX, FiCheckCircle, FiUserPlus } from 'react-icons/fi';
import { TableSkeleton } from '../../components/Skeleton';

const AdminStaff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add, edit
  const [currentId, setCurrentId] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('sales');
  const [status, setStatus] = useState('active');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/staff');
      setStaff(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleOpenAdd = () => {
    setName('');
    setMobile('');
    setEmail('');
    setRole('sales');
    setStatus('active');
    setModalMode('add');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (member) => {
    setModalMode('edit');
    setCurrentId(member._id);
    setName(member.name);
    setMobile(member.mobile);
    setEmail(member.email || '');
    setRole(member.role);
    setStatus(member.status || 'active');
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!mobile || !role) {
      setError('Mobile and Role are required.');
      return;
    }

    const payload = { name, mobile, email, role, status };

    try {
      if (modalMode === 'add') {
        await api.post('/staff', payload);
        setMessage('Staff member created/promoted successfully!');
      } else {
        await api.put(`/staff/${currentId}`, payload);
        setMessage('Staff member details updated successfully!');
      }
      setShowModal(false);
      loadStaff();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const getRoleColor = (r) => {
    switch (r) {
      case 'admin': return 'bg-red-50 text-red-600 border border-red-100';
      case 'manager': return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'sales': return 'bg-purple-50 text-purple-600 border border-purple-100';
      case 'inventory': return 'bg-amber-50 text-amber-600 border border-amber-100';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="space-y-6 text-xs">
      
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">Staff Management</h1>
          <p className="text-xs text-slate-400">Configure outlet staff profiles and allocate role permissions</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-primary-700 hover:bg-primary-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow"
        >
          <FiUserPlus /> Add Staff Member
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 border p-4 rounded-xl text-xs font-bold">{error}</div>}
      {message && <div className="bg-emerald-50 text-emerald-600 border p-4 rounded-xl text-xs font-bold">{message}</div>}

      {/* Staff table */}
      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : staff.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Mobile Number</th>
                  <th className="py-4 px-6">Role Authority</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                {staff.map((member) => (
                  <tr key={member._id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6">
                      <strong className="text-slate-800 dark:text-white text-sm">{member.name}</strong>
                      {member.email && <p className="text-[10px] text-slate-450">{member.email}</p>}
                    </td>
                    <td className="py-4 px-6 font-mono font-semibold">
                      {member.mobile}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                        member.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {member.status || 'active'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleOpenEdit(member)}
                        className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                        title="Edit Permissions"
                      >
                        <FiEdit2 className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400 py-12 text-center select-none bg-white rounded-3xl border border-dashed">No staff members configured.</p>
      )}

      {/* Staff modal dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 rounded-3xl max-w-sm w-full p-6 space-y-6 border shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <FiX className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase border-b pb-3">
              {modalMode === 'add' ? 'Register Staff' : 'Modify Staff Role'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Staff Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g. Shib Charan"
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  disabled={modalMode === 'edit'}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Enter 10-digit mobile"
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Role Permission *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                >
                  <option value="admin">Administrator / Owner</option>
                  <option value="manager">Manager</option>
                  <option value="sales">Sales Desk Staff</option>
                  <option value="inventory">Inventory Desk Staff</option>
                  {modalMode === 'edit' && <option value="customer">Demote to Customer</option>}
                </select>
              </div>

              {modalMode === 'edit' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Account Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="block w-full px-3 py-2 border rounded-xl dark:bg-slate-800"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive (Deactivated)</option>
                  </select>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow"
                >
                  Confirm Staff Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminStaff;
