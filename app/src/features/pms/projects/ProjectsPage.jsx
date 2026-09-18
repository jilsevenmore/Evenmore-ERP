import React from 'react';
import { PmsModulePlaceholder } from '../components/PmsModulePlaceholder';

export default function ProjectsPage() {
  return (
    <PmsModulePlaceholder
      title="All Projects"
      subtitle="Master directory of every project, searchable and filterable by stage, department and status."
      plannedStage="Stage 5"
      scope={[
        'Sortable project directory with status and priority filters',
        'Create-project workflow linked to CRM orders',
        'Project manager assignment and stage template selection',
      ]}
    />
  );
}
