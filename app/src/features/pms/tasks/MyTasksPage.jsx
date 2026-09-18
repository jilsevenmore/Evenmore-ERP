import React from 'react';
import { PmsModulePlaceholder } from '../components/PmsModulePlaceholder';

export default function MyTasksPage() {
  return (
    <PmsModulePlaceholder
      title="My Tasks"
      subtitle="Actionable task workbench for the stages assigned to you."
      plannedStage="Stage 11"
      scope={[
        'Priority, stage and status filter bar',
        'Interactive progress slider that rolls up to stage and project completion',
        'Task detail modal with sub-checklists',
      ]}
    />
  );
}
