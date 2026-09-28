import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Search, Filter, Calendar, Layers, ArrowRight,
  ShieldCheck, RefreshCw, CheckCircle2, Clock, AlertTriangle,
  Building2, Sparkles, FolderOpen, Plus, ExternalLink,
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { fetchCustomerProjects } from '../../../services/customerTrackingService';
import { useAppStore } from '../../../stores/appStore';

function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function CustomerProjectsListPage() {
  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.currentUser);

  const isCustomer = Boolean(
    currentUser?.isCustomer ||
    currentUser?.role?.code === 'CU' ||
    String(currentUser?.role?.name || currentUser?.role || '').toLowerCase() === 'customer'
  );

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadProjects = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const rows = await fetchCustomerProjects();
      setProjects(rows || []);
    } catch (err) {
      console.error('Failed to load customer projects:', err);
      setError(err?.message || 'Unable to retrieve projects. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.productName && p.productName.toLowerCase().includes(q)) ||
        (p.orderNumber && String(p.orderNumber).toLowerCase().includes(q)) ||
        (p.customerName && p.customerName.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'IN_PROGRESS' && p.status !== 'Completed' && p.status !== 'Cancelled') ||
        (statusFilter === 'COMPLETED' && p.status === 'Completed') ||
        (statusFilter === 'DELAYED' && p.status === 'Delayed');

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  return (
    <div className="space-y-5">
      {/* ── Page Header (Canonical ERP System Header) ── */}
      <PageHeader
        title={isCustomer ? 'My Orders & Projects' : 'Customer Project Tracking'}
        subtitle={
          isCustomer
            ? 'Real-time e-commerce progress tracking for your custom manufactured products and orders.'
            : 'Customer-facing milestone pipeline, dynamic stage weights, safe delivery timelines, and proofs.'
        }
        breadcrumb={
          isCustomer
            ? [{ label: 'Track Orders', path: '/customer/projects' }]
            : [
                { label: 'PMS', path: '/pms' },
                { label: 'Customer Tracking', path: '/customer/projects' },
              ]
        }
        actions={
          <div className="flex items-center gap-2">
            {!isCustomer && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/pms/projects')}
              >
                <Layers size={14} className="mr-1.5 text-slate-500" />
                <span>All PMS Projects</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadProjects(true)}
              disabled={refreshing}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin mr-1.5' : 'mr-1.5'} />
              <span>Refresh</span>
            </Button>
          </div>
        }
      />

      {/* ── Filters & Search ── */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, project code, or product name..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Projects' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'DELAYED', label: 'Delayed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Projects Grid ── */}
      {loading ? (
        <div className="min-h-[35vh] flex flex-col items-center justify-center p-6 text-slate-500">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mb-3" />
          <p className="text-xs font-semibold text-slate-700">Loading projects...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
          <AlertTriangle size={32} className="text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => loadProjects()}>
            Try Again
          </Button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            {isCustomer ? <FolderOpen size={24} /> : <Layers size={24} />}
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {isCustomer ? 'No Orders or Projects Found' : 'No Customer Projects Found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            {search || statusFilter !== 'ALL'
              ? 'No projects match your current search and filter criteria.'
              : isCustomer
              ? 'There are currently no active manufacturing projects assigned to your account. If you placed an order recently, please contact your account manager.'
              : 'There are currently no projects in PMS. Create a new project in the PMS module or convert a sales order to preview customer tracking.'}
          </p>
          {!isCustomer && !search && statusFilter === 'ALL' && (
            <div className="mt-5 flex items-center justify-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/pms/projects')}
              >
                <Plus size={14} className="mr-1.5" />
                Go to PMS Projects
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => {
            const overallPct = p.overallCompletionPct ?? 0;
            return (
              <div
                key={p.id}
                onClick={() => navigate(`/customer/projects/${p.id}`)}
                className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                      {p.code}
                    </span>
                    <StatusBadge status={p.status || 'In Progress'} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {p.productName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      {p.customerName && (
                        <span className="truncate max-w-[180px] font-medium text-slate-600">
                          {p.customerName}
                        </span>
                      )}
                      {p.orderNumber && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-slate-500">
                            #{p.orderNumber}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress & Current Stage */}
                  <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Progress</span>
                      <strong className="text-slate-900 font-extrabold">{overallPct}%</strong>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, overallPct))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>Current: <strong>{p.currentStage?.name || 'In Production'}</strong></span>
                      <span>{p.stagesCount || 0} stages</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar size={13} className="text-slate-400" />
                    <span>Est: {formatDate(p.expectedDeliveryDate)}</span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                    <span>Track</span>
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
