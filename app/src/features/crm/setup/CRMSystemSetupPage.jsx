import React, { useState } from 'react';
import { Settings, Shield, Plus, Layers, Sliders, CheckCircle2, Tag, Globe, Sparkles } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';

export default function CRMSystemSetupPage() {
  const [stages, setStages] = useState([
    { id: 1, name: 'New Inbound', code: 'NEW', color: '#3b82f6', probability: 10 },
    { id: 2, name: 'Contacted', code: 'CNT', color: '#f59e0b', probability: 30 },
    { id: 3, name: 'Qualified', code: 'QLF', color: '#10b981', probability: 60 },
    { id: 4, name: 'Proposal Sent', code: 'PRP', color: '#8b5cf6', probability: 80 },
    { id: 5, name: 'Converted / Customer', code: 'CNV', color: '#059669', probability: 100 },
    { id: 6, name: 'Lost / Disqualified', code: 'LST', color: '#ef4444', probability: 0 },
  ]);

  const [sources, setSources] = useState([
    { id: 1, name: 'Website Form', type: 'Digital', active: true },
    { id: 2, name: 'Client Referral', type: 'Direct', active: true },
    { id: 3, name: 'Cold Inbound Call', type: 'Telephony', active: true },
    { id: 4, name: 'Social Media / Instagram Ads', type: 'Paid Campaign', active: true },
    { id: 5, name: 'Medical Trade Expo', type: 'Offline Event', active: true },
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="CRM System Setup & Configurations"
        subtitle="Manage lead lifecycle stages, inbound sources, scoring formulas, and automation rules"
        actions={
          <button type="button" className="btn-primary btn-sm flex items-center gap-1.5">
            <Plus size={14} /> New Stage
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lead Stages Master */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-bold text-sm">Lead Lifecycle Stages ({stages.length})</h3>
            <span className="text-[11px] text-slate-400">Order by pipeline priority</span>
          </div>
          <div className="table-scroll">
            <table className="data-table text-xs">
              <thead>
                <tr>
                  <th>Stage Name</th>
                  <th>Code</th>
                  <th>Win Probability</th>
                  <th>Indicator</th>
                </tr>
              </thead>
              <tbody>
                {stages.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong className="font-semibold">{s.name}</strong>
                    </td>
                    <td>
                      <span className="font-mono text-slate-400 font-bold">{s.code}</span>
                    </td>
                    <td>
                      <span className="font-bold text-blue-600 font-mono">{s.probability}%</span>
                    </td>
                    <td>
                      <span className="w-4 h-4 rounded-full inline-block" style={{ background: s.color }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lead Inbound Sources */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-bold text-sm">Inbound Source Channels ({sources.length})</h3>
            <button type="button" className="btn-outline btn-sm flex items-center gap-1">
              <Plus size={13} /> Add Channel
            </button>
          </div>
          <div className="table-scroll">
            <table className="data-table text-xs">
              <thead>
                <tr>
                  <th>Channel Name</th>
                  <th>Category</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((src) => (
                  <tr key={src.id}>
                    <td>
                      <strong className="font-semibold">{src.name}</strong>
                    </td>
                    <td className="text-slate-500 font-medium">{src.type}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
