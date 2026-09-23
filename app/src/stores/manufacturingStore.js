/**
 * Manufacturing Module — Centralized State Store
 *
 * Full lifecycle store managing BOM versions, material planning, stock reservations,
 * material issue (warehouse -> production), material consumption (production -> actuals),
 * labour logging, batch-level costing, rework tickets, packaging, and dispatches.
 *
 * Persists to localStorage under 'evenmore_manufacturing_v1'. Zero external backend.
 */

import { create } from 'zustand';
import {
  computeBomCost,
  computeMaterialBalance,
  computeConsumptionVariance,
  computeLabourCost,
  computeProductionCost,
  computeBatchCost,
  computeProjectProfitability,
  computeWeightedProgress,
} from '../utils/manufacturingUtils';

const LS_KEY = 'evenmore_manufacturing_v1';

// ─── Pre-seeded Initial Data ─────────────────────────────────────────

const initialBomVersions = [
  {
    id: 'bom-v-101',
    bomNumber: 'BOM-CNC-001',
    productId: 'itm-mach-1',
    productName: 'Custom Heavy CNC Laser Enclosure',
    version: 'v1.0',
    versionNumber: 'v1.0',
    status: 'Superseded',
    effectiveDate: '2026-07-01',
    createdBy: 'Aditya Rao',
    createdDate: '2026-06-28',
    revisionReason: 'Initial prototype design specification for Acme Corp.',
    components: [
      { id: 'c-101', componentCode: 'RAW-CRCA-02', materialName: '2mm CRCA Steel Sheet', description: 'Cold rolled close annealed steel sheet', quantity: 80, uom: 'KG', scrapPct: 5, requiredQty: 84, estimatedRate: 85, estimatedValue: 7140, currentStock: 450, shortage: 0, supplier: 'Shakti Steel Traders' },
      { id: 'c-102', componentCode: 'RAW-MS-ANG', materialName: 'MS Equal Angle 40x40x5', description: 'Structural frame perimeter support', quantity: 24, uom: 'MTR', scrapPct: 3, requiredQty: 25, estimatedRate: 140, estimatedValue: 3500, currentStock: 120, shortage: 0, supplier: 'Shakti Steel Traders' },
      { id: 'c-103', componentCode: 'FAS-HEX-M10', materialName: 'High Tensile Hex Bolt M10x35', description: 'Zinc plated grade 8.8 fastener', quantity: 60, uom: 'NOS', scrapPct: 0, requiredQty: 60, estimatedRate: 12, estimatedValue: 720, currentStock: 800, shortage: 0, supplier: 'Precision Parts Co' },
      { id: 'c-104', componentCode: 'ELE-INT-SW', materialName: 'Laser Rated Safety Interlock Switch', description: 'Dual contact safety switch IP67', quantity: 2, uom: 'NOS', scrapPct: 0, requiredQty: 2, estimatedRate: 1850, estimatedValue: 3700, currentStock: 14, shortage: 0, supplier: 'Gujarat Motors & Drives' },
      { id: 'c-105', componentCode: 'CHM-PU-PNT', materialName: 'Polyurethane Industrial Paint (Grey)', description: 'Anti-corrosive scratch resistant coat', quantity: 8, uom: 'LTR', scrapPct: 8, requiredQty: 9, estimatedRate: 420, estimatedValue: 3780, currentStock: 40, shortage: 0, supplier: 'Asian Paints Industrial' },
    ],
  },
  {
    id: 'bom-v-102',
    bomNumber: 'BOM-CNC-001',
    productId: 'itm-mach-1',
    productName: 'Custom Heavy CNC Laser Enclosure',
    version: 'v2.0',
    versionNumber: 'v2.0',
    status: 'Active',
    effectiveDate: '2026-09-01',
    createdBy: 'Aditya Rao',
    createdDate: '2026-08-28',
    revisionReason: 'Upgraded interlock to Class-1 laser rating and reinforced 2.5mm base stiffeners per client request.',
    components: [
      { id: 'c-101', componentCode: 'RAW-CRCA-02', materialName: '2mm CRCA Steel Sheet', description: 'Cold rolled close annealed steel sheet', quantity: 88, uom: 'KG', scrapPct: 5, requiredQty: 93, estimatedRate: 85, estimatedValue: 7905, currentStock: 450, shortage: 0, supplier: 'Shakti Steel Traders' },
      { id: 'c-102', componentCode: 'RAW-MS-ANG', materialName: 'MS Equal Angle 40x40x5', description: 'Structural frame perimeter support', quantity: 28, uom: 'MTR', scrapPct: 3, requiredQty: 29, estimatedRate: 140, estimatedValue: 4060, currentStock: 120, shortage: 0, supplier: 'Shakti Steel Traders' },
      { id: 'c-103', componentCode: 'FAS-HEX-M10', materialName: 'High Tensile Hex Bolt M10x35', description: 'Zinc plated grade 8.8 fastener', quantity: 72, uom: 'NOS', scrapPct: 0, requiredQty: 72, estimatedRate: 12, estimatedValue: 864, currentStock: 800, shortage: 0, supplier: 'Precision Parts Co' },
      { id: 'c-104', componentCode: 'ELE-INT-SW', materialName: 'Class-1 Laser Safety Interlock Switch', description: 'Dual redundant optical interlock with tamper proof key', quantity: 2, uom: 'NOS', scrapPct: 0, requiredQty: 2, estimatedRate: 2450, estimatedValue: 4900, currentStock: 10, shortage: 0, supplier: 'Gujarat Motors & Drives' },
      { id: 'c-105', componentCode: 'CHM-PU-PNT', materialName: 'Polyurethane Industrial Paint (Grey)', description: 'Anti-corrosive scratch resistant coat', quantity: 10, uom: 'LTR', scrapPct: 8, requiredQty: 11, estimatedRate: 420, estimatedValue: 4620, currentStock: 40, shortage: 0, supplier: 'Asian Paints Industrial' },
      { id: 'c-106', componentCode: 'SEAL-NEO-08', materialName: 'Neoprene Acoustic & Dust Gasket', description: 'Heavy duty perimeter sealing strip 15mm', quantity: 18, uom: 'MTR', scrapPct: 4, requiredQty: 19, estimatedRate: 95, estimatedValue: 1805, currentStock: 95, shortage: 0, supplier: 'Precision Parts Co' },
    ],
  },
  {
    id: 'bom-v-201',
    bomNumber: 'BOM-CLEANROOM',
    productId: 'itm-mach-2',
    productName: 'Modular Clean-Room Partition System',
    version: 'v1.0',
    versionNumber: 'v1.0',
    status: 'Superseded',
    effectiveDate: '2026-08-01',
    createdBy: 'Priya Nair',
    createdDate: '2026-07-25',
    revisionReason: 'Baseline cleanroom panel layout (800mm width).',
    components: [
      { id: 'c-201', componentCode: 'ALU-EXT-40', materialName: 'Aluminium Extrusion 40x40 T-Slot', description: 'Anodized 6063-T6 modular rail', quantity: 45, uom: 'MTR', scrapPct: 2, requiredQty: 46, estimatedRate: 310, estimatedValue: 14260, currentStock: 160, shortage: 0, supplier: 'Precision Parts Co' },
      { id: 'c-202', componentCode: 'LAM-ANTI-01', materialName: 'Antistatic High-Pressure Laminate 6mm', description: 'ISO-7 clean room grade panel core', quantity: 36, uom: 'SQ.MTR', scrapPct: 6, requiredQty: 39, estimatedRate: 920, estimatedValue: 35880, currentStock: 15, shortage: 24, supplier: 'Formica Clean Surfaces' },
      { id: 'c-203', componentCode: 'FAS-BRK-ALU', materialName: 'Cast Corner Gusset & T-Nut Kit', description: 'Die cast zinc internal mounting kit', quantity: 48, uom: 'SETS', scrapPct: 0, requiredQty: 48, estimatedRate: 65, estimatedValue: 3120, currentStock: 250, shortage: 0, supplier: 'Precision Parts Co' },
    ],
  },
  {
    id: 'bom-v-202',
    bomNumber: 'BOM-CLEANROOM',
    productId: 'itm-mach-2',
    productName: 'Modular Clean-Room Partition System',
    version: 'v2.0',
    versionNumber: 'v2.0',
    status: 'Active',
    effectiveDate: '2026-09-02',
    createdBy: 'Priya Nair',
    createdDate: '2026-09-01',
    revisionReason: 'Corridor widened to 1200mm per client approval; added HEPA pass-through cutouts.',
    components: [
      { id: 'c-201', componentCode: 'ALU-EXT-40', materialName: 'Aluminium Extrusion 40x40 T-Slot', description: 'Anodized 6063-T6 modular rail', quantity: 56, uom: 'MTR', scrapPct: 2, requiredQty: 58, estimatedRate: 310, estimatedValue: 17980, currentStock: 160, shortage: 0, supplier: 'Precision Parts Co' },
      { id: 'c-202', componentCode: 'LAM-ANTI-01', materialName: 'Antistatic High-Pressure Laminate 6mm', description: 'ISO-7 clean room grade panel core', quantity: 48, uom: 'SQ.MTR', scrapPct: 6, requiredQty: 51, estimatedRate: 920, estimatedValue: 46920, currentStock: 15, shortage: 36, supplier: 'Formica Clean Surfaces' },
      { id: 'c-203', componentCode: 'FAS-BRK-ALU', materialName: 'Cast Corner Gusset & T-Nut Kit', description: 'Die cast zinc internal mounting kit', quantity: 64, uom: 'SETS', scrapPct: 0, requiredQty: 64, estimatedRate: 65, estimatedValue: 4160, currentStock: 250, shortage: 0, supplier: 'Precision Parts Co' },
      { id: 'c-204', componentCode: 'SEAL-SIL-CLEAN', materialName: 'Medical Grade Silicone Sealant 310ml', description: 'Non-outgassing sterile perimeter bead', quantity: 12, uom: 'TUBES', scrapPct: 0, requiredQty: 12, estimatedRate: 280, estimatedValue: 3360, currentStock: 50, shortage: 0, supplier: 'Precision Parts Co' },
    ],
  },
  {
    id: 'bom-v-301',
    bomNumber: 'BOM-CONVEYOR',
    productId: 'itm-mach-3',
    productName: 'Industrial Conveyor Belt Assembly',
    version: 'v1.0',
    versionNumber: 'v1.0',
    status: 'Active',
    effectiveDate: '2026-08-15',
    createdBy: 'David Patel',
    createdDate: '2026-08-10',
    revisionReason: 'Initial production BOM for Globex warehouse automation line.',
    components: [
      { id: 'c-301', componentCode: 'BLT-PVC-300', materialName: 'PVC 3-Ply Rough Top Conveyor Belt 600mm', description: 'Flame resistant food/box grade belt', quantity: 30, uom: 'MTR', scrapPct: 5, requiredQty: 32, estimatedRate: 620, estimatedValue: 19840, currentStock: 80, shortage: 0, supplier: 'Continental Belting' },
      { id: 'c-302', componentCode: 'DRV-MTR-02', materialName: '1.5 kW Geared Motor Unit 415V 50Hz', description: 'Flange mounted inline reduction drive', quantity: 2, uom: 'NOS', scrapPct: 0, requiredQty: 2, estimatedRate: 14500, estimatedValue: 29000, currentStock: 5, shortage: 0, supplier: 'Gujarat Motors & Drives' },
      { id: 'c-303', componentCode: 'ROL-MS-DRV', materialName: 'Machined Crowned Drive Drum Ø160mm', description: 'Lagged rubber crowned pulley with shaft', quantity: 2, uom: 'NOS', scrapPct: 0, requiredQty: 2, estimatedRate: 4800, estimatedValue: 9600, currentStock: 6, shortage: 0, supplier: 'Om Fabrication Works' },
      { id: 'c-304', componentCode: 'BRG-PLW-35', materialName: 'Pillow Block Bearings UCP 207 Ø35mm', description: 'Self-aligning cast housing ball bearings', quantity: 4, uom: 'NOS', scrapPct: 0, requiredQty: 4, estimatedRate: 450, estimatedValue: 1800, currentStock: 22, shortage: 0, supplier: 'Precision Parts Co' },
    ],
  },
];

const initialMaterialPlans = [
  {
    id: 'mplan-001',
    planNumber: 'MPLAN-2026-001',
    projectId: 'PRJ-2026-001',
    projectNumber: 'PRJ-2026-001',
    productId: 'itm-mach-1',
    productName: 'Custom Heavy CNC Laser Enclosure',
    bomVersionId: 'bom-v-102',
    bomVersion: 'v2.0',
    productionQty: 4,
    planningDate: '2026-09-12',
    requiredByDate: '2026-09-24',
    warehouse: 'Main Central Plant (Bhiwandi Hub)',
    status: 'Reserved',
    items: [
      { id: 'mpi-1', materialCode: 'RAW-CRCA-02', materialName: '2mm CRCA Steel Sheet', bomQty: 88, productionQty: 4, requiredQty: 352, scrapQty: 20, totalRequired: 372, availableStock: 450, reservedStock: 372, availableAfterReservation: 78, shortage: 0, surplus: 78, uom: 'KG', plannedIssueDate: '2026-09-15', status: 'Reserved' },
      { id: 'mpi-2', materialCode: 'RAW-MS-ANG', materialName: 'MS Equal Angle 40x40x5', bomQty: 28, productionQty: 4, requiredQty: 112, scrapQty: 4, totalRequired: 116, availableStock: 120, reservedStock: 116, availableAfterReservation: 4, shortage: 0, surplus: 4, uom: 'MTR', plannedIssueDate: '2026-09-15', status: 'Reserved' },
      { id: 'mpi-3', materialCode: 'FAS-HEX-M10', materialName: 'High Tensile Hex Bolt M10x35', bomQty: 72, productionQty: 4, requiredQty: 288, scrapQty: 0, totalRequired: 288, availableStock: 800, reservedStock: 288, availableAfterReservation: 512, shortage: 0, surplus: 512, uom: 'NOS', plannedIssueDate: '2026-09-18', status: 'Reserved' },
      { id: 'mpi-4', materialCode: 'ELE-INT-SW', materialName: 'Class-1 Laser Safety Interlock Switch', bomQty: 2, productionQty: 4, requiredQty: 8, scrapQty: 0, totalRequired: 8, availableStock: 10, reservedStock: 8, availableAfterReservation: 2, shortage: 0, surplus: 2, uom: 'NOS', plannedIssueDate: '2026-09-20', status: 'Reserved' },
      { id: 'mpi-5', materialCode: 'CHM-PU-PNT', materialName: 'Polyurethane Industrial Paint (Grey)', bomQty: 10, productionQty: 4, requiredQty: 40, scrapQty: 4, totalRequired: 44, availableStock: 40, reservedStock: 40, availableAfterReservation: 0, shortage: 4, surplus: 0, uom: 'LTR', plannedIssueDate: '2026-09-22', status: 'Partially Available' },
    ],
  },
  {
    id: 'mplan-002',
    planNumber: 'MPLAN-2026-002',
    projectId: 'PRJ-2026-002',
    projectNumber: 'PRJ-2026-002',
    productId: 'itm-mach-2',
    productName: 'Modular Clean-Room Partition System',
    bomVersionId: 'bom-v-202',
    bomVersion: 'v2.0',
    productionQty: 12,
    planningDate: '2026-09-02',
    requiredByDate: '2026-09-15',
    warehouse: 'Main Central Plant (Bhiwandi Hub)',
    status: 'Shortage',
    items: [
      { id: 'mpi-201', materialCode: 'ALU-EXT-40', materialName: 'Aluminium Extrusions 40x40 T-Slot', bomQty: 56, productionQty: 12, requiredQty: 672, scrapQty: 14, totalRequired: 686, availableStock: 800, reservedStock: 686, availableAfterReservation: 114, shortage: 0, surplus: 114, uom: 'MTR', plannedIssueDate: '2026-09-03', status: 'Reserved' },
      { id: 'mpi-202', materialCode: 'LAM-ANTI-01', materialName: 'Antistatic High-Pressure Laminate 6mm', bomQty: 48, productionQty: 12, requiredQty: 576, scrapQty: 36, totalRequired: 612, availableStock: 250, reservedStock: 250, availableAfterReservation: 0, shortage: 362, surplus: 0, uom: 'SQ.MTR', plannedIssueDate: '2026-09-05', status: 'Shortage' },
      { id: 'mpi-203', materialCode: 'FAS-BRK-ALU', materialName: 'Cast Corner Gusset & T-Nut Kit', bomQty: 64, productionQty: 12, requiredQty: 768, scrapQty: 0, totalRequired: 768, availableStock: 1100, reservedStock: 768, availableAfterReservation: 332, shortage: 0, surplus: 332, uom: 'SETS', plannedIssueDate: '2026-09-06', status: 'Reserved' },
      { id: 'mpi-204', materialCode: 'SEAL-SIL-CLEAN', materialName: 'Medical Grade Silicone Sealant', bomQty: 12, productionQty: 12, requiredQty: 144, scrapQty: 0, totalRequired: 144, availableStock: 200, reservedStock: 144, availableAfterReservation: 56, shortage: 0, surplus: 56, uom: 'TUBES', plannedIssueDate: '2026-09-08', status: 'Reserved' },
    ],
  },
];

const initialMaterialIssues = [
  {
    id: 'iss-001',
    issueNumber: 'ISS-2026-0101',
    date: '2026-09-15',
    projectId: 'PRJ-2026-001',
    projectNumber: 'PRJ-2026-001',
    batchId: 'batch-001',
    batchNumber: 'BATCH-2026-001',
    bomVersion: 'v2.0',
    materialCode: 'RAW-CRCA-02',
    materialName: '2mm CRCA Steel Sheet',
    plannedQty: 372,
    availableQty: 450,
    issueQty: 372,
    uom: 'KG',
    warehouse: 'Main Central Plant (Bhiwandi Hub)',
    productionStage: 'Production & Fabrication',
    issuedBy: 'Sanjay Rawat (Stores Lead)',
    status: 'Issued',
    remarks: 'Full lot issued for CNC enclosure base and frame laser cutting.',
  },
  {
    id: 'iss-002',
    issueNumber: 'ISS-2026-0102',
    date: '2026-09-16',
    projectId: 'PRJ-2026-001',
    projectNumber: 'PRJ-2026-001',
    batchId: 'batch-001',
    batchNumber: 'BATCH-2026-001',
    bomVersion: 'v2.0',
    materialCode: 'RAW-MS-ANG',
    materialName: 'MS Equal Angle 40x40x5',
    plannedQty: 116,
    availableQty: 120,
    issueQty: 116,
    uom: 'MTR',
    warehouse: 'Main Central Plant (Bhiwandi Hub)',
    productionStage: 'Production & Fabrication',
    issuedBy: 'Sanjay Rawat (Stores Lead)',
    status: 'Issued',
    remarks: 'Perimeter bracing angles released to welding booth.',
  },
  {
    id: 'iss-003',
    issueNumber: 'ISS-2026-0201',
    date: '2026-09-03',
    projectId: 'PRJ-2026-002',
    projectNumber: 'PRJ-2026-002',
    batchId: 'batch-002',
    batchNumber: 'BATCH-2026-002',
    bomVersion: 'v2.0',
    materialCode: 'ALU-EXT-40',
    materialName: 'Aluminium Extrusions 40x40 T-Slot',
    plannedQty: 686,
    availableQty: 800,
    issueQty: 686,
    uom: 'MTR',
    warehouse: 'Main Central Plant (Bhiwandi Hub)',
    productionStage: 'Production & Fabrication',
    issuedBy: 'Sanjay Rawat (Stores Lead)',
    status: 'Issued',
    remarks: 'Phase 1 frame extrusions issued to cutting line.',
  },
  {
    id: 'iss-004',
    issueNumber: 'ISS-2026-0202',
    date: '2026-09-04',
    projectId: 'PRJ-2026-002',
    projectNumber: 'PRJ-2026-002',
    batchId: 'batch-002',
    batchNumber: 'BATCH-2026-002',
    bomVersion: 'v2.0',
    materialCode: 'LAM-ANTI-01',
    materialName: 'Antistatic High-Pressure Laminate 6mm',
    plannedQty: 612,
    availableQty: 250,
    issueQty: 250,
    uom: 'SQ.MTR',
    warehouse: 'Main Central Plant (Bhiwandi Hub)',
    productionStage: 'Production & Fabrication',
    issuedBy: 'Sanjay Rawat (Stores Lead)',
    status: 'Partially Issued',
    remarks: 'Partial stock issued. Deficit 362 sq.mtr PO expedited to vendor.',
  },
];

const initialMaterialConsumptions = [
  {
    id: 'cons-001',
    consumptionNumber: 'CONS-2026-001',
    projectId: 'PRJ-2026-001',
    projectNumber: 'PRJ-2026-001',
    batchId: 'batch-001',
    batchNumber: 'BATCH-2026-001',
    stageName: 'Production & Fabrication',
    materialCode: 'RAW-CRCA-02',
    materialName: '2mm CRCA Steel Sheet',
    bomQty: 352,
    issuedQty: 372,
    actualConsumedQty: 368,
    wastage: 16,
    scrap: 12,
    remainingQty: 4,
    uom: 'KG',
    date: '2026-09-17',
    operator: 'Ramesh Verma (Fabrication Lead)',
    variance: 16,
    variancePct: 4.5,
    remarks: 'Offcuts salvaged for corner reinforcement plates.',
  },
  {
    id: 'cons-002',
    consumptionNumber: 'CONS-2026-002',
    projectId: 'PRJ-2026-001',
    projectNumber: 'PRJ-2026-001',
    batchId: 'batch-001',
    batchNumber: 'BATCH-2026-001',
    stageName: 'Production & Fabrication',
    materialCode: 'RAW-MS-ANG',
    materialName: 'MS Equal Angle 40x40x5',
    bomQty: 112,
    issuedQty: 116,
    actualConsumedQty: 114,
    wastage: 2,
    scrap: 2,
    remainingQty: 2,
    uom: 'MTR',
    date: '2026-09-17',
    operator: 'Suresh Kumar (Welder)',
    variance: 2,
    variancePct: 1.8,
    remarks: 'Miter cuts executed accurately within tolerance.',
  },
  {
    id: 'cons-003',
    consumptionNumber: 'CONS-2026-003',
    projectId: 'PRJ-2026-002',
    projectNumber: 'PRJ-2026-002',
    batchId: 'batch-002',
    batchNumber: 'BATCH-2026-002',
    stageName: 'Production & Fabrication',
    materialCode: 'ALU-EXT-40',
    materialName: 'Aluminium Extrusions 40x40 T-Slot',
    bomQty: 672,
    issuedQty: 686,
    actualConsumedQty: 680,
    wastage: 8,
    scrap: 6,
    remainingQty: 6,
    uom: 'MTR',
    date: '2026-09-08',
    operator: 'Imran Shaikh (Machinist)',
    variance: 8,
    variancePct: 1.2,
    remarks: 'Frame profiles cut to 3000mm heights.',
  },
];

const initialLabourEntries = [
  {
    id: 'lab-001',
    projectId: 'PRJ-2026-001',
    projectNumber: 'PRJ-2026-001',
    employeeId: 'EMP-PR-01',
    employeeName: 'Vikram Singh',
    department: 'Production',
    shift: 'Morning (08:00 - 16:30)',
    stageName: 'Production & Fabrication',
    taskName: 'Sheet Metal CNC Bending & Notching',
    taskDescription: 'Sheet Metal CNC Bending & Notching',
    date: '2026-09-16',
    hours: 8,
    regularHours: 8,
    ratePerHour: 220,
    hourlyRate: 220,
    labourCost: 1760,
    overtimeHours: 2,
    overtimeCost: 660,
    totalCost: 2420,
    remarks: 'Completed bending on all 4 side shell enclosures.',
  },
  {
    id: 'lab-002',
    projectId: 'PRJ-2026-001',
    projectNumber: 'PRJ-2026-001',
    employeeId: 'EMP-PR-02',
    employeeName: 'Ramesh Verma',
    department: 'Production',
    shift: 'Morning (08:00 - 16:30)',
    stageName: 'Production & Fabrication',
    taskName: 'TIG Welding & Seam Grinding',
    taskDescription: 'TIG Welding & Seam Grinding',
    date: '2026-09-17',
    hours: 8,
    regularHours: 8,
    ratePerHour: 240,
    hourlyRate: 240,
    labourCost: 1920,
    overtimeHours: 1,
    overtimeCost: 360,
    totalCost: 2280,
    remarks: 'Interlock brackets welded with zero distortion.',
  },
  {
    id: 'lab-003',
    projectId: 'PRJ-2026-002',
    projectNumber: 'PRJ-2026-002',
    employeeId: 'EMP-PR-03',
    employeeName: 'Imran Shaikh',
    department: 'Production',
    shift: 'General (09:00 - 17:30)',
    stageName: 'Production & Fabrication',
    taskName: 'Aluminium Frame Cutting & Deburring',
    taskDescription: 'Aluminium Frame Cutting & Deburring',
    date: '2026-09-04',
    hours: 8,
    regularHours: 8,
    ratePerHour: 200,
    hourlyRate: 200,
    labourCost: 1600,
    overtimeHours: 0,
    overtimeCost: 0,
    totalCost: 1600,
    remarks: '12 sets of clean-room panels prepared.',
  },
  {
    id: 'lab-004',
    projectId: 'PRJ-2026-002',
    projectNumber: 'PRJ-2026-002',
    employeeId: 'EMP-QA-01',
    employeeName: 'Neha Deshmukh',
    department: 'Quality',
    shift: 'General (09:00 - 17:30)',
    stageName: 'Quality Inspection',
    taskName: 'Anodizing Thickness & Squareness Audit',
    taskDescription: 'Anodizing Thickness & Squareness Audit',
    date: '2026-09-06',
    hours: 4,
    regularHours: 4,
    ratePerHour: 280,
    hourlyRate: 280,
    labourCost: 1120,
    overtimeHours: 0,
    overtimeCost: 0,
    totalCost: 1120,
    remarks: 'Dimensional compliance verified within ±0.5mm.',
  },
];

const initialBatches = [
  {
    id: 'batch-001',
    batchNumber: 'BATCH-2026-001',
    projectId: 'PRJ-2026-001',
    projectNumber: 'PRJ-2026-001',
    productId: 'itm-mach-1',
    productName: 'Custom Heavy CNC Laser Enclosure',
    quantity: 4,
    startDate: '2026-09-14',
    targetDate: '2026-09-28',
    completionPct: 65,
    status: 'In Production',
    materialCost: 38400,
    labourCost: 16800,
    machineCost: 8200,
    overheadCost: 4500,
    reworkCost: 1200,
    scrapCost: 1600,
    otherCost: 2100,
    totalCost: 72800,
    costPerUnit: 18200,
    plannedCost: 68000,
    variance: 4800,
    variancePct: 7.1,
  },
  {
    id: 'batch-002',
    batchNumber: 'BATCH-2026-002',
    projectId: 'PRJ-2026-002',
    projectNumber: 'PRJ-2026-002',
    productId: 'itm-mach-2',
    productName: 'Modular Clean-Room Partition System',
    quantity: 12,
    startDate: '2026-09-02',
    targetDate: '2026-09-24',
    completionPct: 45,
    status: 'Delayed',
    materialCost: 88400,
    labourCost: 28600,
    machineCost: 14200,
    overheadCost: 9800,
    reworkCost: 4200,
    scrapCost: 3100,
    otherCost: 4500,
    totalCost: 152800,
    costPerUnit: 12733,
    plannedCost: 140000,
    variance: 12800,
    variancePct: 9.1,
  },
  {
    id: 'batch-003',
    batchNumber: 'BATCH-2026-003',
    projectId: 'PRJ-2026-003',
    projectNumber: 'PRJ-2026-003',
    productId: 'itm-mach-3',
    productName: 'Industrial Conveyor Belt Assembly',
    quantity: 2,
    startDate: '2026-08-20',
    targetDate: '2026-09-18',
    completionPct: 90,
    status: 'QC Ready',
    materialCost: 62000,
    labourCost: 18400,
    machineCost: 7600,
    overheadCost: 5200,
    reworkCost: 800,
    scrapCost: 1100,
    otherCost: 1900,
    totalCost: 97000,
    costPerUnit: 48500,
    plannedCost: 98000,
    variance: -1000,
    variancePct: -1.0,
  },
];

const initialReworkRecords = [
  {
    id: 'rwk-001',
    reworkNumber: 'RWK-2026-01',
    projectId: 'PRJ-2026-002',
    projectNumber: 'PRJ-2026-002',
    batchId: 'batch-002',
    reworkReason: 'Corridor mounting gusset bolt holes misaligned by 2.5mm on Panel Bay 3 & 4.',
    relatedStage: 'Production & Fabrication',
    relatedTask: 'Aluminium frame extrusion & cutting',
    createdBy: 'Neha Deshmukh (QA Inspector)',
    createdDate: '2026-09-07',
    assignedEmployee: 'Imran Shaikh',
    expectedCompletion: '2026-09-09',
    actualCompletion: '2026-09-09',
    status: 'Completed',
    daysLost: 2,
    revisionNumber: 'REV-02',
    remarks: 'Gusset holes redrilled and deburred to align with widened corridor spec.',
  },
  {
    id: 'rwk-002',
    reworkNumber: 'RWK-2026-02',
    projectId: 'PRJ-2026-001',
    projectNumber: 'PRJ-2026-001',
    batchId: 'batch-001',
    reworkReason: 'Minor powder coat sag observed near rear hinge bracket.',
    relatedStage: 'Production & Fabrication',
    relatedTask: 'Surface finishing & painting',
    createdBy: 'Rahul Mehta',
    createdDate: '2026-09-19',
    assignedEmployee: 'Ramesh Verma',
    expectedCompletion: '2026-09-21',
    actualCompletion: null,
    status: 'In Progress',
    daysLost: 1,
    revisionNumber: 'REV-01',
    remarks: 'Spot sanded and reapplied topcoat in spray booth.',
  },
];

const initialPackagingRecords = [
  {
    id: 'pkg-001',
    packageNumber: 'PKG-2026-001',
    projectId: 'PRJ-2026-001',
    projectNumber: 'PRJ-2026-001',
    packageType: 'Heavy Wooden Crate',
    quantity: 4,
    packedBy: 'Kishore Mali (Packaging Supervisor)',
    packingDate: '2026-09-24',
    dimensions: { length: 2350, width: 1550, height: 2050, unit: 'mm' },
    weight: { value: 420, unit: 'kg' },
    remarks: 'Internal bubble wrap + heavy polythene moisture barrier applied.',
    documents: ['Packing_List_PRJ_001.pdf', 'Shock_Sensor_Audit.pdf'],
    status: 'In Progress',
  },
  {
    id: 'pkg-002',
    packageNumber: 'PKG-2026-002',
    projectId: 'PRJ-2026-003',
    projectNumber: 'PRJ-2026-003',
    packageType: 'Steel Skid with Heavy Shrink Wrap',
    quantity: 2,
    packedBy: 'Kishore Mali (Packaging Supervisor)',
    packingDate: '2026-09-18',
    dimensions: { length: 6200, width: 900, height: 1100, unit: 'mm' },
    weight: { value: 680, unit: 'kg' },
    remarks: 'Motor and bearings greased and shrink wrapped against transit dust.',
    documents: ['Conveyor_Dispatch_Checklist.pdf'],
    status: 'Completed',
  },
];

const initialDispatchRecords = [
  {
    id: 'dsp-001',
    dispatchNumber: 'DSP-2026-001',
    orderNumber: 'SO-2026-0102',
    projectId: 'PRJ-2026-001',
    projectNumber: 'PRJ-2026-001',
    customerName: 'Acme Corp',
    packageCount: 2,
    dispatchDate: '2026-09-28',
    transporter: 'Patel Roadways Logistics',
    carrierName: 'Patel Roadways Logistics',
    lrTrackingNumber: 'LR-BHW-992014',
    lrNumber: 'LR-BHW-992014',
    vehicleNumber: 'MH-04-AB-1290',
    expectedDelivery: '2026-10-02',
    actualDelivery: null,
    status: 'Ready for Dispatch',
  },
  {
    id: 'dsp-002',
    dispatchNumber: 'DSP-2026-002',
    orderNumber: 'SO-2026-0103',
    projectId: 'PRJ-2026-003',
    projectNumber: 'PRJ-2026-003',
    customerName: 'Globex Inc',
    packageCount: 2,
    dispatchDate: '2026-09-19',
    transporter: 'V-Trans Express Freight',
    carrierName: 'V-Trans Express Freight',
    lrTrackingNumber: 'VTR-881023',
    lrNumber: 'VTR-881023',
    vehicleNumber: 'MH-43-E-8832',
    expectedDelivery: '2026-09-22',
    actualDelivery: null,
    status: 'In Transit',
  },
];

const initialPurchaseRequests = [
  {
    id: 'pr-001',
    prNumber: 'PR-2026-081',
    projectId: 'PRJ-2026-002',
    projectNumber: 'PRJ-2026-002',
    materialCode: 'LAM-ANTI-01',
    materialName: 'Antistatic High-Pressure Laminate 6mm',
    requestedQty: 362,
    uom: 'SQ.MTR',
    requiredByDate: '2026-09-15',
    status: 'Approved',
    createdDate: '2026-09-03',
    createdBy: 'Priya Nair',
    remarks: 'Urgent procurement request created from cleanroom partition shortage.',
  },
];

// Weighted stages mapping for manufacturing projects (e.g. 10%, 15%, 30%, 20%, 15%, 10% = 100%)
const initialProjectStages = {
  'PRJ-2026-001': [
    { id: 'stg-1', name: 'Design & Engineering Approval', weight: 15, completionPct: 100, status: 'Completed' },
    { id: 'stg-2', name: 'BOM Lock & Material Planning', weight: 15, completionPct: 100, status: 'Completed' },
    { id: 'stg-3', name: 'Sheet Metal CNC & Fabrication', weight: 30, completionPct: 80, status: 'In Progress' },
    { id: 'stg-4', name: 'Electrical & Interlock Assembly', weight: 20, completionPct: 25, status: 'In Progress' },
    { id: 'stg-5', name: 'Powder Coating & Finish QC', weight: 10, completionPct: 0, status: 'Not Started' },
    { id: 'stg-6', name: 'Packaging & Dispatch Readiness', weight: 10, completionPct: 0, status: 'Not Started' },
  ],
  'PRJ-2026-002': [
    { id: 'stg-201', name: 'Cleanroom Architectural Design', weight: 15, completionPct: 100, status: 'Completed' },
    { id: 'stg-202', name: 'Material Requisition & Sourcing', weight: 20, completionPct: 50, status: 'Delayed' },
    { id: 'stg-203', name: 'Aluminium Extrusion Frame Cut', weight: 25, completionPct: 90, status: 'In Progress' },
    { id: 'stg-204', name: 'Antistatic Panel Lamination', weight: 20, completionPct: 15, status: 'Blocked' },
    { id: 'stg-205', name: 'Quality & Particle Emission Test', weight: 10, completionPct: 0, status: 'Not Started' },
    { id: 'stg-206', name: 'Packaging & Transport Gatepass', weight: 10, completionPct: 0, status: 'Not Started' },
  ],
  'PRJ-2026-003': [
    { id: 'stg-301', name: 'Conveyor GA Layout Review', weight: 10, completionPct: 100, status: 'Completed' },
    { id: 'stg-302', name: 'Component Procurement', weight: 20, completionPct: 100, status: 'Completed' },
    { id: 'stg-303', name: 'Frame Machining & Motor Mount', weight: 35, completionPct: 100, status: 'Completed' },
    { id: 'stg-304', name: 'Belt Tracking & Run-in Testing', weight: 20, completionPct: 85, status: 'In Progress' },
    { id: 'stg-305', name: 'Pre-dispatch QC Sign-off', weight: 15, completionPct: 60, status: 'In Progress' },
  ],
};

// ─── LocalStorage Helpers ─────────────────────────────────────────────

function loadStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading manufacturing storage', e);
    return null;
  }
}

function saveStorage(data) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving manufacturing storage', e);
  }
}

const saved = loadStorage();

// ─── Store Definition ────────────────────────────────────────────────

export const useManufacturingStore = create((set, get) => ({
  bomVersions: saved?.bomVersions ?? initialBomVersions,
  materialPlans: saved?.materialPlans ?? initialMaterialPlans,
  materialIssues: saved?.materialIssues ?? initialMaterialIssues,
  materialConsumptions: saved?.materialConsumptions ?? initialMaterialConsumptions,
  labourEntries: saved?.labourEntries ?? initialLabourEntries,
  batches: saved?.batches ?? initialBatches,
  reworkRecords: saved?.reworkRecords ?? initialReworkRecords,
  packagingRecords: saved?.packagingRecords ?? initialPackagingRecords,
  dispatchRecords: saved?.dispatchRecords ?? initialDispatchRecords,
  purchaseRequests: saved?.purchaseRequests ?? initialPurchaseRequests,
  projectStages: saved?.projectStages ?? initialProjectStages,

  // Helper persistence wrapper
  _sync: () => {
    const state = get();
    saveStorage({
      bomVersions: state.bomVersions,
      materialPlans: state.materialPlans,
      materialIssues: state.materialIssues,
      materialConsumptions: state.materialConsumptions,
      labourEntries: state.labourEntries,
      batches: state.batches,
      reworkRecords: state.reworkRecords,
      packagingRecords: state.packagingRecords,
      dispatchRecords: state.dispatchRecords,
      purchaseRequests: state.purchaseRequests,
      projectStages: state.projectStages,
    });
  },

  // ── BOM Actions ───────────────────────────────────────────────────

  addBomVersion: (newBom) => {
    const id = `bom-v-${Date.now()}`;
    const vNum = newBom.versionNumber || newBom.version || 'v1.0';
    const entry = {
      id,
      createdDate: new Date().toISOString().slice(0, 10),
      components: [],
      ...newBom,
      version: vNum,
      versionNumber: vNum,
    };
    set((state) => ({
      bomVersions: [entry, ...state.bomVersions],
    }));
    get()._sync();
    return entry;
  },

  createBomVersion: (newBom) => get().addBomVersion(newBom),

  updateBomVersion: (id, updates) => {
    set((state) => ({
      bomVersions: state.bomVersions.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
    get()._sync();
  },

  duplicateBomVersion: (sourceId, newVersionNumber) => {
    const source = get().bomVersions.find((b) => b.id === sourceId);
    if (!source) return null;

    const newVersion = {
      ...source,
      id: `bom-v-${Date.now()}`,
      version: newVersionNumber || `v${(parseFloat(source.version.replace('v', '')) + 0.1).toFixed(1)}`,
      status: 'Draft',
      createdDate: new Date().toISOString().slice(0, 10),
      effectiveDate: new Date().toISOString().slice(0, 10),
      revisionReason: `Duplicated from ${source.version}`,
      components: source.components.map((c) => ({
        ...c,
        id: `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      })),
    };

    set((state) => ({
      bomVersions: [newVersion, ...state.bomVersions],
    }));
    get()._sync();
    return newVersion;
  },

  activateBomVersion: (id) => {
    const target = get().bomVersions.find((b) => b.id === id);
    if (!target) return;

    // Single active version rule: supersede previous active versions for this product
    set((state) => ({
      bomVersions: state.bomVersions.map((b) => {
        if (b.productId === target.productId) {
          if (b.id === id) {
            return { ...b, status: 'Active' };
          }
          if (b.status === 'Active') {
            return { ...b, status: 'Superseded' };
          }
        }
        return b;
      }),
    }));
    get()._sync();
  },

  supersedeBomVersion: (id) => {
    set((state) => ({
      bomVersions: state.bomVersions.map((b) => (b.id === id ? { ...b, status: 'Superseded' } : b)),
    }));
    get()._sync();
  },

  archiveBomVersion: (id) => {
    set((state) => ({
      bomVersions: state.bomVersions.map((b) => (b.id === id ? { ...b, status: 'Archived' } : b)),
    }));
    get()._sync();
  },

  addComponentToBom: (bomId, componentData) => {
    const compId = `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newComp = {
      id: compId,
      scrapPct: 0,
      requiredQty: componentData.quantity,
      estimatedValue: Number(componentData.quantity) * Number(componentData.estimatedRate || 0),
      currentStock: 100,
      shortage: 0,
      ...componentData,
    };

    set((state) => ({
      bomVersions: state.bomVersions.map((b) => {
        if (b.id === bomId) {
          return {
            ...b,
            components: [...b.components, newComp],
          };
        }
        return b;
      }),
    }));
    get()._sync();
    return newComp;
  },

  removeComponentFromBom: (bomId, componentId) => {
    set((state) => ({
      bomVersions: state.bomVersions.map((b) => {
        if (b.id === bomId) {
          return {
            ...b,
            components: b.components.filter((c) => c.id !== componentId),
          };
        }
        return b;
      }),
    }));
    get()._sync();
  },

  // ── Material Planning Actions ─────────────────────────────────────

  generateMaterialPlan: ({ projectId, projectNumber, productId, productName, bomVersionId, productionQty, planningDate, requiredByDate, warehouse }) => {
    const bom = get().bomVersions.find((b) => b.id === bomVersionId);
    const planNumber = `MPLAN-2026-${String(get().materialPlans.length + 1).padStart(3, '0')}`;
    const qty = Number(productionQty || 1);

    const items = (bom?.components ?? []).map((comp, idx) => {
      const bomQty = Number(comp.quantity || 1);
      const req = bomQty * qty;
      const scrap = Math.ceil(req * (Number(comp.scrapPct || 0) / 100));
      const totalReq = req + scrap;
      const stock = Number(comp.currentStock || 150);
      const balance = computeMaterialBalance(totalReq, stock, 0);

      return {
        id: `mpi-${Date.now()}-${idx}`,
        materialCode: comp.componentCode,
        materialName: comp.materialName,
        bomQty,
        productionQty: qty,
        requiredQty: req,
        scrapQty: scrap,
        totalRequired: totalReq,
        availableStock: stock,
        reservedStock: 0,
        availableAfterReservation: balance.availableAfterReservation,
        shortage: balance.shortage,
        surplus: balance.surplus,
        uom: comp.uom,
        plannedIssueDate: planningDate || new Date().toISOString().slice(0, 10),
        status: balance.status,
      };
    });

    const hasShortage = items.some((it) => it.shortage > 0);

    const newPlan = {
      id: `mplan-${Date.now()}`,
      planNumber,
      projectId,
      projectNumber: projectNumber || projectId,
      productId,
      productName,
      bomVersionId,
      bomVersion: bom?.version || 'v1.0',
      productionQty: qty,
      planningDate: planningDate || new Date().toISOString().slice(0, 10),
      requiredByDate: requiredByDate || new Date().toISOString().slice(0, 10),
      warehouse: warehouse || 'Main Central Plant (Bhiwandi Hub)',
      status: hasShortage ? 'Shortage' : 'Planned',
      items,
    };

    set((state) => ({
      materialPlans: [newPlan, ...state.materialPlans],
    }));
    get()._sync();
    return newPlan;
  },

  reserveMaterial: (planId, materialCode, qtyToReserve) => {
    set((state) => ({
      materialPlans: state.materialPlans.map((plan) => {
        if (plan.id === planId) {
          const updatedItems = plan.items.map((item) => {
            if (item.materialCode === materialCode) {
              const res = Math.min(item.availableStock, Number(qtyToReserve || item.totalRequired));
              const bal = computeMaterialBalance(item.totalRequired, item.availableStock, res);
              return {
                ...item,
                reservedStock: res,
                availableAfterReservation: bal.availableAfterReservation,
                shortage: bal.shortage,
                surplus: bal.surplus,
                status: 'Reserved',
              };
            }
            return item;
          });
          const allReserved = updatedItems.every((it) => it.status === 'Reserved');
          return {
            ...plan,
            items: updatedItems,
            status: allReserved ? 'Reserved' : plan.status,
          };
        }
        return plan;
      }),
    }));
    get()._sync();
  },

  releaseReservation: (planId, materialCode) => {
    set((state) => ({
      materialPlans: state.materialPlans.map((plan) => {
        if (plan.id === planId) {
          return {
            ...plan,
            items: plan.items.map((item) => {
              if (item.materialCode === materialCode) {
                const bal = computeMaterialBalance(item.totalRequired, item.availableStock, 0);
                return {
                  ...item,
                  reservedStock: 0,
                  availableAfterReservation: bal.availableAfterReservation,
                  shortage: bal.shortage,
                  surplus: bal.surplus,
                  status: bal.status,
                };
              }
              return item;
            }),
          };
        }
        return plan;
      }),
    }));
    get()._sync();
  },

  createPurchaseRequest: ({ projectId, projectNumber, materialCode, materialName, requestedQty, uom, requiredByDate, remarks }) => {
    const prNumber = `PR-2026-${String(get().purchaseRequests.length + 82).padStart(3, '0')}`;
    const newPr = {
      id: `pr-${Date.now()}`,
      prNumber,
      projectId,
      projectNumber: projectNumber || projectId,
      materialCode,
      materialName,
      requestedQty: Number(requestedQty),
      uom,
      requiredByDate: requiredByDate || new Date().toISOString().slice(0, 10),
      status: 'Requested',
      createdDate: new Date().toISOString().slice(0, 10),
      createdBy: 'Production Planner',
      remarks: remarks || 'Automated PR generated from shop-floor material shortage.',
    };

    set((state) => ({
      purchaseRequests: [newPr, ...state.purchaseRequests],
    }));
    get()._sync();
    return newPr;
  },

  // ── Material Issue Actions ────────────────────────────────────────

  createMaterialIssue: (issueData) => {
    const issueNumber = `ISS-2026-${String(get().materialIssues.length + 103).padStart(4, '0')}`;
    const newIssue = {
      id: `iss-${Date.now()}`,
      issueNumber,
      date: new Date().toISOString().slice(0, 10),
      status: 'Issued',
      warehouse: 'Main Central Plant (Bhiwandi Hub)',
      issuedBy: 'Stores Supervisor',
      ...issueData,
    };

    set((state) => ({
      materialIssues: [newIssue, ...state.materialIssues],
    }));
    get()._sync();
    return newIssue;
  },

  returnMaterialIssue: (issueId, returnQty, reason) => {
    set((state) => ({
      materialIssues: state.materialIssues.map((iss) => {
        if (iss.id === issueId) {
          return {
            ...iss,
            status: 'Returned',
            remarks: `${iss.remarks ? iss.remarks + ' | ' : ''}Returned ${returnQty} ${iss.uom}: ${reason}`,
          };
        }
        return iss;
      }),
    }));
    get()._sync();
  },

  // ── Material Consumption Actions ──────────────────────────────────

  recordMaterialConsumption: (consumptionData) => {
    const consumptionNumber = `CONS-2026-${String(get().materialConsumptions.length + 4).padStart(3, '0')}`;
    const planned = Number(consumptionData.bomQty || 0);
    const consumed = Math.max(0, Number(consumptionData.actualConsumedQty || 0)); // non negative
    const varianceData = computeConsumptionVariance(planned, consumed);

    const newCons = {
      id: `cons-${Date.now()}`,
      consumptionNumber,
      date: new Date().toISOString().slice(0, 10),
      wastage: Math.max(0, consumed - planned),
      scrap: Number(consumptionData.scrap || 0),
      remainingQty: Math.max(0, Number(consumptionData.issuedQty || 0) - consumed),
      variance: varianceData.variance,
      variancePct: varianceData.variancePct,
      ...consumptionData,
      actualConsumedQty: consumed,
    };

    set((state) => ({
      materialConsumptions: [newCons, ...state.materialConsumptions],
    }));
    get()._sync();
    return newCons;
  },

  // ── Labour Logging Actions ────────────────────────────────────────

  addLabourEntry: (entryData) => {
    const regHrs = Number(entryData.regularHours ?? entryData.hours ?? 0);
    const otHrs = Number(entryData.overtimeHours ?? 0);
    const rate = Number(entryData.hourlyRate ?? entryData.ratePerHour ?? 220);
    const labourCost = regHrs * rate;
    const overtimeCost = otHrs * (rate * 1.5);
    const totalCost = labourCost + overtimeCost;
    const task = entryData.taskName || entryData.taskDescription || 'Shopfloor Assembly';

    const newEntry = {
      id: `lab-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      hours: regHrs,
      regularHours: regHrs,
      ratePerHour: rate,
      hourlyRate: rate,
      taskName: task,
      taskDescription: task,
      shift: entryData.shift || 'General',
      department: entryData.department || 'Production',
      labourCost,
      overtimeCost,
      totalCost,
      ...entryData,
    };

    set((state) => ({
      labourEntries: [newEntry, ...state.labourEntries],
    }));
    get()._sync();
    return newEntry;
  },

  deleteLabourEntry: (id) => {
    set((state) => ({
      labourEntries: state.labourEntries.filter((l) => l.id !== id),
    }));
    get()._sync();
  },

  // ── Batch Actions ─────────────────────────────────────────────────

  createBatch: (batchData) => {
    const batchNumber = `BATCH-2026-${String(get().batches.length + 4).padStart(3, '0')}`;
    const cost = computeProductionCost(batchData);
    const qty = Math.max(1, Number(batchData.quantity || 1));
    const planned = Number(batchData.plannedCost || cost.totalCost);

    const newBatch = {
      id: `batch-${Date.now()}`,
      batchNumber,
      startDate: new Date().toISOString().slice(0, 10),
      completionPct: 0,
      status: 'Scheduled',
      ...batchData,
      totalCost: cost.totalCost,
      costPerUnit: Math.round((cost.totalCost / qty) * 100) / 100,
      plannedCost: planned,
      variance: cost.totalCost - planned,
      variancePct: planned > 0 ? Math.round(((cost.totalCost - planned) / planned) * 100) : 0,
    };

    set((state) => ({
      batches: [newBatch, ...state.batches],
    }));
    get()._sync();
    return newBatch;
  },

  updateBatchStatus: (id, status, completionPct) => {
    set((state) => ({
      batches: state.batches.map((b) => (b.id === id ? { ...b, status, ...(completionPct !== undefined ? { completionPct } : {}) } : b)),
    }));
    get()._sync();
  },

  // ── Rework Actions ────────────────────────────────────────────────

  recordRework: (reworkData) => {
    const reworkNumber = `RWK-2026-${String(get().reworkRecords.length + 3).padStart(2, '0')}`;
    const newRework = {
      id: `rwk-${Date.now()}`,
      reworkNumber,
      createdDate: new Date().toISOString().slice(0, 10),
      status: 'Requested',
      daysLost: 1,
      revisionNumber: 'REV-01',
      ...reworkData,
    };

    set((state) => ({
      reworkRecords: [newRework, ...state.reworkRecords],
    }));
    get()._sync();
    return newRework;
  },

  updateReworkStatus: (id, status, actualCompletion) => {
    set((state) => ({
      reworkRecords: state.reworkRecords.map((r) => (r.id === id ? { ...r, status, ...(actualCompletion ? { actualCompletion } : {}) } : b)),
    }));
    get()._sync();
  },

  // ── Packaging Actions ─────────────────────────────────────────────

  createPackagingRecord: (pkgData) => {
    const packageNumber = `PKG-2026-${String(get().packagingRecords.length + 3).padStart(3, '0')}`;
    const newPkg = {
      id: `pkg-${Date.now()}`,
      packageNumber,
      packingDate: new Date().toISOString().slice(0, 10),
      status: 'Pending',
      documents: [],
      ...pkgData,
    };

    set((state) => ({
      packagingRecords: [newPkg, ...state.packagingRecords],
    }));
    get()._sync();
    return newPkg;
  },

  updatePackagingStatus: (id, status) => {
    set((state) => ({
      packagingRecords: state.packagingRecords.map((p) => (p.id === id ? { ...p, status } : p)),
    }));
    get()._sync();
  },

  // ── Dispatch Actions ──────────────────────────────────────────────

  createDispatchRecord: (dispatchData) => {
    const dispatchNumber = `DSP-2026-${String(get().dispatchRecords.length + 3).padStart(3, '0')}`;
    const carrier = dispatchData.carrierName || dispatchData.transporter || 'Self Logistics';
    const lr = dispatchData.lrNumber || dispatchData.lrTrackingNumber || 'Pending Assignment';
    const newDsp = {
      id: `dsp-${Date.now()}`,
      dispatchNumber,
      dispatchDate: new Date().toISOString().slice(0, 10),
      status: 'Ready for Dispatch',
      ...dispatchData,
      transporter: carrier,
      carrierName: carrier,
      lrTrackingNumber: lr,
      lrNumber: lr,
    };

    set((state) => ({
      dispatchRecords: [newDsp, ...state.dispatchRecords],
    }));
    get()._sync();
    return newDsp;
  },

  updateDispatchStatus: (id, status, actualDelivery) => {
    set((state) => ({
      dispatchRecords: state.dispatchRecords.map((d) => (d.id === id ? { ...d, status, ...(actualDelivery ? { actualDelivery } : {}) } : d)),
    }));
    get()._sync();
  },

  // ── Project Weighted Stages Update ────────────────────────────────

  updateStageProgress: (projectId, stageId, completionPct) => {
    set((state) => {
      const stages = state.projectStages[projectId] || [];
      const updated = stages.map((s) => {
        if (s.id === stageId) {
          const pct = Math.min(100, Math.max(0, Number(completionPct)));
          return {
            ...s,
            completionPct: pct,
            status: pct === 100 ? 'Completed' : pct > 0 ? 'In Progress' : 'Not Started',
          };
        }
        return s;
      });
      return {
        projectStages: {
          ...state.projectStages,
          [projectId]: updated,
        },
      };
    });
    get()._sync();
  },

  // ── Getters / Selectors ───────────────────────────────────────────

  getProjectBoms: (projectId, productName) => {
    return get().bomVersions.filter((b) => b.productName === productName || b.productId === projectId);
  },

  getProjectActiveBom: (productName) => {
    return get().bomVersions.find((b) => b.productName === productName && b.status === 'Active') || get().bomVersions[0];
  },

  getProjectPlan: (projectId) => {
    return get().materialPlans.find((p) => p.projectId === projectId || p.projectNumber === projectId);
  },

  getProjectIssues: (projectId) => {
    return get().materialIssues.filter((i) => i.projectId === projectId || i.projectNumber === projectId);
  },

  getProjectConsumptions: (projectId) => {
    return get().materialConsumptions.filter((c) => c.projectId === projectId || c.projectNumber === projectId);
  },

  getProjectLabour: (projectId) => {
    return get().labourEntries.filter((l) => l.projectId === projectId || l.projectNumber === projectId);
  },

  getProjectBatches: (projectId) => {
    return get().batches.filter((b) => b.projectId === projectId || b.projectNumber === projectId);
  },

  getProjectRework: (projectId) => {
    return get().reworkRecords.filter((r) => r.projectId === projectId || r.projectNumber === projectId);
  },

  getProjectPackaging: (projectId) => {
    return get().packagingRecords.filter((p) => p.projectId === projectId || p.projectNumber === projectId);
  },

  getProjectDispatch: (projectId) => {
    return get().dispatchRecords.find((d) => d.projectId === projectId || d.projectNumber === projectId);
  },

  getProjectStages: (projectId) => {
    return get().projectStages[projectId] || [];
  },

  getProjectWeightedProgress: (projectId) => {
    const stages = get().getProjectStages(projectId);
    return computeWeightedProgress(stages);
  },
}));
