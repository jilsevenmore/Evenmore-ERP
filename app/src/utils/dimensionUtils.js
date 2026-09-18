/**
 * Sheet / part dimensional spec helpers.
 *
 * Steel parts are registered with a physical sheet spec — height (thickness),
 * width and length — plus the piece weight in kg. Each dimension carries its own
 * unit, because a drawing routinely quotes thickness in mm while the plate size
 * is called out in inches or metres. Values are stored exactly as typed next to
 * their unit (`sheetHeightUnit` / `sheetWidthUnit` / `sheetLengthUnit`); convert
 * on read with the helpers below instead of assuming a unit.
 */

/** Selectable linear units. `toMm` is the factor to normalise into millimetres. */
export const DIMENSION_UNITS = [
    { code: 'mm', label: 'Millimetre (mm)', short: 'mm', toMm: 1 },
    { code: 'cm', label: 'Centimetre (cm)', short: 'cm', toMm: 10 },
    { code: 'm', label: 'Metre (m)', short: 'm', toMm: 1000 },
    { code: 'in', label: 'Inch (in)', short: 'in', toMm: 25.4 },
];

export const DEFAULT_DIMENSION_UNIT = 'mm';

/** Mild steel density in kg/m³ — used to estimate a sheet's theoretical weight. */
export const STEEL_DENSITY_KG_M3 = 7850;

const unitFactor = (unit) => DIMENSION_UNITS.find((u) => u.code === unit)?.toMm ?? 1;

/** Label suffix for a unit code, safe for unknown/blank codes. */
export const dimensionUnitLabel = (unit) => DIMENSION_UNITS.find((u) => u.code === unit)?.short || DEFAULT_DIMENSION_UNIT;

/**
 * Unit stored for one axis ('height' | 'width' | 'length').
 * Records saved before per-axis units fall back to the item-wide `dimensionUnit`.
 */
export const sheetAxisUnit = (item, axis) => {
    const perAxis = { height: item?.sheetHeightUnit, width: item?.sheetWidthUnit, length: item?.sheetLengthUnit }[axis];
    return perAxis || item?.dimensionUnit || DEFAULT_DIMENSION_UNIT;
};

/** Convert a value into millimetres. Returns 0 for blank/non-numeric input. */
export const toMm = (value, unit) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return n * unitFactor(unit);
};

/** Convert millimetres into `unit`. */
export const fromMm = (mm, unit) => {
    const n = Number(mm);
    if (!Number.isFinite(n)) return 0;
    return n / unitFactor(unit);
};

/**
 * Shortest decimal form of `n` that stays within 1e-5 relative error (0.00002 mm
 * on a 2 mm plate — orders of magnitude below any manufacturing tolerance).
 *
 * Fixed 4-decimal rounding would leave 2 mm → in → mm sitting at 1.999, so a
 * user toggling units would watch their dimension drift. Allowing a hair of
 * slack lets 2 mm read as 0.07874 in and convert straight back to 2.
 */
const roundForDisplay = (n) => {
    for (let d = 0; d <= 6; d += 1) {
        const r = Number(n.toFixed(d));
        if (Math.abs(r - n) <= Math.abs(n) * 1e-5) return r;
    }
    return Number(n.toFixed(6));
};

/** Re-express a value from one unit into another, rounded for display. */
export const convertDimension = (value, fromUnit, toUnit) => {
    if (value === '' || value === null || value === undefined) return '';
    const n = Number(value);
    if (!Number.isFinite(n)) return '';
    return String(roundForDisplay(fromMm(toMm(n, fromUnit), toUnit)));
};

/**
 * Theoretical weight (kg) of one piece from its H × W × L spec. Each dimension
 * is normalised from its own unit, so a 2 mm × 4 in × 2.5 m plate computes
 * correctly. Any missing dimension yields 0 — the caller keeps the manual entry.
 */
export const calcSheetWeightKg = ({
    height,
    width,
    length,
    heightUnit,
    widthUnit,
    lengthUnit,
    density = STEEL_DENSITY_KG_M3,
}) => {
    const hM = toMm(height, heightUnit) / 1000;
    const wM = toMm(width, widthUnit) / 1000;
    const lM = toMm(length, lengthUnit) / 1000;
    if (hM <= 0 || wM <= 0 || lM <= 0) return 0;
    return Number((hM * wM * lM * density).toFixed(3));
};

/**
 * "2 × 1250 × 2500 mm" for an item carrying a sheet spec, or '' when it has none.
 * Mixed units are spelled out per value ("2 mm × 49.2 in × 2.5 m") since there is
 * no single suffix to hoist. Accepts the raw item so callers can drop it into a cell.
 */
export const formatSheetDimensions = (item, { withLabels = false } = {}) => {
    if (!item?.hasSheetSpec) return '';
    const parts = [
        ['H', item.sheetHeight, sheetAxisUnit(item, 'height')],
        ['W', item.sheetWidth, sheetAxisUnit(item, 'width')],
        ['L', item.sheetLength, sheetAxisUnit(item, 'length')],
    ].filter(([, v]) => Number(v) > 0);
    if (parts.length === 0) return '';
    const units = new Set(parts.map(([, , u]) => dimensionUnitLabel(u)));
    const label = (k, v) => (withLabels ? `${k} ${v}` : `${v}`);
    if (units.size === 1) {
        return `${parts.map(([k, v]) => label(k, v)).join(' × ')} ${[...units][0]}`;
    }
    return parts.map(([k, v, u]) => `${label(k, v)} ${dimensionUnitLabel(u)}`).join(' × ');
};

/** "12.5 kg / Sheet" for list & detail displays, or '' when no weight is set. */
export const formatSheetWeight = (item, uom) => {
    const kg = Number(item?.sheetWeightKg);
    if (!Number.isFinite(kg) || kg <= 0) return '';
    return `${kg} kg${uom ? ` / ${uom}` : ''}`;
};
