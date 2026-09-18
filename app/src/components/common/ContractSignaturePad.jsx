import { useRef } from 'react';

export function SignaturePreview({ signature }) {
  return <svg viewBox="0 0 600 180" className="w-full max-w-xs h-24" aria-label="Recorded signature" role="img">
    {(signature?.strokes || []).map((stroke, index) => <polyline key={index} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={stroke.map(([x, y]) => `${x * 600},${y * 180}`).join(' ')} />)}
  </svg>;
}

export default function ContractSignaturePad({ value, onChange }) {
  const active = useRef(null);
  const strokes = useRef(value);
  function point(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    return [Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))];
  }
  function finish(event) {
    if (active.current !== event.pointerId) return;
    active.current = null;
    onChange([...strokes.current]);
  }
  return <div className="space-y-2">
    <p className="text-xs text-slate-500">Sign below using your mouse, finger or stylus.</p>
    <svg viewBox="0 0 600 180" preserveAspectRatio="none" role="img" aria-label="Signature pad" className="w-full h-44 bg-white border border-slate-300 rounded-lg text-slate-900" style={{ touchAction: 'none', userSelect: 'none' }}
      onPointerDown={event => {
        if (active.current !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
        event.preventDefault();
        active.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        strokes.current = [...value, [point(event)]];
        onChange(strokes.current);
      }}
      onPointerMove={event => {
        if (active.current !== event.pointerId) return;
        const next = [...strokes.current];
        next[next.length - 1] = [...next[next.length - 1], point(event)];
        strokes.current = next;
        onChange(next);
      }} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}>
      {value.map((stroke, index) => <polyline key={index} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={stroke.map(([x, y]) => `${x * 600},${y * 180}`).join(' ')} />)}
    </svg>
    <button type="button" className="btn-outline btn-sm" onClick={() => { active.current = null; strokes.current = []; onChange([]); }}>Clear Signature</button>
  </div>;
}
