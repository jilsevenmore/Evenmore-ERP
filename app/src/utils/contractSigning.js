// Only these fields are part of the customer-visible agreement.
export function contractDocument(contract) {
  return Object.fromEntries(['contractNumber', 'customer', 'contractType', 'amount', 'startDate', 'endDate', 'description', 'terms', 'template', 'createdAt'].map(key => [key, contract[key] ?? '']));
}

export function validateSignature(input) {
  if (typeof input?.name !== 'string' || !input.name.trim()) throw new Error('Please enter the signer name.');
  if (input.name.length > 200 || typeof input.role !== 'string' || input.role.length > 200) throw new Error('Please enter valid signer information.');
  if (input.agreed !== true) throw new Error('Please confirm that you agree and are authorized to sign.');
  const strokes = input.strokes;
  if (!Array.isArray(strokes) || !strokes.length || strokes.length > 200 || strokes.flat().length > 20000) throw new Error('Please provide your signature.');
  let distance = 0;
  for (const stroke of strokes) {
    if (!Array.isArray(stroke) || !stroke.length) throw new Error('Please provide your signature.');
    for (let i = 0; i < stroke.length; i++) {
      const p = stroke[i];
      if (!Array.isArray(p) || p.length !== 2 || p.some(n => !Number.isFinite(n) || n < 0 || n > 1)) throw new Error('Invalid signature. Please clear and sign again.');
      if (i) distance += Math.hypot(p[0] - stroke[i - 1][0], p[1] - stroke[i - 1][1]);
    }
  }
  if (distance < 0.025) throw new Error('Please provide your signature.');
  return { name: input.name.trim(), role: input.role.trim(), strokes, agreed: true };
}

export function signatureSvg(signature) {
  // Numeric coordinates only; never interpolate user markup into the document.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 180" width="300" height="90">${(signature?.strokes || []).map(stroke => `<polyline fill="none" stroke="#172033" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="${stroke.map(p => `${Number(p[0]) * 600},${Number(p[1]) * 180}`).join(' ')}"/>`).join('')}</svg>`;
}
