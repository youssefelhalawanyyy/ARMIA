'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Lock,
  Mail,
  Phone,
  User,
  Shield,
  KeyRound,
  AlertTriangle,
  X,
  CheckCircle2,
  Check,
  Search,
  Users,
} from 'lucide-react';
import {
  getAllAdminUsers,
  createNewAdminUser,
  deleteAdminUser,
  updateAdminUserTitle,
  AdminUserRecord,
} from '@/lib/adminUserService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { success, error, info } = useToast();

  const [admins, setAdmins] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Admin Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    adminTitle: 'Store Manager',
  });

  // Delete Confirmation Modal State
  const [adminToDelete, setAdminToDelete] = useState<AdminUserRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllAdminUsers();
      setAdmins(data);
    } catch (err) {
      console.error('Error fetching admins:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getAllAdminUsers()
      .then((data) => {
        if (isMounted) {
          setAdmins(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error loading admins:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.displayName.trim()) {
      error('Full Name is required.');
      return;
    }
    if (!formData.email.trim()) {
      error('Email address is required.');
      return;
    }
    if (formData.password.length < 6) {
      error('Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      error('Passwords do not match.');
      return;
    }

    setCreating(true);
    try {
      const created = await createNewAdminUser({
        email: formData.email.trim(),
        password: formData.password,
        displayName: formData.displayName.trim(),
        phone: formData.phone.trim() || undefined,
        adminTitle: formData.adminTitle,
        createdByUid: currentUser?.uid,
      });

      success(
        `Admin account created for ${created.displayName}! They can now log in at /admin/login.`,
        'Admin Created'
      );

      setAdmins((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setFormData({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        adminTitle: 'Store Manager',
      });
    } catch (err: unknown) {
      console.error('Error creating admin user:', err);
      const e = err as { message?: string; code?: string };
      if (e.code === 'auth/email-already-in-use') {
        error('This email is already registered in Firebase. Please use another email.');
      } else {
        error('Failed to create admin user: ' + (e.message || 'Error occurred'));
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;

    if (adminToDelete.uid === currentUser?.uid) {
      error('Security Error: You cannot delete your own active administrator account.');
      setAdminToDelete(null);
      return;
    }

    setDeleting(true);
    try {
      await deleteAdminUser(adminToDelete.uid);
      success(
        `Admin privileges revoked for ${adminToDelete.displayName || adminToDelete.email}.`,
        'Admin Removed'
      );
      setAdmins((prev) => prev.filter((a) => a.uid !== adminToDelete.uid));
      setAdminToDelete(null);
    } catch (err: unknown) {
      console.error('Error deleting admin:', err);
      const e = err as { message?: string };
      error('Failed to remove admin: ' + (e.message || 'Error occurred'));
    } finally {
      setDeleting(false);
    }
  };

  const filteredAdmins = admins.filter((admin) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      (admin.displayName && admin.displayName.toLowerCase().includes(q)) ||
      (admin.email && admin.email.toLowerCase().includes(q)) ||
      (admin.adminTitle && admin.adminTitle.toLowerCase().includes(q)) ||
      (admin.phone && admin.phone.includes(q))
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#B67355]">
            Access Control & Team Credentials
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
            Admin Team & Access Management
          </h1>
          <p className="text-xs text-[#8E8A85]">
            Manage authorized boutique team members, assign operational roles, and create new admin credentials synced directly with Firebase Authentication.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-[#B67355] text-white px-4 py-2 text-xs uppercase tracking-wider font-bold hover:bg-[#DCC9A6] hover:text-[#1F1F1F] transition-all shadow-md rounded"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New Admin</span>
          </button>

          <button
            onClick={loadAdmins}
            className="inline-flex items-center gap-2 bg-[#1F1F1F] border border-[#333333] text-[#DCC9A6] px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#2A2A2A] transition-colors rounded"
          >
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1F1F1F] border border-[#333333] p-5 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#8E8A85]">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Total Administrators</span>
            <Users className="w-4 h-4 text-[#DCC9A6]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-white">
            {admins.length} Admins
          </p>
          <span className="text-[10px] text-emerald-400 block">
            With active portal permissions
          </span>
        </div>

        <div className="bg-[#1F1F1F] border border-[#333333] p-5 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#8E8A85]">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Super Administrators</span>
            <ShieldCheck className="w-4 h-4 text-[#B67355]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-white">
            {admins.filter((a) => a.isSuperAdmin).length}
          </p>
          <span className="text-[10px] text-[#8E8A85] block">
            Executive atelier credentials
          </span>
        </div>

        <div className="bg-[#1F1F1F] border border-[#333333] p-5 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#8E8A85]">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Security Protocol</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-serif text-emerald-400">
            Firebase Auth 256-Bit
          </p>
          <span className="text-[10px] text-[#8E8A85] block">
            Role-guarded route middleware
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#1F1F1F] border border-[#333333] p-4 shadow-sm rounded-xl">
        <div className="relative">
          <input
            type="text"
            placeholder="Search admins by name, email address, operational role, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141414] border border-[#333333] text-white px-4 py-2.5 pl-10 text-xs focus:outline-none focus:border-[#DCC9A6] rounded"
          />
          <Search className="w-4 h-4 text-[#8E8A85] absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-[#1F1F1F] border border-[#333333] overflow-hidden shadow-sm rounded-xl">
        {loading ? (
          <div className="py-16 text-center text-[#8E8A85] text-xs">
            <div className="w-8 h-8 border-2 border-[#DCC9A6] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p>Loading administrator directory...</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Shield className="w-10 h-10 text-[#8E8A85] mx-auto mb-2" />
            <p className="font-serif text-base text-[#DCC9A6]">No administrators found</p>
            <p className="text-xs text-[#8E8A85]">Click "+ Create New Admin" to add your team members.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#141414] border-b border-[#333333] text-[#8E8A85] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Administrator</th>
                  <th className="py-3.5 px-4">Email Credentials</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Role & Privileges</th>
                  <th className="py-3.5 px-4">Added On</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {filteredAdmins.map((admin) => {
                  const initial = (admin.displayName?.[0] || admin.email?.[0] || 'A').toUpperCase();
                  const isCurrent = admin.uid === currentUser?.uid;

                  return (
                    <tr key={admin.uid} className="hover:bg-[#252525] transition-colors">
                      {/* Name & Initial */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#B67355] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                            {initial}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-white">
                                {admin.displayName}
                              </p>
                              {isCurrent && (
                                <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  You (Active)
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#8E8A85] font-mono block">
                              UID: {admin.uid.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-4 font-mono text-neutral-200">
                        {admin.email}
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-4 text-[#8E8A85]">
                        {admin.phone || '-'}
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                          admin.isSuperAdmin
                            ? 'bg-[#DCC9A6]/20 text-[#DCC9A6] border border-[#DCC9A6]/40'
                            : 'bg-[#B67355]/20 text-[#DCC9A6] border border-[#B67355]/40'
                        }`}>
                          <ShieldCheck className="w-3 h-3" />
                          <span>{admin.adminTitle || 'Store Manager'}</span>
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="py-4 px-4 text-[#8E8A85] text-[11px]">
                        {typeof admin.createdAt === 'string'
                          ? new Date(admin.createdAt).toLocaleDateString('en-GB')
                          : 'Active Member'}
                      </td>

                      {/* Delete Action */}
                      <td className="py-4 px-4 text-right">
                        {!isCurrent ? (
                          <button
                            type="button"
                            onClick={() => setAdminToDelete(admin)}
                            className="inline-flex items-center gap-1 bg-red-950/40 hover:bg-red-900 border border-red-800 text-red-300 px-3 py-1.5 text-xs font-bold rounded transition-colors"
                            title="Delete Admin User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        ) : (
                          <span className="text-neutral-500 text-[10px] italic">Active Session</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: CREATE NEW ADMIN USER */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#1F1F1F] border border-[#333333] p-6 sm:p-8 shadow-2xl rounded-2xl text-white space-y-6">
            
            <div className="flex items-center justify-between border-b border-[#333333] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#B67355] flex items-center justify-center text-white">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#B67355]">
                    New Credentials
                  </span>
                  <h3 className="font-serif text-xl font-bold text-white mt-0.5">
                    Create New Administrator
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-[#8E8A85] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
              {/* Full Name */}
              <div>
                <label className="block text-[#8E8A85] uppercase tracking-wider font-bold mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="e.g. Sarah Mansour"
                    className="w-full bg-[#141414] border border-[#333333] text-white px-3.5 py-2.5 pl-10 rounded text-xs focus:outline-none focus:border-[#DCC9A6]"
                  />
                  <User className="w-4 h-4 text-[#8E8A85] absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[#8E8A85] uppercase tracking-wider font-bold mb-1.5">
                  Admin Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. sarah.manager@armiaboutique.com"
                    className="w-full bg-[#141414] border border-[#333333] text-white px-3.5 py-2.5 pl-10 rounded text-xs focus:outline-none focus:border-[#DCC9A6]"
                  />
                  <Mail className="w-4 h-4 text-[#8E8A85] absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8E8A85] uppercase tracking-wider font-bold mb-1.5">
                    Password (Min. 6 chars) *
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-[#141414] border border-[#333333] text-white px-3.5 py-2.5 pl-10 rounded text-xs focus:outline-none focus:border-[#DCC9A6]"
                    />
                    <Lock className="w-4 h-4 text-[#8E8A85] absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-[#8E8A85] uppercase tracking-wider font-bold mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-[#141414] border border-[#333333] text-white px-3.5 py-2.5 pl-10 rounded text-xs focus:outline-none focus:border-[#DCC9A6]"
                    />
                    <KeyRound className="w-4 h-4 text-[#8E8A85] absolute left-3.5 top-3" />
                  </div>
                </div>
              </div>

              {/* Operational Role Title */}
              <div>
                <label className="block text-[#8E8A85] uppercase tracking-wider font-bold mb-1.5">
                  Administrative Role & Title
                </label>
                <select
                  value={formData.adminTitle}
                  onChange={(e) => setFormData({ ...formData, adminTitle: e.target.value })}
                  className="w-full bg-[#141414] border border-[#333333] text-white px-3.5 py-2.5 rounded text-xs focus:outline-none focus:border-[#DCC9A6] cursor-pointer font-semibold"
                >
                  <option value="Store Manager">Store Manager (مدير المتجر)</option>
                  <option value="Orders & Logistics Admin">Orders & Logistics Admin (إدارة الطلبات والشحن)</option>
                  <option value="Inventory & Products Specialist">Inventory & Products Specialist (إدارة المنتجات والمخزون)</option>
                  <option value="Customer Support Concierge">Customer Support Concierge (خدمة العملاء والواتساب)</option>
                  <option value="Super Administrator">Super Administrator (مدير تنفيذي)</option>
                </select>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[#8E8A85] uppercase tracking-wider font-bold mb-1.5">
                  Contact Mobile Number (Optional)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="010XXXXXXXX"
                    className="w-full bg-[#141414] border border-[#333333] text-white px-3.5 py-2.5 pl-10 rounded text-xs focus:outline-none focus:border-[#DCC9A6]"
                  />
                  <Phone className="w-4 h-4 text-[#8E8A85] absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#333333]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-[#141414] border border-[#333333] text-[#8E8A85] hover:text-white px-4 py-2.5 rounded text-xs uppercase tracking-wider font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="bg-[#B67355] hover:bg-[#DCC9A6] hover:text-[#1F1F1F] text-white px-6 py-2.5 rounded text-xs uppercase tracking-wider font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{creating ? 'Creating Account in Firebase...' : 'Create Admin Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE ADMIN USER CONFIRMATION */}
      {adminToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#1F1F1F] border border-red-800 p-6 sm:p-8 shadow-2xl rounded-2xl text-white space-y-5">
            <div className="w-12 h-12 rounded-full bg-red-950 border border-red-800 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-serif text-lg font-bold text-white">
                Revoke Admin Access?
              </h3>
              <p className="text-xs text-[#CCCCCC]">
                Are you sure you want to remove administrator privileges for{' '}
                <strong className="text-white">{adminToDelete.displayName}</strong> ({adminToDelete.email})?
              </p>
              <p className="text-[11px] text-red-400 mt-2">
                This user will no longer be able to log into the ARMIA Admin Portal.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3 border-t border-[#333333]">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setAdminToDelete(null)}
                className="bg-[#141414] border border-[#333333] text-[#8E8A85] hover:text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold rounded"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteAdmin}
                className="bg-red-900 hover:bg-red-800 text-white px-5 py-2 text-xs uppercase tracking-wider font-bold rounded shadow-md transition-colors disabled:opacity-50"
              >
                {deleting ? 'Revoking Access...' : 'Yes, Revoke Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
