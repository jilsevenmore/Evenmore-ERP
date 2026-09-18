import React from 'react';
import { PmsModulePlaceholder } from '../components/PmsModulePlaceholder';

export default function MyProjectsPage() {
  return (
    <PmsModulePlaceholder
      title="My Projects"
      subtitle="Projects where you are the assigned project manager."
      plannedStage="Stage 11"
      scope={[
        'Scoped to the current user via the store selector getMyProjects()',
        'Same filtering and sorting as the master directory',
      ]}
    />
  );
}
