import React from 'react';

export const Button = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  children,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs';

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-2 text-xs gap-2',
    lg: 'px-4 py-2.5 text-sm gap-2',
  };

  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 border border-transparent',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200',
    outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs border border-transparent',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 shadow-none',
  };

  return (
    <button className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`} {...props}>
      {Icon && <Icon size={size === 'sm' ? 14 : 16} className="shrink-0" />}
      <span>{children}</span>
    </button>
  );
};

export default Button;

