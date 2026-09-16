import CrmKpiCard from '../common/CrmKpiCard';
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  RotateCcw,
  Handshake,
  Trophy,
  Clock,
  TrendingUp,
  LayoutGrid,
  List as ListIcon,
  MoreVertical,
  X,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  Send,
  FileText,
  Edit2,
  Trash2,
  Phone,
  Tag,
  Globe,
  Package,
  Flag,
  UserRound,
  ChevronDown,
  Inbox,
  AlertTriangle,
  MoveRight,
  SlidersHorizontal,
  Printer,
  Info,
} from 'lucide-react';

const STORAGE_KEY = 'evenmore_crm_deals_v2';

const STAGES = ['Draft', 'Sent', 'Open', 'Won', 'Lost'];
const PRODUCTS = ['All Products', 'Diamond Jewelry', 'Gold Ornaments', 'Silver Collection', 'Laser Machine', 'CNC Spindle', 'AMC Service'];
const SOURCES = ['All Sources', 'Website', 'Referral', 'Walk-in', 'Trade Show', 'Cold Call', 'Social Media'];
const USERS = ['All Users', 'Priya Patel', 'Jayesh Patel', 'Kavita Desai', 'Hetal Patel', 'Rohit Sharma', 'Amit Kumar', 'Utsav Faldu', 'Dr. Meera', 'Ankush Jain', 'Nikhil Patil', 'Mr. Kamlesh Dhumadiya'];

const STAGE_STYLES = {
  Draft: {
    title: 'Draft',
    icon: FileText,
    iconColor: 'bg-blue-100 text-blue-600',
    colBg: 'bg-[#f4f7fb]/70 border-blue-100/60',
    headerBadge: 'bg-blue-50 text-blue-700 border-blue-200',
    accentColor: 'text-blue-600',
  },
  Sent: {
    title: 'Sent',
    icon: Send,
    iconColor: 'bg-purple-100 text-purple-600',
    colBg: 'bg-[#f8f5fc]/70 border-purple-100/60',
    headerBadge: 'bg-purple-50 text-purple-700 border-purple-200',
    accentColor: 'text-purple-600',
  },
  Open: {
    title: 'Open',
    icon: Clock,
    iconColor: 'bg-amber-100 text-amber-600',
    colBg: 'bg-[#fcf7ee]/70 border-amber-100/60',
    headerBadge: 'bg-amber-50 text-amber-700 border-amber-200',
    accentColor: 'text-amber-600',
  },
  Won: {
    title: 'Won',
    icon: CheckCircle2,
    iconColor: 'bg-emerald-100 text-emerald-600',
    colBg: 'bg-[#f2faf5]/70 border-emerald-100/60',
    headerBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    accentColor: 'text-emerald-600',
  },
  Lost: {
    title: 'Lost',
    icon: XCircle,
    iconColor: 'bg-rose-100 text-rose-600',
    colBg: 'bg-[#fdf4f4]/70 border-rose-100/60',
    headerBadge: 'bg-rose-50 text-rose-700 border-rose-200',
    accentColor: 'text-rose-600',
  },
};

const INITIAL_DEALS = [
  {
    id: 'dl-101',
    name: 'Diamond Ring Inquiry',
    price: 500000,
    client: 'Priya Patel',
    initials: 'PP',
    avatarColor: 'bg-blue-100 text-blue-700',
    stage: 'Draft',
    date: '15 Sep 2025',
    phone: '+91 98765 43210',
    product: 'Diamond Jewelry',
    source: 'Website',
    assignedUser: 'Priya Patel',
  },
  {
    id: 'dl-102',
    name: 'Custom Pendant',
    price: 320000,
    client: 'Rohit Sharma',
    initials: 'RS',
    avatarColor: 'bg-purple-100 text-purple-700',
    stage: 'Draft',
    date: '16 Sep 2025',
    phone: '+91 98765 43211',
    product: 'Gold Ornaments',
    source: 'Referral',
    assignedUser: 'Rohit Sharma',
  },
  {
    id: 'dl-103',
    name: 'Bracelet Collection',
    price: 875000,
    client: 'Neha Shah',
    initials: 'NS',
    avatarColor: 'bg-indigo-100 text-indigo-700',
    stage: 'Draft',
    date: '17 Sep 2025',
    phone: '+91 98765 43212',
    product: 'Silver Collection',
    source: 'Walk-in',
    assignedUser: 'Jayesh Patel',
  },
  {
    id: 'dl-104',
    name: 'Laser Cutting Spare Rig',
    price: 650000,
    client: 'Amit Bhai',
    initials: 'AB',
    avatarColor: 'bg-amber-100 text-amber-700',
    stage: 'Draft',
    date: '18 Sep 2025',
    phone: '+91 98765 43213',
    product: 'Laser Machine',
    source: 'Website',
    assignedUser: 'Priya Patel',
  },
  {
    id: 'dl-105',
    name: 'Fiber Optics Lens Set',
    price: 450000,
    client: 'Kavita Desai',
    initials: 'KD',
    avatarColor: 'bg-emerald-100 text-emerald-700',
    stage: 'Draft',
    date: '19 Sep 2025',
    phone: '+91 98765 43214',
    product: 'CNC Spindle',
    source: 'Referral',
    assignedUser: 'Kavita Desai',
  },
  {
    id: 'dl-106',
    name: 'CNC Router Maintenance',
    price: 455000,
    client: 'Utsav Faldu',
    initials: 'UF',
    avatarColor: 'bg-rose-100 text-rose-700',
    stage: 'Draft',
    date: '20 Sep 2025',
    phone: '+91 98765 43215',
    product: 'AMC Service',
    source: 'Trade Show',
    assignedUser: 'Utsav Faldu',
  },

  {
    id: 'dl-201',
    name: 'Engagement Ring',
    price: 750000,
    client: 'Jayesh Patel',
    initials: 'JP',
    avatarColor: 'bg-purple-100 text-purple-700',
    stage: 'Sent',
    date: '14 Sep 2025',
    phone: '+91 98765 43216',
    product: 'Diamond Jewelry',
    source: 'Website',
    assignedUser: 'Jayesh Patel',
  },
  {
    id: 'dl-202',
    name: 'Earrings Set',
    price: 425000,
    client: 'Amit Kumar',
    initials: 'AK',
    avatarColor: 'bg-rose-100 text-rose-700',
    stage: 'Sent',
    date: '15 Sep 2025',
    phone: '+91 98765 43217',
    product: 'Gold Ornaments',
    source: 'Walk-in',
    assignedUser: 'Amit Kumar',
  },
  {
    id: 'dl-203',
    name: 'Gold Chain',
    price: 630000,
    client: 'Sneha Mehta',
    initials: 'SM',
    avatarColor: 'bg-purple-100 text-purple-700',
    stage: 'Sent',
    date: '15 Sep 2025',
    phone: '+91 98765 43218',
    product: 'Gold Ornaments',
    source: 'Referral',
    assignedUser: 'Jayesh Patel',
  },
  {
    id: 'dl-204',
    name: 'Platinum Band Order',
    price: 890000,
    client: 'Dr. Deepan',
    initials: 'DD',
    avatarColor: 'bg-sky-100 text-sky-700',
    stage: 'Sent',
    date: '16 Sep 2025',
    phone: '+91 98765 43219',
    product: 'Diamond Jewelry',
    source: 'Cold Call',
    assignedUser: 'Priya Patel',
  },
  {
    id: 'dl-205',
    name: 'Jewelry Marker 50W',
    price: 600000,
    client: 'Vruti Lakhani',
    initials: 'VL',
    avatarColor: 'bg-amber-100 text-amber-700',
    stage: 'Sent',
    date: '17 Sep 2025',
    phone: '+91 98765 43220',
    product: 'Laser Machine',
    source: 'Website',
    assignedUser: 'Hetal Patel',
  },
  {
    id: 'dl-206',
    name: 'Industrial Laser Bed',
    price: 525000,
    client: 'Pooja Verma',
    initials: 'PV',
    avatarColor: 'bg-emerald-100 text-emerald-700',
    stage: 'Sent',
    date: '18 Sep 2025',
    phone: '+91 98765 43221',
    product: 'Laser Machine',
    source: 'Social Media',
    assignedUser: 'Rohit Sharma',
  },
  {
    id: 'dl-207',
    name: 'Optical Sensor Upgrade',
    price: 480000,
    client: 'Ankur Jain',
    initials: 'AJ',
    avatarColor: 'bg-blue-100 text-blue-700',
    stage: 'Sent',
    date: '19 Sep 2025',
    phone: '+91 98765 43222',
    product: 'CNC Spindle',
    source: 'Referral',
    assignedUser: 'Ankush Jain',
  },
  {
    id: 'dl-208',
    name: 'Rotary Tooling Pack',
    price: 520000,
    client: 'Nikhil Patil',
    initials: 'NP',
    avatarColor: 'bg-rose-100 text-rose-700',
    stage: 'Sent',
    date: '20 Sep 2025',
    phone: '+91 98765 43223',
    product: 'AMC Service',
    source: 'Trade Show',
    assignedUser: 'Nikhil Patil',
  },

  {
    id: 'dl-301',
    name: 'Wedding Set',
    price: 1250000,
    client: 'Kavita Desai',
    initials: 'KD',
    avatarColor: 'bg-amber-100 text-amber-700',
    stage: 'Open',
    date: '14 Sep 2025',
    phone: '+91 98765 43224',
    product: 'Diamond Jewelry',
    source: 'Walk-in',
    assignedUser: 'Kavita Desai',
  },
  {
    id: 'dl-302',
    name: 'Solitaire Ring',
    price: 890000,
    client: 'Utsav Faldu',
    initials: 'UF',
    avatarColor: 'bg-blue-100 text-blue-700',
    tag: 'Hot',
    stage: 'Open',
    date: '13 Sep 2025',
    phone: '+91 98765 43225',
    product: 'Diamond Jewelry',
    source: 'Referral',
    assignedUser: 'Utsav Faldu',
  },
  {
    id: 'dl-303',
    name: 'Diamond Necklace',
    price: 1875000,
    client: 'Chetan Chaudhari',
    initials: 'CC',
    avatarColor: 'bg-indigo-100 text-indigo-700',
    stage: 'Open',
    date: '12 Sep 2025',
    phone: '+91 98765 43226',
    product: 'Diamond Jewelry',
    source: 'Website',
    assignedUser: 'Jayesh Patel',
  },
  {
    id: 'dl-304',
    name: 'Custom Laser Unit',
    price: 1000000,
    client: 'Alpha Corp',
    initials: 'AC',
    avatarColor: 'bg-emerald-100 text-emerald-700',
    stage: 'Open',
    date: '14 Sep 2025',
    phone: '+91 98765 43227',
    product: 'Laser Machine',
    source: 'Cold Call',
    assignedUser: 'Priya Patel',
  },
  {
    id: 'dl-305',
    name: 'CNC Spindle Rig',
    price: 515000,
    client: 'Rohit Traders',
    initials: 'RT',
    avatarColor: 'bg-amber-100 text-amber-700',
    stage: 'Open',
    date: '15 Sep 2025',
    phone: '+91 98765 43228',
    product: 'CNC Spindle',
    source: 'Referral',
    assignedUser: 'Rohit Sharma',
  },
  {
    id: 'dl-306',
    name: 'Gold Bangle Set',
    price: 750000,
    client: 'Sunita Jain',
    initials: 'SJ',
    avatarColor: 'bg-purple-100 text-purple-700',
    stage: 'Open',
    date: '16 Sep 2025',
    phone: '+91 98765 43229',
    product: 'Gold Ornaments',
    source: 'Walk-in',
    assignedUser: 'Kavita Desai',
  },

  {
    id: 'dl-401',
    name: 'Anniversary Ring',
    price: 980000,
    client: 'Hetal Patel',
    initials: 'HP',
    avatarColor: 'bg-rose-100 text-rose-700',
    tag: 'Won',
    stage: 'Won',
    date: '10 Sep 2025',
    phone: '+91 98765 43230',
    product: 'Diamond Jewelry',
    source: 'Website',
    assignedUser: 'Hetal Patel',
  },
  {
    id: 'dl-402',
    name: 'Office Bulk Order',
    price: 2500000,
    client: 'Dr. Meera',
    initials: 'DM',
    avatarColor: 'bg-amber-100 text-amber-700',
    tag: 'Won',
    stage: 'Won',
    date: '09 Sep 2025',
    phone: '+91 98765 43231',
    product: 'Silver Collection',
    source: 'Referral',
    assignedUser: 'Dr. Meera',
  },
  {
    id: 'dl-403',
    name: 'Festival Collection',
    price: 645000,
    client: 'Rohit M Shreshth',
    initials: 'RM',
    avatarColor: 'bg-emerald-100 text-emerald-700',
    tag: 'Won',
    stage: 'Won',
    date: '08 Sep 2025',
    phone: '+91 98765 43232',
    product: 'Gold Ornaments',
    source: 'Social Media',
    assignedUser: 'Rohit Sharma',
  },
  {
    id: 'dl-404',
    name: 'Corporate Gifting Silver',
    price: 1550000,
    client: 'Tata Auto Ltd',
    initials: 'TA',
    avatarColor: 'bg-blue-100 text-blue-700',
    tag: 'Won',
    stage: 'Won',
    date: '07 Sep 2025',
    phone: '+91 98765 43233',
    product: 'Silver Collection',
    source: 'Trade Show',
    assignedUser: 'Jayesh Patel',
  },
  {
    id: 'dl-405',
    name: 'Laser Precision Head',
    price: 1825000,
    client: 'Apex Tools',
    initials: 'AT',
    avatarColor: 'bg-indigo-100 text-indigo-700',
    tag: 'Won',
    stage: 'Won',
    date: '06 Sep 2025',
    phone: '+91 98765 43234',
    product: 'Laser Machine',
    source: 'Website',
    assignedUser: 'Priya Patel',
  },
  {
    id: 'dl-406',
    name: 'Diamond Brooch Custom',
    price: 1200000,
    client: 'Sanjay Rawat',
    initials: 'SR',
    avatarColor: 'bg-purple-100 text-purple-700',
    tag: 'Won',
    stage: 'Won',
    date: '05 Sep 2025',
    phone: '+91 98765 43235',
    product: 'Diamond Jewelry',
    source: 'Walk-in',
    assignedUser: 'Kavita Desai',
  },

  {
    id: 'dl-501',
    name: 'Silver Collection',
    price: 450000,
    client: 'Prashant Dudhagara',
    initials: 'PD',
    avatarColor: 'bg-rose-100 text-rose-700',
    tag: 'Lost',
    stage: 'Lost',
    date: '10 Sep 2025',
    phone: '+91 98765 43236',
    product: 'Silver Collection',
    source: 'Website',
    assignedUser: 'Prashant Dudhagara',
  },
  {
    id: 'dl-502',
    name: "Men's Bracelet",
    price: 320000,
    client: 'Ankush Jain',
    initials: 'AJ',
    avatarColor: 'bg-indigo-100 text-indigo-700',
    tag: 'Lost',
    stage: 'Lost',
    date: '08 Sep 2025',
    phone: '+91 98765 43237',
    product: 'Gold Ornaments',
    source: 'Referral',
    assignedUser: 'Ankush Jain',
  },
  {
    id: 'dl-503',
    name: 'Client - Retail Order',
    price: 1070000,
    client: 'Nikhil Patil',
    initials: 'NP',
    avatarColor: 'bg-rose-100 text-rose-700',
    tag: 'Lost',
    stage: 'Lost',
    date: '07 Sep 2025',
    phone: '+91 98765 43238',
    product: 'Diamond Jewelry',
    source: 'Cold Call',
    assignedUser: 'Nikhil Patil',
  },
];

function formatPriceINR(value) {
  const n = Number(value) || 0;
  return `₹ ${n.toLocaleString('en-IN')}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatStageSummary(totalAmount, count) {
  const n = Number(totalAmount) || 0;
  let formatted = '';
  if (n >= 10000000) {
    formatted = `₹ ${(n / 10000000).toFixed(2)} Cr`;
  } else if (n >= 100000) {
    formatted = `₹ ${(n / 100000).toFixed(1)} Lakh`;
  } else {
    formatted = `₹ ${n.toLocaleString('en-IN')}`;
  }
  return `${count} deals • ${formatted}`;
}

function getInitialsFromName(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColorFromName(name = '') {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-emerald-100 text-emerald-700',
    'bg-indigo-100 text-indigo-700',
    'bg-sky-100 text-sky-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash += name.charCodeAt(i);
  }
  return colors[hash % colors.length];
}

const EMPTY_DEAL_FORM = {
  name: '',
  price: '',
  client: '',
  phone: '',
  product: 'Diamond Jewelry',
  stage: 'Draft',
  source: 'Website',
  assignedUser: 'Priya Patel',
  date: '15 Sep 2025',
  tag: '',
};

export default function DealsPage() {
  const [deals, setDeals] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_DEALS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
    } catch {}
  }, [deals]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('All Products');
  const [selectedStage, setSelectedStage] = useState('All Stages');
  const [selectedSource, setSelectedSource] = useState('All Sources');
  const [selectedUser, setSelectedUser] = useState('All Users');
  const [dateRange, setDateRange] = useState('01 Sep 2025 - 30 Sep 2025');
  const [viewMode, setViewMode] = useState('kanban');

  const [expandedColumns, setExpandedColumns] = useState({});
  const [openMenuDealId, setOpenMenuDealId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [dealToDelete, setDealToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [formState, setFormState] = useState(EMPTY_DEAL_FORM);
  const [formError, setFormError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showLearnMoreBanner, setShowLearnMoreBanner] = useState(true);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.deal-action-menu-container')) {
        setOpenMenuDealId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredDeals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return deals.filter((d) => {
      if (selectedProduct !== 'All Products' && d.product !== selectedProduct) return false;
      if (selectedStage !== 'All Stages' && d.stage !== selectedStage) return false;
      if (selectedSource !== 'All Sources' && d.source !== selectedSource) return false;
      if (selectedUser !== 'All Users' && d.assignedUser !== selectedUser) return false;
      if (q && !`${d.name} ${d.client} ${d.phone} ${d.product}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [deals, searchQuery, selectedProduct, selectedStage, selectedSource, selectedUser]);

  const stats = useMemo(() => {
    const totalDeals = 48;
    const totalValue = '₹ 1.72 Cr';
    const wonDeals = 18;
    const avgDealSize = '₹ 9.6 Lakh';
    const conversionRate = '37%';

    return {
      totalDeals,
      totalValue,
      wonDeals,
      avgDealSize,
      conversionRate,
    };
  }, [deals]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedProduct('All Products');
    setSelectedStage('All Stages');
    setSelectedSource('All Sources');
    setSelectedUser('All Users');
    setDateRange('01 Sep 2025 - 30 Sep 2025');
    showNotification('Filters reset.');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedProduct !== 'All Products') count += 1;
    if (selectedStage !== 'All Stages') count += 1;
    if (selectedSource !== 'All Sources') count += 1;
    if (selectedUser !== 'All Users') count += 1;
    if (dateRange !== '01 Sep 2025 - 30 Sep 2025') count += 1;
    return count;
  }, [dateRange, selectedProduct, selectedSource, selectedStage, selectedUser]);

  const handleOpenCreateModal = (stageName = 'Draft') => {
    setEditingDeal(null);
    setFormState({
      ...EMPTY_DEAL_FORM,
      stage: stageName,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    });
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const handlePrintDeals = () => {
    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) {
      showNotification('Please allow popups to print deals.');
      return;
    }

    const rows = filteredDeals.map((deal, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(deal.name)}</td>
        <td>${escapeHtml(deal.client)}</td>
        <td>${escapeHtml(deal.phone)}</td>
        <td>${escapeHtml(deal.stage)}</td>
        <td>${escapeHtml(deal.product)}</td>
        <td>${escapeHtml(deal.source)}</td>
        <td>${escapeHtml(deal.assignedUser)}</td>
        <td>${escapeHtml(deal.date)}</td>
        <td>${escapeHtml(formatPriceINR(deal.price))}</td>
      </tr>
    `).join('');

    const today = new Date().toLocaleDateString('en-GB');
    const activeFilters = [
      selectedProduct !== 'All Products' ? `Product: ${selectedProduct}` : '',
      selectedStage !== 'All Stages' ? `Stage: ${selectedStage}` : '',
      selectedSource !== 'All Sources' ? `Source: ${selectedSource}` : '',
      selectedUser !== 'All Users' ? `Assigned User: ${selectedUser}` : '',
      dateRange !== '01 Sep 2025 - 30 Sep 2025' ? `Date Range: ${dateRange}` : '',
      searchQuery.trim() ? `Search: ${searchQuery.trim()}` : '',
    ].filter(Boolean);
    const summaryValue = filteredDeals.reduce((sum, deal) => sum + (Number(deal.price) || 0), 0);

    const reportHtml = `
      <!doctype html>
      <html>
        <head>
          <title>Deals Report</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; margin: 0; padding: 32px; }
            h1 { margin: 0 0 6px; font-size: 28px; }
            .sub { margin: 0; color: #64748b; font-size: 13px; }
            .meta { margin-top: 18px; display: flex; gap: 12px; flex-wrap: wrap; }
            .pill { background: #eff6ff; color: #1d4ed8; border-radius: 999px; padding: 6px 10px; font-size: 12px; font-weight: 700; }
            .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 20px 0; }
            .card { border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; }
            .card small { color: #64748b; display: block; margin-bottom: 6px; font-size: 12px; font-weight: 700; }
            .card strong { font-size: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 12px; }
            th { background: #f8fafc; color: #475569; text-transform: uppercase; letter-spacing: .04em; }
            .filters { margin-top: 12px; color: #475569; font-size: 12px; }
            .empty { margin-top: 24px; padding: 18px; border: 1px dashed #cbd5e1; border-radius: 14px; color: #64748b; font-size: 13px; }
            @media print { body { padding: 18px; } }
          </style>
        </head>
        <body>
          <h1>Deals Report</h1>
          <p class="sub">Printed on ${escapeHtml(today)}</p>
          <div class="meta">
            <span class="pill">${escapeHtml(`${filteredDeals.length} deals`)}</span>
            <span class="pill">${escapeHtml(dateRange)}</span>
          </div>
          ${activeFilters.length > 0 ? `<p class="filters"><strong>Active Filters:</strong> ${escapeHtml(activeFilters.join(' | '))}</p>` : ''}
          <div class="grid">
            <div class="card"><small>Total Deals</small><strong>${escapeHtml(String(filteredDeals.length))}</strong></div>
            <div class="card"><small>Total Value</small><strong>${escapeHtml(formatPriceINR(summaryValue))}</strong></div>
            <div class="card"><small>View</small><strong>${escapeHtml(viewMode === 'kanban' ? 'Kanban' : 'List')}</strong></div>
          </div>
          ${filteredDeals.length === 0 ? `
            <div class="empty">No deals match the current filters.</div>
          ` : `
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Deal Name</th>
                  <th>Client</th>
                  <th>Phone</th>
                  <th>Stage</th>
                  <th>Product</th>
                  <th>Source</th>
                  <th>Assigned User</th>
                  <th>Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          `}
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
    }, 300);
    showNotification('Print report opened.');
  };

  const handleOpenEditModal = (deal) => {
    setEditingDeal(deal);
    setFormState({
      name: deal.name,
      price: deal.price,
      client: deal.client,
      phone: deal.phone,
      product: deal.product || 'Diamond Jewelry',
      stage: deal.stage || 'Draft',
      source: deal.source || 'Website',
      assignedUser: deal.assignedUser || 'Priya Patel',
      date: deal.date || '15 Sep 2025',
      tag: deal.tag || '',
    });
    setFormError('');
    setOpenMenuDealId(null);
    setIsCreateModalOpen(true);
  };

  const handleSaveDeal = (e) => {
    e.preventDefault();
    if (!formState.name.trim()) {
      setFormError('Deal name is required.');
      return;
    }
    if (!formState.client.trim()) {
      setFormError('Client name is required.');
      return;
    }
    if (!formState.phone.trim()) {
      setFormError('Phone number is required.');
      return;
    }

    const priceNum = Number(formState.price) || 0;
    const initials = getInitialsFromName(formState.client);
    const avatarColor = getAvatarColorFromName(formState.client);

    if (editingDeal) {
      setDeals((prev) =>
        prev.map((d) =>
          d.id === editingDeal.id
            ? {
                ...d,
                name: formState.name.trim(),
                price: priceNum,
                client: formState.client.trim(),
                initials,
                avatarColor: d.avatarColor || avatarColor,
                phone: formState.phone.trim(),
                product: formState.product,
                stage: formState.stage,
                source: formState.source,
                assignedUser: formState.assignedUser,
                date: formState.date || d.date,
                tag: formState.tag || d.tag,
              }
            : d
        )
      );
      showNotification(`Deal "${formState.name.trim()}" updated successfully!`);
    } else {
      const newDeal = {
        id: `dl-${Date.now()}`,
        name: formState.name.trim(),
        price: priceNum,
        client: formState.client.trim(),
        initials,
        avatarColor,
        phone: formState.phone.trim(),
        product: formState.product,
        stage: formState.stage,
        source: formState.source,
        assignedUser: formState.assignedUser,
        date: formState.date || '15 Sep 2025',
        tag: formState.stage === 'Won' ? 'Won' : formState.stage === 'Lost' ? 'Lost' : formState.tag || '',
      };
      setDeals((prev) => [newDeal, ...prev]);
      showNotification(`New deal "${newDeal.name}" added!`);
    }

    setIsCreateModalOpen(false);
    setEditingDeal(null);
  };

  const handleDeleteDeal = () => {
    if (!dealToDelete) return;
    setDeals((prev) => prev.filter((d) => d.id !== dealToDelete.id));
    showNotification(`Deal "${dealToDelete.name}" deleted.`);
    setDealToDelete(null);
  };

  const handleMoveStage = (dealId, targetStage) => {
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? {
              ...d,
              stage: targetStage,
              tag: targetStage === 'Won' ? 'Won' : targetStage === 'Lost' ? 'Lost' : d.tag === 'Won' || d.tag === 'Lost' ? '' : d.tag,
            }
          : d
      )
    );
    setOpenMenuDealId(null);
    showNotification(`Deal moved to ${targetStage}`);
  };

  const toggleExpandColumn = (st) => {
    setExpandedColumns((prev) => ({
      ...prev,
      [st]: !prev[st],
    }));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-4 md:p-7 space-y-6">
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#0f172a] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/dashboard" className="hover:text-blue-600 transition-colors font-medium">
              Dashboard
            </Link>
            <span>&gt;</span>
            <span className="text-slate-700 font-medium">Deals</span>
            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-slate-200/70 text-slate-600 text-[11px] font-semibold">
              {filteredDeals.length} of {deals.length} deals
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Manage Deals</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Track pipeline stages, deal values, conversion rates, and client opportunities.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrintDeals}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Printer size={16} />
            <span>Print</span>
          </button>

          <button
            onClick={() => handleOpenCreateModal()}
            className="inline-flex items-center gap-2 bg-[#1d4a79] hover:bg-[#163a61] text-white font-semibold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Deal</span>
          </button>
        </div>
      </div>

      {showLearnMoreBanner && (
        <div className="rounded-2xl border border-blue-100 bg-[#eef5ff] px-4 py-3 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-white text-[#2f6fed]">
                <Info size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-[#1d3f6e]">Understand the Difference</p>
                <p className="mt-1 text-[12px] text-slate-600">
                  Lead Stages are used to track and nurture potential leads. Deal Stages are used to track confirmed deals in the sales pipeline.
                </p>
                <button
                  type="button"
                  className="mt-3 text-[14px] font-medium text-[#2457ff] transition hover:text-[#1d4ed8]"
                >
                  Learn More -&gt;
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowLearnMoreBanner(false)}
              className="shrink-0 p-1 text-slate-400 hover:text-slate-600"
              aria-label="Close information banner"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <CrmKpiCard label="Total Deals" value={stats.totalDeals} icon={Handshake} tone="blue">
            <div className="text-[11px] font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
              <span>↑ 12%</span>
              <span className="text-slate-400 font-normal">vs last month</span>
          </div>
        </CrmKpiCard>

        <CrmKpiCard label="Total Value" value={stats.totalValue} symbol="₹" tone="emerald">
            <div className="text-[11px] font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
              <span>↑ 18%</span>
              <span className="text-slate-400 font-normal">vs last month</span>
          </div>
        </CrmKpiCard>

        <CrmKpiCard label="Won Deals" value={stats.wonDeals} icon={Trophy} tone="amber">
            <div className="text-[11px] font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
              <span>↑ 25%</span>
              <span className="text-slate-400 font-normal">vs last month</span>
          </div>
        </CrmKpiCard>

        <CrmKpiCard label="Average Deal Size" value={stats.avgDealSize} icon={Clock} tone="purple">
            <div className="text-[11px] font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
              <span>↑ 14%</span>
              <span className="text-slate-400 font-normal">vs last month</span>
          </div>
        </CrmKpiCard>

        <CrmKpiCard label="Conversion Rate" value={stats.conversionRate} icon={TrendingUp} tone="rose">
            <div className="text-[11px] font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
              <span>↑ 6%</span>
              <span className="text-slate-400 font-normal">vs last month</span>
          </div>
        </CrmKpiCard>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3.5 text-xs font-semibold transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'border-blue-200 bg-blue-50 text-[#1f6bff]'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#1f6bff]">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <div className="text-[11px] font-medium text-slate-500">
                {activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset Filters"
              className="w-9 h-9 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw size={15} />
            </button>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-white text-[#1f6bff] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid size={14} />
                <span>Kanban</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-[#1f6bff] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListIcon size={14} />
                <span>List</span>
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Product</label>
              <div className="relative">
                <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PRODUCTS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Stage</label>
              <div className="relative">
                <Flag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All Stages">All Stages</option>
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Source</label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Assigned User</label>
              <div className="relative">
                <UserRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {USERS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date Range</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="01 Sep 2025 - 30 Sep 2025">01 Sep 2025 - 30 Sep 2025</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="This Quarter">This Quarter</option>
                  <option value="This Year">This Year</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by deal name, client, phone, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4 pt-1">
          {STAGES.map((st) => {
            const items = filteredDeals.filter((d) => d.stage === st);
            const stageStyle = STAGE_STYLES[st] || STAGE_STYLES.Draft;
            const StageIcon = stageStyle.icon;
            const totalStageAmount = items.reduce((sum, d) => sum + (Number(d.price) || 0), 0);
            const isDragOver = dragOverStage === st;
            const isExpanded = Boolean(expandedColumns[st]);
            const visibleItems = isExpanded ? items : items.slice(0, 3);
            const remainingCount = items.length - 3;

            return (
              <div
                key={st}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStage(st);
                }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverStage(null);
                  const droppedId = e.dataTransfer.getData('text/plain');
                  if (droppedId) {
                    handleMoveStage(droppedId, st);
                  }
                }}
                className={`rounded-2xl border p-3 flex flex-col space-y-3 transition-all duration-200 ${
                  stageStyle.colBg
                } ${isDragOver ? 'ring-2 ring-blue-500/40 border-blue-400 bg-blue-50/40' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${stageStyle.iconColor}`}>
                    <StageIcon size={16} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">{stageStyle.title}</h3>
                    <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                      {formatStageSummary(totalStageAmount, items.length)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenCreateModal(st)}
                  className="w-full py-1.5 bg-white hover:bg-slate-50 border border-dashed border-slate-300 hover:border-blue-400 rounded-xl text-xs font-semibold text-[#1f6bff] flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Plus size={14} />
                  <span>Add Deal</span>
                </button>

                <div className="space-y-3 min-h-[120px]">
                  {items.length === 0 ? (
                    <div className="bg-white/80 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                      <Inbox size={22} className="text-slate-300 mx-auto mb-1" />
                      <p className="text-xs font-medium text-slate-400">No deals in {st}</p>
                    </div>
                  ) : (
                    visibleItems.map((deal) => {
                      const isMenuOpen = openMenuDealId === deal.id;
                      return (
                        <div
                          key={deal.id}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', deal.id);
                          }}
                          className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing relative group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-bold text-slate-900 leading-snug truncate flex-1" title={deal.name}>
                              {deal.name}
                            </h4>

                            <div className="relative deal-action-menu-container flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuDealId((prev) => (prev === deal.id ? null : deal.id));
                                }}
                                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                                  isMenuOpen
                                    ? 'bg-slate-200 text-slate-800'
                                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <MoreVertical size={14} />
                              </button>

                              {isMenuOpen && (
                                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(deal)}
                                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                                  >
                                    <Edit2 size={13} className="text-blue-600" />
                                    <span>Edit Deal</span>
                                  </button>

                                  <div className="px-3.5 py-1 text-[10px] uppercase font-bold text-slate-400 border-t border-slate-100 mt-1">
                                    Move to
                                  </div>
                                  <div className="grid grid-cols-2 gap-1 px-2 pb-1">
                                    {STAGES.filter((s) => s !== deal.stage).map((s) => (
                                      <button
                                        key={s}
                                        type="button"
                                        onClick={() => handleMoveStage(deal.id, s)}
                                        className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded text-left truncate"
                                      >
                                        → {s}
                                      </button>
                                    ))}
                                  </div>

                                  <div className="my-1 border-t border-slate-100" />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDealToDelete(deal);
                                      setOpenMenuDealId(null);
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5"
                                  >
                                    <Trash2 size={13} className="text-rose-500" />
                                    <span>Delete Deal</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm md:text-base font-bold text-slate-900">
                              {formatPriceINR(deal.price)}
                            </span>

                            {deal.tag && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  deal.tag === 'Won'
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                    : deal.tag === 'Lost'
                                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                                    : 'bg-rose-50 text-rose-600 border-rose-200'
                                }`}
                              >
                                {deal.tag}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                                  deal.avatarColor || 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {deal.initials || 'CL'}
                              </div>
                              <span className="truncate font-medium text-slate-600 text-xs">{deal.client}</span>
                            </div>

                            <div className="flex items-center gap-1 text-[11px] text-slate-400 flex-shrink-0">
                              <Calendar size={12} className="text-slate-400" />
                              <span>{deal.date}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {remainingCount > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleExpandColumn(st)}
                    className="w-full py-1.5 text-xs font-semibold text-[#1f6bff] hover:bg-blue-50/50 rounded-xl transition-colors text-center"
                  >
                    {isExpanded ? 'Show less' : `+ ${remainingCount} more deals`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Deal Name</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4 text-right">Value (₹)</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{deal.name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                            deal.avatarColor || 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {deal.initials || 'CL'}
                        </div>
                        <span className="font-medium text-slate-700">{deal.client}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{deal.product}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          STAGE_STYLES[deal.stage]?.headerBadge || 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {deal.stage}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatPriceINR(deal.price)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{deal.date}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(deal)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDealToDelete(deal)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-slate-100 my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingDeal ? 'Edit Deal' : 'Create New Deal'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="m-5 mb-0 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle size={14} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveDeal} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Deal Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diamond Ring Inquiry"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Client Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Patel"
                    value={formState.client}
                    onChange={(e) => setFormState({ ...formState, client: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={formState.phone}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500000"
                    value={formState.price}
                    onChange={(e) => setFormState({ ...formState, price: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product</label>
                  <select
                    value={formState.product}
                    onChange={(e) => setFormState({ ...formState, product: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium"
                  >
                    {PRODUCTS.filter((p) => p !== 'All Products').map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stage</label>
                  <select
                    value={formState.stage}
                    onChange={(e) => setFormState({ ...formState, stage: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Source</label>
                  <select
                    value={formState.source}
                    onChange={(e) => setFormState({ ...formState, source: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium"
                  >
                    {SOURCES.filter((s) => s !== 'All Sources').map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned User</label>
                  <select
                    value={formState.assignedUser}
                    onChange={(e) => setFormState({ ...formState, assignedUser: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium"
                  >
                    {USERS.filter((u) => u !== 'All Users').map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1f6bff] hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs transition-all"
                >
                  {editingDeal ? 'Save Changes' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {dealToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete Deal?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong>{dealToDelete.name}</strong>? This action will remove this deal from the sales pipeline.
            </p>

            <div className="flex items-center justify-end gap-2 mt-6 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setDealToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDeal}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-xs"
              >
                Yes, Delete Deal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
