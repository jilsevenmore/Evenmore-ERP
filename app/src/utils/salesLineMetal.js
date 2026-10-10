// Metal-industry sales lines (Sweven: steel / iron sheet, plate and section,
// fabrication, machines and spare parts). Pure helpers, shared by the line
// editor and every printed sales document -- including the public quotation
// page, so nothing here may import the ERP context.

// Mirrors LINE_KINDS in Backend/apps/sales/models.py.
// Replaced (sheet-metal sales): sheet and section lead.
// export const SALES_LINE_KINDS = ['Machine', 'Spare Part', 'Fabrication', 'Service', 'Custom'];
export const SALES_LINE_KINDS = ['Sheet Metal', 'Section / Pipe', 'Fabrication', 'Machine', 'Spare Part', 'Service', 'Custom'];

// ── Material catalogue ──────────────────────────────────────────────────────
// Density in g/cm³ (= kg per 1,000,000 mm³). Grades are suggestions only.
export const METAL_MATERIALS = [
    { code: 'MS', label: 'MS (Mild Steel)', density: 7.85, grades: ['IS 2062 E250', 'IS 2062 E350', 'IS 1079', 'ASTM A36'] },
    { code: 'HR', label: 'HR (Hot Rolled)', density: 7.85, grades: ['IS 1079 HR1', 'IS 2062', 'SAIL HR'] },
    { code: 'CR', label: 'CR (Cold Rolled)', density: 7.85, grades: ['IS 513 CR1', 'IS 513 CR2', 'IS 513 D'] },
    { code: 'GI', label: 'GI (Galvanised)', density: 7.85, grades: ['IS 277 Z120', 'IS 277 Z180', 'IS 277 Z275'] },
    { code: 'GP', label: 'GP / Galvalume', density: 7.85, grades: ['AZ 150', 'AZ 70'] },
    { code: 'SS 304', label: 'SS 304', density: 7.93, grades: ['304L', 'Jindal', 'POSCO'] },
    { code: 'SS 316', label: 'SS 316', density: 7.98, grades: ['316L', 'Jindal'] },
    { code: 'SS 202', label: 'SS 202', density: 7.8, grades: ['J4', 'Jindal'] },
    { code: 'SS 430', label: 'SS 430', density: 7.7, grades: ['Jindal'] },
    { code: 'AL', label: 'Aluminium', density: 2.7, grades: ['1100', '3003', '5052', '6061'] },
    { code: 'CU', label: 'Copper', density: 8.96, grades: ['ETP', 'DHP'] },
    { code: 'BRASS', label: 'Brass', density: 8.5, grades: ['70/30', '63/37'] },
    { code: 'OTHER', label: 'Other', density: 7.85, grades: [] },
];
export const materialOf = (code) => METAL_MATERIALS.find((m) => m.code === code) || null;

/** "SS 304 Jindal"; a grade the material name already states is not repeated. */
export const materialGradeText = (spec = {}) => {
    const material = spec.material || '';
    const grade = String(spec.grade || '').trim();
    return grade && !material.split(' ').includes(grade) ? [material, grade].filter(Boolean).join(' ') : material;
};

// ── Forms and how each one is measured ──────────────────────────────────────
// `dims` names the inputs the form needs; `calc` gives kg per piece from them.
const flat = (s, d) => (s.thicknessMm * s.widthMm * s.lengthMm * d) / 1e6;
export const METAL_FORMS = [
    { code: 'Sheet', group: 'flat', dims: ['thicknessMm', 'widthMm', 'lengthMm'], calc: flat },
    { code: 'Plate', group: 'flat', dims: ['thicknessMm', 'widthMm', 'lengthMm'], calc: flat },
    { code: 'Chequered Plate', group: 'flat', dims: ['thicknessMm', 'widthMm', 'lengthMm'], calc: flat },
    { code: 'Perforated Sheet', group: 'flat', dims: ['thicknessMm', 'widthMm', 'lengthMm'], calc: flat },
    { code: 'Strip', group: 'flat', dims: ['thicknessMm', 'widthMm', 'lengthMm'], calc: flat },
    { code: 'Flat Bar', group: 'flat', dims: ['thicknessMm', 'widthMm', 'lengthMm'], calc: flat },
    // A coil's length is not measured at sale -- its weight is.
    { code: 'Coil', group: 'coil', dims: ['thicknessMm', 'widthMm'], calc: null },
    // Width carries the outside diameter; π(OD − t)·t·L·ρ.
    { code: 'Pipe / Tube', group: 'round', dims: ['widthMm', 'thicknessMm', 'lengthMm'],
        calc: (s, d) => (Math.PI * (s.widthMm - s.thicknessMm) * s.thicknessMm * s.lengthMm * d) / 1e6 },
    // Width carries the diameter; π/4·D²·L·ρ.
    { code: 'Round Bar', group: 'round', dims: ['widthMm', 'lengthMm'],
        calc: (s, d) => (Math.PI / 4 * s.widthMm * s.widthMm * s.lengthMm * d) / 1e6 },
    { code: 'Square Bar', group: 'round', dims: ['widthMm', 'lengthMm'],
        calc: (s, d) => (s.widthMm * s.widthMm * s.lengthMm * d) / 1e6 },
    // Rolled sections are sold on the mill's kg/m.
    { code: 'Angle', group: 'section', dims: ['kgPerMeter', 'lengthMm'], calc: (s) => s.kgPerMeter * s.lengthMm / 1000 },
    { code: 'Channel', group: 'section', dims: ['kgPerMeter', 'lengthMm'], calc: (s) => s.kgPerMeter * s.lengthMm / 1000 },
    { code: 'Beam / Joist', group: 'section', dims: ['kgPerMeter', 'lengthMm'], calc: (s) => s.kgPerMeter * s.lengthMm / 1000 },
    { code: 'Fabricated Item', group: 'other', dims: [], calc: null },
    { code: 'Other', group: 'other', dims: [], calc: null },
];
export const formOf = (code) => METAL_FORMS.find((f) => f.code === code) || null;

// What each dimension is called for a given form (width doubles as OD / dia / side).
export const dimLabel = (formCode, dim) => {
    const f = formOf(formCode);
    if (dim === 'widthMm') {
        if (f?.code === 'Pipe / Tube') return 'OD (mm)';
        if (f?.code === 'Round Bar') return 'Dia (mm)';
        if (f?.code === 'Square Bar') return 'Side (mm)';
        return 'Width (mm)';
    }
    return { thicknessMm: 'Thk (mm)', lengthMm: 'Length (mm)', kgPerMeter: 'kg / m' }[dim] || dim;
};

export const METAL_FINISHES = ['Mill', 'HR', 'CR', '2B', 'BA', 'No. 4 / Satin', 'Mirror (No. 8)', 'Hairline', 'Galvanised', 'Pre-painted', 'Primer', 'Powder coated', 'Oiled'];

// Section groups the line kinds fall into for the calculator.
export const KIND_DEFAULT_FORM = { 'Sheet Metal': 'Sheet', 'Section / Pipe': 'Angle', Fabrication: 'Fabricated Item' };
export const kindUsesCalculator = (kind) => !['Service', 'Machine', 'Spare Part'].includes(kind);

// HSN suggestion by material and form (Customs Tariff chapter 72-76). Shown as
// a hint only -- the classification is the business's to confirm.
export const suggestHsn = (spec = {}) => {
    const m = spec.material || '';
    const f = formOf(spec.form)?.group;
    if (spec.form === 'Fabricated Item') return '7308';
    if (m === 'AL') return f === 'flat' || f === 'coil' ? '7606' : '7604';
    if (m === 'CU') return '7409';
    if (m === 'BRASS') return '7409';
    const stainless = m.startsWith('SS');
    if (spec.form === 'Pipe / Tube') return '7306';
    if (f === 'section') return stainless ? '7222' : '7216';
    if (f === 'round') return stainless ? '7222' : '7214';
    if (stainless) return Number(spec.widthMm) >= 600 ? '7219' : '7220';
    if (m === 'GI' || m === 'GP') return '7210';
    if (m === 'CR') return '7209';
    return Number(spec.widthMm) >= 600 || !spec.widthMm ? '7208' : '7211';
};

const n = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const round3 = (value) => Math.round(value * 1000) / 1000;

/** kg per piece from the dimensions, or null when the form cannot be computed. */
export const calcPieceWeight = (spec = {}) => {
    const f = formOf(spec.form);
    if (!f?.calc) return null;
    const values = { thicknessMm: n(spec.thicknessMm), widthMm: n(spec.widthMm), lengthMm: n(spec.lengthMm), kgPerMeter: n(spec.kgPerMeter) };
    if (f.dims.some((dim) => !(values[dim] > 0))) return null;
    const density = n(spec.density) || materialOf(spec.material)?.density || 7.85;
    const kg = f.calc(values, density);
    return kg > 0 ? round3(kg) : null;
};

/** The effective kg per piece: typed override, else calculated. */
export const pieceWeightOf = (spec = {}) => (spec.weightManual ? n(spec.weightPerPiece) : (calcPieceWeight(spec) ?? n(spec.weightPerPiece)));

/** "SS 304 · Sheet · 2B · 1.5 × 1250 × 2500 mm · 10 pcs × 37.17 kg" */
export const sheetSpecText = (spec) => {
    if (!spec) return '';
    const f = formOf(spec.form);
    const dims = (f?.dims || []).filter((d) => n(spec[d]) > 0)
        .map((d) => (d === 'kgPerMeter' ? `${n(spec[d])} kg/m` : n(spec[d]))).join(' × ');
    const hasMm = (f?.dims || []).some((d) => d !== 'kgPerMeter' && n(spec[d]) > 0);
    const piece = pieceWeightOf(spec);
    return [
        materialGradeText(spec),
        spec.form,
        spec.finish,
        dims ? `${dims}${hasMm ? ' mm' : ''}` : '',
        spec.pieces ? `${n(spec.pieces)} pcs${piece > 0 ? ` × ${formatKg(piece)}` : ''}` : '',
    ].filter(Boolean).join(' · ');
};

/**
 * The name a custom calculator line gets until the user types their own,
 * e.g. "SS 304 Sheet 2B 1.5 mm" or "MS Angle 4.5 kg/m".
 */
export const sheetAutoDescription = (spec = {}) => {
    const f = formOf(spec.form);
    if (!spec.material && !spec.form) return '';
    const size = f?.group === 'section'
        ? (n(spec.kgPerMeter) > 0 ? `${n(spec.kgPerMeter)} kg/m` : '')
        : f?.group === 'round'
            ? (n(spec.widthMm) > 0 ? `${spec.form === 'Pipe / Tube' ? 'OD ' : ''}${n(spec.widthMm)} mm${spec.form === 'Pipe / Tube' && n(spec.thicknessMm) > 0 ? ` × ${n(spec.thicknessMm)} mm` : ''}` : '')
            : (n(spec.thicknessMm) > 0 ? `${n(spec.thicknessMm)} mm` : '');
    return [materialGradeText(spec), spec.form === 'Other' ? '' : spec.form, spec.finish, size].filter(Boolean).join(' ');
};

/**
 * Apply the calculator to a line: weight per piece, and qty / unit from the
 * billing basis -- by kg the quantity is the total weight, by piece it is the
 * piece count. Returns the fields to merge onto the line.
 */
export const applySheetSpec = (spec) => {
    const piece = pieceWeightOf(spec);
    const pieces = n(spec.pieces);
    const totalKg = round3(piece * pieces);
    const next = { ...spec, weightPerPiece: piece || spec.weightPerPiece || '' };
    const patch = {
        sheetSpec: next,
        materialGrade: materialGradeText(spec) || undefined,
        specification: sheetSpecText(next) || undefined,
    };
    if (spec.basis === 'pcs') {
        if (pieces > 0) patch.qty = pieces;
        patch.uom = 'Nos';
        patch.unitWeight = piece > 0 ? piece : '';
    } else {
        if (totalKg > 0) patch.qty = totalKg;
        patch.uom = 'Kg';
        patch.unitWeight = '';
    }
    return patch;
};

export const formatKg = (kg) => `${Number(kg || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })} kg`;

// Replaced (sheet-metal sales): a kg-billed line's quantity *is* its weight,
// and a piece-billed one weighs pieces × kg/piece.
// export const lineTotalWeight = (line) => (Number(line.qty) || 0) * (Number(line.unitWeight) || 0);
export const lineTotalWeight = (line) => {
    const spec = line.sheetSpec;
    if (spec?.basis === 'kg' || (!spec && /^kgs?$/i.test(String(line.uom || '')))) return n(line.qty);
    if (spec?.basis === 'pcs' && n(spec.weightPerPiece) > 0) return n(line.qty) * n(spec.weightPerPiece);
    return n(line.qty) * n(line.unitWeight);
};

/** Pieces on a line, when the calculator knows them. */
export const linePieces = (line) => {
    const spec = line.sheetSpec;
    if (!spec) return 0;
    return spec.basis === 'pcs' ? n(line.qty) : n(spec.pieces);
};

// Replaced: a line from the sheet calculator prints its own spec.
// export const lineSpecText = (line) => [
//     line.lineKind,
//     line.materialGrade,
//     line.specification,
//     Number(line.unitWeight) > 0 ? `${formatKg(line.unitWeight)}/unit` : '',
// ].filter(Boolean).join(' · ');
export const lineSpecText = (line) => {
    if (!line) return '';
    if (line.sheetSpec && (line.sheetSpec.form || line.sheetSpec.material)) return sheetSpecText(line.sheetSpec);
    const kind = line.lineKind || line.itemType || '';
    const grade = line.materialGrade || line.grade || line.metalGrade || '';
    const spec = line.specification || line.dimensions || '';
    const category = (!kind && line.category) ? line.category : '';
    const weight = Number(line.unitWeight) > 0 ? `${formatKg(line.unitWeight)}/unit` : '';
    return [
        kind,
        category,
        grade,
        spec,
        weight,
    ].filter(Boolean).join(' · ');
};
