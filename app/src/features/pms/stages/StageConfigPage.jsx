import React from 'react';
import { PmsModulePlaceholder } from '../components/PmsModulePlaceholder';

export default function StageConfigPage() {
  return (
    <PmsModulePlaceholder
      title="Dynamic Stages"
      subtitle="Define the stage templates every project runs through, and the order they execute in."
      plannedStage="Stage 6"
      scope={[
        'Configured stage list with up/down sequence reordering',
        'Stage builder for department, duration, role and approval rules',
        'Activate or retire templates without touching live projects',
      ]}
    />
  );
}
