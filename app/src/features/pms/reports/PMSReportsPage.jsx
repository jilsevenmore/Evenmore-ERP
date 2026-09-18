import React from 'react';
import { PmsModulePlaceholder } from '../components/PmsModulePlaceholder';

export default function PMSReportsPage() {
  return (
    <PmsModulePlaceholder
      title="PMS Reports"
      subtitle="Delivery velocity, stage bottlenecks and departmental SLA compliance."
      plannedStage="Stage 11"
      scope={[
        'On-time versus delayed completion trends',
        'Average hours spent per stage',
        'Delay root-cause frequency and department efficiency',
      ]}
    />
  );
}
