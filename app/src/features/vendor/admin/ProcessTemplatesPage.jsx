import React, { useState, useMemo } from 'react';
import { useVendorStore } from '../../../stores/vendorStore';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import {
  Sliders,
  Plus,
  Copy,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Layers,
  ShieldCheck,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

const templateGuide = {
  title: 'Vendor Process Templates & Stage Sequences',
  subtitle: 'Configure dynamic outsourcing pipelines with weighted milestones, expected days, and quality proof requirements.',
  purpose: 'Process templates define the exact progression of outsourced jobs. Each stage carries an explicit weight percentage (totaling exactly 100%), expected durations, and proof upload rules.',
  workflow: ['Create Template', 'Add Stages & Weights', 'Enforce 100% Total', 'Configure Proof Rules', 'Assign to Shared Orders'],
  keyTerms: [
    { term: '100% Weight Rule', definition: 'The sum of all active stage weights must equal exactly 100% before saving to guarantee accurate progress calculations.' },
    { term: 'Proof Requirement', definition: 'When marked mandatory, vendors cannot submit stage completion without attaching verified inspection photos or test reports.' },
  ],
  tips: [
    'Click "Preview" on any template to see exactly how vendors will interact with the stage sequence.',
    'Click "Duplicate" to quickly clone standard templates for specialized fabrication variations.',
  ],
};

export function ProcessTemplatesPage() {
  const templates = useVendorStore((s) => s.templates);
  const saveProcessTemplate = useVendorStore((s) => s.saveProcessTemplate);
  const duplicateProcessTemplate = useVendorStore((s) => s.duplicateProcessTemplate);
  const toggleTemplateActive = useVendorStore((s) => s.toggleTemplateActive);
  const deleteProcessTemplate = useVendorStore((s) => s.deleteProcessTemplate);

  // Modals state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null); // null = new, object = edit
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [feedback, setFeedback] = useState('');

  // Form State for Template Builder
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formApplicable, setFormApplicable] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [stages, setStages] = useState([]);
  const [validationError, setValidationError] = useState('');

  const liveTotalWeight = useMemo(() => {
    return stages.reduce((sum, stg) => sum + (Number(stg.weight) || 0), 0);
  }, [stages]);

  const openNewEditor = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormDesc('');
    setFormApplicable('Heavy Machinery & Structural Steel');
    setFormActive(true);
    setStages([
      {
        id: `stg-${Date.now()}-1`,
        name: 'Fabrication',
        sequence: 1,
        weight: 30,
        expectedDays: 5,
        responsibleParty: 'Vendor',
        proofRequired: false,
        mandatoryFields: ['Quantity', 'Remarks'],
        instructions: 'Laser cut, bend, and prepare MS raw plates.',
        isActive: true,
      },
      {
        id: `stg-${Date.now()}-2`,
        name: 'Welding',
        sequence: 2,
        weight: 25,
        expectedDays: 4,
        responsibleParty: 'Vendor',
        proofRequired: true,
        mandatoryFields: ['Quantity', 'Remarks', 'Proof'],
        instructions: 'MIG welding with weld seam test cert.',
        isActive: true,
      },
      {
        id: `stg-${Date.now()}-3`,
        name: 'Grinding',
        sequence: 3,
        weight: 15,
        expectedDays: 2,
        responsibleParty: 'Vendor',
        proofRequired: false,
        mandatoryFields: ['Quantity'],
        instructions: 'Deburr edges flush with base material.',
        isActive: true,
      },
      {
        id: `stg-${Date.now()}-4`,
        name: 'Painting',
        sequence: 4,
        weight: 20,
        expectedDays: 3,
        responsibleParty: 'Vendor',
        proofRequired: true,
        mandatoryFields: ['Quantity', 'Remarks', 'Proof'],
        instructions: 'Red oxide primer + RAL 7035 PU enamel finish.',
        isActive: true,
      },
      {
        id: `stg-${Date.now()}-5`,
        name: 'QC Inspection',
        sequence: 5,
        weight: 10,
        expectedDays: 2,
        responsibleParty: 'In-House / Vendor',
        proofRequired: true,
        mandatoryFields: ['Quantity', 'Remarks', 'Proof'],
        instructions: 'Final dimensional and paint thickness inspection.',
        isActive: true,
      },
    ]);
    setValidationError('');
    setEditorOpen(true);
  };

  const openEdit = (tmpl) => {
    setEditingTemplate(tmpl);
    setFormName(tmpl.name);
    setFormDesc(tmpl.description || '');
    setFormApplicable(tmpl.applicableType || '');
    setFormActive(tmpl.isActive !== false);
    setStages(
      (tmpl.stages || []).map((s, idx) => ({
        ...s,
        sequence: s.sequence || (idx + 1),
      }))
    );
    setValidationError('');
    setEditorOpen(true);
  };

  // Stage builder actions
  const handleAddStage = () => {
    const nextSeq = stages.length + 1;
    const newStage = {
      id: `stg-${Date.now()}-${nextSeq}`,
      name: `Stage ${nextSeq}`,
      sequence: nextSeq,
      weight: 10,
      expectedDays: 3,
      responsibleParty: 'Vendor',
      proofRequired: false,
      mandatoryFields: ['Quantity', 'Remarks'],
      instructions: '',
      isActive: true,
    };
    setStages([...stages, newStage]);
  };

  const handleRemoveStage = (index) => {
    if (stages.length <= 1) {
      setValidationError('Template must have at least one stage.');
      return;
    }
    const updated = stages
      .filter((_, idx) => idx !== index)
      .map((s, idx) => ({ ...s, sequence: idx + 1 }));
    setStages(updated);
  };

  const handleDuplicateStage = (index) => {
    const src = stages[index];
    const dup = {
      ...src,
      id: `stg-${Date.now()}-dup`,
      name: `${src.name} (Copy)`,
      sequence: stages.length + 1,
    };
    const updated = [...stages, dup].map((s, idx) => ({ ...s, sequence: idx + 1 }));
    setStages(updated);
  };

  const moveStage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= stages.length) return;

    const list = [...stages];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const renumbered = list.map((s, idx) => ({ ...s, sequence: idx + 1 }));
    setStages(renumbered);
  };

  const updateStageField = (index, field, val) => {
    const updated = [...stages];
    updated[index] = { ...updated[index], [field]: val };
    setStages(updated);
  };

  // Save validation
  const handleSave = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!formName.trim()) {
      setValidationError('Template name is required.');
      return;
    }

    if (liveTotalWeight !== 100) {
      setValidationError(
        `Total stage weight MUST equal exactly 100%. Current total is ${liveTotalWeight}%. Please balance weights.`
      );
      return;
    }

    const res = saveProcessTemplate({
      id: editingTemplate?.id,
      name: formName.trim(),
      description: formDesc.trim(),
      applicableType: formApplicable.trim(),
      isActive: formActive,
      stages: stages.map((s, idx) => ({
        ...s,
        sequence: idx + 1,
        weight: Number(s.weight) || 0,
        expectedDays: Number(s.expectedDays) || 1,
      })),
    });

    if (res.success) {
      setFeedback(`Process Template "${formName}" saved successfully!`);
      setTimeout(() => setFeedback(''), 3000);
      setEditorOpen(false);
    } else {
      setValidationError(res.error || 'Failed to save template.');
    }
  };

  const handleDuplicate = (id, name) => {
    duplicateProcessTemplate(id);
    setFeedback(`Duplicated template "${name}".`);
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete template "${name}"?`)) {
      deleteProcessTemplate(id);
      setFeedback(`Deleted template "${name}".`);
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Process Templates"
        subtitle="Manage dynamic stage pipelines, weighted milestone formulas, and inspection proof policies."
        guide={templateGuide}
        actions={
          <Button icon={Plus} onClick={openNewEditor}>
            Create Process Template
          </Button>
        }
      />

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback('')}>✕</button>
        </div>
      )}

      {/* ── Templates List ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((tmpl) => (
          <div
            key={tmpl.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 hover:shadow-xs transition-shadow flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {tmpl.stages?.length || 0} Stages
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    tmpl.isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tmpl.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {tmpl.name}
              </h3>
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                {tmpl.description || 'No description provided.'}
              </p>

              <div className="pt-2 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p>
                  Scope: <strong className="text-slate-800 dark:text-slate-200">{tmpl.applicableType}</strong>
                </p>
                <p>
                  Total Weight: <strong className="text-emerald-600">100%</strong> (Normalized)
                </p>
              </div>

              {/* Stage sequence preview pill */}
              <div className="pt-2 flex flex-wrap gap-1">
                {tmpl.stages?.slice(0, 5).map((stg, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700"
                  >
                    {stg.name} ({stg.weight}%)
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setPreviewTemplate(tmpl)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-primary hover:bg-slate-50 text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                title="Preview vendor view"
              >
                <Eye size={12} />
                <span>Preview</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleDuplicate(tmpl.id, tmpl.name)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 cursor-pointer"
                  title="Duplicate template"
                >
                  <Copy size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(tmpl)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 cursor-pointer"
                  title="Edit template"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(tmpl.id, tmpl.name)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                  title="Delete template"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Template Editor Modal with Stage Builder & 100% Validator ── */}
      {editorOpen && (
        <Modal
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          title={editingTemplate ? `Edit Template: ${editingTemplate.name}` : 'Create Vendor Process Template'}
          subtitle="Configure stages, assign percentage weight contributions, and set quality requirements."
          size="xl"
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {validationError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-rose-500" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Template Header Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Standard Heavy Fabrication & Assembly"
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white dark:bg-slate-900 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Applicable Order / Product Category *
                </label>
                <input
                  type="text"
                  required
                  value={formApplicable}
                  onChange={(e) => setFormApplicable(e.target.value)}
                  placeholder="e.g. Heavy Machinery, CNC Turned Parts, Enclosures"
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Template Description
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Describe manufacturing scope and workflow guidelines..."
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white dark:bg-slate-900 text-xs"
                />
              </div>
            </div>

            {/* ── Live Weight Validation Banner ────────────────────────── */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                liveTotalWeight === 100
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : liveTotalWeight > 100
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                {liveTotalWeight === 100 ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : (
                  <AlertTriangle size={16} className={liveTotalWeight > 100 ? 'text-rose-600' : 'text-amber-600'} />
                )}
                <span>
                  Total Stage Weight: <strong>{liveTotalWeight}%</strong> / 100%
                </span>
              </div>

              <span className="text-[11px] font-semibold">
                {liveTotalWeight === 100
                  ? '✓ Weights perfectly balanced'
                  : liveTotalWeight > 100
                  ? `Exceeds 100% by ${liveTotalWeight - 100}%! Please reduce stage weights.`
                  : `Needs +${100 - liveTotalWeight}% to reach required 100%.`}
              </span>
            </div>

            {/* ── Dynamic Stage Builder ──────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Layers size={14} className="text-primary" />
                  <span>Pipeline Stages ({stages.length})</span>
                </h4>

                <Button variant="secondary" size="sm" icon={Plus} type="button" onClick={handleAddStage}>
                  Add Stage
                </Button>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {stages.map((stg, idx) => (
                  <div
                    key={stg.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-2.5 shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          required
                          value={stg.name}
                          onChange={(e) => updateStageField(idx, 'name', e.target.value)}
                          placeholder="Stage Name"
                          className="p-1.5 rounded-lg border border-slate-200 font-bold text-xs w-48 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <label className="text-[11px] text-slate-500 font-semibold">Weight %:</label>
                          <input
                            type="number"
                            required
                            min="1"
                            max="100"
                            value={stg.weight}
                            onChange={(e) => updateStageField(idx, 'weight', Number(e.target.value))}
                            className="w-16 p-1 rounded-lg border border-slate-300 text-center font-mono font-bold text-xs"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <label className="text-[11px] text-slate-500 font-semibold">Days:</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={stg.expectedDays}
                            onChange={(e) => updateStageField(idx, 'expectedDays', Number(e.target.value))}
                            className="w-14 p-1 rounded-lg border border-slate-300 text-center font-mono text-xs"
                          />
                        </div>

                        {/* Reorder & Stage Actions */}
                        <div className="flex items-center gap-0.5 pl-2 border-l border-slate-200">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveStage(idx, -1)}
                            className="p-1 text-slate-400 hover:text-primary disabled:opacity-30 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === stages.length - 1}
                            onClick={() => moveStage(idx, 1)}
                            className="p-1 text-slate-400 hover:text-primary disabled:opacity-30 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateStage(idx)}
                            className="p-1 text-slate-400 hover:text-primary cursor-pointer"
                            title="Duplicate stage"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveStage(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Remove stage"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                      <div>
                        <label className="text-slate-500 font-semibold block mb-0.5">Responsible Party</label>
                        <select
                          value={stg.responsibleParty || 'Vendor'}
                          onChange={(e) => updateStageField(idx, 'responsibleParty', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-200 text-xs"
                        >
                          <option value="Vendor">Vendor</option>
                          <option value="In-House / Vendor">In-House / Vendor</option>
                          <option value="Third-Party QC">Third-Party QC</option>
                        </select>
                      </div>

                      <div className="flex items-center pt-4">
                        <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={stg.proofRequired}
                            onChange={(e) => updateStageField(idx, 'proofRequired', e.target.checked)}
                            className="rounded border-slate-300 text-primary"
                          />
                          <span>Mandatory Proof Required</span>
                        </label>
                      </div>

                      <div>
                        <label className="text-slate-500 font-semibold block mb-0.5">Stage Instructions</label>
                        <input
                          type="text"
                          placeholder="Technical guidelines for supplier..."
                          value={stg.instructions || ''}
                          onChange={(e) => updateStageField(idx, 'instructions', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-200 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" type="button" onClick={() => setEditorOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={liveTotalWeight !== 100}
              >
                {liveTotalWeight !== 100 ? 'Fix Weights to 100%' : 'Save Process Template'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Process Template Preview Modal (Requirement 19) ───────── */}
      {previewTemplate && (
        <Modal
          isOpen={Boolean(previewTemplate)}
          onClose={() => setPreviewTemplate(null)}
          title={`Vendor Experience Preview: ${previewTemplate.name}`}
          subtitle="Exact visual timeline representation of how suppliers see this stage sequence in their portal."
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50/70 border border-blue-200 text-blue-800 rounded-xl flex items-center gap-2 text-xs">
              <Info size={16} className="text-blue-600 shrink-0" />
              <span>
                Vendors see this sequence with active stage completion forms and weighted contribution bars totaling 100%.
              </span>
            </div>

            <div className="space-y-3">
              {previewTemplate.stages?.map((stg, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">
                        {stg.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {stg.instructions || 'Standard fabrication guidelines apply.'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="font-bold text-xs text-primary font-mono">
                      Weight: {stg.weight}%
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Duration: {stg.expectedDays} days • {stg.proofRequired ? 'Proof Mandatory' : 'Optional Proof'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={() => setPreviewTemplate(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ProcessTemplatesPage;
