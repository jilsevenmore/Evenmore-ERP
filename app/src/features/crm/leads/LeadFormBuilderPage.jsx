import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LeadFormBuilder from './LeadFormBuilder';
import { createFieldFromType, defaultLeadFormSections } from '../../../data/crm/leadFormSchema';

export default function LeadFormBuilderPage() {
  const navigate = useNavigate();
  const [leadFormSections, setLeadFormSections] = useState(defaultLeadFormSections);
  const [selectedBuilderFieldId, setSelectedBuilderFieldId] = useState(
    defaultLeadFormSections[0].fields[0].id
  );

  const selectedBuilderField =
    leadFormSections.flatMap((s) => s.fields).find((f) => f.id === selectedBuilderFieldId) ?? null;

  function updateLeadFormField(fieldId, updates) {
    setLeadFormSections((current) =>
      current.map((section) => ({
        ...section,
        fields: section.fields.map((field) =>
          field.id === fieldId ? { ...field, ...updates } : field
        ),
      }))
    );
  }

  function addLeadFormField(sectionId, type, index) {
    const nextField = createFieldFromType(type, Date.now());
    setLeadFormSections((current) =>
      current.map((section) => {
        if (section.id !== sectionId) return section;
        const nextFields = [...section.fields];
        const insertAt = typeof index === 'number' ? index : nextFields.length;
        nextFields.splice(insertAt, 0, nextField);
        return { ...section, fields: nextFields };
      })
    );
    setSelectedBuilderFieldId(nextField.id);
  }

  function removeLeadFormField(fieldId) {
    const allFields = leadFormSections.flatMap((s) => s.fields);
    const filtered = allFields.filter((f) => f.id !== fieldId);
    setLeadFormSections((current) =>
      current.map((section) => ({
        ...section,
        fields: section.fields.filter((f) => f.id !== fieldId),
      }))
    );
    setSelectedBuilderFieldId(filtered[0]?.id ?? null);
  }

  function moveLeadFormField(fieldId, targetSectionId, targetIndex) {
    setLeadFormSections((current) => {
      let movingField = null;
      const stripped = current.map((section) => ({
        ...section,
        fields: section.fields.filter((f) => {
          if (f.id === fieldId) { movingField = f; return false; }
          return true;
        }),
      }));
      if (!movingField) return current;
      return stripped.map((section) => {
        if (section.id !== targetSectionId) return section;
        const nextFields = [...section.fields];
        const insertAt = typeof targetIndex === 'number' ? targetIndex : nextFields.length;
        nextFields.splice(insertAt, 0, movingField);
        return { ...section, fields: nextFields };
      });
    });
    setSelectedBuilderFieldId(fieldId);
  }

  function addLeadFormSection() {
    const nextSectionId = `custom-section-${Date.now()}`;
    setLeadFormSections((current) => [
      ...current,
      { id: nextSectionId, title: `New Section ${current.length + 1}`, fields: [] },
    ]);
  }

  return (
    <LeadFormBuilder
      sections={leadFormSections}
      selectedFieldId={selectedBuilderFieldId}
      selectedField={selectedBuilderField}
      onSelectField={setSelectedBuilderFieldId}
      onUpdateField={updateLeadFormField}
      onAddField={addLeadFormField}
      onRemoveField={removeLeadFormField}
      onMoveField={moveLeadFormField}
      onAddSection={addLeadFormSection}
      onSaveAndOpen={() => navigate('/crm/leads/create-form')}
    />
  );
}
