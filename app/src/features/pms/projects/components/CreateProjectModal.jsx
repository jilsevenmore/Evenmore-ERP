import React, { useMemo, useState } from 'react';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { usePmsStore, nextProjectId } from '../../../../stores/pmsStore';
import { useERP } from '../../../../context/ERPContext';
import { formatCurrency } from '../../../../utils/currencyUtils';
import { AlertCircle, Link2, PackageCheck } from 'lucide-react';

/**
 * CreateProjectModal — turns a confirmed CRM/ERP sales order into a project.
 *
 * Orders come from the ERP sales orders the server returned, and
 * any order already linked to a project is excluded so the same order cannot be
 * converted twice. Selecting an order auto-fills customer, product and value.
 */

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const fieldClass =
  'w-full text-xs rounded-lg border border-[#dce5f4] bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400';
const labelClass = 'block text-[11px] font-semibold text-slate-600 mb-1.5';

function todayLocalDate() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function CreateProjectModal({ isOpen, onClose, onCreated }) {
  const projects = usePmsStore((s) => s.projects);
  const stageConfigs = usePmsStore((s) => s.stageConfigs);
  const employees = usePmsStore((s) => s.employees);
  const createProjectFromOrder = usePmsStore((s) => s.createProjectFromOrder);
  const showToast = usePmsStore((s) => s.showToast);
  // The sales orders a project can be created from, as the server returned them.
  const { salesOrders = [] } = useERP() || {};

  const activeConfigs = useMemo(
    () => stageConfigs.filter((c) => c.isActive).sort((a, b) => a.sequence - b.sequence),
    [stageConfigs]
  );
  const managers = useMemo(() => employees.filter((e) => e.isProjectManager), [employees]);

  // An order already converted into a project cannot be converted twice, but it
  // still appears in the list — disabled, naming the project that owns it — so
  // an empty dropdown never looks like a loading failure.
  const { availableOrders, linkedOrders } = useMemo(() => {
    const linkedBy = new Map();
    for (const p of projects) {
      if (p.crmOrderId) linkedBy.set(p.crmOrderId, p.id);
    }
    return {
      availableOrders: salesOrders.filter((o) => !linkedBy.has(o.orderNumber)),
      linkedOrders: salesOrders
        .filter((o) => linkedBy.has(o.orderNumber))
        .map((o) => ({ ...o, linkedProjectId: linkedBy.get(o.orderNumber) })),
    };
  }, [projects, salesOrders]);

  const [orderNumber, setOrderNumber] = useState('');
  const [managerId, setManagerId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [startDate, setStartDate] = useState(todayLocalDate());
  const [specifications, setSpecifications] = useState('');
  const [selectedConfigIds, setSelectedConfigIds] = useState(() => activeConfigs.map((c) => c.id));
  const [errors, setErrors] = useState({});

  const selectedOrder = availableOrders.find((o) => o.orderNumber === orderNumber) ?? null;
  const projectCode = useMemo(() => nextProjectId(projects), [projects]);

  function toggleConfig(id) {
    setSelectedConfigIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function reset() {
    setOrderNumber('');
    setManagerId('');
    setPriority('Medium');
    setStartDate(todayLocalDate());
    setSpecifications('');
    setSelectedConfigIds(activeConfigs.map((c) => c.id));
    setErrors({});
  }

  function handleClose() {
    reset();
    onClose?.();
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const nextErrors = {};
    if (!selectedOrder) nextErrors.order = 'Select a CRM sales order.';
    if (!managerId) nextErrors.manager = 'Assign a project manager.';
    if (selectedConfigIds.length === 0) nextErrors.stages = 'Pick at least one stage.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const manager = managers.find((m) => m.id === managerId);
    let id;
    try {
      id = await createProjectFromOrder({
      order: selectedOrder,
      projectManager: {
        id: manager.id,
        name: manager.name,
        email: manager.email,
        avatar: manager.avatar,
      },
      priority,
      startDate: new Date(`${startDate}T09:00:00`).toISOString(),
        stageConfigIds: selectedConfigIds,
        specifications,
      });
    } catch (err) {
      setErrors({ order: err?.message || 'The project could not be created.' });
      return;
    }

    showToast(`${id} created from ${selectedOrder.orderNumber}.`);
    reset();
    onCreated?.(id);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Project from CRM Order"
      subtitle={`New project will be created as ${projectCode}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="pms-create-project" icon={PackageCheck}>
            Create Project
          </Button>
        </>
      }
    >
      <form id="pms-create-project" onSubmit={handleSubmit} className="space-y-4">
        {/* CRM order */}
        <div>
          <label className={labelClass} htmlFor="pms-order">
            CRM Sales Order <span className="text-rose-500">*</span>
          </label>
          <select
            id="pms-order"
            className={fieldClass}
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
          >
            <option value="">Select a confirmed sales order…</option>
            {availableOrders.map((o) => (
              <option key={o.orderNumber} value={o.orderNumber}>
                {o.orderNumber} — {o.customer} ({formatCurrency(o.total ?? o.amount ?? 0)})
              </option>
            ))}
            {linkedOrders.length > 0 && (
              <optgroup label="Already converted">
                {linkedOrders.map((o) => (
                  <option key={o.orderNumber} value={o.orderNumber} disabled>
                    {o.orderNumber} — {o.customer} · linked to {o.linkedProjectId}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          {availableOrders.length === 0 && (
            <p className="text-[11px] text-amber-600 mt-1.5">
              Every sales order already has a project. Add a sales order in ERP, or unlink one,
              to create another project.
            </p>
          )}
          {errors.order && (
            <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1.5">
              <AlertCircle size={11} /> {errors.order}
            </p>
          )}
        </div>

        {/* Auto-filled order summary */}
        {selectedOrder && (
          <div className="rounded-lg border border-[#dce5f4] bg-[#f6f9ff] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Link2 size={12} className="text-blue-500" />
              <span className="text-[11px] font-bold text-slate-700">Auto-filled from order</span>
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ['Customer', selectedOrder.customer],
                ['Order value', formatCurrency(selectedOrder.total ?? selectedOrder.amount ?? 0)],
                ['Line items', selectedOrder.itemsCount ?? selectedOrder.items?.length ?? 0],
                ['Delivery due', selectedOrder.deliveryDate ?? '—'],
              ].map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="text-[10px] text-slate-500">{k}</dt>
                  <dd className="text-[11px] font-semibold text-slate-800 truncate" title={String(v)}>
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelClass} htmlFor="pms-pm">
              Project Manager <span className="text-rose-500">*</span>
            </label>
            <select
              id="pms-pm"
              className={fieldClass}
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
            >
              <option value="">Select a manager…</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.role}
                </option>
              ))}
            </select>
            {errors.manager && (
              <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1.5">
                <AlertCircle size={11} /> {errors.manager}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass} htmlFor="pms-priority">Priority</label>
            <select
              id="pms-priority"
              className={fieldClass}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="pms-start">Start Date</label>
            <input
              id="pms-start"
              type="date"
              className={fieldClass}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="pms-specs">Specifications</label>
          <textarea
            id="pms-specs"
            rows={2}
            className={fieldClass}
            value={specifications}
            onChange={(e) => setSpecifications(e.target.value)}
            placeholder="Technical notes, tolerances, finish requirements…"
          />
        </div>

        {/* Stage template picker */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className={labelClass + ' mb-0'}>Stage Template</span>
            <span className="text-[10px] text-slate-400">
              {selectedConfigIds.length} of {activeConfigs.length} selected
            </span>
          </div>
          <div className="rounded-lg border border-[#dce5f4] divide-y divide-slate-100 max-h-48 overflow-y-auto">
            {activeConfigs.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={selectedConfigIds.includes(c.id)}
                  onChange={() => toggleConfig(c.id)}
                  className="accent-blue-600"
                />
                <span className="text-[11px] font-semibold text-slate-700 flex-1 min-w-0 truncate">
                  {c.sequence}. {c.name}
                </span>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {c.department} · {c.defaultDuration} {c.durationUnit}
                </span>
              </label>
            ))}
          </div>
          {errors.stages && (
            <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-1.5">
              <AlertCircle size={11} /> {errors.stages}
            </p>
          )}
          <p className="text-[10px] text-slate-400 mt-1.5">
            Every selected stage is initialised as “Not Started”, and creation is logged to the
            project audit trail.
          </p>
        </div>
      </form>
    </Modal>
  );
}

export default CreateProjectModal;
