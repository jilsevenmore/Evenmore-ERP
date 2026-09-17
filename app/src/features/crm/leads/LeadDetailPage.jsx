import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LeadDetailView from './LeadDetailView';
import { leads } from '../../../data/crm/mockLeads';

const LEADS_STORAGE_KEY = 'evenmore-crm-leads-v1';

function loadStoredLeads() {
  try {
    const raw = localStorage.getItem(LEADS_STORAGE_KEY);
    if (!raw) return leads;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return leads;
    return parsed;
  } catch {
    return leads;
  }
}

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const storedLeads = React.useMemo(loadStoredLeads, []);
  const activeLead = storedLeads.find((l) => String(l.id) === String(id)) ?? null;

  if (!activeLead) {
    return (
      <div>
        <div className="card p-8 text-center space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Lead not found</h3>
          <p className="text-xs text-slate-500">This lead may have been deleted.</p>
          <button type="button" className="btn-primary btn-sm" onClick={() => navigate('/crm/leads')}>
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <LeadDetailView lead={activeLead} onBackToLeads={() => navigate('/crm/leads')} />
    </div>
  );
}
