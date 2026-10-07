import React, { useMemo, useState } from 'react';
import {
  Briefcase,
  ChevronDown,
  ChevronUp,
  Landmark,
  Layers,
  Menu,
  Package,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Target,
  UserCheck,
  Users,
} from 'lucide-react';

/**
 * The permission catalogue as a checkbox tree: module tabs -> group cards ->
 * permissions. Everything it lists comes from `GET /admin/permissions/`
 * (`modules`), so a permission added on the server shows up here as-is.
 *
 * `selected` is an array of permission ids; `onChange` receives the next one.
 * `inherited` (optional) marks ids that come from the user's role.
 */

// Presentation only — an unknown module simply gets the fallback icon.
const MODULE_ICONS = {
  CRM: Target,
  Staff: Users,
  Project: Briefcase,
  HRM: UserCheck,
  Account: Landmark,
  POS: ShoppingCart,
  Sales: ShoppingCart,
  Purchase: ShoppingBag,
  Inventory: Package,
  PMS: Layers,
  'Menu Access': Menu,
};

const GROUP_TONES = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-purple-100 text-purple-700',
  'bg-rose-100 text-rose-700',
];

function idsOf(groups) {
  return groups.flatMap((g) => g.permissions.map((p) => p.id));
}

function text(value) {
  return String(value ?? '').toLowerCase();
}

export function PermissionPicker({ modules, selected, onChange, readOnly = false, inherited }) {
  const [activeModule, setActiveModule] = useState(null);
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState({});

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const allIds = useMemo(() => modules.flatMap((m) => idsOf(m.groups)), [modules]);
  const current = modules.find((m) => m.module === activeModule) || modules[0] || null;

  // While searching, matches from every module are shown together.
  const q = query.trim().toLowerCase();
  const visibleGroups = useMemo(() => {
    if (!q) {
      return (current?.groups || []).map((g) => ({ ...g, module: current.module }));
    }
    return modules.flatMap((m) =>
      m.groups
        .map((g) => {
          const groupHit = text(g.group).includes(q) || text(m.module).includes(q);
          const permissions = groupHit
            ? g.permissions
            : g.permissions.filter(
                (p) => text(p.label).includes(q) || text(p.id).includes(q) || text(p.description).includes(q)
              );
          return { ...g, module: m.module, permissions };
        })
        .filter((g) => g.permissions.length > 0)
    );
  }, [q, modules, current]);

  const visibleIds = useMemo(() => idsOf(visibleGroups), [visibleGroups]);

  const setMany = (ids, on) => {
    if (readOnly) return;
    const next = new Set(selected);
    ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
    // Keep catalogue order so the saved list reads like the screen.
    onChange(allIds.filter((id) => next.has(id)).concat([...next].filter((id) => !allIds.includes(id))));
  };

  const toggleOne = (id) => setMany([id], !selectedSet.has(id));

  const countIn = (ids) => ids.filter((id) => selectedSet.has(id)).length;
  const scopeIds = q ? visibleIds : idsOf(current?.groups || []);
  const scopeLabel = q ? 'matches' : 'module';

  if (!modules.length) {
    return (
      <div className="text-center py-10 text-xs text-slate-400">
        The permission catalogue could not be loaded.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Module tabs, search and bulk actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between border-b border-slate-200 gap-3 pb-2">
        <div className="flex flex-nowrap items-center gap-1 overflow-x-auto no-scrollbar scrollbar-none py-1 min-w-0 flex-1">
          {modules.map((m) => {
            const ids = idsOf(m.groups);
            const isActive = !q && current?.module === m.module;
            return (
              <button
                key={m.module}
                type="button"
                onClick={() => {
                  setActiveModule(m.module);
                  setQuery('');
                }}
                className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? 'text-[#1f6bff] border-b-2 border-[#1f6bff] rounded-b-none bg-blue-50/30'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {m.module}
                <span className="ml-1 text-[10px] font-medium text-slate-400">
                  {countIn(ids)}/{ids.length}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[200px] flex-1 md:flex-initial">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search all permissions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-600">
          {selected.filter((id) => allIds.includes(id)).length} of {allIds.length} permissions selected
          {q && <span className="font-normal text-slate-400"> · {visibleIds.length} matching “{query.trim()}”</span>}
        </span>
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMany(scopeIds, true)}
              disabled={!scopeIds.length}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 disabled:opacity-40"
            >
              Select {scopeLabel}
            </button>
            <button
              type="button"
              onClick={() => setMany(scopeIds, false)}
              disabled={!countIn(scopeIds)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 disabled:opacity-40"
            >
              Clear {scopeLabel}
            </button>
            <span className="w-px h-4 bg-slate-200 mx-0.5" />
            <button
              type="button"
              onClick={() => setMany(allIds, true)}
              className="px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 font-semibold text-blue-700"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={() => setMany(allIds, false)}
              disabled={!selected.length}
              className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 font-semibold text-rose-600 disabled:opacity-40"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Group cards */}
      {visibleGroups.length === 0 ? (
        <div className="text-center py-10 text-xs text-slate-400">No matching permissions found.</div>
      ) : (
        visibleGroups.map((group, index) => {
          const key = `${group.module}::${group.group}`;
          const Icon = MODULE_ICONS[group.module] || Sparkles;
          const ids = group.permissions.map((p) => p.id);
          const selectedCount = countIn(ids);
          const allOn = ids.length > 0 && selectedCount === ids.length;
          const isCollapsed = Boolean(collapsed[key]) && !q;
          return (
            <div key={key} className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-2xs">
              <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 p-3.5 bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${GROUP_TONES[index % GROUP_TONES.length]}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs md:text-sm font-bold text-slate-800 leading-tight truncate">{group.group}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{group.module}</p>
                  </div>
                </div>

                <div className="flex flex-wrap lg:flex-nowrap items-center gap-x-4 gap-y-1 text-xs">
                  {!readOnly && (
                    <label className="flex items-center gap-1.5 font-medium text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={allOn}
                        onChange={() => setMany(ids, !allOn)}
                        className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span>Select All</span>
                    </label>
                  )}
                  <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
                    {selectedCount} of {ids.length} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
                  >
                    {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </button>
                </div>
              </div>

              {!isCollapsed && (
                <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {group.permissions.map((perm) => {
                    const isChecked = selectedSet.has(perm.id);
                    const fromRole = inherited?.has(perm.id);
                    return (
                      <label
                        key={perm.id}
                        title={perm.description || perm.id}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all select-none ${
                          readOnly ? 'cursor-default' : 'cursor-pointer'
                        } ${
                          isChecked
                            ? 'bg-[#1f6bff] border-[#1f6bff] text-white shadow-2xs font-medium'
                            : 'bg-slate-50/50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={readOnly}
                          onChange={() => toggleOne(perm.id)}
                          className={`w-4 h-4 rounded border-slate-300 focus:ring-0 ${
                            isChecked ? 'accent-white text-blue-600' : 'text-blue-600'
                          }`}
                        />
                        <span className="text-xs truncate flex-1">{perm.label}</span>
                        {fromRole && (
                          <span className={`text-[9px] font-bold uppercase tracking-wide ${isChecked ? 'text-blue-100' : 'text-slate-400'}`}>
                            role
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

/** id -> label, for showing permission chips outside the picker. */
export function permissionLabels(modules) {
  const map = {};
  (modules || []).forEach((m) =>
    m.groups.forEach((g) => g.permissions.forEach((p) => {
      map[p.id] = p.label;
    }))
  );
  return map;
}

export default PermissionPicker;
