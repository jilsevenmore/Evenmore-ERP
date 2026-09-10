import React, { useState } from 'react';
import { Plus, DollarSign, Filter, MoreHorizontal, User, Building, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import { useERP } from '../../../context/ERPContext';

const STAGES = [
  { id: 'prospect', label: 'Prospecting', color: 'border-blue-400 text-blue-700 bg-blue-50' },
  { id: 'qualification', label: 'Qualification', color: 'border-indigo-400 text-indigo-700 bg-indigo-50' },
  { id: 'proposal', label: 'Proposal Sent', color: 'border-amber-400 text-amber-700 bg-amber-50' },
  { id: 'negotiation', label: 'Negotiation', color: 'border-purple-400 text-purple-700 bg-purple-50' },
  { id: 'won', label: 'Closed Won', color: 'border-emerald-400 text-emerald-700 bg-emerald-50' },
];

export default function DealsPage() {
  const { formatCurrency } = useERP();
  const [deals, setDeals] = useState([
    {
      id: 'd-1',
      title: 'Endoscopy Vision System Upgrade',
      company: 'Hirapara Industries',
      amount: 185000,
      stage: 'proposal',
      owner: 'David Patel',
      expectedClose: '15/09/2026',
      contact: 'Chirag Hirapara',
    },
    {
      id: 'd-2',
      title: 'Hospital Biometric & Surveillance Suite',
      company: 'Apollo Apex Healthcare',
      amount: 420000,
      stage: 'negotiation',
      owner: 'Priya Mehta',
      expectedClose: '28/09/2026',
      contact: 'Dr. R. Sharma',
    },
    {
      id: 'd-3',
      title: 'Enterprise Server Rack Expansion',
      company: 'Rangoni Of Florence',
      amount: 95000,
      stage: 'qualification',
      owner: 'David Patel',
      expectedClose: '10/10/2026',
      contact: 'Alok Verma',
    },
    {
      id: 'd-4',
      title: 'Automated Pharmacy Dispenser System',
      company: 'Fortis Health Central',
      amount: 620000,
      stage: 'won',
      owner: 'Priya Mehta',
      expectedClose: '01/09/2026',
      contact: 'Sunita Rao',
    },
    {
      id: 'd-5',
      title: 'Industrial Cold Chain IoT Sensors',
      company: 'Thermax Logistics',
      amount: 140000,
      stage: 'prospect',
      owner: 'Rahul Deshmukh',
      expectedClose: '22/10/2026',
      contact: 'Karan Mehra',
    },
  ]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({
    title: '',
    company: '',
    amount: 50000,
    stage: 'prospect',
    owner: 'David Patel',
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newDeal.title || !newDeal.company) return;
    const created = {
      id: `d-${Date.now()}`,
      ...newDeal,
      expectedClose: '30/09/2026',
      contact: 'Primary POC',
    };
    setDeals([created, ...deals]);
    setNewDeal({ title: '', company: '', amount: 50000, stage: 'prospect', owner: 'David Patel' });
    setIsAddOpen(false);
  };

  const moveStage = (dealId, nextStage) => {
    setDeals(deals.map((d) => (d.id === dealId ? { ...d, stage: nextStage } : d)));
  };

  const totalPipeline = deals.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Deals & Opportunities"
        subtitle={`Active pipeline tracking (${deals.length} deals • ${formatCurrency(totalPipeline, { noDecimals: true })})`}
        actions={
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="btn-primary btn-sm flex items-center gap-1.5"
          >
            <Plus size={14} strokeWidth={2.4} /> Create Deal
          </button>
        }
      />

      {/* Add Deal Form */}
      {isAddOpen && (
        <form onSubmit={handleCreate} className="card p-4 space-y-3 bg-blue-50/50 dark:bg-slate-900/40 border border-blue-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">New Deal Opportunity</h3>
            <button type="button" onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <input
              type="text"
              required
              placeholder="Deal Title *"
              value={newDeal.title}
              onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
              className="p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
            />
            <input
              type="text"
              required
              placeholder="Company / Account *"
              value={newDeal.company}
              onChange={(e) => setNewDeal({ ...newDeal, company: e.target.value })}
              className="p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
            />
            <input
              type="number"
              required
              placeholder="Expected Value (INR)"
              value={newDeal.amount}
              onChange={(e) => setNewDeal({ ...newDeal, amount: Number(e.target.value) })}
              className="p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
            />
            <select
              value={newDeal.stage}
              onChange={(e) => setNewDeal({ ...newDeal, stage: e.target.value })}
              className="p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
            >
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsAddOpen(false)} className="btn-ghost btn-sm">
              Cancel
            </button>
            <button type="submit" className="btn-primary btn-sm">
              Save Deal
            </button>
          </div>
        </form>
      )}

      {/* Kanban Stages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id);
          const stageTotal = stageDeals.reduce((sum, d) => sum + d.amount, 0);

          return (
            <div key={stage.id} className="card p-3 space-y-3 min-h-[420px] bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-xs uppercase tracking-wide text-slate-800 dark:text-slate-200">
                  {stage.label} ({stageDeals.length})
                </span>
                <span className="text-[11px] font-mono text-slate-500 font-bold">
                  {formatCurrency(stageTotal, { noDecimals: true })}
                </span>
              </div>

              <div className="space-y-2.5">
                {stageDeals.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    No deals in this stage
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="card p-3 space-y-2 hover:shadow-md transition cursor-pointer border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                          {deal.title}
                        </strong>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Building size={11} className="shrink-0" />
                        <span className="truncate">{deal.company}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="font-bold font-mono text-xs text-blue-600 dark:text-blue-400">
                          {formatCurrency(deal.amount, { noDecimals: true })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {deal.owner.split(' ')[0]}
                        </span>
                      </div>

                      {/* Stage Progression Shortcut */}
                      <div className="flex justify-end gap-1 pt-1">
                        {STAGES.map((st, i) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => moveStage(deal.id, st.id)}
                            className={`w-2 h-2 rounded-full transition ${
                              deal.stage === st.id ? 'bg-blue-600 scale-125' : 'bg-slate-300 dark:bg-slate-600 hover:bg-blue-400'
                            }`}
                            title={`Move to ${st.label}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
