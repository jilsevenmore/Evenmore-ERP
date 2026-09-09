import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LeadDetailView from './LeadDetailView';
import { leads } from '../../../data/crm/mockLeads';

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const activeLead = leads.find((l) => String(l.id) === String(id)) || leads[0];

  return (
    <div className="p-1">
      <LeadDetailView lead={activeLead} onBackToLeads={() => navigate('/crm/leads')} />
    </div>
  );
}
