import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LeadFormBuilder from './LeadFormBuilder';
import { createFieldFromType, defaultLeadFormSections } from '../../../data/crm/leadFormSchema';

function getStoredForms() {
  try {
    const raw = localStorage.getItem('dynamicLeadForms');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
  }
  return [
    {
      id: 'lead-form-default',
      name: 'LEAD CREATE FORM',
      description: 'No description provided',
      createdOn: '13/04/2026',
      sections: defaultLeadFormSections,
    },
  ];
}

export default function LeadFormBuilderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formId = searchParams.get('formId') || localStorage.getItem('activeLeadFormId') || 'lead-form-default';

  const [currentForm] = useState(() => {
    const forms = getStoredForms();
    return forms.find((f) => f.id === formId) || forms[0];
  });

  const [leadFormSections, setLeadFormSections] = useState(() => {
    return currentForm?.sections || defaultLeadFormSections;
  });

  const [selectedBuilderFieldId, setSelectedBuilderFieldId] = useState(() => {
    const emailField = leadFormSections.flatMap((s) => s.fields).find((f) => f.id === 'email');
    return emailField?.id ?? leadFormSections[0]?.fields?.[0]?.id ?? null;
  });

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
    const targetSecId = sectionId || leadFormSections[0]?.id;
    const nextField = createFieldFromType(type, Date.now());
    setLeadFormSections((current) =>
      current.map((section) => {
        if (section.id !== targetSecId) return section;
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
          if (f.id === fieldId) {
            movingField = f;
            return false;
          }
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

  function removeLeadFormSection(sectionId) {
    const remaining = leadFormSections.filter((section) => section.id !== sectionId);
    if (remaining.length === 0) return;
    setLeadFormSections(remaining);
    const nextField = remaining.flatMap((section) => section.fields)[0];
    setSelectedBuilderFieldId(nextField?.id ?? null);
  }

  function updateLeadFormSectionTitle(sectionId, newTitle) {
    setLeadFormSections((current) =>
      current.map((section) => (section.id === sectionId ? { ...section, title: newTitle } : section))
    );
  }

  function duplicateLeadFormSection(sectionId) {
    setLeadFormSections((current) => {
      const targetSec = current.find((s) => s.id === sectionId);
      if (!targetSec) return current;
      const newSecId = `custom-section-${Date.now()}`;
      const clonedFields = (targetSec.fields || []).map((f, i) => ({
        ...f,
        id: `field-${Date.now()}-${i}`,
      }));
      const newSec = {
        ...targetSec,
        id: newSecId,
        title: `${targetSec.title} (Copy)`,
        fields: clonedFields,
      };
      const idx = current.findIndex((s) => s.id === sectionId);
      const next = [...current];
      next.splice(idx + 1, 0, newSec);
      return next;
    });
  }

  const [saveSuccess, setSaveSuccess] = useState(false);

  function openLeadCreateForm() {
    try {
      localStorage.setItem('leadFormSections_v2', JSON.stringify(leadFormSections));
      localStorage.setItem('leadFormSections', JSON.stringify(leadFormSections));
    } catch {
    }
    navigate('/crm/leads/create-form');
  }

  function saveLeadForm() {
    try {
      const forms = getStoredForms();
      const updatedForms = forms.map((f) =>
        f.id === (currentForm?.id || formId)
          ? { ...f, sections: leadFormSections }
          : f
      );
      localStorage.setItem('dynamicLeadForms', JSON.stringify(updatedForms));
      localStorage.setItem('leadFormSections_v2', JSON.stringify(leadFormSections));
      localStorage.setItem('leadFormSections', JSON.stringify(leadFormSections));
    } catch {
    }
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      navigate('/crm/leads/forms');
    }, 600);
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
      onRemoveSection={removeLeadFormSection}
      onUpdateSectionTitle={updateLeadFormSectionTitle}
      onDuplicateSection={duplicateLeadFormSection}
      onPreview={openLeadCreateForm}
      onSaveAndOpen={saveLeadForm}
      saveSuccess={saveSuccess}
      formTitle={currentForm?.name}
    />
  );
}
