import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendorStore } from '../../../stores/vendorStore';
import { Button } from '../../../components/ui/Button';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';

export function VendorNotificationsPage() {
  const navigate = useNavigate();
  const getCurrentVendor = useVendorStore((s) => s.getCurrentVendor);
  const notifications = useVendorStore((s) => s.notifications);
  const markNotificationRead = useVendorStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useVendorStore((s) => s.markAllNotificationsRead);

  const currentVendor = getCurrentVendor();
  const [filterType, setFilterType] = useState('all'); // 'all', 'unread'

  const vendorNotifications = notifications.filter(
    (n) => n.vendorId === currentVendor?.id || n.vendorId === null
  );

  const filtered = vendorNotifications.filter((n) => {
    if (filterType === 'unread') return !n.read;
    return true;
  });

  const unreadCount = vendorNotifications.filter((n) => !n.read).length;

  const handleOpenOrder = (notif) => {
    markNotificationRead(notif.id);
    if (notif.orderId) {
      navigate(`/vendor/orders/${notif.orderId}`);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Vendor Notifications & Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Production updates, administrative approvals, rejection remarks, and deadline reminders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={CheckCheck}
              onClick={() => markAllNotificationsRead(currentVendor?.id)}
            >
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${
            filterType === 'all'
              ? 'bg-primary text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All ({vendorNotifications.length})
        </button>
        <button
          onClick={() => setFilterType('unread')}
          className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${
            filterType === 'unread'
              ? 'bg-primary text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <Bell size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">You're all caught up!</p>
            <p className="text-xs text-slate-500">
              There are no {filterType === 'unread' ? 'unread' : ''} notifications for your vendor account.
            </p>
          </div>
        ) : (
          filtered.map((notif) => {
            const isSuccess = notif.type === 'success';
            const isError = notif.type === 'error';
            const isWarning = notif.type === 'warning';

            return (
              <div
                key={notif.id}
                onClick={() => handleOpenOrder(notif)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                  !notif.read
                    ? 'bg-white dark:bg-slate-900 border-primary/40 shadow-xs ring-1 ring-primary/10'
                    : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSuccess
                        ? 'bg-emerald-100 text-emerald-700'
                        : isError
                        ? 'bg-rose-100 text-rose-700'
                        : isWarning
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {isSuccess ? (
                      <CheckCircle2 size={18} />
                    ) : isError ? (
                      <AlertCircle size={18} />
                    ) : isWarning ? (
                      <AlertTriangle size={18} />
                    ) : (
                      <Bell size={18} />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                        {notif.title}
                      </h3>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                      {notif.orderNumber && (
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-primary">
                          {notif.orderNumber}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span>{notif.date}</span>
                      {notif.stageName && (
                        <>
                          <span>•</span>
                          <span>Stage: <strong>{notif.stageName}</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markNotificationRead(notif.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    title={notif.read ? 'Already read' : 'Mark as read'}
                  >
                    <CheckCheck size={14} className={notif.read ? 'text-emerald-500' : 'text-slate-400'} />
                  </button>
                  <ArrowRight size={14} className="text-slate-400" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default VendorNotificationsPage;
