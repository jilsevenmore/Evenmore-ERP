import React from 'react';
import { PmsModulePlaceholder } from '../components/PmsModulePlaceholder';

export default function DelayDashboardPage() {
  return (
    <PmsModulePlaceholder
      title="Delay Center"
      subtitle="Resolution desk for overdue and at-risk stages across every project."
      plannedStage="Stage 10"
      scope={[
        'Overdue count, average delay duration and bottleneck department metrics',
        'Actionable delay table backed by the store selector getDelayedStages()',
        'Log delay reason, owner and expected recovery date',
      ]}
    />
  );
}
