import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LeadFormsManager from '../leads/LeadFormsManager';
import { defaultLeadFormSections } from '../../../data/crm/leadFormSchema';

export default function LeadFormsPage() {
  const navigate = useNavigate();
  const [leadForms] = useState([
    {
      id: 'lead-form-default',
      name: 'LEAD CREATE FORM',
      description: 'No description provided',
      createdOn: '13/04/2026',
      sections: defaultLeadFormSections,
    },
  ]);

  function openNewLeadForm() {
    navigate('/crm/leads/form-builder');
  }

  function editLeadForm() {
    navigate('/crm/leads/form-builder');
  }

  return (
    <LeadFormsManager forms={leadForms} onCreateForm={openNewLeadForm} onEditForm={editLeadForm} />
  );
}
