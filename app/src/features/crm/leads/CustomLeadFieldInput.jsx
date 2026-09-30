import React from 'react';

/**
 * CustomLeadFieldInput — one Lead Create Form builder field as a real input.
 *
 * Renders by the builder's field type and reports plain values: text, a number,
 * a date string, a boolean for Checkbox, an array for Multi Select. The caller
 * supplies the wrapper markup, so it sits in whichever form layout hosts it.
 */

function optionsOf(field) {
  return Array.isArray(field.options) && field.options.length > 0 ? field.options : [];
}

export function CustomLeadFieldInput({ field, value, onChange, users = [], className = '' }) {
  const placeholder = field.placeholder || `Enter ${String(field.label || '').toLowerCase()}`;
  const common = { id: `custom-${field.id}`, className, 'aria-label': field.label };

  if (field.type === 'Multi Line') {
    return <textarea {...common} rows={3} placeholder={placeholder} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
  if (field.type === 'Checkbox') {
    return (
      <input
        {...common}
        type="checkbox"
        className=""
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
      />
    );
  }
  if (field.type === 'Dropdown' || field.type === 'Radio') {
    return (
      <select {...common} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">{field.placeholder || 'Select option'}</option>
        {optionsOf(field).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  }
  if (field.type === 'Multi Select') {
    const selected = Array.isArray(value) ? value : [];
    return (
      <select
        {...common}
        multiple
        value={selected}
        onChange={(e) => onChange(Array.from(e.target.selectedOptions, (o) => o.value))}
      >
        {optionsOf(field).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  }
  if (field.type === 'User') {
    return (
      <select {...common} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">{field.placeholder || 'Select user'}</option>
        {users.map((u) => <option key={u.id ?? u.name} value={u.name}>{u.name}</option>)}
      </select>
    );
  }
  const type = {
    Number: 'number', Currency: 'number', Email: 'email', Phone: 'tel', Date: 'date',
  }[field.type] || 'text';
  return (
    <input
      {...common}
      type={type}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(e) => onChange(type === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value)}
    />
  );
}

export default CustomLeadFieldInput;
