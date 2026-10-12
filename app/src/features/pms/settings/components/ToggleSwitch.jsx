import React from 'react';

/**
 * ToggleSwitch — Pixel-perfect slide switch with guaranteed padding and no overflow clipping.
 */
export function ToggleSwitch({
  checked = false,
  onChange,
  activeColor = '#1f6bff',
  inactiveColor = '#cbd5e1',
  disabled = false,
  ariaLabel = 'Toggle switch',
  size = 'md',
  className = '',
}) {
  const isSm = size === 'sm';
  const pillWidth = isSm ? 36 : 44;
  const pillHeight = isSm ? 20 : 24;
  const knobSize = isSm ? 14 : 18;
  const padding = isSm ? 3 : 3;
  const travel = pillWidth - knobSize - padding * 2;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleClick}
      className={`relative inline-flex items-center shrink-0 rounded-full select-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-95'
      } ${className}`}
      style={{
        width: pillWidth,
        height: pillHeight,
        padding: padding,
        backgroundColor: checked ? activeColor : inactiveColor,
        boxSizing: 'border-box',
      }}
    >
      <span
        aria-hidden="true"
        className="block rounded-full bg-white transition-transform duration-200 ease-in-out pointer-events-none"
        style={{
          width: knobSize,
          height: knobSize,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(0, 0, 0, 0.1)',
          transform: checked ? `translateX(${travel}px)` : 'translateX(0px)',
        }}
      />
    </button>
  );
}

export default ToggleSwitch;
