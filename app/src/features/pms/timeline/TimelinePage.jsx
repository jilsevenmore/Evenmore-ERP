import React from 'react';
import { PmsModulePlaceholder } from '../components/PmsModulePlaceholder';

export default function TimelinePage() {
  return (
    <PmsModulePlaceholder
      title="Timeline & Gantt"
      subtitle="Cross-project milestone view with delay highlighting."
      plannedStage="Stage 11"
      scope={[
        'Gantt bars per project stage with overdue segments highlighted',
        'Department and project scope filters',
      ]}
    />
  );
}
