import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  X,
  Sliders,
  Type,
  Hash,
  Calendar,
  List,
  ToggleLeft,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { fetchCustomFields, createCustomField, deleteCustomField } from '../../services/upgradeService';

const ENTITY_OPTIONS = [
  { value: 'all', label: 'All Entities' },
  { value: 'Lead', label: 'CRM Leads' },
  { value: 'Deal', label: 'CRM Deals' },
  { value: 'Party', label: 'Parties / Customers & Vendors' },
  { value: 'Item', label: 'Inventory Items' },
  { value: 'PurchaseOrder', label: 'Purchase Orders' },
  { value: 'SalesOrder', label: 'Sales Orders' },
  { value: 'Project', label: 'PMS Projects' },
  { value: 'Task', label: 'PMS Tasks' },
  { value: 'Employee', label: 'HRMS Employees' },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Text / String', icon: Type },
  { value: 'number', label: 'Number / Decimal', icon: Hash },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'select', label: 'Dropdown / Select', icon: List },
  { value: 'boolean', label: 'Yes / No (Boolean)', icon: ToggleLeft },
];

export default function CustomFieldsPage() {
  const showToast = useAppStore((s) => s.showToast);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New field form state
  const [newField, setNewField] = useState({
    entity_type: 'Lead',
    field_label: '',
    field_name: '',
    field_type: 'text',
    is_required: false,
    options: '',
    default_value: '',
    sort_order: 0,
  });

  const loadFields = async () => {
    setLoading(true);
    try {
      const res = await fetchCustomFields(selectedEntity === 'all' ? undefined : selectedEntity);
      const data = res?.data || res?.results || res || [];
      setFields(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load custom fields from backend, fallback empty', err);
      setFields([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFields();
  }, [selectedEntity]);

  const handleLabelChange = (label) => {
    const autoKey = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    setNewField((prev) => ({
      ...prev,
      field_label: label,
      field_name: prev.field_name ? prev.field_name : autoKey,
    }));
  };

  const handleCreateField = async (e) => {
    e.preventDefault();
    if (!newField.field_label || !newField.field_name) {
      showToast('Field label and key name are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        entity_type: newField.entity_type,
        field_label: newField.field_label.trim(),
        field_name: newField.field_name.trim().toLowerCase(),
        field_type: newField.field_type,
        is_required: newField.is_required,
        default_value: newField.default_value || null,
        sort_order: parseInt(newField.sort_order, 10) || 0,
        options: newField.field_type === 'select'
          ? newField.options.split(',').map((s) => s.trim()).filter(Boolean)
          : null,
      };

      await createCustomField(payload);
      showToast(`Custom field '${payload.field_label}' created successfully`, 'success');
      setIsModalOpen(false);
      setNewField({
        entity_type: 'Lead',
        field_label: '',
        field_name: '',
        field_type: 'text',
        is_required: false,
        options: '',
        default_value: '',
        sort_order: 0,
      });
      loadFields();
    } catch (err) {
      showToast(err?.message || 'Failed to create custom field', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteField = async (id, label) => {
    if (!window.confirm(`Delete custom field "${label}"? Existing field data may no longer be rendered.`)) {
      return;
    }
    try {
      await deleteCustomField(id);
      showToast(`Custom field "${label}" removed`, 'success');
      setFields((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      showToast(err?.message || 'Failed to delete field', 'error');
    }
  };

  const filteredFields = useMemo(() => {
    return fields.filter((f) => {
      const matchSearch =
        !searchTerm ||
        (f.field_label || f.fieldLabel || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.field_name || f.fieldName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchEntity =
        selectedEntity === 'all' ||
        (f.entity_type || f.entityType) === selectedEntity;
      return matchSearch && matchEntity;
    });
  }, [fields, searchTerm, selectedEntity]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-slate-800">Custom Fields Builder</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Define dynamic extension attributes and custom validation rules across CRM, Supply Chain, Finance, and HRMS.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Custom Field
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Defined Fields</span>
          <div className="text-2xl font-bold text-slate-800 mt-1">{fields.length}</div>
          <span className="text-xs text-emerald-600 mt-1 inline-block">Configured in schema</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Entities</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {new Set(fields.map((f) => f.entity_type || f.entityType)).size}
          </div>
          <span className="text-xs text-slate-500 mt-1 inline-block">Active entity targets</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Required Fields</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {fields.filter((f) => f.is_required || f.isRequired).length}
          </div>
          <span className="text-xs text-slate-500 mt-1 inline-block">Mandatory user input</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Choice Dropdowns</span>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {fields.filter((f) => (f.field_type || f.fieldType) === 'select').length}
          </div>
          <span className="text-xs text-slate-500 mt-1 inline-block">Option list validated</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-slate-400" />
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
            {ENTITY_OPTIONS.slice(0, 6).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedEntity(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  selectedEntity === opt.value
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search field label or key..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Fields Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading custom field schemas...</div>
        ) : filteredFields.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Sliders className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-base font-medium">No custom fields defined for this view</p>
            <p className="text-xs text-slate-400">Click &quot;Add Custom Field&quot; to define a new dynamic column</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Field Label</th>
                  <th className="px-6 py-3.5">API Key (Code)</th>
                  <th className="px-6 py-3.5">Entity Model</th>
                  <th className="px-6 py-3.5">Data Type</th>
                  <th className="px-6 py-3.5">Requirement</th>
                  <th className="px-6 py-3.5">Options / Default</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFields.map((f) => {
                  const typeObj = FIELD_TYPES.find((t) => t.value === (f.field_type || f.fieldType)) || FIELD_TYPES[0];
                  const Icon = typeObj.icon;
                  const opts = Array.isArray(f.options) ? f.options.join(', ') : f.options;
                  return (
                    <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {f.field_label || f.fieldLabel}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {f.field_name || f.fieldName}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                          {f.entity_type || f.entityType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                          <Icon className="h-3.5 w-3.5" />
                          {typeObj.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {f.is_required || f.isRequired ? (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-semibold">
                            Mandatory
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">
                            Optional
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                        {opts ? (
                          <span className="italic">Choices: {opts}</span>
                        ) : f.default_value || f.defaultValue ? (
                          <span>Default: {f.default_value || f.defaultValue}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteField(f.id, f.field_label || f.fieldLabel)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                          title="Delete Field"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Custom Field Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-slate-900">Add Custom Field</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateField} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Target Entity
                </label>
                <select
                  value={newField.entity_type}
                  onChange={(e) => setNewField({ ...newField, entity_type: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20"
                >
                  {ENTITY_OPTIONS.filter((o) => o.value !== 'all').map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.value})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Field Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. GST Exemption Certificate"
                  value={newField.field_label}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  API Key / Field Name (snake_case)
                </label>
                <input
                  type="text"
                  placeholder="e.g. gst_exemption_cert"
                  value={newField.field_name}
                  onChange={(e) => setNewField({ ...newField, field_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Field Type
                  </label>
                  <select
                    value={newField.field_type}
                    onChange={(e) => setNewField({ ...newField, field_type: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={newField.sort_order}
                    onChange={(e) => setNewField({ ...newField, sort_order: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {newField.field_type === 'select' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Dropdown Choices (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Option A, Option B, Option C"
                    value={newField.options}
                    onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Default Value (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Optional default placeholder"
                  value={newField.default_value}
                  onChange={(e) => setNewField({ ...newField, default_value: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isRequiredField"
                  checked={newField.is_required}
                  onChange={(e) => setNewField({ ...newField, is_required: e.target.checked })}
                  className="h-4 w-4 text-primary rounded border-slate-300 focus:ring-primary"
                />
                <label htmlFor="isRequiredField" className="text-sm font-medium text-slate-700">
                  Required field (validation error if left empty)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/95 transition-all shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
