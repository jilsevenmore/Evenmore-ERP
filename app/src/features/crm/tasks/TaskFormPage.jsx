import { useNavigate } from 'react-router-dom';
import TaskForm from './TaskForm';
import { leads } from '../../../data/crm/mockLeads';

export default function TaskFormPage() {
  const navigate = useNavigate();
  const sampleLead = leads[0];

  return (
    <TaskForm
      lead={sampleLead}
      onBack={() => navigate('/crm/leads')}
      onAddNote={() => navigate(`/crm/leads/${sampleLead.id}`)}
    />
  );
}
