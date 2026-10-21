import { useEffect, useLayoutEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Building, Building2, ChevronDown, ChevronUp, MapPin, UserX, Users } from 'lucide-react';
import { UserInitials } from '../../components/common/UserInitials';

/**
 * The chart canvas. Layout is plain nested flex (an `ul`/`li` tree with CSS
 * connectors), so every branch is as wide as its content and cards can never
 * overlap. Siblings that have no reports of their own stack in a column once
 * there are more than STACK_AFTER of them, which keeps a department of
 * hundreds from becoming one very wide row.
 */
const STACK_AFTER = 3;

function Toggle({ item, open, onToggle, label }) {
  if (!item.reportCount) return null;
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onToggle(item.key); }}
      title={open ? 'Collapse' : 'Expand'}
      className="oc-toggle mt-2 px-2 py-0.5 font-medium text-slate-600 bg-off hover:bg-slate-200 border border-bdr rounded-full inline-flex items-center gap-1 transition-colors cursor-pointer"
    >
      <span className="oc-toggle-label">{item.reportCount} {label}</span>
      {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
    </button>
  );
}

function OrgCard({ item, open, onToggle }) {
  return (
    <div className="oc-card w-[190px] border-2 border-navy p-3">
      <div className="w-9 h-9 rounded-full ring-2 ring-navy grid place-items-center text-navy">
        <Building size={17} />
      </div>
      <div className="text-[13.5px] font-bold text-slate-900 mt-2">{item.name}</div>
      <div className="text-[11px] text-muted">
        {item.departmentCount} departments • {item.employeeCount} employees
      </div>
      <Toggle item={item} open={open} onToggle={onToggle} label={item.reportCount === 1 ? 'unit' : 'units'} />
    </div>
  );
}

function DeptCard({ item, open, onToggle, matched }) {
  return (
    <div className={`oc-card w-[200px] p-3 border ${item.unassigned ? 'border-dashed border-slate-300 bg-slate-50' : 'border-navy/40 bg-blue-50/40'} ${matched ? 'ring-2 ring-blue-500/40' : ''}`}>
      <div className="flex items-center gap-1.5 text-navy">
        <Building2 size={15} className="shrink-0" />
        <span className="text-[13px] font-bold text-slate-900 truncate" title={item.name}>{item.name}</span>
      </div>
      {item.unassigned ? (
        <div className="text-[11px] text-muted mt-1">No department on the employee record</div>
      ) : item.head ? (
        <div className="text-[11px] text-slate-600 mt-1 truncate" title={item.head.name}>
          Head: <b className="font-semibold text-slate-800">{item.head.name}</b>
          {item.headElsewhere && <span className="text-muted"> (another dept.)</span>}
        </div>
      ) : (
        <div className="text-[11px] text-amber-700 mt-1 leading-snug">
          <UserX size={12} className="inline -mt-0.5 mr-0.5" />Department Head not assigned
        </div>
      )}
      <div className="flex justify-center gap-1.5 mt-2 text-[10.5px]">
        <span className="px-2 py-0.5 bg-white border border-bdr rounded-full text-slate-700 font-medium inline-flex items-center gap-1">
          <Users size={11} /> {item.employeeCount}
        </span>
        {!item.unassigned && (
          <span className="px-2 py-0.5 bg-white border border-bdr rounded-full text-slate-700 font-medium">
            {item.teamCount} team{item.teamCount === 1 ? '' : 's'}
          </span>
        )}
      </div>
      <Toggle item={item} open={open} onToggle={onToggle} label={item.reportCount === 1 ? 'top person' : 'top people'} />
    </div>
  );
}

function EmployeeCard({ item, open, onToggle, onSelect, matched }) {
  return (
    <div
      onClick={() => onSelect(item)}
      className={`oc-card w-[180px] p-2.5 border border-bdr cursor-pointer hover:border-slate-400 hover:shadow-md group ${matched ? 'ring-2 ring-blue-500/40 border-blue-400' : ''}`}
    >
      <div className="relative">
        <UserInitials name={item.name} className="w-9 h-9 text-xs" />
        {item.relation === 'head' && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 rounded-full bg-navy text-white text-[9px] font-bold leading-4">HEAD</span>
        )}
      </div>
      <div className="text-[12.5px] font-semibold text-slate-900 mt-1.5 group-hover:text-navy transition-colors truncate w-full" title={item.name}>
        {item.name}
      </div>
      <div className="text-[10.5px] text-muted font-medium">{item.code}</div>
      <div className="text-[11px] text-slate-600 truncate w-full" title={item.designation}>{item.designation || '—'}</div>
      <div className="text-[10.5px] text-muted truncate w-full" title={item.department}>{item.department || 'No department'}</div>
      {item.location && (
        <div className="text-[10.5px] text-muted truncate w-full inline-flex items-center justify-center gap-0.5">
          <MapPin size={10} className="shrink-0" /> {item.location}
        </div>
      )}
      <Toggle item={item} open={open} onToggle={onToggle} label={item.reportCount === 1 ? 'report' : 'reports'} />
    </div>
  );
}

function Card(props) {
  const { item } = props;
  if (item.kind === 'org') return <OrgCard {...props} />;
  if (item.kind === 'dept') return <DeptCard {...props} />;
  return <EmployeeCard {...props} />;
}

function Children({ items, ctx }) {
  const stack = items.length > STACK_AFTER && items.every((child) => !child.children.length);
  if (stack) {
    return (
      <div className="oc-stack">
        {items.map((child) => (
          <div key={child.key} className="oc-stack-item">
            <Card item={child} open={false} onToggle={ctx.onToggle} onSelect={ctx.onSelect} matched={ctx.matched.has(child.key)} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <ul>
      {items.map((child) => <Branch key={child.key} item={child} ctx={ctx} />)}
    </ul>
  );
}

function Branch({ item, ctx }) {
  const open = ctx.expanded.has(item.key) && item.children.length > 0;
  return (
    <li>
      <Card item={item} open={open} onToggle={ctx.onToggle} onSelect={ctx.onSelect} matched={ctx.matched.has(item.key)} />
      {open && <Children items={item.children} ctx={ctx} />}
    </li>
  );
}

/**
 * `zoom` scales the drawing; the sizer takes the scaled size so the scroll
 * area always matches what is on screen, in both directions.
 */
const OrgTreeView = forwardRef(function OrgTreeView(
  { root, expanded, matched, zoom, setZoom, onToggle, onSelect, centerSignal },
  ref
) {
  const scrollRef = useRef(null);
  const innerRef = useRef(null);
  const pendingCenter = useRef(true);
  const hasInitialFitted = useRef(false);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Smooth drag to pan
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const centerView = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
    el.scrollTop = 0;
  }, []);

  const fitToScreen = useCallback(() => {
    const el = scrollRef.current;
    const treeEl = innerRef.current;
    if (!el || !treeEl) return;

    const paddingX = 48;
    const paddingY = 48;
    const containerW = el.clientWidth - paddingX;
    const containerH = el.clientHeight - paddingY;
    const treeW = treeEl.offsetWidth || size.width;
    const treeH = treeEl.offsetHeight || size.height;

    if (containerW > 0 && treeW > 0) {
      const scaleX = containerW / treeW;
      const scaleY = containerH > 0 && treeH > 0 ? containerH / treeH : scaleX;
      // Fit both dimensions so full chart is visible without clipping
      const fitScale = Math.min(1, Math.min(scaleX, scaleY));
      const targetZoom = Math.max(20, Math.min(100, Math.round(fitScale * 100)));
      if (setZoom) {
        setZoom(targetZoom);
      }
      centerView();
      setTimeout(() => {
        centerView();
      }, 50);
    }
  }, [setZoom, centerView, size.width, size.height]);

  useImperativeHandle(ref, () => ({
    getTreeElement: () => innerRef.current,
    fitToScreen: () => fitToScreen(),
    centerView: () => centerView(),
  }), [fitToScreen, centerView]);

  useEffect(() => {
    pendingCenter.current = true;
    if (centerSignal > 1) {
      setTimeout(fitToScreen, 50);
    }
  }, [centerSignal, fitToScreen]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !pendingCenter.current || !size.width) return;
    pendingCenter.current = false;
    centerView();
  }, [size, centerSignal, centerView]);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return undefined;
    const measure = () => {
      setSize({ width: el.offsetWidth, height: el.offsetHeight });
      if (!hasInitialFitted.current && el.offsetWidth > 0 && scrollRef.current?.clientWidth > 0) {
        hasInitialFitted.current = true;
        setTimeout(fitToScreen, 20);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [fitToScreen]);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('.oc-card') || e.target.closest('button') || e.target.closest('input') || e.target.closest('a')) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: scrollRef.current?.scrollLeft || 0,
      scrollTop: scrollRef.current?.scrollTop || 0,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !scrollRef.current) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      scrollRef.current.scrollLeft = dragStart.current.scrollLeft - dx;
      scrollRef.current.scrollTop = dragStart.current.scrollTop - dy;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 5 : -5;
      if (setZoom) {
        setZoom((z) => Math.max(20, Math.min(200, z + delta)));
      }
    }
  };

  const scale = zoom / 100;
  const ctx = { expanded, matched, onToggle, onSelect };

  return (
    <div
      ref={scrollRef}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      className={`oc-scroll ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
    >
      <div
        className="oc-sizer"
        style={{
          width: size.width * scale || undefined,
          height: size.height * scale || undefined,
        }}
      >
        <div
          ref={innerRef}
          className="oc-tree"
          style={{ transform: `scale(${scale})` }}
        >
          <ul>
            <Branch item={root} ctx={ctx} />
          </ul>
          <style>{`
            .oc-scroll {
              overflow: auto;
              max-height: calc(100vh - 270px);
              min-height: 520px;
              padding: 16px;
              background-color: #fafbfc;
              border-radius: 12px;
              position: relative;
            }
            .oc-sizer {
              margin: 0 auto;
              position: relative;
              overflow: visible;
            }
            .oc-tree {
              position: absolute;
              top: 0;
              left: 0;
              transform-origin: top left;
              width: max-content;
              padding: 16px 36px 48px;
            }
            .oc-toggle, .oc-toggle-label {
              font-size: 10.5px;
              line-height: 16px;
            }
            .oc-card {
              background: #fff;
              border-radius: 12px;
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              box-shadow: 0 1px 3px rgba(15,23,42,0.08);
              transition: box-shadow .15s, border-color .15s, transform .15s;
              position: relative;
              z-index: 2;
              user-select: none;
            }
            .oc-tree ul {
              position: relative;
              display: flex;
              justify-content: center;
              padding-top: 24px;
              margin: 0;
            }
            .oc-tree > ul {
              padding-top: 0;
            }
            .oc-tree li {
              list-style: none;
              position: relative;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 24px 10px 0;
            }
            .oc-tree > ul > li {
              padding-top: 0;
            }
            /* Connectors: clean solid lines */
            .oc-tree li::before, .oc-tree li::after {
              content: '';
              position: absolute;
              top: 0;
              right: 50%;
              width: 50%;
              height: 24px;
              border-top: 2px solid #cbd5e1;
            }
            .oc-tree li::after {
              right: auto;
              left: 50%;
              border-left: 2px solid #cbd5e1;
            }
            .oc-tree li:only-child::before {
              display: none;
            }
            .oc-tree li:only-child::after {
              display: block;
              border: 0 none;
              border-left: 2px solid #cbd5e1;
              height: 24px;
              width: 0;
              left: 50%;
            }
            .oc-tree li:first-child::before, .oc-tree li:last-child::after {
              border: 0 none;
            }
            .oc-tree li:last-child::before {
              border-right: 2px solid #cbd5e1;
              border-radius: 0 6px 0 0;
            }
            .oc-tree li:first-child::after {
              border-radius: 6px 0 0 0;
            }
            .oc-tree ul ul::before {
              content: '';
              position: absolute;
              top: 0;
              left: 50%;
              height: 24px;
              border-left: 2px solid #cbd5e1;
            }
            .oc-tree > ul > li::before, .oc-tree > ul > li::after {
              display: none;
            }
            /* Stacked leaves: one column, chained by a centre line. */
            .oc-stack {
              position: relative;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 12px;
              padding-top: 24px;
            }
            .oc-stack::before {
              content: '';
              position: absolute;
              top: 0;
              left: 50%;
              height: 24px;
              border-left: 2px solid #cbd5e1;
            }
            .oc-stack-item {
              position: relative;
            }
            .oc-stack-item + .oc-stack-item::before {
              content: '';
              position: absolute;
              top: -12px;
              left: 50%;
              height: 12px;
              border-left: 2px solid #cbd5e1;
            }
            @media print {
              .oc-scroll { max-height: none !important; overflow: visible !important; min-height: 0 !important; background: transparent !important; }
              .oc-sizer { width: auto !important; height: auto !important; overflow: visible !important; margin: 0 !important; }
              .oc-tree { position: static !important; transform: none !important; padding: 0 !important; }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
});

export default OrgTreeView;

