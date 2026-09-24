import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { toTitleCase, safeString } from '../../utils/stringUtils';
import { PageInfoButton } from './PageInfoButton';

export function PageHeader({ title, subtitle, breadcrumb, guide, actions }) {
  const location = useLocation();

  const pathname = safeString(location?.pathname, '/');
  const pathParts = pathname.split('/').filter(Boolean);
  const defaultBreadcrumbs = [
    { label: 'Dashboard', path: '/' },
    ...pathParts.map((part, index) => ({
      label: toTitleCase(part, part),
      path: `/${pathParts.slice(0, index + 1).join('/')}`,
      isCurrent: index === pathParts.length - 1,
    })),
  ];

  const activeBreadcrumb = breadcrumb || defaultBreadcrumbs;

  return (
    <div className="flex flex-col gap-2 pb-2">
      {/* Breadcrumb Path */}
      {activeBreadcrumb && activeBreadcrumb.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium overflow-x-auto lg:overflow-visible whitespace-nowrap lg:whitespace-normal scrollbar-none">
          {activeBreadcrumb.map((bc, idx) => {
            const isLast = idx === activeBreadcrumb.length - 1;
            const label = safeString(bc?.label || bc?.name, 'Section');
            const targetPath = bc?.path || bc?.to || '#';
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight size={12} className="text-slate-300 shrink-0 lg:shrink" />}
                {isLast ? (
                  <span className="text-slate-600 font-semibold">{label}</span>
                ) : (
                  <Link
                    to={targetPath}
                    className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  >
                    {label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0 lg:min-w-auto">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight break-words min-w-0 lg:min-w-auto">{title}</h2>
            <PageInfoButton guide={guide} title={title} />
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-1 max-w-3xl">{subtitle}</p>}
        </div>

        {actions && <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 w-full sm:w-auto sm:shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

export default PageHeader;

