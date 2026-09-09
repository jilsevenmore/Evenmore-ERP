import React, { useState } from 'react';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, AlertTriangle, UserCheck, ShieldCheck } from 'lucide-react';
export const MonthEndAuditPage = () => {
    const [auditItems, setAuditItems] = useState([
        {
            id: 'aud-1',
            sku: 'SRV-DL380-G10',
            name: 'HPE ProLiant DL380 Gen10 Server 2U Rack',
            location: 'Central Bay-1',
            systemQty: 12,
            physicalCount: 12,
            variance: 0,
            varianceCost: 0,
            status: 'Reconciled',
        },
        {
            id: 'aud-2',
            sku: 'SW-CAT9300-48P',
            name: 'Cisco Catalyst 9300 48-Port PoE+ Switch',
            location: 'Central Bay-2',
            systemQty: 28,
            physicalCount: 27,
            variance: -1,
            varianceCost: -1950,
            status: 'Variance Flagged',
        },
        {
            id: 'aud-3',
            sku: 'FBR-SFP-10G-SR',
            name: '10GBASE-SR SFP+ Transceiver Module',
            location: 'Clean Storage Drawer 4',
            systemQty: 240,
            physicalCount: 240,
            variance: 0,
            varianceCost: 0,
            status: 'Reconciled',
        },
        {
            id: 'aud-4',
            sku: 'CAB-CAT6A-1000',
            name: 'Cat6A Shielded Plenum Cable Spool 1000ft',
            location: 'Rack Storage B-12',
            systemQty: 65,
            physicalCount: 65,
            variance: 0,
            varianceCost: 0,
            status: 'Reconciled',
        },
        {
            id: 'aud-5',
            sku: 'UPS-SMT3000RM2U',
            name: 'APC Smart-UPS 3000VA LCD RM 2U 120V',
            location: 'Heavy Bay Floor 1',
            systemQty: 8,
            physicalCount: 8,
            variance: 0,
            varianceCost: 0,
            status: 'Reconciled',
        },
    ]);
    const [auditLocked, setAuditLocked] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);
    const reconcileItem = (id) => {
        setAuditItems((prev) => prev.map((item) => item.id === id
            ? {
                ...item,
                physicalCount: item.systemQty,
                variance: 0,
                varianceCost: 0,
                status: 'Reconciled',
            }
            : item));
    };
    const handleSignOff = () => {
        setAuditLocked(true);
        setToastMessage('Month-End Stock Reconciliation successfully locked & posted to GL!');
        setTimeout(() => setToastMessage(null), 4000);
    };
    const columns = [
        {
            key: 'sku',
            header: 'SKU Code',
            render: (a) => <span className="font-mono font-bold text-slate-800">{a.sku}</span>,
        },
        {
            key: 'name',
            header: 'Item Description',
            render: (a) => (<div>
          <p className="font-bold text-[#1F2E4A]">{a.name}</p>
          <span className="text-[10px] text-slate-500">{a.location}</span>
        </div>),
        },
        {
            key: 'systemQty',
            header: 'System ERP Book Qty',
            align: 'center',
            render: (a) => <span className="font-mono text-slate-700">{a.systemQty}</span>,
        },
        {
            key: 'physicalCount',
            header: 'Physical Floor Count',
            align: 'center',
            render: (a) => (<span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
          {a.physicalCount}
        </span>),
        },
        {
            key: 'variance',
            header: 'Count Discrepancy',
            align: 'center',
            render: (a) => a.variance === 0 ? (<span className="text-emerald-700 font-mono font-semibold flex items-center justify-center gap-1">
            <CheckCircle2 size={12}/> Match (0)
          </span>) : (<span className="text-rose-700 font-mono font-bold flex items-center justify-center gap-1">
            <AlertTriangle size={12}/> {a.variance} units
          </span>),
        },
        {
            key: 'varianceCost',
            header: 'Fiscal Variance',
            align: 'right',
            render: (a) => (<span className={`font-mono font-bold ${a.varianceCost < 0 ? 'text-rose-700' : 'text-slate-900'}`}>
          {a.varianceCost < 0
                    ? `-$${Math.abs(a.varianceCost).toLocaleString()}`
                    : `$${a.varianceCost.toLocaleString()}`}
        </span>),
        },
        {
            key: 'status',
            header: 'Audit Status',
            align: 'center',
            render: (a) => <StatusBadge status={a.status}/>,
        },
        {
            key: 'actions',
            header: 'Adjustment',
            align: 'right',
            render: (a) => a.status === 'Variance Flagged' && !auditLocked ? (<button onClick={() => reconcileItem(a.id)} className="px-2 py-1 bg-[#1F2E4A] text-white rounded text-[11px] font-semibold hover:bg-[#152033] cursor-pointer">
            Post Adjustment
          </button>) : (<span className="text-slate-400 text-xs">Locked</span>),
        },
    ];
    return (<div className="space-y-6">
      {toastMessage && (<div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-800 flex items-center gap-2">
          <ShieldCheck size={16}/> {toastMessage}
        </div>)}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1F2E4A] tracking-tight">
            Month-End Stock Audit & Reconciliation
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Monthly physical count verification against book balance, variance write-offs, and auditor GL closing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!auditLocked ? (<Button icon={UserCheck} onClick={handleSignOff}>
              Lock & Sign-Off Audit
            </Button>) : (<span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-xs flex items-center gap-1.5 border border-emerald-300">
              <ShieldCheck size={14}/> Audit Certified & Closed
            </span>)}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-[#CED4DA]">
          <span className="text-xs text-slate-500 font-semibold uppercase">Audit Cycle</span>
          <p className="text-lg font-bold text-[#1F2E4A] mt-1">October 2026 Close</p>
          <span className="text-[11px] text-slate-400">Auditor: Sarah Jenkins (Lead CPA)</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-[#CED4DA]">
          <span className="text-xs text-slate-500 font-semibold uppercase">Reconciled Accuracy</span>
          <p className="text-lg font-bold text-emerald-700 mt-1">98.2%</p>
          <span className="text-[11px] text-slate-400">Within acceptable tolerance (±2%)</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-[#CED4DA]">
          <span className="text-xs text-slate-500 font-semibold uppercase">Net Inventory Variance</span>
          <p className="text-lg font-bold text-rose-700 mt-1">-$1,950.00</p>
          <span className="text-[11px] text-slate-400">1 Unit Switch Shrinkage</span>
        </div>
      </div>

      <DataTable title="Physical vs Book Count Audit Schedule" columns={columns} data={auditItems} keyExtractor={(a) => a.id} searchPlaceholder="Filter SKU or location..." searchFilter={(a, term) => a.sku.toLowerCase().includes(term) ||
            a.name.toLowerCase().includes(term) ||
            a.location.toLowerCase().includes(term)}/>
    </div>);
};
