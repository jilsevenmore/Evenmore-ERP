import React from 'react';
import { PmsModulePlaceholder } from '../components/PmsModulePlaceholder';

export default function PMSDashboard() {
  return (
    <PmsModulePlaceholder
      title="PMS Dashboard"
      subtitle="Executive overview of project health, department workload and delivery risk."
      plannedStage="Stage 4"
      scope={[
        'Seven core KPI tiles driven by the PMS store',
        'Project pipeline distribution across configured stages',
        'Department workload and capacity cards',
        'Delayed projects table with quick actions',
        'Upcoming deadline countdowns and a live activity feed',
      ]}
    />
  );
}
