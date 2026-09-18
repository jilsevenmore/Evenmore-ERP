import React from 'react';
import { useParams } from 'react-router-dom';
import { PmsModulePlaceholder } from '../components/PmsModulePlaceholder';

export default function ProjectDetailPage() {
  const { id } = useParams();
  return (
    <PmsModulePlaceholder
      title={`Project ${id ?? ''}`.trim()}
      subtitle="Complete 360 view: info, stage timeline, tasks, design proofs, approvals and audit trail."
      plannedStage="Stage 7"
      scope={[
        'Project hero banner with a live completion gauge',
        'Dynamic interactive stage timeline with delay markers',
        'Tabs for tasks, documents, approvals and the audit trail',
      ]}
    />
  );
}
