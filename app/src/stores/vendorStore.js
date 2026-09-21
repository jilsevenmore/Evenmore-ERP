import { create } from 'zustand';
import { computeOrderProgress, computeOrderRiskStatus } from '../utils/vendorProgressUtils';

const LS_KEY = 'evenmore_vendor_portal_v1';
const SESSION_KEY = 'evenmore_vendor_session_v1';

// ── Initial Mock Vendors ─────────────────────────────────────────
const initialVendors = [
  {
    id: 'vend-om-fab',
    code: 'VEND-001',
    name: 'Om Fabrication Works',
    category: 'Heavy Fabrication & Machining',
    supplyType: 'Heavy Fabrication & Sheet Metal',
    portalAccess: 'Enabled',
    activeUsersCount: 2,
    contactPerson: 'Rajesh Sharma',
    email: 'rajesh@omfab.com',
    phone: '+91 98765 43210',
    address: 'Plot 42, GIDC Industrial Estate, Phase 2, Vatva',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    pincode: '382445',
    gstin: '24AABCO1234F1Z8',
    paymentTerms: 'Net 30',
    lastLogin: '2026-09-21 11:30 AM',
    onTimeRate: 94,
    rating: 4.8,
  },
  {
    id: 'vend-shakti',
    code: 'VEND-002',
    name: 'Shakti Steel Traders',
    category: 'Structural Steel & Profiles',
    supplyType: 'Raw Steel, Angles & Beams',
    portalAccess: 'Enabled',
    activeUsersCount: 1,
    contactPerson: 'Suresh Mehta',
    email: 'suresh@shaktisteel.com',
    phone: '+91 98234 56789',
    address: '15/A Phase 2, Naroda Industrial Area',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    pincode: '382330',
    gstin: '24AAECS5678K1Z2',
    paymentTerms: 'Net 45',
    lastLogin: '2026-09-20 04:15 PM',
    onTimeRate: 88,
    rating: 4.5,
  },
  {
    id: 'vend-precision',
    code: 'VEND-003',
    name: 'Precision Parts Company',
    category: 'CNC & High Precision Components',
    supplyType: 'CNC Turning, Milling & Bushings',
    portalAccess: 'Enabled',
    activeUsersCount: 1,
    contactPerson: 'Vikram Rathi',
    email: 'vikram@precisionparts.com',
    phone: '+91 98111 22334',
    address: '88 Engineering Park, GIDC Sanand',
    city: 'Sanand',
    state: 'Gujarat',
    country: 'India',
    pincode: '382110',
    gstin: '24AABCP9988C1Z6',
    paymentTerms: 'Net 30',
    lastLogin: '2026-09-19 02:40 PM',
    onTimeRate: 91,
    rating: 4.7,
  },
  {
    id: 'vend-gujarat',
    code: 'VEND-004',
    name: 'Gujarat Motors and Drives',
    category: 'Motors & Transmission',
    supplyType: 'Electric Motors & Reduction Gearboxes',
    portalAccess: 'Paused',
    activeUsersCount: 1,
    contactPerson: 'Dilip Joshi',
    email: 'dilip@gujaratmotors.com',
    phone: '+91 98999 88776',
    address: '102 GIDC Makarpura',
    city: 'Vadodara',
    state: 'Gujarat',
    country: 'India',
    pincode: '390010',
    gstin: '24AAEFG1122D1Z4',
    paymentTerms: 'Due on Receipt',
    lastLogin: '2026-09-10 10:00 AM',
    onTimeRate: 76,
    rating: 3.9,
  },
];

// ── Initial Vendor Users (Contacts) ───────────────────────────────
const initialVendorUsers = [
  {
    id: 'vuser-1',
    vendorId: 'vend-om-fab',
    name: 'Rajesh Sharma',
    email: 'rajesh@omfab.com',
    phone: '+91 98765 43210',
    designation: 'Plant General Manager',
    role: 'Portal Admin',
    status: 'Active',
    lastLogin: '2026-09-21 11:30 AM',
    password: 'password123',
  },
  {
    id: 'vuser-2',
    vendorId: 'vend-om-fab',
    name: 'Amit Patel',
    email: 'amit@omfab.com',
    phone: '+91 98765 43211',
    designation: 'Fabrication Workshop Lead',
    role: 'Production Lead',
    status: 'Active',
    lastLogin: '2026-09-20 06:10 PM',
    password: 'password123',
  },
  {
    id: 'vuser-3',
    vendorId: 'vend-shakti',
    name: 'Suresh Mehta',
    email: 'suresh@shaktisteel.com',
    phone: '+91 98234 56789',
    designation: 'Commercial Manager',
    role: 'Portal Admin',
    status: 'Active',
    lastLogin: '2026-09-20 04:15 PM',
    password: 'password123',
  },
  {
    id: 'vuser-4',
    vendorId: 'vend-precision',
    name: 'Vikram Rathi',
    email: 'vikram@precisionparts.com',
    phone: '+91 98111 22334',
    designation: 'Operations Director',
    role: 'Portal Admin',
    status: 'Active',
    lastLogin: '2026-09-19 02:40 PM',
    password: 'password123',
  },
  {
    id: 'vuser-5',
    vendorId: 'vend-gujarat',
    name: 'Dilip Joshi',
    email: 'dilip@gujaratmotors.com',
    phone: '+91 98999 88776',
    designation: 'Sales & Delivery Lead',
    role: 'Portal Admin',
    status: 'Inactive',
    lastLogin: '2026-09-10 10:00 AM',
    password: 'password123',
  },
];

// ── Initial Process Templates ─────────────────────────────────────
const initialTemplates = [
  {
    id: 'tmpl-fab-1',
    name: 'Standard Heavy Fabrication & Assembly',
    description: 'Complete 5-stage outsourcing sequence for heavy structural equipment and fabrication.',
    applicableType: 'Heavy Machinery & Structural Steel',
    totalWeight: 100,
    isActive: true,
    createdDate: '2026-08-10',
    updatedDate: '2026-09-15',
    stages: [
      {
        id: 'stg-tmpl-1',
        name: 'Fabrication',
        sequence: 1,
        weight: 30,
        expectedDays: 5,
        responsibleParty: 'Vendor',
        proofRequired: false,
        mandatoryFields: ['Quantity', 'Remarks'],
        instructions: 'Laser cut, bend, and prepare MS raw plates as per approved CAD drawing revision 4.',
        isActive: true,
      },
      {
        id: 'stg-tmpl-2',
        name: 'Welding',
        sequence: 2,
        weight: 25,
        expectedDays: 4,
        responsibleParty: 'Vendor',
        proofRequired: true,
        mandatoryFields: ['Quantity', 'Remarks', 'Proof'],
        instructions: 'Full penetration MIG welding. Upload weld seam inspection photograph and dye penetrant test certificate.',
        isActive: true,
      },
      {
        id: 'stg-tmpl-3',
        name: 'Grinding',
        sequence: 3,
        weight: 15,
        expectedDays: 2,
        responsibleParty: 'Vendor',
        proofRequired: false,
        mandatoryFields: ['Quantity'],
        instructions: 'Deburr sharp edges and grind all weld spatter flush with base material.',
        isActive: true,
      },
      {
        id: 'stg-tmpl-4',
        name: 'Painting',
        sequence: 4,
        weight: 20,
        expectedDays: 3,
        responsibleParty: 'Vendor',
        proofRequired: true,
        mandatoryFields: ['Quantity', 'Remarks', 'Proof'],
        instructions: 'Red oxide epoxy primer 2 coats + Polyurethane enamel finish in RAL 7035 light grey (min DFT 80 microns).',
        isActive: true,
      },
      {
        id: 'stg-tmpl-5',
        name: 'QC Inspection',
        sequence: 5,
        weight: 10,
        expectedDays: 2,
        responsibleParty: 'In-House / Vendor',
        proofRequired: true,
        mandatoryFields: ['Quantity', 'Remarks', 'Proof'],
        instructions: 'Comprehensive dimensional audit and DFT paint thickness report signed by certified QC inspector.',
        isActive: true,
      },
    ],
  },
  {
    id: 'tmpl-cnc-2',
    name: 'Precision CNC Machining & Finishing',
    description: 'Precision turning, milling, and tolerance verification for precision components.',
    applicableType: 'Precision Components & Bushings',
    totalWeight: 100,
    isActive: true,
    createdDate: '2026-08-15',
    updatedDate: '2026-09-12',
    stages: [
      {
        id: 'stg-tmpl-201',
        name: 'Raw Material Sourcing & Cut',
        sequence: 1,
        weight: 20,
        expectedDays: 3,
        responsibleParty: 'Vendor',
        proofRequired: false,
        mandatoryFields: ['Quantity'],
        instructions: 'Verify mill test certificate for brass/steel bar stock before cutting.',
        isActive: true,
      },
      {
        id: 'stg-tmpl-202',
        name: 'CNC Milling & Turning',
        sequence: 2,
        weight: 40,
        expectedDays: 6,
        responsibleParty: 'Vendor',
        proofRequired: true,
        mandatoryFields: ['Quantity', 'Remarks', 'Proof'],
        instructions: 'Maintain +/- 0.02mm tolerance on bearing journals.',
        isActive: true,
      },
      {
        id: 'stg-tmpl-203',
        name: 'Heat Treatment & Surface Finishing',
        sequence: 3,
        weight: 25,
        expectedDays: 4,
        responsibleParty: 'Vendor',
        proofRequired: true,
        mandatoryFields: ['Quantity', 'Remarks', 'Proof'],
        instructions: 'Induction harden to 45-48 HRC and black oxide finish.',
        isActive: true,
      },
      {
        id: 'stg-tmpl-204',
        name: 'Final Dimensional Quality Check',
        sequence: 4,
        weight: 15,
        expectedDays: 2,
        responsibleParty: 'In-House / Vendor',
        proofRequired: true,
        mandatoryFields: ['Quantity', 'Remarks', 'Proof'],
        instructions: 'CMM dimensional inspection report required.',
        isActive: true,
      },
    ],
  },
  {
    id: 'tmpl-sheet-3',
    name: 'Sheet Metal & Powder Coating',
    description: 'Enclosure fabrication, punch, press brake bending and architectural powder coating.',
    applicableType: 'Enclosures & Electrical Panels',
    totalWeight: 100,
    isActive: true,
    createdDate: '2026-08-22',
    updatedDate: '2026-09-10',
    stages: [
      {
        id: 'stg-tmpl-301',
        name: 'Laser Cutting & CNC Bending',
        sequence: 1,
        weight: 35,
        expectedDays: 4,
        responsibleParty: 'Vendor',
        proofRequired: false,
        mandatoryFields: ['Quantity'],
        instructions: '2mm CRCA sheet cutting and precision bending.',
        isActive: true,
      },
      {
        id: 'stg-tmpl-302',
        name: 'TIG/MIG Spot Welding',
        sequence: 2,
        weight: 25,
        expectedDays: 3,
        responsibleParty: 'Vendor',
        proofRequired: true,
        mandatoryFields: ['Quantity', 'Remarks', 'Proof'],
        instructions: 'Corner seam weld without distortion.',
        isActive: true,
      },
      {
        id: 'stg-tmpl-303',
        name: 'Pre-treatment & Powder Coating',
        sequence: 3,
        weight: 25,
        expectedDays: 3,
        responsibleParty: 'Vendor',
        proofRequired: true,
        mandatoryFields: ['Quantity', 'Remarks', 'Proof'],
        instructions: '7-tank phosphating pre-treatment followed by pure polyester powder coat.',
        isActive: true,
      },
      {
        id: 'stg-tmpl-304',
        name: 'Packaging & Dispatch QC',
        sequence: 4,
        weight: 15,
        expectedDays: 1,
        responsibleParty: 'In-House / Vendor',
        proofRequired: true,
        mandatoryFields: ['Quantity', 'Remarks'],
        instructions: 'Bubble wrapped and corner protected for transport.',
        isActive: true,
      },
    ],
  },
];

// ── Initial Shared Orders ─────────────────────────────────────────
const initialOrders = [
  {
    id: 'ord-1025',
    orderNumber: 'ORD-1025',
    salesOrderId: 'so-1025',
    vendorId: 'vend-om-fab',
    vendorName: 'Om Fabrication Works',
    customer: 'Patel Agro Industries',
    product: 'MS Table 4x2 Feet Heavy Duty',
    quantity: 50,
    uom: 'Units',
    assignedDate: '2026-09-12',
    expectedStartDate: '2026-09-12',
    expectedEndDate: '2026-09-28',
    dueDate: '2026-09-28',
    lastUpdate: '2026-09-20 16:30',
    priority: 'High',
    status: 'Awaiting Approval',
    riskStatus: 'On Track',
    templateId: 'tmpl-fab-1',
    templateName: 'Standard Heavy Fabrication & Assembly',
    isShared: true,
    visibilityStatus: 'Visible',
    assignedOwner: 'Adarsh Gupta',
    notes: 'Priority agricultural processing tables required for harvest season dispatch.',
    stages: [
      {
        id: 'stg-1025-1',
        name: 'Fabrication',
        sequence: 1,
        weight: 30,
        expectedDays: 5,
        plannedDate: '2026-09-17',
        actualStartDate: '2026-09-12',
        actualCompletionDate: '2026-09-16',
        status: 'Approved',
        progress: 100,
        quantityCompleted: 50,
        responsibleParty: 'Vendor',
        proofRequired: false,
        approvalStatus: 'Approved',
        proofFiles: [
          { name: 'cad_cut_check.jpg', size: '1.4 MB', type: 'image/jpeg', url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=60' }
        ],
        remarks: 'Base frame laser cuts and 4x2 angle brackets fabrication completed as per CAD rev 4.',
      },
      {
        id: 'stg-1025-2',
        name: 'Welding',
        sequence: 2,
        weight: 25,
        expectedDays: 4,
        plannedDate: '2026-09-21',
        actualStartDate: '2026-09-17',
        actualCompletionDate: null,
        status: 'Submitted',
        progress: 100,
        quantityCompleted: 50,
        responsibleParty: 'Vendor',
        proofRequired: true,
        approvalStatus: 'Pending Approval',
        proofFiles: [
          { name: 'welding_inspection_cert.pdf', size: '2.1 MB', type: 'application/pdf', url: '#' },
          { name: 'weld_seam_macro.jpg', size: '3.2 MB', type: 'image/jpeg', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=60' }
        ],
        remarks: 'All 50 table frames MIG welded with AWS ER70S-6 wire. Liquid penetrant check shows zero cracks.',
        submittedBy: 'Rajesh Sharma',
        submittedDate: '2026-09-20 16:30',
      },
      {
        id: 'stg-1025-3',
        name: 'Grinding',
        sequence: 3,
        weight: 15,
        expectedDays: 2,
        plannedDate: '2026-09-23',
        actualStartDate: null,
        actualCompletionDate: null,
        status: 'Not Started',
        progress: 0,
        quantityCompleted: 0,
        responsibleParty: 'Vendor',
        proofRequired: false,
        approvalStatus: 'Pending',
        proofFiles: [],
        remarks: '',
      },
      {
        id: 'stg-1025-4',
        name: 'Painting',
        sequence: 4,
        weight: 20,
        expectedDays: 3,
        plannedDate: '2026-09-26',
        actualStartDate: null,
        actualCompletionDate: null,
        status: 'Not Started',
        progress: 0,
        quantityCompleted: 0,
        responsibleParty: 'Vendor',
        proofRequired: true,
        approvalStatus: 'Pending',
        proofFiles: [],
        remarks: '',
      },
      {
        id: 'stg-1025-5',
        name: 'QC Inspection',
        sequence: 5,
        weight: 10,
        expectedDays: 2,
        plannedDate: '2026-09-28',
        actualStartDate: null,
        actualCompletionDate: null,
        status: 'Not Started',
        progress: 0,
        quantityCompleted: 0,
        responsibleParty: 'In-House / Vendor',
        proofRequired: true,
        approvalStatus: 'Pending',
        proofFiles: [],
        remarks: '',
      },
    ],
    updateHistory: [
      {
        id: 'hist-1',
        stage: 'Fabrication',
        previousStatus: 'In Progress',
        newStatus: 'Submitted',
        quantity: 50,
        remarks: 'Base frame laser cuts and 4x2 angle brackets fabrication completed as per CAD rev 4.',
        submittedBy: 'Amit Patel',
        submittedDate: '2026-09-15 14:20',
        proofFiles: [{ name: 'cad_cut_check.jpg', size: '1.4 MB' }],
        approvalStatus: 'Approved',
        reviewedBy: 'Adarsh Gupta',
        reviewedDate: '2026-09-16 10:15',
        approvalRemarks: 'Dimensions verified against technical drawing. Approved to begin welding.',
      },
      {
        id: 'hist-2',
        stage: 'Welding',
        previousStatus: 'In Progress',
        newStatus: 'Submitted',
        quantity: 50,
        remarks: 'All 50 table frames MIG welded with AWS ER70S-6 wire. Liquid penetrant check shows zero cracks.',
        submittedBy: 'Rajesh Sharma',
        submittedDate: '2026-09-20 16:30',
        proofFiles: [
          { name: 'welding_inspection_cert.pdf', size: '2.1 MB' },
          { name: 'weld_seam_macro.jpg', size: '3.2 MB' },
        ],
        approvalStatus: 'Pending Approval',
        reviewedBy: null,
        reviewedDate: null,
      },
    ],
  },
  {
    id: 'ord-1028',
    orderNumber: 'ORD-1028',
    salesOrderId: 'so-1028',
    vendorId: 'vend-om-fab',
    vendorName: 'Om Fabrication Works',
    customer: 'Surat Agri Equipment',
    product: 'Custom Heavy Duty Chassis Frame',
    quantity: 20,
    uom: 'Units',
    assignedDate: '2026-09-15',
    expectedStartDate: '2026-09-15',
    expectedEndDate: '2026-10-05',
    dueDate: '2026-10-05',
    lastUpdate: '2026-09-19 11:15',
    priority: 'Medium',
    status: 'In Progress',
    riskStatus: 'On Track',
    templateId: 'tmpl-fab-1',
    templateName: 'Standard Heavy Fabrication & Assembly',
    isShared: true,
    visibilityStatus: 'Visible',
    assignedOwner: 'Kavita Iyer',
    notes: 'Structural steel chassis frames for tractor trailer mounting.',
    stages: [
      {
        id: 'stg-1028-1',
        name: 'Fabrication',
        sequence: 1,
        weight: 30,
        expectedDays: 5,
        plannedDate: '2026-09-20',
        actualStartDate: '2026-09-16',
        actualCompletionDate: null,
        status: 'In Progress',
        progress: 60,
        quantityCompleted: 12,
        responsibleParty: 'Vendor',
        proofRequired: false,
        approvalStatus: 'Pending',
        proofFiles: [],
        remarks: '12 out of 20 base frames cut and notched on bandsaw.',
      },
      {
        id: 'stg-1028-2',
        name: 'Welding',
        sequence: 2,
        weight: 25,
        expectedDays: 4,
        plannedDate: '2026-09-25',
        actualStartDate: null,
        actualCompletionDate: null,
        status: 'Not Started',
        progress: 0,
        quantityCompleted: 0,
        responsibleParty: 'Vendor',
        proofRequired: true,
        approvalStatus: 'Pending',
        proofFiles: [],
        remarks: '',
      },
      {
        id: 'stg-1028-3',
        name: 'Grinding',
        sequence: 3,
        weight: 15,
        expectedDays: 2,
        plannedDate: '2026-09-28',
        actualStartDate: null,
        actualCompletionDate: null,
        status: 'Not Started',
        progress: 0,
        quantityCompleted: 0,
        responsibleParty: 'Vendor',
        proofRequired: false,
        approvalStatus: 'Pending',
        proofFiles: [],
        remarks: '',
      },
      {
        id: 'stg-1028-4',
        name: 'Painting',
        sequence: 4,
        weight: 20,
        expectedDays: 3,
        plannedDate: '2026-10-02',
        actualStartDate: null,
        actualCompletionDate: null,
        status: 'Not Started',
        progress: 0,
        quantityCompleted: 0,
        responsibleParty: 'Vendor',
        proofRequired: true,
        approvalStatus: 'Pending',
        proofFiles: [],
        remarks: '',
      },
      {
        id: 'stg-1028-5',
        name: 'QC Inspection',
        sequence: 5,
        weight: 10,
        expectedDays: 2,
        plannedDate: '2026-10-05',
        actualStartDate: null,
        actualCompletionDate: null,
        status: 'Not Started',
        progress: 0,
        quantityCompleted: 0,
        responsibleParty: 'In-House / Vendor',
        proofRequired: true,
        approvalStatus: 'Pending',
        proofFiles: [],
        remarks: '',
      },
    ],
    updateHistory: [
      {
        id: 'hist-28-1',
        stage: 'Fabrication',
        previousStatus: 'Started',
        newStatus: 'In Progress',
        quantity: 12,
        remarks: '12 out of 20 base frames cut and notched on bandsaw.',
        submittedBy: 'Amit Patel',
        submittedDate: '2026-09-19 11:15',
        proofFiles: [],
        approvalStatus: 'In Progress',
      }
    ],
  },
  {
    id: 'ord-1031',
    orderNumber: 'ORD-1031',
    salesOrderId: 'so-1031',
    vendorId: 'vend-om-fab',
    vendorName: 'Om Fabrication Works',
    customer: 'Kisan Agro Machinery',
    product: 'Tractor Trolley Underbody',
    quantity: 15,
    uom: 'Units',
    assignedDate: '2026-09-01',
    expectedStartDate: '2026-09-01',
    expectedEndDate: '2026-09-18', // Past date -> delayed!
    dueDate: '2026-09-18',
    lastUpdate: '2026-09-18 17:00',
    priority: 'Urgent',
    status: 'Delayed',
    riskStatus: 'Delayed',
    templateId: 'tmpl-fab-1',
    templateName: 'Standard Heavy Fabrication & Assembly',
    isShared: true,
    visibilityStatus: 'Visible',
    assignedOwner: 'Adarsh Gupta',
    notes: 'Urgent order: Painting stage delayed due to supplier paint booth compressor breakdown.',
    stages: [
      {
        id: 'stg-1031-1',
        name: 'Fabrication',
        sequence: 1,
        weight: 30,
        expectedDays: 4,
        actualStartDate: '2026-09-01',
        actualCompletionDate: '2026-09-06',
        status: 'Approved',
        progress: 100,
        quantityCompleted: 15,
        responsibleParty: 'Vendor',
        approvalStatus: 'Approved',
        proofFiles: [{ name: 'fab_completion.jpg', size: '2.1 MB' }],
        remarks: '15 units fabrication complete.',
      },
      {
        id: 'stg-1031-2',
        name: 'Welding',
        sequence: 2,
        weight: 25,
        expectedDays: 4,
        actualStartDate: '2026-09-07',
        actualCompletionDate: '2026-09-12',
        status: 'Approved',
        progress: 100,
        quantityCompleted: 15,
        responsibleParty: 'Vendor',
        approvalStatus: 'Approved',
        proofFiles: [{ name: 'weld_qc.pdf', size: '1.8 MB' }],
        remarks: 'Welding passed 100% inspection.',
      },
      {
        id: 'stg-1031-3',
        name: 'Grinding',
        sequence: 3,
        weight: 15,
        expectedDays: 2,
        actualStartDate: '2026-09-13',
        actualCompletionDate: '2026-09-15',
        status: 'Approved',
        progress: 100,
        quantityCompleted: 15,
        responsibleParty: 'Vendor',
        approvalStatus: 'Approved',
        proofFiles: [],
        remarks: 'Grinding and cleaning finished.',
      },
      {
        id: 'stg-1031-4',
        name: 'Painting',
        sequence: 4,
        weight: 20,
        expectedDays: 3,
        actualStartDate: '2026-09-16',
        actualCompletionDate: null,
        status: 'Delayed',
        progress: 0,
        quantityCompleted: 0,
        responsibleParty: 'Vendor',
        proofRequired: true,
        approvalStatus: 'Pending',
        proofFiles: [],
        remarks: 'Paint booth compressor failed; maintenance scheduled for completion on 22nd Sep.',
      },
      {
        id: 'stg-1031-5',
        name: 'QC Inspection',
        sequence: 5,
        weight: 10,
        expectedDays: 2,
        actualStartDate: null,
        actualCompletionDate: null,
        status: 'Not Started',
        progress: 0,
        quantityCompleted: 0,
        responsibleParty: 'In-House / Vendor',
        proofRequired: true,
        approvalStatus: 'Pending',
        proofFiles: [],
        remarks: '',
      },
    ],
    updateHistory: [
      {
        id: 'hist-31-1',
        stage: 'Painting',
        previousStatus: 'Started',
        newStatus: 'Delayed',
        quantity: 0,
        remarks: 'Paint booth compressor down. Repair parts arriving tomorrow.',
        submittedBy: 'Rajesh Sharma',
        submittedDate: '2026-09-18 17:00',
        proofFiles: [],
        approvalStatus: 'Pending',
      }
    ],
  },
  {
    id: 'ord-1022',
    orderNumber: 'ORD-1022',
    salesOrderId: 'so-1022',
    vendorId: 'vend-om-fab',
    vendorName: 'Om Fabrication Works',
    customer: 'Gujarat Dairy Fed',
    product: 'Stainless Steel Milk Hopper Stand',
    quantity: 10,
    uom: 'Units',
    assignedDate: '2026-08-20',
    expectedStartDate: '2026-08-20',
    expectedEndDate: '2026-09-10',
    dueDate: '2026-09-10',
    lastUpdate: '2026-09-10 14:00',
    priority: 'Medium',
    status: 'Completed',
    riskStatus: 'Completed',
    templateId: 'tmpl-fab-1',
    templateName: 'Standard Heavy Fabrication & Assembly',
    isShared: true,
    visibilityStatus: 'Visible',
    assignedOwner: 'Adarsh Gupta',
    notes: 'Food grade SS-304 frames completed and cleared by dairy inspector.',
    stages: [
      { id: 'stg-1022-1', name: 'Fabrication', sequence: 1, weight: 30, status: 'Approved', progress: 100, quantityCompleted: 10 },
      { id: 'stg-1022-2', name: 'Welding', sequence: 2, weight: 25, status: 'Approved', progress: 100, quantityCompleted: 10 },
      { id: 'stg-1022-3', name: 'Grinding', sequence: 3, weight: 15, status: 'Approved', progress: 100, quantityCompleted: 10 },
      { id: 'stg-1022-4', name: 'Painting', sequence: 4, weight: 20, status: 'Approved', progress: 100, quantityCompleted: 10 },
      { id: 'stg-1022-5', name: 'QC Inspection', sequence: 5, weight: 10, status: 'Approved', progress: 100, quantityCompleted: 10 },
    ],
    updateHistory: [
      {
        id: 'hist-22-1',
        stage: 'QC Inspection',
        previousStatus: 'Submitted',
        newStatus: 'Approved',
        quantity: 10,
        remarks: 'All 10 hopper stands inspected and dispatched.',
        submittedBy: 'Rajesh Sharma',
        submittedDate: '2026-09-10 11:30',
        proofFiles: [{ name: 'final_qc_signed.pdf', size: '1.2 MB' }],
        approvalStatus: 'Approved',
        reviewedBy: 'Adarsh Gupta',
        reviewedDate: '2026-09-10 14:00',
      }
    ],
  },
  {
    id: 'ord-1035',
    orderNumber: 'ORD-1035',
    salesOrderId: 'so-1035',
    vendorId: 'vend-om-fab',
    vendorName: 'Om Fabrication Works',
    customer: 'Baroda Engineering Co',
    product: 'Hydraulic Mounting Brackets',
    quantity: 100,
    uom: 'Pcs',
    assignedDate: '2026-09-21',
    expectedStartDate: '2026-09-22',
    expectedEndDate: '2026-10-15',
    dueDate: '2026-10-15',
    lastUpdate: '2026-09-21 09:30',
    priority: 'Normal',
    status: 'New',
    riskStatus: 'On Track',
    templateId: 'tmpl-fab-1',
    templateName: 'Standard Heavy Fabrication & Assembly',
    isShared: true,
    visibilityStatus: 'Visible',
    assignedOwner: 'Adarsh Gupta',
    notes: 'Newly shared outsourcing order. Awaiting vendor acceptance.',
    stages: [
      { id: 'stg-1035-1', name: 'Fabrication', sequence: 1, weight: 30, status: 'Not Started', progress: 0 },
      { id: 'stg-1035-2', name: 'Welding', sequence: 2, weight: 25, status: 'Not Started', progress: 0 },
      { id: 'stg-1035-3', name: 'Grinding', sequence: 3, weight: 15, status: 'Not Started', progress: 0 },
      { id: 'stg-1035-4', name: 'Painting', sequence: 4, weight: 20, status: 'Not Started', progress: 0 },
      { id: 'stg-1035-5', name: 'QC Inspection', sequence: 5, weight: 10, status: 'Not Started', progress: 0 },
    ],
    updateHistory: [],
  },
  {
    id: 'ord-1026',
    orderNumber: 'ORD-1026',
    salesOrderId: 'so-1026',
    vendorId: 'vend-shakti',
    vendorName: 'Shakti Steel Traders',
    customer: 'Apex Infra Projects',
    product: 'Heavy I-Beam Assembly 6m',
    quantity: 40,
    uom: 'Units',
    assignedDate: '2026-09-10',
    expectedStartDate: '2026-09-10',
    expectedEndDate: '2026-09-30',
    dueDate: '2026-09-30',
    lastUpdate: '2026-09-18 15:45',
    priority: 'High',
    status: 'In Progress',
    riskStatus: 'On Track',
    templateId: 'tmpl-sheet-3',
    templateName: 'Sheet Metal & Powder Coating',
    isShared: true,
    visibilityStatus: 'Visible',
    assignedOwner: 'Kavita Iyer',
    notes: 'Heavy structural beams cut to exact 6-meter lengths with gusset plates.',
    stages: [
      { id: 'stg-1026-1', name: 'Laser Cutting & CNC Bending', sequence: 1, weight: 35, status: 'Approved', progress: 100, quantityCompleted: 40 },
      { id: 'stg-1026-2', name: 'TIG/MIG Spot Welding', sequence: 2, weight: 25, status: 'Approved', progress: 100, quantityCompleted: 40 },
      { id: 'stg-1026-3', name: 'Pre-treatment & Powder Coating', sequence: 3, weight: 25, status: 'In Progress', progress: 50, quantityCompleted: 20 },
      { id: 'stg-1026-4', name: 'Packaging & Dispatch QC', sequence: 4, weight: 15, status: 'Not Started', progress: 0 },
    ],
    updateHistory: [
      {
        id: 'hist-26-1',
        stage: 'Pre-treatment & Powder Coating',
        previousStatus: 'Started',
        newStatus: 'In Progress',
        quantity: 20,
        remarks: '20 beams coated and baked.',
        submittedBy: 'Suresh Mehta',
        submittedDate: '2026-09-18 15:45',
        proofFiles: [],
        approvalStatus: 'In Progress',
      }
    ],
  },
  {
    id: 'ord-1029',
    orderNumber: 'ORD-1029',
    salesOrderId: 'so-1029',
    vendorId: 'vend-precision',
    vendorName: 'Precision Parts Company',
    customer: 'Siemens Switchgear',
    product: 'CNC Brass Bushings 40mm',
    quantity: 250,
    uom: 'Pcs',
    assignedDate: '2026-09-14',
    expectedStartDate: '2026-09-14',
    expectedEndDate: '2026-09-23', // Due in 2 days, only 45% done -> At Risk
    dueDate: '2026-09-23',
    lastUpdate: '2026-09-19 18:20',
    priority: 'High',
    status: 'At Risk',
    riskStatus: 'At Risk',
    templateId: 'tmpl-cnc-2',
    templateName: 'Precision CNC Machining & Finishing',
    isShared: true,
    visibilityStatus: 'Visible',
    assignedOwner: 'Adarsh Gupta',
    notes: 'Tight turnaround tolerance required. Running second shift to meet delivery.',
    stages: [
      { id: 'stg-1029-1', name: 'Raw Material Sourcing & Cut', sequence: 1, weight: 20, status: 'Approved', progress: 100, quantityCompleted: 250 },
      { id: 'stg-1029-2', name: 'CNC Milling & Turning', sequence: 2, weight: 40, status: 'In Progress', progress: 62.5, quantityCompleted: 156 },
      { id: 'stg-1029-3', name: 'Heat Treatment & Surface Finishing', sequence: 3, weight: 25, status: 'Not Started', progress: 0 },
      { id: 'stg-1029-4', name: 'Final Dimensional Quality Check', sequence: 4, weight: 15, status: 'Not Started', progress: 0 },
    ],
    updateHistory: [
      {
        id: 'hist-29-1',
        stage: 'CNC Milling & Turning',
        previousStatus: 'Started',
        newStatus: 'In Progress',
        quantity: 156,
        remarks: '156 bushings completed. Second machine configured to speed up balance 94 pcs.',
        submittedBy: 'Vikram Rathi',
        submittedDate: '2026-09-19 18:20',
        proofFiles: [],
        approvalStatus: 'In Progress',
      }
    ],
  },
];

// ── Initial Sharing History (Audit Log) ───────────────────────────
const initialSharingHistory = [
  {
    id: 'sh-1',
    orderNumber: 'ORD-1025',
    vendorId: 'vend-om-fab',
    vendorName: 'Om Fabrication Works',
    sharedBy: 'Adarsh Gupta',
    sharedDate: '2026-09-12 10:00 AM',
    unsharedBy: null,
    unsharedDate: null,
    status: 'Active',
    reason: 'Outsourced fabrication contract assigned.',
  },
  {
    id: 'sh-2',
    orderNumber: 'ORD-1028',
    vendorId: 'vend-om-fab',
    vendorName: 'Om Fabrication Works',
    sharedBy: 'Kavita Iyer',
    sharedDate: '2026-09-15 02:30 PM',
    unsharedBy: null,
    unsharedDate: null,
    status: 'Active',
    reason: 'Chassis manufacturing capacity allocation.',
  },
  {
    id: 'sh-3',
    orderNumber: 'ORD-1031',
    vendorId: 'vend-om-fab',
    vendorName: 'Om Fabrication Works',
    sharedBy: 'Adarsh Gupta',
    sharedDate: '2026-09-01 09:15 AM',
    unsharedBy: null,
    unsharedDate: null,
    status: 'Active',
    reason: 'Underbody fabrication.',
  },
  {
    id: 'sh-4',
    orderNumber: 'ORD-1035',
    vendorId: 'vend-om-fab',
    vendorName: 'Om Fabrication Works',
    sharedBy: 'Adarsh Gupta',
    sharedDate: '2026-09-21 09:30 AM',
    unsharedBy: null,
    unsharedDate: null,
    status: 'Active',
    reason: 'New hydraulic mounting bracket batch.',
  },
  {
    id: 'sh-5',
    orderNumber: 'ORD-1026',
    vendorId: 'vend-shakti',
    vendorName: 'Shakti Steel Traders',
    sharedBy: 'Kavita Iyer',
    sharedDate: '2026-09-10 11:00 AM',
    unsharedBy: null,
    unsharedDate: null,
    status: 'Active',
    reason: 'Heavy I-Beam structural order.',
  },
  {
    id: 'sh-6',
    orderNumber: 'ORD-1029',
    vendorId: 'vend-precision',
    vendorName: 'Precision Parts Company',
    sharedBy: 'Adarsh Gupta',
    sharedDate: '2026-09-14 03:00 PM',
    unsharedBy: null,
    unsharedDate: null,
    status: 'Active',
    reason: 'High precision brass bushing turning.',
  },
];

// ── Initial Notifications ─────────────────────────────────────────
const initialNotifications = [
  {
    id: 'notif-1',
    vendorId: 'vend-om-fab',
    title: 'Stage Approved: Fabrication',
    message: 'Your submission for Stage 1 (Fabrication) on Order ORD-1025 has been approved by Adarsh Gupta.',
    date: '2026-09-16 10:15 AM',
    read: false,
    orderId: 'ord-1025',
    orderNumber: 'ORD-1025',
    stageName: 'Fabrication',
    type: 'success',
  },
  {
    id: 'notif-2',
    vendorId: 'vend-om-fab',
    title: 'New Order Shared: ORD-1035',
    message: 'Order ORD-1035 (Hydraulic Mounting Brackets, 100 Pcs) has been shared with Om Fabrication Works.',
    date: '2026-09-21 09:30 AM',
    read: false,
    orderId: 'ord-1035',
    orderNumber: 'ORD-1035',
    stageName: null,
    type: 'info',
  },
  {
    id: 'notif-3',
    vendorId: 'vend-om-fab',
    title: 'Stage Overdue Alert: Painting',
    message: 'Order ORD-1031 is currently past due date (2026-09-18). Please update the Painting stage status.',
    date: '2026-09-19 09:00 AM',
    read: true,
    orderId: 'ord-1031',
    orderNumber: 'ORD-1031',
    stageName: 'Painting',
    type: 'warning',
  },
  {
    id: 'notif-4',
    vendorId: null, // Admin notification
    title: 'Stage Update Awaiting Approval: ORD-1025',
    message: 'Om Fabrication Works submitted Stage 2 (Welding) for Order ORD-1025. Verification required.',
    date: '2026-09-20 04:30 PM',
    read: false,
    orderId: 'ord-1025',
    orderNumber: 'ORD-1025',
    stageName: 'Welding',
    type: 'action_required',
  },
];

function loadSavedData() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed;
    }
  } catch (err) {
    console.warn('Could not load vendor store from localStorage', err);
  }
  return null;
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  // Default to Om Fabrication Works / Rajesh Sharma logged in for convenience
  return {
    vendorId: 'vend-om-fab',
    userId: 'vuser-1',
  };
}

const savedData = loadSavedData();
const savedSession = loadSession();

export const useVendorStore = create((set, get) => ({
  // ── Core Entities ───────────────────────────────────────────────
  vendors: savedData?.vendors || initialVendors,
  vendorUsers: savedData?.vendorUsers || initialVendorUsers,
  templates: savedData?.templates || initialTemplates,
  orders: (savedData?.orders || initialOrders).map((o) => ({
    ...o,
    overallProgress: computeOrderProgress(o.stages, o.quantity),
    riskStatus: computeOrderRiskStatus(o),
  })),
  sharingHistory: savedData?.sharingHistory || initialSharingHistory,
  notifications: savedData?.notifications || initialNotifications,

  // ── Authentication & Session State ──────────────────────────────
  currentVendorId: savedSession?.vendorId || 'vend-om-fab',
  currentUserId: savedSession?.userId || 'vuser-1',
  sessionError: null,

  // ── Helper to persist full state ────────────────────────────────
  _persist: () => {
    try {
      const { vendors, vendorUsers, templates, orders, sharingHistory, notifications } = get();
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ vendors, vendorUsers, templates, orders, sharingHistory, notifications })
      );
    } catch (e) {
      console.error('Error saving vendor state to localStorage:', e);
    }
  },

  _persistSession: () => {
    try {
      const { currentVendorId, currentUserId } = get();
      if (currentVendorId && currentUserId) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ vendorId: currentVendorId, userId: currentUserId }));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {}
  },

  // ── Session Getters ─────────────────────────────────────────────
  getCurrentVendor: () => {
    const { vendors, currentVendorId } = get();
    return vendors.find((v) => v.id === currentVendorId) || vendors[0];
  },

  getCurrentUser: () => {
    const { vendorUsers, currentUserId } = get();
    return vendorUsers.find((u) => u.id === currentUserId) || vendorUsers[0];
  },

  // ── Auth Actions ────────────────────────────────────────────────
  loginVendor: (emailOrId, password) => {
    const { vendorUsers, vendors } = get();
    const query = (emailOrId || '').trim().toLowerCase();

    // Check user match by email or vendor code match
    const foundUser = vendorUsers.find(
      (u) => u.email.toLowerCase() === query || u.id.toLowerCase() === query
    );

    if (!foundUser) {
      // Check if vendor code was entered
      const foundVendor = vendors.find(
        (v) => v.code.toLowerCase() === query || v.email.toLowerCase() === query
      );
      if (foundVendor) {
        const firstUser = vendorUsers.find((u) => u.vendorId === foundVendor.id);
        if (firstUser) {
          if (foundVendor.portalAccess === 'Disabled') {
            set({ sessionError: 'Vendor portal access is currently disabled for this account. Contact your administrator.' });
            return { success: false, error: 'Vendor portal access is currently disabled.' };
          }
          set({ currentVendorId: foundVendor.id, currentUserId: firstUser.id, sessionError: null });
          get()._persistSession();
          return { success: true, vendor: foundVendor, user: firstUser };
        }
      }
      set({ sessionError: 'Invalid credentials. Please verify your Email or Vendor ID.' });
      return { success: false, error: 'Invalid credentials.' };
    }

    const userVendor = vendors.find((v) => v.id === foundUser.vendorId);
    if (!userVendor) {
      set({ sessionError: 'Vendor profile not found.' });
      return { success: false, error: 'Vendor profile not found.' };
    }

    if (userVendor.portalAccess === 'Disabled') {
      set({ sessionError: 'Vendor portal access is currently disabled for your organization.' });
      return { success: false, error: 'Portal access disabled.' };
    }

    if (foundUser.status === 'Inactive') {
      set({ sessionError: 'Your individual user account is currently deactivated.' });
      return { success: false, error: 'User account inactive.' };
    }

    // Accept demo password or 'password123'
    if (password && password !== 'password123' && foundUser.password && password !== foundUser.password) {
      set({ sessionError: 'Incorrect password entered.' });
      return { success: false, error: 'Incorrect password.' };
    }

    // Update last login
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const updatedUsers = vendorUsers.map((u) => (u.id === foundUser.id ? { ...u, lastLogin: nowStr } : u));
    const updatedVendors = vendors.map((v) => (v.id === userVendor.id ? { ...v, lastLogin: nowStr } : v));

    set({
      currentVendorId: userVendor.id,
      currentUserId: foundUser.id,
      vendorUsers: updatedUsers,
      vendors: updatedVendors,
      sessionError: null,
    });

    get()._persist();
    get()._persistSession();
    return { success: true, vendor: userVendor, user: foundUser };
  },

  logoutVendor: () => {
    set({ currentVendorId: null, currentUserId: null, sessionError: null });
    get()._persistSession();
  },

  switchDemoVendor: (vendorId, userId) => {
    const { vendors, vendorUsers } = get();
    const vendor = vendors.find((v) => v.id === vendorId);
    const user = userId ? vendorUsers.find((u) => u.id === userId) : vendorUsers.find((u) => u.vendorId === vendorId);
    if (vendor && user) {
      set({ currentVendorId: vendor.id, currentUserId: user.id, sessionError: null });
      get()._persistSession();
    }
  },

  // ── Admin: Vendor Portal Access Control ─────────────────────────
  setVendorPortalAccess: (vendorId, newAccess) => {
    set((state) => {
      const updated = state.vendors.map((v) =>
        v.id === vendorId ? { ...v, portalAccess: newAccess } : v
      );
      return { vendors: updated };
    });
    get()._persist();
  },

  // ── Vendor User Management (CRUD) ──────────────────────────────
  addVendorUser: (vendorId, userData) => {
    const newUser = {
      id: `vuser-${Date.now().toString().slice(-4)}`,
      vendorId,
      name: userData.name || 'New Contact',
      email: userData.email,
      phone: userData.phone || '',
      designation: userData.designation || 'Coordinator',
      role: userData.role || 'Production Lead',
      status: 'Active',
      lastLogin: 'Never',
      password: userData.password || 'password123',
    };

    set((state) => {
      const updatedUsers = [...state.vendorUsers, newUser];
      const updatedVendors = state.vendors.map((v) =>
        v.id === vendorId ? { ...v, activeUsersCount: (v.activeUsersCount || 0) + 1 } : v
      );
      return { vendorUsers: updatedUsers, vendors: updatedVendors };
    });
    get()._persist();
    return newUser;
  },

  updateVendorUser: (userId, updates) => {
    set((state) => {
      const updated = state.vendorUsers.map((u) => (u.id === userId ? { ...u, ...updates } : u));
      return { vendorUsers: updated };
    });
    get()._persist();
  },

  toggleVendorUserStatus: (userId) => {
    set((state) => {
      const target = state.vendorUsers.find((u) => u.id === userId);
      if (!target) return state;
      const newStatus = target.status === 'Active' ? 'Inactive' : 'Active';
      const updatedUsers = state.vendorUsers.map((u) =>
        u.id === userId ? { ...u, status: newStatus } : u
      );
      return { vendorUsers: updatedUsers };
    });
    get()._persist();
  },

  resetVendorUserPassword: (userId, newPassword = 'password123') => {
    set((state) => {
      const updated = state.vendorUsers.map((u) =>
        u.id === userId ? { ...u, password: newPassword } : u
      );
      return { vendorUsers: updated };
    });
    get()._persist();
  },

  // ── Order Sharing & Lifecycle ──────────────────────────────────
  acceptOrder: (orderId) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    set((state) => {
      const updatedOrders = state.orders.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: 'Accepted',
          lastUpdate: nowStr,
        };
      });
      return { orders: updatedOrders };
    });
    get()._persist();
  },

  startStage: (orderId, stageId) => {
    const today = new Date().toISOString().split('T')[0];
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    set((state) => {
      const updatedOrders = state.orders.map((order) => {
        if (order.id !== orderId) return order;

        const updatedStages = order.stages.map((stg) => {
          if (stg.id !== stageId) return stg;
          return {
            ...stg,
            status: 'In Progress',
            actualStartDate: stg.actualStartDate || today,
            progress: stg.progress || 10,
          };
        });

        const newProgress = computeOrderProgress(updatedStages, order.quantity);
        return {
          ...order,
          status: 'In Progress',
          stages: updatedStages,
          overallProgress: newProgress,
          lastUpdate: nowStr,
        };
      });
      return { orders: updatedOrders };
    });
    get()._persist();
  },

  // ── Stage Submission by Vendor ─────────────────────────────────
  submitStageUpdate: (orderId, stageId, payload) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const currentUser = get().getCurrentUser();
    const currentVendor = get().getCurrentVendor();

    set((state) => {
      let targetOrder = null;
      let targetStage = null;

      const updatedOrders = state.orders.map((order) => {
        if (order.id !== orderId) return order;
        targetOrder = order;

        const updatedStages = order.stages.map((stg) => {
          if (stg.id !== stageId) return stg;
          targetStage = stg;

          const isCompletedSubmit = payload.status === 'Completed';
          return {
            ...stg,
            status: isCompletedSubmit ? 'Submitted' : payload.status || 'In Progress',
            approvalStatus: isCompletedSubmit ? 'Pending Approval' : 'In Progress',
            quantityCompleted: payload.quantityCompleted !== undefined ? Number(payload.quantityCompleted) : stg.quantityCompleted,
            progress: isCompletedSubmit ? 100 : (payload.progress || 50),
            remarks: payload.remarks || stg.remarks,
            proofFiles: payload.proofFiles && payload.proofFiles.length > 0 ? [...stg.proofFiles, ...payload.proofFiles] : stg.proofFiles,
            submittedBy: currentUser?.name || 'Vendor User',
            submittedDate: payload.updateDate || nowStr,
          };
        });

        const newProgress = computeOrderProgress(updatedStages, order.quantity);
        const newStatus = payload.status === 'Completed' ? 'Awaiting Approval' : 'In Progress';

        // Add to history
        const newHistoryItem = {
          id: `hist-${Date.now()}`,
          stage: targetStage?.name || 'Stage Update',
          previousStatus: targetStage?.status || 'In Progress',
          newStatus: payload.status === 'Completed' ? 'Submitted' : payload.status,
          quantity: payload.quantityCompleted,
          remarks: payload.remarks,
          submittedBy: currentUser?.name || 'Vendor User',
          submittedDate: nowStr,
          proofFiles: payload.proofFiles || [],
          approvalStatus: payload.status === 'Completed' ? 'Pending Approval' : 'In Progress',
        };

        return {
          ...order,
          status: newStatus,
          stages: updatedStages,
          overallProgress: newProgress,
          lastUpdate: nowStr,
          updateHistory: [newHistoryItem, ...(order.updateHistory || [])],
        };
      });

      // Emit Notification for Admin
      const newNotif = {
        id: `notif-${Date.now()}`,
        vendorId: null, // For Admin
        title: `Stage Submitted: ${targetStage?.name || 'Stage'} (${targetOrder?.orderNumber})`,
        message: `${currentVendor?.name || 'Vendor'} submitted stage update for ${targetOrder?.orderNumber}. Review and approval required.`,
        date: nowStr,
        read: false,
        orderId: orderId,
        orderNumber: targetOrder?.orderNumber,
        stageName: targetStage?.name,
        type: 'action_required',
      };

      return {
        orders: updatedOrders,
        notifications: [newNotif, ...state.notifications],
      };
    });

    get()._persist();
    return { success: true };
  },

  // ── In-House Stage Approval by Admin ───────────────────────────
  approveStageUpdate: (orderId, stageId, adminNotes = '') => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const today = new Date().toISOString().split('T')[0];

    set((state) => {
      let targetOrder = null;
      let targetStage = null;

      const updatedOrders = state.orders.map((order) => {
        if (order.id !== orderId) return order;
        targetOrder = order;

        let nextStageUnlocked = false;
        const updatedStages = order.stages.map((stg, index) => {
          if (stg.id === stageId) {
            targetStage = stg;
            return {
              ...stg,
              status: 'Approved',
              approvalStatus: 'Approved',
              actualCompletionDate: today,
              progress: 100,
            };
          }
          // Unlock the next stage if it was Not Started
          if (targetStage && !nextStageUnlocked && stg.sequence === (targetStage.sequence + 1)) {
            nextStageUnlocked = true;
            if (stg.status === 'Not Started') {
              return {
                ...stg,
                status: 'Started',
                actualStartDate: today,
                progress: 0,
              };
            }
          }
          return stg;
        });

        const newProgress = computeOrderProgress(updatedStages, order.quantity);
        const allStagesApproved = updatedStages.every((s) => s.status === 'Approved' || s.status === 'Completed');

        // Update history item
        const updatedHistory = (order.updateHistory || []).map((h, idx) => {
          if (idx === 0 && h.stage === targetStage?.name && h.approvalStatus === 'Pending Approval') {
            return {
              ...h,
              approvalStatus: 'Approved',
              reviewedBy: 'Operations Admin',
              reviewedDate: nowStr,
              approvalRemarks: adminNotes || 'Approved by in-house engineering team.',
            };
          }
          return h;
        });

        return {
          ...order,
          status: allStagesApproved ? 'Completed' : 'In Progress',
          stages: updatedStages,
          overallProgress: newProgress,
          riskStatus: allStagesApproved ? 'Completed' : order.riskStatus,
          lastUpdate: nowStr,
          updateHistory: updatedHistory,
        };
      });

      // Notification to vendor
      const vendorNotif = {
        id: `notif-${Date.now()}`,
        vendorId: targetOrder?.vendorId,
        title: `Stage Approved: ${targetStage?.name}`,
        message: `Your stage submission for ${targetOrder?.orderNumber} has been verified and approved by Admin. ${adminNotes ? `Note: "${adminNotes}"` : ''}`,
        date: nowStr,
        read: false,
        orderId: orderId,
        orderNumber: targetOrder?.orderNumber,
        stageName: targetStage?.name,
        type: 'success',
      };

      return {
        orders: updatedOrders,
        notifications: [vendorNotif, ...state.notifications],
      };
    });

    get()._persist();
    return { success: true };
  },

  // ── In-House Stage Rejection by Admin ───────────────────────────
  rejectStageUpdate: (orderId, stageId, rejectionReason) => {
    if (!rejectionReason || !rejectionReason.trim()) {
      return { success: false, error: 'Rejection reason is mandatory.' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    set((state) => {
      let targetOrder = null;
      let targetStage = null;

      const updatedOrders = state.orders.map((order) => {
        if (order.id !== orderId) return order;
        targetOrder = order;

        const updatedStages = order.stages.map((stg) => {
          if (stg.id !== stageId) return stg;
          targetStage = stg;
          return {
            ...stg,
            status: 'Rejected',
            approvalStatus: 'Rejected',
            rejectionReason: rejectionReason,
          };
        });

        const newProgress = computeOrderProgress(updatedStages, order.quantity);

        // Update latest history entry with rejection reason
        const updatedHistory = (order.updateHistory || []).map((h, idx) => {
          if (idx === 0 && h.stage === targetStage?.name && h.approvalStatus === 'Pending Approval') {
            return {
              ...h,
              approvalStatus: 'Rejected',
              reviewedBy: 'Operations Admin',
              reviewedDate: nowStr,
              rejectionReason: rejectionReason,
            };
          }
          return h;
        });

        return {
          ...order,
          status: 'In Progress',
          stages: updatedStages,
          overallProgress: newProgress,
          lastUpdate: nowStr,
          updateHistory: updatedHistory,
        };
      });

      // Notification for vendor
      const vendorNotif = {
        id: `notif-${Date.now()}`,
        vendorId: targetOrder?.vendorId,
        title: `Stage Update Rejected: ${targetStage?.name}`,
        message: `Your stage submission for ${targetOrder?.orderNumber} was rejected. Reason: "${rejectionReason}". Please review and resubmit.`,
        date: nowStr,
        read: false,
        orderId: orderId,
        orderNumber: targetOrder?.orderNumber,
        stageName: targetStage?.name,
        type: 'error',
      };

      return {
        orders: updatedOrders,
        notifications: [vendorNotif, ...state.notifications],
      };
    });

    get()._persist();
    return { success: true };
  },

  // ── Share Order with Vendor ─────────────────────────────────────
  shareOrderWithVendor: (shareData) => {
    const { vendors, templates } = get();
    const vendor = vendors.find((v) => v.id === shareData.vendorId);
    const template = templates.find((t) => t.id === shareData.templateId) || templates[0];
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const stages = (template?.stages || []).map((stg, idx) => ({
      id: `stg-${Date.now()}-${idx}`,
      name: stg.name,
      sequence: stg.sequence || (idx + 1),
      weight: stg.weight,
      expectedDays: stg.expectedDays,
      status: 'Not Started',
      progress: 0,
      quantityCompleted: 0,
      responsibleParty: stg.responsibleParty || 'Vendor',
      proofRequired: stg.proofRequired || false,
      approvalStatus: 'Pending',
      proofFiles: [],
      remarks: '',
    }));

    const newOrder = {
      id: `ord-${Date.now().toString().slice(-4)}`,
      orderNumber: shareData.orderNumber || `ORD-${Date.now().toString().slice(-4)}`,
      salesOrderId: shareData.salesOrderId || null,
      vendorId: shareData.vendorId,
      vendorName: vendor?.name || 'Assigned Vendor',
      customer: shareData.customer || 'Commercial Client',
      product: shareData.product || 'Manufactured Item',
      quantity: Number(shareData.quantity) || 50,
      uom: shareData.uom || 'Units',
      assignedDate: nowStr.split(' ')[0],
      expectedStartDate: shareData.expectedStartDate || nowStr.split(' ')[0],
      expectedEndDate: shareData.expectedEndDate || shareData.dueDate || nowStr.split(' ')[0],
      dueDate: shareData.expectedEndDate || shareData.dueDate || nowStr.split(' ')[0],
      lastUpdate: nowStr,
      priority: shareData.priority || 'Medium',
      status: 'New',
      riskStatus: 'On Track',
      templateId: template?.id,
      templateName: template?.name,
      isShared: true,
      visibilityStatus: 'Visible',
      assignedOwner: shareData.assignedOwner || 'Operations Admin',
      notes: shareData.notes || '',
      stages: stages,
      updateHistory: [],
    };

    newOrder.overallProgress = computeOrderProgress(newOrder.stages, newOrder.quantity);

    const newHistoryAudit = {
      id: `sh-${Date.now()}`,
      orderNumber: newOrder.orderNumber,
      vendorId: newOrder.vendorId,
      vendorName: newOrder.vendorName,
      sharedBy: 'Operations Admin',
      sharedDate: nowStr,
      unsharedBy: null,
      unsharedDate: null,
      status: 'Active',
      reason: shareData.notes || 'Order shared via Admin Order Module.',
    };

    const vendorNotif = {
      id: `notif-${Date.now()}`,
      vendorId: newOrder.vendorId,
      title: `New Order Assigned: ${newOrder.orderNumber}`,
      message: `Order ${newOrder.orderNumber} (${newOrder.product}, Qty: ${newOrder.quantity}) has been shared with your account.`,
      date: nowStr,
      read: false,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      stageName: null,
      type: 'info',
    };

    set((state) => ({
      orders: [newOrder, ...state.orders],
      sharingHistory: [newHistoryAudit, ...state.sharingHistory],
      notifications: [vendorNotif, ...state.notifications],
    }));

    get()._persist();
    return newOrder;
  },

  // ── Unshare Order ───────────────────────────────────────────────
  unshareOrder: (orderId, reason = 'Administrative cancellation') => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    set((state) => {
      let targetOrder = null;
      const updatedOrders = state.orders.map((o) => {
        if (o.id !== orderId) return o;
        targetOrder = o;
        return {
          ...o,
          isShared: false,
          visibilityStatus: 'Hidden',
          status: 'Cancelled',
        };
      });

      const updatedHistory = state.sharingHistory.map((sh) => {
        if (sh.orderNumber === targetOrder?.orderNumber && sh.status === 'Active') {
          return {
            ...sh,
            unsharedBy: 'Operations Admin',
            unsharedDate: nowStr,
            status: 'Unshared',
            reason: reason,
          };
        }
        return sh;
      });

      return {
        orders: updatedOrders,
        sharingHistory: updatedHistory,
      };
    });

    get()._persist();
    return { success: true };
  },

  // ── Process Template CRUD ───────────────────────────────────────
  saveProcessTemplate: (templateData) => {
    const totalWeight = (templateData.stages || []).reduce(
      (sum, s) => sum + (Number(s.weight) || 0),
      0
    );

    if (totalWeight !== 100) {
      return { success: false, error: `Total stage weight must equal exactly 100%. Current sum is ${totalWeight}%.` };
    }

    const today = new Date().toISOString().split('T')[0];

    set((state) => {
      let updatedTemplates;
      if (templateData.id) {
        // Edit
        updatedTemplates = state.templates.map((t) =>
          t.id === templateData.id
            ? { ...t, ...templateData, totalWeight: 100, updatedDate: today }
            : t
        );
      } else {
        // Create
        const newTemplate = {
          ...templateData,
          id: `tmpl-${Date.now().toString().slice(-4)}`,
          totalWeight: 100,
          isActive: templateData.isActive !== false,
          createdDate: today,
          updatedDate: today,
        };
        updatedTemplates = [...state.templates, newTemplate];
      }
      return { templates: updatedTemplates };
    });

    get()._persist();
    return { success: true };
  },

  duplicateProcessTemplate: (templateId) => {
    const { templates } = get();
    const source = templates.find((t) => t.id === templateId);
    if (!source) return;

    const today = new Date().toISOString().split('T')[0];
    const duplicated = {
      ...source,
      id: `tmpl-${Date.now().toString().slice(-4)}`,
      name: `${source.name} (Copy)`,
      createdDate: today,
      updatedDate: today,
      stages: source.stages.map((s, idx) => ({
        ...s,
        id: `stg-dup-${Date.now()}-${idx}`,
      })),
    };

    set((state) => ({ templates: [...state.templates, duplicated] }));
    get()._persist();
    return duplicated;
  },

  toggleTemplateActive: (templateId) => {
    set((state) => {
      const updated = state.templates.map((t) =>
        t.id === templateId ? { ...t, isActive: !t.isActive } : t
      );
      return { templates: updated };
    });
    get()._persist();
  },

  deleteProcessTemplate: (templateId) => {
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== templateId),
    }));
    get()._persist();
  },

  // ── Notifications ───────────────────────────────────────────────
  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
    get()._persist();
  },

  markAllNotificationsRead: (vendorId = null) => {
    set((state) => ({
      notifications: state.notifications.map((n) => {
        if (vendorId === null || n.vendorId === vendorId) {
          return { ...n, read: true };
        }
        return n;
      }),
    }));
    get()._persist();
  },

  // ── Vendor Profile Edit ─────────────────────────────────────────
  updateVendorProfile: (vendorId, profileData) => {
    set((state) => {
      const updated = state.vendors.map((v) =>
        v.id === vendorId ? { ...v, ...profileData } : v
      );
      return { vendors: updated };
    });
    get()._persist();
  },
}));
