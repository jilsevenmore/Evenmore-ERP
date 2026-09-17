import React, { useState, useMemo } from 'react';
import { ArrowUpDown, MoreVertical, Search, Download } from 'lucide-react';
import Pagination from './Pagination';

/**
 * DataTable — Unified CRM/ERP/HRMS Data Table.
 * Supports both ERP props (header, accessor, title, subtitle, searchFilter, keyExtractor)
 * and CRM/HRMS props (label, key, searchable, selectable, emptyTitle, emptyDesc, etc.)
 */
export function DataTable({
  title,
  subtitle,
  columns = [],
  data = [],
  rowKey = 'id',
  keyExtractor,
  selectable = false,
  selected = [],
  onSelectChange,
  onRowClick,
  actions,
  searchable = false,
  searchPlaceholder = 'Search…',
  searchFilter,
  emptyMessage,
  emptyTitle = 'No records found',
  emptyDesc = 'There are no records matching your current filter criteria.',
  emptyAction,
  pageSize: initialPageSize = 5,
  pageSizeOptions = [5, 10, 20],
  action,
  exportable = true,
}) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const isSearchEnabled = searchable || !!searchFilter || searchPlaceholder !== 'Search…' || !!title;

  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  // Filter
  const filtered = useMemo(() => {
    if (!isSearchEnabled || !search.trim()) return safeData;
    const q = search.toLowerCase().trim();

    if (typeof searchFilter === 'function') {
      try {
        return safeData.filter((row) => searchFilter(row, q));
      } catch (err) {
        console.warn('Error in searchFilter:', err);
      }
    }

    return safeData.filter((row) => {
      if (!row) return false;
      return columns.some((col) => {
        const k = col.key || col.accessor || col.id;
        if (!k) return false;
        const val = row[k];
        return val != null && String(val).toLowerCase().includes(q);
      });
    });
  }, [safeData, search, isSearchEnabled, searchFilter, columns]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a?.[sortKey] ?? '';
      const bv = b?.[sortKey] ?? '';
      const cmp = String(av).toLowerCase().localeCompare(String(bv).toLowerCase(), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Paginate
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  function getRowKey(row, index) {
    if (typeof keyExtractor === 'function') {
      try {
        const k = keyExtractor(row);
        if (k != null) return k;
      } catch {
        // fallback
      }
    }
    if (rowKey && row && row[rowKey] != null) return row[rowKey];
    if (row && row.id != null) return row.id;
    if (row && row.code != null) return row.code;
    return `row-${index}`;
  }

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const allChecked = paginated.length > 0 && paginated.every((r, idx) => selected.includes(getRowKey(r, idx)));

  function toggleAll() {
    if (!onSelectChange) return;
    const pageKeys = paginated.map((r, idx) => getRowKey(r, idx));
    if (allChecked) {
      onSelectChange(selected.filter((k) => !pageKeys.includes(k)));
    } else {
      onSelectChange([...new Set([...selected, ...pageKeys])]);
    }
  }

  function toggleRow(key) {
    if (!onSelectChange) return;
    onSelectChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  }

  const handleExportCSV = () => {
    try {
      if (!safeData || safeData.length === 0) return;
      
      const exportCols = columns.filter((col) => col.key !== 'actions' && col.id !== 'actions');
      const headers = exportCols.map((c) => `"${(c.header || c.label || c.title || c.key || '').replace(/"/g, '""')}"`);
      
      const rows = filtered.map((row) => {
        return exportCols.map((col) => {
          const k = col.key || col.accessor || col.id;
          let cellVal = k != null && row ? row[k] : '';
          if (typeof cellVal === 'object' && cellVal !== null) {
            cellVal = JSON.stringify(cellVal);
          }
          return `"${String(cellVal ?? '').replace(/"/g, '""')}"`;
        }).join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const cleanTitle = (title || 'export').toLowerCase().replace(/[^a-z0-9]/g, '-');
      link.setAttribute('href', url);
      link.setAttribute('download', `${cleanTitle}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export table CSV:', err);
    }
  };

  function renderCell(col, row) {
    const key = col.key || col.accessor || col.id;
    const val = key != null && row ? row[key] : undefined;

    if (typeof col.render === 'function') {
      try {
        // If render explicitly expects 2 args
        if (col.render.length >= 2) {
          return col.render(val, row);
        }
        // If label is defined (HRMS style single-arg value function)
        if (col.label !== undefined && key !== undefined && val !== undefined) {
          return col.render(val, row);
        }
        // ERP and general row-based render
        return col.render(row, row);
      } catch (err) {
        console.warn('Error in DataTable renderCell:', err);
        return val != null ? String(val) : '—';
      }
    }

    return val != null ? String(val) : '—';
  }

  return (
    <div className="table-card bg-card rounded-xl border border-border shadow-xs overflow-hidden">
      {/* Optional Card Header with Title, Subtitle, and Search / Action */}
      {(title || isSearchEnabled || action) && (
        <div className="p-3.5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card-alt">
          <div>
            {title && <h3 className="font-bold text-text text-sm tracking-tight">{title}</h3>}
            {subtitle && <p className="text-[11px] text-muted mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2">
            {isSearchEnabled && (
              <div className="relative flex items-center w-full sm:w-64">
                <Search size={14} className="absolute left-3 text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-8.5 pr-3 py-1.5 bg-card border border-border rounded-xl text-xs text-text placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition shadow-2xs"
                />
              </div>
            )}
            {exportable && safeData.length > 0 && (
              <button
                type="button"
                onClick={handleExportCSV}
                title="Export Table to CSV"
                className="p-1.5 border border-border hover:bg-card-hover rounded-xl text-muted hover:text-text cursor-pointer transition shadow-2xs flex items-center gap-1 text-xs shrink-0"
              >
                <Download size={14} />
              </button>
            )}
            {action && <div>{action}</div>}
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="table-scroll overflow-x-auto max-h-[70vh]">
        <table className="data-table w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 shadow-xs">
            <tr className="border-b border-border bg-table-head text-text-secondary font-semibold text-[11px] uppercase tracking-wider">
              {selectable && (
                <th className="col-check py-2.5 px-3 w-10 text-center bg-table-head">
                  <input
                    type="checkbox"
                    className="row-check rounded border-border text-primary focus:ring-primary cursor-pointer"
                    checked={allChecked}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
              )}
              {columns.map((col, idx) => {
                const colTitle = col.header || col.label || col.title || '';
                const colKey = col.key || col.accessor || col.id || `col-${idx}`;
                const alignCls =
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';

                return (
                  <th
                    key={colKey}
                    style={col.width ? { width: col.width } : {}}
                    className={`py-2.5 px-3 ${alignCls}`}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        className={`inline-flex items-center gap-1 font-bold text-text-secondary hover:text-primary transition cursor-pointer ${
                          col.align === 'right' ? 'ml-auto justify-end' : col.align === 'center' ? 'mx-auto justify-center' : 'justify-start'
                        }`}
                        onClick={() => toggleSort(colKey)}
                      >
                        <span>{colTitle}</span>
                        <ArrowUpDown
                          size={12}
                          className={sortKey === colKey ? 'text-primary' : 'text-muted/60'}
                        />
                      </button>
                    ) : (
                      <div className={`w-full ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                        <span>{colTitle}</span>
                      </div>
                    )}
                  </th>
                );
              })}
              {actions && <th className="col-more py-2.5 px-3 text-center w-12"><MoreVertical size={14} className="mx-auto text-muted" /></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {paginated.map((row, index) => {
              const rowId = getRowKey(row, index);
              const isRowSelected = selected.includes(rowId);

              return (
                <tr
                  key={rowId}
                  className={`transition-colors hover:bg-card-hover ${isRowSelected ? 'bg-primary-subtle' : ''} ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {selectable && (
                    <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="row-check rounded border-border text-primary focus:ring-primary cursor-pointer"
                        checked={isRowSelected}
                        onChange={() => toggleRow(rowId)}
                        aria-label="Select row"
                      />
                    </td>
                  )}
                  {columns.map((col, idx) => {
                    const colKey = col.key || col.accessor || col.id || `col-${idx}`;
                    const alignCls =
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';

                    return (
                      <td
                        key={colKey}
                        style={col.width ? { width: col.width } : {}}
                        className={`py-2 px-3 text-text align-middle ${alignCls}`}
                      >
                        {renderCell(col, row)}
                      </td>
                    );
                  })}
                  {actions && (
                    <td className="py-2 px-3 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                      {actions(row)}
                    </td>
                  )}
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
                  className="empty-row py-12 px-4 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="font-semibold text-text text-sm">{emptyMessage || emptyTitle}</p>
                    <p className="text-xs text-muted max-w-sm">{emptyDesc}</p>
                    {emptyAction && <div className="pt-2">{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {(sorted.length > pageSize || sorted.length > 5) && (
        <div className="border-t border-border bg-card-alt pr-16 sm:pr-20">
          <Pagination
            total={sorted.length}
            page={page}
            pageSize={pageSize}
            onChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

export default DataTable;
