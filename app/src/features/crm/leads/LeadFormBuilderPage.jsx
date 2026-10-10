import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import LeadFormBuilder from './LeadFormBuilder';
import { createFieldFromType, withStandardLeadFields, isStandardLeadField, PERMANENT_LEAD_FIELD_ID } from '../../../data/crm/leadFormSchema';

// The canvas works on the visible fields; standard fields removed from the form
// are kept aside and saved back as `hidden: true` so they are not re-added.
function splitLayout(sections) {
  const removed = [];
  const visible = withStandardLeadFields(sections).map((section) => ({
    ...section,
    fields: (section.fields || []).flatMap((field) => {
      // `locked` is retired: standard fields are configurable now.
      const { locked: _locked, ...rest } = field;
      if (rest.hidden) { removed.push(rest); return []; }
      return [rest];
    }),
  }));
  return { visible, removed };
}
import { useCrmStore } from '../../../stores/crmStore';
import { loadForms, saveForms, findForm, getActiveFormId, LEAD_FORM } from '../../../services/crmForms';

export default function LeadFormBuilderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const formId = searchParams.get('formId') || getActiveFormId() || null;

  const returnTo = location.state?.returnTo || null;
  const draftData = useMemo(() => {
    if (location.state?.draftData) return location.state.draftData;
    try {
      const saved = sessionStorage.getItem('crm_lead_create_draft');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [location.state]);

  // The form being edited, from `/crm/forms/`.
  const storeForms = useCrmStore((s) => s.forms);
  const currentForm = useMemo(
    () => (formId ? findForm(formId) : null) || loadForms(LEAD_FORM)[0] || null,
    [formId, storeForms],
  );

  // Replaced: the standard lead fields were always in the layout (locked).
  // Now they can be removed, and come back from the "Standard fields" list.
  const [leadFormSections, setLeadFormSections] = useState(
    () => splitLayout(currentForm?.sections).visible,
  );
  const [removedStandardFields, setRemovedStandardFields] = useState(
    () => splitLayout(currentForm?.sections).removed,
  );

  // A form loaded after the first render replaces the blank starting point.
  useEffect(() => {
    if (!currentForm?.sections) return;
    const { visible, removed } = splitLayout(currentForm.sections);
    setLeadFormSections(visible);
    setRemovedStandardFields(removed);
  }, [currentForm]);

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
    const target = allFields.find((f) => f.id === fieldId);
    if (!target || fieldId === PERMANENT_LEAD_FIELD_ID) return;
    if (isStandardLeadField(target)) {
      setRemovedStandardFields((current) => [...current, { ...target, hidden: true }]);
    }
    const filtered = allFields.filter((f) => f.id !== fieldId);
    setLeadFormSections((current) =>
      current.map((section) => ({
        ...section,
        fields: section.fields.filter((f) => f.id !== fieldId),
      }))
    );
    setSelectedBuilderFieldId(filtered[0]?.id ?? null);
  }

  function restoreStandardField(fieldId, sectionId) {
    const field = removedStandardFields.find((f) => f.id === fieldId);
    if (!field) return;
    const { hidden: _hidden, ...restored } = field;
    const targetSecId = sectionId || leadFormSections[0]?.id;
    setRemovedStandardFields((current) => current.filter((f) => f.id !== fieldId));
    setLeadFormSections((current) =>
      current.map((section) =>
        section.id === targetSecId ? { ...section, fields: [...section.fields, restored] } : section
      )
    );
    setSelectedBuilderFieldId(fieldId);
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
    const target = leadFormSections.find((section) => section.id === sectionId);
    let remaining = leadFormSections.filter((section) => section.id !== sectionId);
    if (!target || remaining.length === 0) return;
    // Replaced: a section holding standard fields could not be removed. Its
    // standard fields now go to the removed list; Lead Name moves to the first
    // remaining section, since every lead needs one.
    const fields = target.fields || [];
    const permanent = fields.find((field) => field.id === PERMANENT_LEAD_FIELD_ID);
    if (permanent) {
      remaining = remaining.map((section, index) =>
        index === 0 ? { ...section, fields: [permanent, ...section.fields] } : section
      );
    }
    const removedStandard = fields.filter((field) => isStandardLeadField(field) && field.id !== PERMANENT_LEAD_FIELD_ID);
    if (removedStandard.length) {
      setRemovedStandardFields((current) => [...current, ...removedStandard.map((field) => ({ ...field, hidden: true }))]);
    }
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
        // A copy gets a new id, so it is an ordinary custom field, not the standard one it came from.
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
    // Save first, so the capture page renders what is on screen here.
    persistSections();
    navigate('/crm/leads/create-form', { state: { draftData } });
  }

  function persistSections() {
    const forms = loadForms(LEAD_FORM);
    const targetId = currentForm?.id || formId;
    // Removed standard fields are saved as hidden so the form does not re-add them.
    const sectionsToSave = leadFormSections.map((section, index) =>
      index === 0 ? { ...section, fields: [...section.fields, ...removedStandardFields] } : section
    );
    const updated = forms.some((f) => f.id === targetId)
      ? forms.map((f) => (f.id === targetId ? { ...f, sections: sectionsToSave } : f))
      : [...forms, { id: targetId, name: 'Lead create form', sections: sectionsToSave }];
    saveForms(updated, LEAD_FORM);
  }

  function handleReturnToForm() {
    persistSections();
    if (returnTo) {
      navigate(returnTo);
    } else {
      navigate('/crm/leads?openCreate=true');
    }
  }

  function saveLeadForm() {
    persistSections();
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      if (returnTo) {
        navigate(returnTo);
      } else {
        navigate('/crm/leads/forms');
      }
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
      removedStandardFields={removedStandardFields}
      onRestoreStandardField={restoreStandardField}
      onMoveField={moveLeadFormField}
      onAddSection={addLeadFormSection}
      onRemoveSection={removeLeadFormSection}
      onUpdateSectionTitle={updateLeadFormSectionTitle}
      onDuplicateSection={duplicateLeadFormSection}
      onPreview={openLeadCreateForm}
      onSaveAndOpen={saveLeadForm}
      saveSuccess={saveSuccess}
      formTitle={currentForm?.name}
      draftData={draftData}
      onReturnToForm={handleReturnToForm}
    />
  );
}
