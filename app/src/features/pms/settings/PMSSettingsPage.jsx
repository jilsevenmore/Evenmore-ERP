import React from 'react';
import { PmsModulePlaceholder } from '../components/PmsModulePlaceholder';

export default function PMSSettingsPage() {
  return (
    <PmsModulePlaceholder
      title="PMS Settings"
      subtitle="At-risk thresholds, approval policies and notification defaults."
      plannedStage="Stage 12"
      scope={[
        'At-risk threshold percentage driving the delay engine',
        'Required sign-off policies for design and QA',
        'Toast and alert preferences',
      ]}
    />
  );
}
