
import React, { useState, useMemo } from 'react';
import { 
  Users as UsersIcon, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  MoreHorizontal,
  Mail,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  Plus,
  X,
  Edit2,
  Power
} from 'lucide-react';
import { INITIAL_USERS } from '../mockData';
import { AccountStatus, User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLanguage } from '../LanguageContext';

// --- Utility for Tailwind classes ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Users: React.FC = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    status: AccountStatus.ENABLED,
    department: ''
  });

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.status === AccountStatus.ENABLED).length,
      lockedOrDisabled: users.filter(u => u.status === AccountStatus.DISABLED || u.status === AccountStatus.LOCKED).length
    };
  }, [users]);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      status: AccountStatus.ENABLED,
      department: ''
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // Don't show password
      status: user.status,
      department: user.department || ''
    });
    setIsAddModalOpen(true);
  };

  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === AccountStatus.ENABLED ? AccountStatus.DISABLED : AccountStatus.ENABLED;
    setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { 
        ...u, 
        username: formData.username,
        email: formData.email,
        status: formData.status,
        department: formData.department,
        // Only update password if provided
        ...(formData.password ? { password: formData.password } : {})
      } : u));
    } else {
      const newUser: User = {
        id: `U${(users.length + 1).toString().padStart(3, '0')}`,
        ...formData,
        lastLogin: '-'
      };
      setUsers([newUser, ...users]);
    }
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute right-[-10px] top-[-10px] opacity-[0.03] rotate-12">
            <UsersIcon size={100} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.users.totalUsers}</p>
          <h3 className="text-3xl font-black text-[#54585a]">{stats.total} <span className="text-sm font-bold text-gray-400">{t.users.person}</span></h3>
          <p className="text-[10px] font-bold text-gray-400 mt-2">{t.users.totalUsersDesc}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute right-[-10px] top-[-10px] opacity-[0.03] rotate-12">
            <ShieldCheck size={100} className="text-[#9CB13A]" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.users.activeUsers}</p>
          <h3 className="text-3xl font-black text-[#9CB13A]">{stats.active} <span className="text-sm font-bold text-gray-400">{t.users.person}</span></h3>
          <p className="text-[10px] font-bold text-[#9CB13A]/60 mt-2">{t.users.activeUsersDesc}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute right-[-10px] top-[-10px] opacity-[0.03] rotate-12">
            <ShieldAlert size={100} className="text-red-500" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.users.lockedDisabled}</p>
          <h3 className="text-3xl font-black text-red-500">{stats.lockedOrDisabled} <span className="text-sm font-bold text-gray-400">{t.users.person}</span></h3>
          <p className="text-[10px] font-bold text-red-500/60 mt-2">{t.users.lockedDisabledDesc}</p>
        </div>
      </div>

      {/* User List & Search */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder={t.users.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#9CB13A] outline-none"
            />
          </div>
          <button 
            onClick={handleOpenAddModal}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#54585A] text-white px-6 py-2.5 rounded-2xl font-black text-sm hover:bg-[#444749] transition-all shadow-sm active:scale-95"
          >
            <UserPlus size={18} />
            {t.users.addUser}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.users.username}</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.users.status}</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.users.department}</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.users.lastLogin}</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t.users.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-black text-xs">
                        {user.username.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-800">{user.username}</p>
                        <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                          <Mail size={10} /> {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${
                      user.status === AccountStatus.ENABLED 
                        ? 'bg-[#1DD793]/10 text-[#1DD793] border border-[#1DD793]/20' 
                        : user.status === AccountStatus.LOCKED
                        ? 'bg-red-50 text-red-600 border border-red-100'
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}>
                      {user.status === AccountStatus.ENABLED && <CheckCircle2 size={12} />}
                      {user.status === AccountStatus.DISABLED && <XCircle size={12} />}
                      {user.status === AccountStatus.LOCKED && <Lock size={12} />}
                      {user.status === AccountStatus.ENABLED ? t.users.enabled : user.status === AccountStatus.DISABLED ? t.users.disabled : t.users.locked}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                      <Building2 size={14} className="text-gray-400" />
                      {user.department || t.users.unassigned}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                      <Clock size={14} />
                      {user.lastLogin}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end">
                      <button 
                        onClick={() => handleOpenEditModal(user)}
                        title={t.users.edit}
                        className="p-2 text-gray-400 hover:text-[#9CB13A] hover:bg-[#9CB13A]/10 rounded-xl transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden"
            >
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#9CB13A] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#9CB13A]/20">
                    {editingUser ? <Edit2 size={20} /> : <UserPlus size={20} />}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">{editingUser ? t.users.editAccount : t.users.addNewAccount}</h2>
                    <p className="text-xs font-bold text-gray-400">{editingUser ? t.users.editAccountDesc : t.users.addNewAccountDesc}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 hover:bg-white rounded-xl transition-all text-gray-400 hover:text-gray-600 shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.users.usernameLabel}</label>
                    <input 
                      required
                      type="text" 
                      placeholder={t.users.usernamePlaceholder}
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#9CB13A] outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.users.emailLabel}</label>
                    <input 
                      required
                      type="email" 
                      placeholder="example@kiwi.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#9CB13A] outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.users.passwordLabel}</label>
                    <input 
                      type="password" 
                      placeholder={t.users.passwordPlaceholder}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#9CB13A] outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.users.accountStatus}</label>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as AccountStatus})}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#9CB13A] outline-none transition-all appearance-none"
                      >
                        <option value={AccountStatus.ENABLED}>{t.users.enabled}</option>
                        <option value={AccountStatus.DISABLED}>{t.users.disabled}</option>
                        <option value={AccountStatus.LOCKED}>{t.users.locked}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.users.departmentLabel}</label>
                      <input 
                        type="text" 
                        placeholder={t.users.departmentPlaceholder}
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#9CB13A] outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-[#E7E6E6] text-gray-500 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all"
                  >
                    {t.users.cancel}
                  </button>
                  <button 
                    type="submit"
                    className="flex-2 px-12 py-3 bg-[#54585A] text-white rounded-2xl font-black text-sm hover:bg-[#444749] transition-all shadow-lg active:scale-95"
                  >
                    {editingUser ? t.users.confirmUpdate : t.users.confirmCreate}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;
