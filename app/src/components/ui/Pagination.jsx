import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination — CRM-styled pagination bar.
 * Props: total, page, pageSize, onChange
 * Opt-in (screenshot format): showTotalRecords, pageSizeOptions, onPageSizeChange
 */
export function Pagination({ total = 0, page = 1, pageSize = 20, onChange, showTotalRecords = false, pageSizeOptions = null, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = Math.min((page - 1) * pageSize + 1, total);
  const end = Math.min(page * pageSize, total);

  function goTo(p) {
    const next = Math.max(1, Math.min(totalPages, p));
    onChange?.(next);
  }

  // Generate page numbers around current
  const pages = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
    pages.push(i);
  }

  return (
    <div className="pagination">
      {showTotalRecords ? (
        <span className="pagination-total">
          Total Records <strong>{total}</strong>
        </span>
      ) : (
        <span>
          {total > 0 ? `${start}–${end} of ${total} records` : 'No records'}
        </span>
      )}

      <div className="pagination-pages">
        <button
          type="button"
          className="pager-btn"
          disabled={page <= 1}
          onClick={() => goTo(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </button>

        {pages[0] > 1 && (
          <>
            <button type="button" className="pager-btn" onClick={() => goTo(1)}>1</button>
            {pages[0] > 2 && <span style={{ padding: '0 4px', color: '#7184a3' }}>…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`pager-btn${p === page ? ' active' : ''}`}
            onClick={() => goTo(p)}
          >
            {p}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span style={{ padding: '0 4px', color: '#7184a3' }}>…</span>
            )}
            <button type="button" className="pager-btn" onClick={() => goTo(totalPages)}>
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          className="pager-btn"
          disabled={page >= totalPages}
          onClick={() => goTo(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </button>

        {Array.isArray(pageSizeOptions) && pageSizeOptions.length > 0 && (
          <select
            className="page-size-select"
            value={pageSize}
            onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
            aria-label="Records per page"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

export default Pagination;

