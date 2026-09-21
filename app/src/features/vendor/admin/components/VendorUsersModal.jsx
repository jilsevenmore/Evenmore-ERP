import React, { useState } from 'react';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { useVendorStore } from '../../../../stores/vendorStore';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Edit2,
  Trash2,
} from 'lucide-react';

export function VendorUsersModal({ isOpen, onClose, vendor }) {
  const vendorUsers = useVendorStore((s) => s.vendorUsers);
  const addVendorUser = useVendorStore((s) => s.addVendorUser);
  const updateVendorUser = useVendorStore((s) => s.updateVendorUser);
  const toggleVendorUserStatus = useVendorStore((s) => s.toggleVendorUserStatus);
  const resetVendorUserPassword = useVendorStore((s) => s.resetVendorUserPassword);

  const [isAdding, setIsAdding] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [feedback, setFeedback] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: 'Production Coordinator',
    role: 'Production Lead',
    password: 'password123',
  });

  if (!isOpen || !vendor) return null;

  const users = vendorUsers.filter((u) => u.vendorId === vendor.id);

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    if (editingUserId) {
      updateVendorUser(editingUserId, formData);
      setFeedback(`User ${formData.name} updated successfully!`);
    } else {
      addVendorUser(vendor.id, formData);
      setFeedback(`New contact ${formData.name} added to portal!`);
    }

    setIsAdding(false);
    setEditingUserId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      designation: 'Production Coordinator',
      role: 'Production Lead',
      password: 'password123',
    });
    setTimeout(() => setFeedback(''), 3000);
  };

  const startEdit = (user) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      designation: user.designation || 'Coordinator',
      role: user.role || 'Production Lead',
      password: user.password || 'password123',
    });
    setIsAdding(true);
  };

  const handleResetPassword = (userId, userName) => {
    resetVendorUserPassword(userId, 'password123');
    setFeedback(`Password for ${userName} reset to "password123"`);
    setTimeout(() => setFeedback(''), 3000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Vendor Portal Contacts & Users: ${vendor.name}`}
      subtitle={`Manage authorized portal logins and technical contacts for ${vendor.code}`}
      size="lg"
    >
      <div className="space-y-4 text-xs">
        {feedback && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback('')} className="text-emerald-600">✕</button>
          </div>
        )}

        {/* Header Action */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-200">
              Registered Contacts ({users.length})
            </p>
            <p className="text-[11px] text-slate-400">
              Each contact has distinct credentials to sign in and submit stage updates.
            </p>
          </div>

          {!isAdding && (
            <Button
              size="sm"
              icon={UserPlus}
              onClick={() => {
                setEditingUserId(null);
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  designation: 'Production Coordinator',
                  role: 'Production Lead',
                  password: 'password123',
                });
                setIsAdding(true);
              }}
            >
              Add Contact
            </Button>
          )}
        </div>

        {/* Add / Edit Form */}
        {isAdding && (
          <form onSubmit={handleCreateUser} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">
              {editingUserId ? 'Edit Vendor Contact' : 'Register New Vendor Contact'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address (Login ID) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh@vendor.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+91 98000 00000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Designation / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fabrication Lead"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Portal Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white dark:bg-slate-900 text-xs"
                >
                  <option value="Portal Admin">Portal Admin</option>
                  <option value="Production Lead">Production Lead</option>
                  <option value="QC Inspector">QC Inspector</option>
                  <option value="Dispatch Clerk">Dispatch Clerk</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Password
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white dark:bg-slate-900 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingUserId(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                {editingUserId ? 'Save Contact' : 'Create Contact'}
              </Button>
            </div>
          </form>
        )}

        {/* Users List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          {users.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              No contacts registered for this vendor. Click "Add Contact" to create login credentials.
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      user.status === 'Active'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                    }`}
                  >
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        {user.name}
                      </span>
                      <span
                        className={`px-2 py-0.2 rounded-full text-[10px] font-semibold ${
                          user.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {user.status}
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {user.role}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>{user.designation}</span>
                      <span>•</span>
                      <span className="font-mono text-primary">{user.email}</span>
                      {user.phone && (
                        <>
                          <span>•</span>
                          <span>{user.phone}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleResetPassword(user.id, user.name)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                    title="Reset dummy password to 'password123'"
                  >
                    <KeyRound size={13} />
                  </button>

                  <button
                    onClick={() => startEdit(user)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-primary hover:bg-slate-50 transition-colors cursor-pointer"
                    title="Edit contact"
                  >
                    <Edit2 size={13} />
                  </button>

                  <button
                    onClick={() => toggleVendorUserStatus(user.id)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      user.status === 'Active'
                        ? 'border border-rose-200 text-rose-600 hover:bg-rose-50'
                        : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default VendorUsersModal;
