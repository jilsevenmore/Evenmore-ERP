import { X } from 'lucide-react';
import { useEffect } from 'react';

/**
 * Modal — CRM-styled modal dialog.
 * Props: isOpen, onClose, title, children, footer, size ('md'|'lg'|'xl')
 */
export function Modal({ isOpen, onClose, title, subtitle, children, footer, size = 'md' }) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = size === 'lg' ? 'modal-lg' : size === 'xl' ? 'modal-xl' : '';

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className={`modal-card ${sizeClass}`} role="dialog" aria-modal="true">
        {title && (
          <div className="modal-header">
            <div>
              <h2>{title}</h2>
              {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
            </div>
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;

