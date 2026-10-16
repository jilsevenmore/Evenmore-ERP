import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useERP } from '../../context/ERPContext';
import { Button } from '../../components/ui/Button';
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Save,
  ArrowLeft,
  UploadCloud,
  Package,
  Layers,
  MapPin,
  CheckCircle2,
  Barcode,
  Scale,
  Plus,
  X,
  Trash2,
  Cpu,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Wand2,
  Check,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Hash,
} from 'lucide-react';
import { sanitizeNumberInput, handleNumberInputFocus } from '../../utils/stringUtils';
import { uploadFileToBackend } from '../../services/fileUploadService';
import { resolveFileUrl } from '../../services/api';

// SEWEN Letter Pad / Official Product Categories (from actual catalog & website)
const SEWEN_STANDARD_CATEGORIES = [
  'Side Table',
  'Desk',
  'End Table',
  'Metal Legs',
  'Sofa Legs',
  'Dining Table',
  'Coffee Table',
  'Work Station',
  'Conference Table',
  'Chair',
  'Modern Metal Wall Art',
  'Laser Cut Design Wall',
  'CNC Job Work',
  'MS Laser Cutting Service',
  'Fabricated MS Products',
  'Mild Steel (Pipes & Sheets)',
  'Hardware & Consumables',
];

export const AddEditItemPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const fileInputRef = useRef(null);

  // Parse query param kind (e.g. /items/new?kind=Part)
  const searchParams = new URLSearchParams(routerLocation.search);
  const queryKind = searchParams.get('kind');

  const {
    items,
    categories = [],
    itemTypes = [],
    materialGrades = [],
    vendors = [],
    units = [],
    locations = [],
    addUnit,
    addInventoryItem,
    updateInventoryItem,
  } = useERP();

  const isEditMode = Boolean(id);
  const existingItem = items.find((i) => i.id === id || i.sku === id);

  // Merge database categories with SEWEN standard categories from letter pad
  const allCategories = useMemo(() => {
    const list = [...categories];
    const existingNames = new Set(categories.map((c) => (c.name || '').toLowerCase().trim()));
    SEWEN_STANDARD_CATEGORIES.forEach((name) => {
      if (!existingNames.has(name.toLowerCase().trim())) {
        list.push({ id: `sewen-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`, name });
      }
    });
    return list;
  }, [categories]);

  // Form state
  const [sku, setSku] = useState('');
  const [status, setStatus] = useState('Optimal');
  const [itemLifecycle, setItemLifecycle] = useState('Active');
  // SEWEN classification: 'Standalone' (Finished Furniture), 'Part' (Metal Legs/Hardware), 'Service' (Laser/CNC Job Work), 'Raw Material', 'Consumable'
  const [itemKind, setItemKind] = useState(
    queryKind === 'Part' ? 'Part' : (queryKind === 'Service' ? 'Service' : 'Standalone')
  );
  const [name, setName] = useState('');
  const [itemTypeId, setItemTypeId] = useState('');
  const [category, setCategory] = useState(allCategories[0]?.name || 'Side Table');
  const [vendor, setVendor] = useState(vendors[0]?.name || '');

  // Dynamic Units & Conversions
  const [purchaseUnit, setPurchaseUnit] = useState('Box');
  const [salesUnit, setSalesUnit] = useState('Pcs');
  const [unitConversionFactor, setUnitConversionFactor] = useState(1);
  const [uom, setUom] = useState('Pcs');

  // Weight-based item (steel bought/sold by weight)
  const [isWeightItem, setIsWeightItem] = useState(false);
  const [theoreticalWeight, setTheoreticalWeight] = useState('');
  const [tolerancePct, setTolerancePct] = useState('2');

  // Metal Sheet, Tube, Rod, Angle, Beam & Channel Specification state
  const [gradeId, setGradeId] = useState('');
  const [metalGrade, setMetalGrade] = useState('MS');
  const [sheetThickness, setSheetThickness] = useState('');
  const [sheetThicknessUnit, setSheetThicknessUnit] = useState('mm');
  const [sheetLength, setSheetLength] = useState('');
  const [sheetWidth, setSheetWidth] = useState('');
  const [hasTubeSpec, setHasTubeSpec] = useState(false);
  const [tubeProfile, setTubeProfile] = useState('Square'); // SEWEN uses square/rectangular pipes frequently
  const [outerDiameter, setOuterDiameter] = useState('');
  const [outerWidth, setOuterWidth] = useState('');
  const [outerHeight, setOuterHeight] = useState('');
  const [wallThickness, setWallThickness] = useState('');
  const [tubeLength, setTubeLength] = useState('');
  const [diameter, setDiameter] = useState('');
  const [innerDiameter, setInnerDiameter] = useState('');
  const [finishCoating, setFinishCoating] = useState('Matte Black Powder Coated');
  const [legA, setLegA] = useState('');
  const [legB, setLegB] = useState('');
  const [webThickness, setWebThickness] = useState('');
  const [flangeThickness, setFlangeThickness] = useState('');
  const [weightPerMeter, setWeightPerMeter] = useState('');
  const [weightPerPiece, setWeightPerPiece] = useState('');
  const [metalCalcError, setMetalCalcError] = useState('');
  const [userToggledMetalSpecs, setUserToggledMetalSpecs] = useState(null);

  // Tracking Mode (Clean Quantity or Batch tracking)
  const [trackingMode, setTrackingMode] = useState('Quantity'); // 'Quantity' | 'Batch'
  const [batchNumber, setBatchNumber] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [manufactureDate, setManufactureDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Commercials & GST
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [taxRate, setTaxRate] = useState('18');
  const [hsnCode, setHsnCode] = useState('9403'); // Default 9403 = Metal Furniture
  const [sacCode, setSacCode] = useState('9988'); // Default 9988 = Fabrication & Laser Services
  const [availableQty, setAvailableQty] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');
  const [location, setLocation] = useState(locations[0]?.name || '');
  const [description, setDescription] = useState('');

  // Simple Clean Warranty
  const [warrantyApplicable, setWarrantyApplicable] = useState(false);
  const [warrantyPeriod, setWarrantyPeriod] = useState(1);
  const [warrantyUnit, setWarrantyUnit] = useState('Years');
  const [warrantyNotes, setWarrantyNotes] = useState('Structural integrity & powder coat warranty');

  // Product Image Upload
  const [imagePreview, setImagePreview] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imageFileId, setImageFileId] = useState('');
  const [imageUploadError, setImageUploadError] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Inline Unit Creation Modal
  const [showNewUnitModal, setShowNewUnitModal] = useState(false);
  const [newUnitCode, setNewUnitCode] = useState('');
  const [newUnitLabel, setNewUnitLabel] = useState('');
  const [savedAlert, setSavedAlert] = useState(false);

  // Filter categories by selected Item Type
  const availableCategories = useMemo(() => {
    let list = allCategories.filter((c) => c.isActive !== false || (existingItem && (existingItem.categoryId === c.id || existingItem.category === c.name)));
    if (itemTypeId) {
      list = list.filter((c) => c.itemTypeId === itemTypeId || !c.itemTypeId);
    }
    return list;
  }, [allCategories, itemTypeId, existingItem]);

  const selectedItemType = useMemo(() => {
    return itemTypes.find((it) => it.id === itemTypeId);
  }, [itemTypes, itemTypeId]);

  const itemTypeCode = (selectedItemType?.code || '').toUpperCase();
  const shapeProfile = (selectedItemType?.shapeProfile || '').toUpperCase();

  const isSheetType = itemTypeCode === 'SHEET' || shapeProfile === 'SHEET';
  const isTubeOrPipeType = itemTypeCode === 'TUBE' || itemTypeCode === 'PIPE' || shapeProfile === 'HOLLOW_SECTION' || shapeProfile === 'ROUND_HOLLOW' || hasTubeSpec;
  const isRodType = itemTypeCode === 'ROD' || shapeProfile === 'ROUND_SOLID';
  const isAngleType = itemTypeCode === 'ANGLE' || shapeProfile === 'EQUAL_ANGLE' || shapeProfile === 'UNEQUAL_ANGLE';
  const isBeamOrChannelType = itemTypeCode === 'BEAM' || itemTypeCode === 'CHANNEL' || shapeProfile === 'BEAM' || shapeProfile === 'CHANNEL';
  const isFlatBarType = itemTypeCode === 'FLAT' || (itemTypeCode === 'BAR' && shapeProfile === 'FLAT_BAR');

  const isMetalShape = Boolean(
    isSheetType ||
    isTubeOrPipeType ||
    isRodType ||
    isAngleType ||
    isBeamOrChannelType ||
    isFlatBarType ||
    itemKind === 'Raw Material' ||
    existingItem?.metalGrade ||
    existingItem?.sheetThickness ||
    existingItem?.diameter ||
    existingItem?.legA
  );

  const showMetalSpecs = userToggledMetalSpecs !== null ? userToggledMetalSpecs : (itemKind === 'Raw Material' || isMetalShape);

  // Helper for generating SEWEN specific SKUs
  const generateSewenSku = (kind) => {
    let prefix = 'SEW-FUR';
    if (kind === 'Part' || kind === 'Component') prefix = 'SEW-LEG';
    else if (kind === 'Service') prefix = 'SEW-SRV';
    else if (kind === 'Raw Material') prefix = 'SEW-RAW';
    else if (kind === 'Consumable') prefix = 'SEW-CON';
    return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  const handleItemKindChange = (newKind) => {
    setItemKind(newKind);
    // Auto-update SKU prefix on create mode if standard prefix
    if (!isEditMode && (!sku || sku.startsWith('SEW-') || sku.startsWith('PRD-') || sku.startsWith('MACH-'))) {
      setSku(generateSewenSku(newKind));
    }
    // Context-sensitive defaults for units & HSN
    if (newKind === 'Service') {
      if (salesUnit === 'Box' || salesUnit === 'Pcs') {
        setSalesUnit('Sq.Ft');
        setUom('Sq.Ft');
      }
      setPurchaseUnit('Job');
      if (!sacCode) setSacCode('9988');
    } else if (newKind === 'Raw Material') {
      if (salesUnit === 'Box') {
        setSalesUnit('Kg');
        setUom('Kg');
      }
      setPurchaseUnit('Mtr');
      if (!hsnCode) setHsnCode('7216');
    } else {
      if (salesUnit === 'Sq.Ft' || salesUnit === 'Job') {
        setSalesUnit('Pcs');
        setUom('Pcs');
      }
      setPurchaseUnit('Pcs');
      if (!hsnCode) setHsnCode('9403');
    }
  };

  const handleItemTypeChange = (newTypeId) => {
    setItemTypeId(newTypeId);
    if (newTypeId) {
      const match = allCategories.find((c) => (c.itemTypeId === newTypeId) && (c.name?.toLowerCase() === category?.toLowerCase()));
      if (!match) {
        const firstMatch = allCategories.find((c) => c.itemTypeId === newTypeId && c.isActive !== false);
        if (firstMatch) {
          setCategory(firstMatch.name);
        }
      }
    }
  };

  const handleCategoryChange = (newCatName) => {
    setCategory(newCatName);
    const catObj = allCategories.find((c) => c.name === newCatName || c.id === newCatName);
    if (catObj && catObj.itemTypeId && !itemTypeId) {
      setItemTypeId(catObj.itemTypeId);
    }
    if (catObj && (catObj.defaultHsnCode || catObj.default_hsn_code) && !hsnCode) {
      setHsnCode(catObj.defaultHsnCode || catObj.default_hsn_code);
    }
  };

  useEffect(() => {
    if (isEditMode && existingItem) {
      setSku(existingItem.sku || existingItem.code || '');
      setName(existingItem.name || '');
      setItemKind(existingItem.itemKind || 'Standalone');
      setItemTypeId(existingItem.itemTypeId || '');
      setCategory(existingItem.category || allCategories[0]?.name || 'Side Table');
      setVendor(existingItem.vendor || vendors[0]?.name || '');
      setUom(existingItem.salesUnit || existingItem.uom || 'Pcs');
      setPurchaseUnit(existingItem.purchaseUnit || 'Pcs');
      setSalesUnit(existingItem.salesUnit || existingItem.uom || 'Pcs');
      setUnitConversionFactor(existingItem.unitConversionFactor || 1);
      setIsWeightItem(Boolean(existingItem.isWeightItem));
      setTheoreticalWeight(existingItem.theoreticalWeight !== undefined ? String(existingItem.theoreticalWeight) : '');
      setTolerancePct(existingItem.tolerancePct !== undefined ? String(existingItem.tolerancePct) : '2');
      // Metal specifications
      setGradeId(existingItem.gradeId || '');
      setMetalGrade(existingItem.metalGrade || 'MS');
      setSheetThickness(existingItem.sheetThickness !== undefined && existingItem.sheetThickness !== null ? String(existingItem.sheetThickness) : '');
      setSheetThicknessUnit(existingItem.sheetThicknessUnit || 'mm');
      setSheetLength(existingItem.sheetLength !== undefined && existingItem.sheetLength !== null ? String(existingItem.sheetLength) : '');
      setSheetWidth(existingItem.sheetWidth !== undefined && existingItem.sheetWidth !== null ? String(existingItem.sheetWidth) : '');
      setHasTubeSpec(Boolean(existingItem.hasTubeSpec));
      setTubeProfile(existingItem.tubeProfile || 'Square');
      setOuterDiameter(existingItem.outerDiameter !== undefined && existingItem.outerDiameter !== null ? String(existingItem.outerDiameter) : '');
      setOuterWidth(existingItem.outerWidth !== undefined && existingItem.outerWidth !== null ? String(existingItem.outerWidth) : '');
      setOuterHeight(existingItem.outerHeight !== undefined && existingItem.outerHeight !== null ? String(existingItem.outerHeight) : '');
      setWallThickness(existingItem.wallThickness !== undefined && existingItem.wallThickness !== null ? String(existingItem.wallThickness) : '');
      setTubeLength(existingItem.tubeLength !== undefined && existingItem.tubeLength !== null ? String(existingItem.tubeLength) : '');
      setDiameter(existingItem.diameter !== undefined && existingItem.diameter !== null ? String(existingItem.diameter) : '');
      setInnerDiameter(existingItem.innerDiameter !== undefined && existingItem.innerDiameter !== null ? String(existingItem.innerDiameter) : '');
      setFinishCoating(existingItem.finishCoating || 'Matte Black Powder Coated');
      setLegA(existingItem.legA !== undefined && existingItem.legA !== null ? String(existingItem.legA) : '');
      setLegB(existingItem.legB !== undefined && existingItem.legB !== null ? String(existingItem.legB) : '');
      setWebThickness(existingItem.webThickness !== undefined && existingItem.webThickness !== null ? String(existingItem.webThickness) : '');
      setFlangeThickness(existingItem.flangeThickness !== undefined && existingItem.flangeThickness !== null ? String(existingItem.flangeThickness) : '');
      setWeightPerMeter(existingItem.weightPerMeter !== undefined && existingItem.weightPerMeter !== null ? String(existingItem.weightPerMeter) : '');
      setWeightPerPiece(existingItem.weightPerPiece !== undefined && existingItem.weightPerPiece !== null ? String(existingItem.weightPerPiece) : '');
      setTrackingMode(existingItem.trackingMode === 'Batch' ? 'Batch' : 'Quantity');
      setBatchNumber(existingItem.batchNumber || '');
      setLotNumber(existingItem.lotNumber || '');
      setManufactureDate(existingItem.manufactureDate || '');
      setExpiryDate(existingItem.expiryDate || '');
      setTaxRate(existingItem.taxRate !== undefined ? String(existingItem.taxRate) : '18');
      setHsnCode(existingItem.hsnCode || '9403');
      setSacCode(existingItem.sacCode || '9988');
      setImagePreview(resolveFileUrl(existingItem.imageUrl || existingItem.image || ''));
      setImageFileId(existingItem.imageFileId || '');
      setSelectedImageFile(null);
      setImageUploadError('');
      setCostPrice(String(existingItem.costPrice ?? existingItem.unitCost ?? ''));
      setSellingPrice(String(existingItem.sellingPrice ?? ''));
      setAvailableQty(String(existingItem.availableQty ?? existingItem.stock ?? '0'));
      setReorderLevel(String(existingItem.reorderLevel ?? ''));
      setLocation(existingItem.location || locations[0]?.name || '');
      setDescription(existingItem.description || '');
      setItemLifecycle(existingItem.lifecycleStatus || 'Active');
      setStatus(existingItem.status || 'Optimal');
      setWarrantyApplicable(Boolean(existingItem.warrantyApplicable));
      setWarrantyPeriod(existingItem.warrantyPeriod !== undefined ? existingItem.warrantyPeriod : 1);
      setWarrantyUnit(existingItem.warrantyUnit || 'Years');
    }
    else if (!isEditMode) {
      const generatedSku = generateSewenSku(itemKind);
      setSku(generatedSku);
      if (allCategories.length > 0 && !category) {
        setCategory(allCategories[0].name);
      }
      if (vendors.length > 0 && !vendor) {
        setVendor(vendors[0].name);
      }
      if (locations.length > 0 && !location) {
        setLocation(locations[0].name);
      }
      setImagePreview('');
      setImageFileId('');
      setSelectedImageFile(null);
      setImageUploadError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, existingItem, allCategories, vendors, locations]);

  // Image Upload Handlers
  const handleFileSelect = (file) => {
    if (!file) return;
    setImageUploadError('');

    const validExtensions = /\.(png|jpe?g|webp|svg|gif)$/i;
    if (!file.type.startsWith('image/') && !validExtensions.test(file.name)) {
      setImageUploadError('Please select a valid image file (PNG, JPG, JPEG, WEBP, SVG, or GIF).');
      return;
    }

    const maxSizeBytes = 25 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setImageUploadError('Image file size exceeds the 25MB limit.');
      return;
    }

    setSelectedImageFile(file);
    try {
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDropFile = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    setSelectedImageFile(null);
    setImageFileId(null);
    setImageUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateUnit = (e) => {
    e.preventDefault();
    if (!newUnitCode.trim() || !newUnitLabel.trim()) return;
    const created = addUnit({
      code: newUnitCode.trim(),
      label: newUnitLabel.trim(),
    });
    setSalesUnit(created.code);
    setShowNewUnitModal(false);
    setNewUnitCode('');
    setNewUnitLabel('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isUploadingImage) return;

    let finalFileId = imageFileId || null;
    let finalImageUrl = imagePreview || '';

    if (selectedImageFile) {
      try {
        setIsUploadingImage(true);
        setImageUploadError('');
        const uploadRes = await uploadFileToBackend(
          selectedImageFile,
          selectedImageFile.name,
          'product_image',
          { returnDetails: true }
        );
        if (uploadRes?.fileId) {
          finalFileId = uploadRes.fileId;
        }
        if (uploadRes?.url) {
          finalImageUrl = uploadRes.url;
        }
      } catch (err) {
        console.error('Failed to upload product image:', err);
        setImageUploadError('Failed to upload product photo: ' + (err.message || 'Server error'));
        setIsUploadingImage(false);
        return;
      }
    } else if (!imagePreview) {
      finalFileId = null;
      finalImageUrl = '';
    }

    const isService = itemKind === 'Service';
    const parsedCost = parseFloat(costPrice) || 0;
    const parsedSelling = parseFloat(sellingPrice) || 0;
    const parsedQty = isService ? 0 : (parseInt(availableQty, 10) || 0);
    const parsedReorder = parseInt(reorderLevel, 10) || 0;
    const parsedConv = parseFloat(unitConversionFactor) || 1;

    let computedStatus = status;
    if (isService) {
      computedStatus = 'Optimal';
    } else if (parsedQty <= 0) {
      computedStatus = 'Critical';
    } else if (parsedQty <= parsedReorder) {
      computedStatus = 'Low Stock';
    } else {
      computedStatus = 'Optimal';
    }

    const matchedCat = allCategories.find((c) => c.name === category);

    const payload = {
      sku,
      code: sku,
      name: name || 'Unnamed Item',
      itemKind,
      itemTypeId: itemTypeId || undefined,
      category,
      categoryId: matchedCat?.id && !matchedCat.id.startsWith('sewen-') ? matchedCat.id : undefined,
      vendor,
      description,
      lifecycleStatus: itemLifecycle,
      uom: salesUnit || uom,
      purchaseUnit,
      salesUnit,
      unitConversionFactor: parsedConv,
      isWeightItem,
      theoreticalWeight: isWeightItem ? (parseFloat(theoreticalWeight) || 0) : (parseFloat(weightPerPiece) || undefined),
      tolerancePct: isWeightItem ? (parseFloat(tolerancePct) > 0 ? parseFloat(tolerancePct) : 2) : undefined,
      gradeId: gradeId || undefined,
      metalGrade,
      hasSheetSpec: isSheetType || Boolean(sheetThickness && (sheetLength || sheetWidth)),
      sheetThickness: sheetThickness ? parseFloat(sheetThickness) : undefined,
      sheetThicknessUnit,
      sheetLength: sheetLength ? parseFloat(sheetLength) : undefined,
      sheetWidth: sheetWidth ? parseFloat(sheetWidth) : undefined,
      hasTubeSpec: isTubeOrPipeType,
      tubeProfile: isTubeOrPipeType ? tubeProfile : undefined,
      outerDiameter: isTubeOrPipeType && tubeProfile === 'Round' && outerDiameter ? parseFloat(outerDiameter) : undefined,
      outerWidth: isTubeOrPipeType && (tubeProfile === 'Square' || tubeProfile === 'Rectangular') && outerWidth ? parseFloat(outerWidth) : undefined,
      outerHeight: isTubeOrPipeType && tubeProfile === 'Rectangular' && outerHeight ? parseFloat(outerHeight) : undefined,
      wallThickness: (isTubeOrPipeType || isAngleType) && wallThickness ? parseFloat(wallThickness) : undefined,
      tubeLength: tubeLength ? parseFloat(tubeLength) : (sheetLength ? parseFloat(sheetLength) : undefined),
      diameter: diameter ? parseFloat(diameter) : undefined,
      innerDiameter: innerDiameter ? parseFloat(innerDiameter) : undefined,
      finishCoating: finishCoating || undefined,
      legA: legA ? parseFloat(legA) : undefined,
      legB: legB ? parseFloat(legB) : undefined,
      webThickness: webThickness ? parseFloat(webThickness) : undefined,
      flangeThickness: flangeThickness ? parseFloat(flangeThickness) : undefined,
      weightPerMeter: weightPerMeter ? parseFloat(weightPerMeter) : undefined,
      weightPerPiece: weightPerPiece ? parseFloat(weightPerPiece) : undefined,
      trackingMode: isService ? 'None' : trackingMode,
      batchNumber: trackingMode === 'Batch' ? batchNumber : undefined,
      lotNumber: trackingMode === 'Batch' ? lotNumber : undefined,
      manufactureDate: trackingMode === 'Batch' ? manufactureDate : undefined,
      expiryDate: trackingMode === 'Batch' ? expiryDate : undefined,
      taxRate: parseFloat(taxRate) || 18,
      hsnCode: isService ? '' : (hsnCode.trim() || '9403'),
      sacCode: isService ? (sacCode.trim() || '9988') : '',
      warrantyApplicable,
      warrantyPeriod: Number(warrantyPeriod) || 1,
      warrantyUnit,
      costPrice: parsedCost,
      unitCost: parsedCost,
      sellingPrice: parsedSelling,
      availableQty: parsedQty,
      stock: parsedQty,
      reorderLevel: parsedReorder,
      location,
      status: computedStatus,
      imageFileId: finalFileId,
      image: finalImageUrl,
      imageUrl: finalImageUrl,
    };

    if (isEditMode && existingItem) {
      updateInventoryItem(existingItem.id, payload);
    }
    else {
      addInventoryItem(payload);
    }

    setSavedAlert(true);
    setIsUploadingImage(false);
    setTimeout(() => {
      navigate('/inventory/items');
    }, 500);
  };

  const isConversionValid = Boolean(purchaseUnit && salesUnit && parseFloat(unitConversionFactor) > 0);

  // Live profit margin calculation
  const parsedCostNum = parseFloat(costPrice) || 0;
  const parsedSellingNum = parseFloat(sellingPrice) || 0;
  const grossMargin = parsedSellingNum - parsedCostNum;
  const marginPercent = parsedSellingNum > 0 ? (grossMargin / parsedSellingNum) * 100 : 0;

  // Context-aware placeholders based on SEWEN products
  const productNamePlaceholder = useMemo(() => {
    if (itemKind === 'Part' || itemKind === 'Component') {
      return 'e.g. Heavy Duty T-Shaped Furniture Leg (Set of 4, Matte Black)';
    }
    if (itemKind === 'Service') {
      return 'e.g. MS Laser Cutting Service (CNC Sheet Cutting per mm/sq.ft)';
    }
    if (itemKind === 'Raw Material') {
      return 'e.g. MS Square Hollow Pipe 25×25×2.0mm (6 Mtr)';
    }
    if (itemKind === 'Consumable') {
      return 'e.g. M8 Threaded Furniture Leveler Glides & Screws';
    }
    return 'e.g. C-Shaped End Table (Matte Black MS Frame + Wood Top)';
  }, [itemKind]);

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Top Breadcrumb & Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link
              to="/inventory/items"
              className="text-blue-600 hover:underline font-semibold"
            >
              SEWEN Item Master
            </Link>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="font-semibold text-slate-700">
              {isEditMode ? `Edit ${sku}` : `Add Product`}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-blue-600" />
            {isEditMode ? `Edit Item: ${existingItem?.name || sku}` : `Create SEWEN Catalog Product`}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            SEWEN Metal Furniture, Architectural Fabrication &amp; CNC Job Work Catalog
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link to="/inventory/items">
            <Button variant="outline" icon={ArrowLeft} size="sm">
              Back to Catalog
            </Button>
          </Link>
          <Button
            type="button"
            icon={Save}
            size="sm"
            onClick={handleSubmit}
            disabled={isUploadingImage}
          >
            {isUploadingImage ? 'Saving...' : (isEditMode ? `Update Item` : `Save & Register Product`)}
          </Button>
        </div>
      </div>

      {savedAlert && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-xl flex items-center gap-2.5 text-xs font-semibold shadow-xs animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>Product successfully registered in SEWEN catalog! Redirecting to Item Master...</span>
        </div>
      )}

      {/* Main Form Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-7">

          {/* SEWEN Classification Selector Tabs */}
          <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Product Category Type</span>
              <span className="text-[11px] text-slate-500">
                Select whether this item is a Finished Furniture product, Metal Leg component, Job Work service, or Material.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {[
                { kind: 'Standalone', label: 'Finished Furniture', icon: Package },
                { kind: 'Part', label: 'Metal Legs & Hardware', icon: Cpu },
                { kind: 'Service', label: 'Laser Cutting & Job Work', icon: Wand2 },
                { kind: 'Raw Material', label: 'Raw Steel & Materials', icon: Layers },
                { kind: 'Consumable', label: 'Consumables', icon: Sparkles },
              ].map(({ kind, label, icon: Icon }) => {
                const isSelected = itemKind === kind || (kind === 'Standalone' && (itemKind === 'Standalone' || itemKind === 'Finished Product')) || (kind === 'Part' && (itemKind === 'Part' || itemKind === 'Component'));
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => handleItemKindChange(kind)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer shadow-2xs ${isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={14} className={isSelected ? 'text-white' : 'text-slate-500'} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Balanced Two-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">

            {/* LEFT COLUMN: Identity, Commercials & Units */}
            <div className="space-y-6">

              {/* 1. Basic Specifications */}
              <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <Package size={17} className="text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-800">Basic Specifications</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      SKU / Product Code *
                    </label>
                    <input
                      required
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full h-10 border border-slate-200 rounded-xl px-3 bg-slate-50 text-slate-800 font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 font-bold"
                      placeholder="e.g. SEW-FUR-1042"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Catalog Status
                    </label>
                    <select
                      value={itemLifecycle}
                      onChange={(e) => setItemLifecycle(e.target.value)}
                      className="w-full h-10 border border-slate-200 rounded-xl px-3 bg-slate-50 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-blue-600"
                    >
                      <option value="Active">Active (In Catalog &amp; Production)</option>
                      <option value="Draft">Draft (Design Review)</option>
                      <option value="Archived">Archived / Discontinued</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product / Item Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 border border-slate-200 rounded-xl px-3 bg-slate-50 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                    placeholder={productNamePlaceholder}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category (SEWEN Catalog)
                    </label>
                    <select
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full h-10 border border-slate-200 rounded-xl px-2.5 bg-slate-50 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
                    >
                      {availableCategories.map((c) => (
                        <option key={c.id || c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Item Type
                    </label>
                    <select
                      value={itemTypeId}
                      onChange={(e) => handleItemTypeChange(e.target.value)}
                      className="w-full h-10 border border-slate-200 rounded-xl px-2.5 bg-slate-50 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-blue-600"
                    >
                      <option value="">-- All Types --</option>
                      {itemTypes.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name} ({it.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Primary Vendor / Supplier
                    </label>
                    <select
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                      className="w-full h-10 border border-slate-200 rounded-xl px-2.5 bg-slate-50 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-blue-600"
                    >
                      <option value="">SEWEN In-House Workshop</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.name}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Pricing & GST Commercials */}
              <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={17} className="text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-800">Pricing &amp; GST Compliance</h3>
                  </div>
                  {/* Real-time Profit Margin Badge */}
                  {(parsedCostNum > 0 || parsedSellingNum > 0) && (
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${grossMargin > 0
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : grossMargin < 0
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      Margin: ₹{grossMargin.toFixed(2)} ({marginPercent.toFixed(1)}%)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cost Price (₹ / {salesUnit || 'Unit'})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onFocus={handleNumberInputFocus}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const cleaned = sanitizeNumberInput(raw);
                        if (cleaned !== raw) e.target.value = cleaned;
                        setCostPrice(cleaned);
                      }}
                      className="w-full h-10 border border-slate-200 rounded-xl px-3 bg-slate-50 text-slate-800 font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Selling Price (₹ / {salesUnit || 'Unit'})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={sellingPrice}
                      onFocus={handleNumberInputFocus}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const cleaned = sanitizeNumberInput(raw);
                        if (cleaned !== raw) e.target.value = cleaned;
                        setSellingPrice(cleaned);
                      }}
                      className="w-full h-10 border border-slate-200 rounded-xl px-3 bg-slate-50 text-slate-800 font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 font-bold"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      GST Tax Rate (%)
                    </label>
                    <select
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-full h-10 border border-slate-200 rounded-xl px-3 bg-slate-50 text-slate-800 font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-600 font-semibold"
                    >
                      <option value="18">18% (Standard Furniture &amp; Metal)</option>
                      <option value="12">12% (Standard Low)</option>
                      <option value="28">28% (Luxury Decor)</option>
                      <option value="5">5% (Concessional)</option>
                      <option value="0">0% (Exempt)</option>
                    </select>
                  </div>
                </div>

                {/* Context-aware Tax Code: Only show SAC for Service, and HSN for Goods (No disabled clutter!) */}
                <div className="pt-2 border-t border-slate-100">
                  {itemKind === 'Service' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        SAC Code (Service Accounting Code) *
                      </label>
                      <div className="relative">
                        <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={sacCode}
                          onChange={(e) => setSacCode(e.target.value)}
                          placeholder="e.g. 9988 - Manufacturing &amp; Fabrication Job Work Services"
                          className="w-full h-10 pl-8 pr-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Printed on GST tax invoices for job work &amp; laser services.</p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        HSN Code (Harmonized Goods Code) *
                      </label>
                      <div className="relative">
                        <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={hsnCode}
                          onChange={(e) => setHsnCode(e.target.value)}
                          placeholder="e.g. 9403 (Metal Furniture) or 7306 (MS Pipes)"
                          className="w-full h-10 pl-8 pr-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Appears as HSN column on customer delivery challans &amp; invoices.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Units of Measure & Weight Measurement */}
              <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Scale size={17} className="text-blue-600" />
                    Units of Measure &amp; Conversion
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNewUnitModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} /> Add Unit
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Purchase Unit
                    </label>
                    <select
                      value={purchaseUnit}
                      onChange={(e) => setPurchaseUnit(e.target.value)}
                      className="w-full h-9 border border-slate-200 rounded-lg px-2.5 bg-slate-50 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-blue-600"
                    >
                      <option value="Pcs">Pcs (Pieces)</option>
                      <option value="Box">Box (Carton)</option>
                      <option value="Set">Set (e.g. 4 legs)</option>
                      <option value="Mtr">Mtr (Meters)</option>
                      <option value="Kg">Kg (Kilograms)</option>
                      <option value="Sq.Ft">Sq.Ft (Square Feet)</option>
                      <option value="Job">Job / Order</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.code}>
                          {u.label || u.code}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Sales / Billing Unit
                    </label>
                    <select
                      value={salesUnit}
                      onChange={(e) => {
                        setSalesUnit(e.target.value);
                        setUom(e.target.value);
                      }}
                      className="w-full h-9 border border-slate-200 rounded-lg px-2.5 bg-slate-50 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-blue-600 font-semibold"
                    >
                      <option value="Pcs">Pcs (Pieces)</option>
                      <option value="Set">Set (e.g. 4 legs)</option>
                      <option value="Sq.Ft">Sq.Ft (Laser / Panels)</option>
                      <option value="Mtr">Mtr (Running Meters)</option>
                      <option value="Kg">Kg (Steel by Weight)</option>
                      <option value="Box">Box</option>
                      <option value="Job">Job</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.code}>
                          {u.label || u.code}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Conversion Factor
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.0001"
                      value={unitConversionFactor}
                      onChange={(e) => setUnitConversionFactor(e.target.value)}
                      className="w-full h-9 border border-slate-200 rounded-lg px-2.5 bg-slate-50 text-slate-800 font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-600"
                      placeholder="1"
                    />
                  </div>
                </div>

                {isConversionValid && purchaseUnit !== salesUnit && (
                  <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="font-semibold text-slate-800">Conversion Rule: </span>
                    1 {purchaseUnit} = <strong>{unitConversionFactor}</strong> {salesUnit}
                  </div>
                )}

                {/* Weight-Based Steel Toggle */}
                <div className="border border-blue-200 rounded-xl p-3 bg-blue-50/30">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isWeightItem}
                      onChange={(e) => setIsWeightItem(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Scale size={13} className="text-blue-600" /> Steel Weight Intake (weighed by kg on GRN)
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1 ml-6">
                    Enable for raw metal, pipes, and sheets weighed at intake; stock &amp; billing follow received weight.
                  </p>
                  {isWeightItem && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5 ml-6">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Theoretical Weight (kg / unit)
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={theoreticalWeight}
                          onChange={(e) => setTheoreticalWeight(e.target.value)}
                          className="w-full h-8 border border-slate-300 rounded-lg px-2.5 bg-white text-slate-800 font-mono text-xs focus:outline-none focus:border-blue-600"
                          placeholder="e.g. 2.10"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Weight Tolerance (± %)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={tolerancePct}
                          onChange={(e) => setTolerancePct(e.target.value)}
                          className="w-full h-8 border border-slate-300 rounded-lg px-2.5 bg-white text-slate-800 font-mono text-xs focus:outline-none focus:border-blue-600"
                          placeholder="2"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Media, Storage & Warranty */}
            <div className="space-y-6">

              {/* 1. Product Image / Media Upload */}
              <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={17} className="text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-800">Product Image &amp; Media</h3>
                  </div>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                  accept="image/*"
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex items-center gap-4">
                    <img
                      src={imagePreview}
                      alt="Product Preview"
                      className="w-24 h-24 rounded-xl object-contain bg-white border border-slate-200 shadow-xs shrink-0"
                    />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                        <Check size={14} className="text-emerald-600 shrink-0" /> Photo Attached
                      </p>
                      <p className="text-[11px] text-slate-500">
                        High-resolution furniture photo attached and visible on customer orders &amp; quotes.
                      </p>
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition cursor-pointer shadow-2xs"
                        >
                          Change Photo
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(true);
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={handleDropFile}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer text-center ${isDraggingFile
                        ? 'border-blue-500 bg-blue-50/60 scale-[1.01]'
                        : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100/70 hover:border-blue-400'
                      }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 shadow-2xs">
                      <UploadCloud size={24} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      Drop product photo or <span className="text-blue-600 underline">click to browse</span>
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1">
                      Supports PNG, JPG, JPEG, WEBP or SVG up to 25MB
                    </span>
                  </div>
                )}

                {imageUploadError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0 text-rose-600" />
                    <span>{imageUploadError}</span>
                  </div>
                )}
              </div>

              {/* 2. Description & Specifications */}
              <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <FileText size={17} className="text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-800">Description &amp; Specifications</h3>
                </div>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 resize-none"
                  placeholder="e.g. Dimensions: 1200mm (L) x 600mm (W) x 750mm (H). Powder coated 25x25mm MS tube frame with 18mm prelaminated wood top..."
                />
              </div>

              {/* 3. Storage & Inventory Tracking */}
              <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Barcode size={17} className="text-amber-600" />
                    <h3 className="text-sm font-bold text-slate-800">Storage &amp; Stock Tracking</h3>
                  </div>
                  <Link
                    to="/stock/locations"
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Manage Locations
                  </Link>
                </div>

                {itemKind === 'Service' ? (
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
                    <Wand2 size={16} className="text-blue-600 shrink-0" />
                    <span>Laser Cutting &amp; Job Work services are billed per sq.ft / hour / job and do not maintain stock on hand.</span>
                  </div>
                ) : (
                  <>
                    {/* Warehouse Location */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Default Warehouse Location
                      </label>
                      <div className="relative">
                        <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full h-10 pl-9 pr-8 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-blue-600 appearance-none cursor-pointer"
                        >
                          <option value="">-- Select Warehouse Location --</option>
                          {locations.map((loc) => (
                            <option key={loc.id || loc.code} value={loc.name}>
                              {loc.name} ({loc.code}) {loc.type ? `— ${loc.type}` : ''}
                            </option>
                          ))}
                          {location && !locations.some((l) => l.name === location) && (
                            <option value={location}>{location} (Custom Location)</option>
                          )}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Stock Counts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Current Stock On Hand ({salesUnit || 'Unit'})
                        </label>
                        <input
                          type="number"
                          value={availableQty}
                          onFocus={handleNumberInputFocus}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const cleaned = sanitizeNumberInput(raw);
                            if (cleaned !== raw) e.target.value = cleaned;
                            setAvailableQty(cleaned);
                          }}
                          className="w-full h-10 border border-slate-200 rounded-xl px-3 bg-slate-50 text-slate-800 font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-600 font-bold"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Reorder Alert Level ({salesUnit || 'Unit'})
                        </label>
                        <input
                          type="number"
                          value={reorderLevel}
                          onFocus={handleNumberInputFocus}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const cleaned = sanitizeNumberInput(raw);
                            if (cleaned !== raw) e.target.value = cleaned;
                            setReorderLevel(cleaned);
                          }}
                          className="w-full h-10 border border-slate-200 rounded-xl px-3 bg-slate-50 text-slate-800 font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-600"
                          placeholder="5"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* 4. SEWEN Structural Warranty Configuration */}
              <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">SEWEN Product Warranty</h4>
                      <p className="text-[10px] text-slate-500">Structural warranty on welds, powder coat &amp; joinery</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={warrantyApplicable}
                      onChange={(e) => setWarrantyApplicable(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span className="ml-2 text-xs font-semibold text-slate-700">
                      {warrantyApplicable ? '1 Year Warranty' : 'No Warranty'}
                    </span>
                  </label>
                </div>

                {warrantyApplicable && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Warranty Period</label>
                        <input
                          type="number"
                          min="1"
                          value={warrantyPeriod}
                          onChange={(e) => setWarrantyPeriod(Math.max(1, Number(e.target.value) || 1))}
                          className="w-full h-9 border border-slate-200 rounded-xl px-3 bg-slate-50 text-slate-800 font-mono text-xs focus:bg-white focus:outline-none focus:border-emerald-600"
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Warranty Unit</label>
                        <select
                          value={warrantyUnit}
                          onChange={(e) => setWarrantyUnit(e.target.value)}
                          className="w-full h-9 border border-slate-200 rounded-xl px-3 bg-slate-50 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-emerald-600"
                        >
                          <option value="Years">Years</option>
                          <option value="Months">Months</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* DEDICATED CONTEXTUAL SECTION: Metal & Steel Specifications (Collapsible) */}
          <div className="border border-indigo-200/90 rounded-2xl bg-indigo-50/20 overflow-hidden shadow-2xs">
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 bg-white/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Layers size={17} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Metal &amp; Steel Technical Specifications</h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {isRodType
                        ? 'Round Rod / Bar'
                        : isAngleType
                        ? 'Angle Section'
                        : isBeamOrChannelType
                        ? 'Channel / Beam'
                        : isFlatBarType
                        ? 'Flat Bar'
                        : isTubeOrPipeType
                        ? 'Tube / Square Pipe'
                        : 'Sheet / Plate'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    MS tube profiles, sheet gauges, surface coatings, and theoretical steel weight calculation.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isRodType && !isAngleType && !isBeamOrChannelType && !isFlatBarType && showMetalSpecs && (
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-indigo-900 mr-2">
                    <input
                      type="checkbox"
                      checked={hasTubeSpec}
                      onChange={(e) => {
                        setHasTubeSpec(e.target.checked);
                        setMetalCalcError('');
                      }}
                      className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
                    />
                    Hollow Pipe / Tube
                  </label>
                )}
                <button
                  type="button"
                  onClick={() => setUserToggledMetalSpecs((prev) => (prev !== null ? !prev : !showMetalSpecs))}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  {showMetalSpecs ? (
                    <>
                      <ChevronUp size={14} /> Collapse Specs
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} /> Configure Steel Specs
                    </>
                  )}
                </button>
              </div>
            </div>

            {showMetalSpecs && (
              <div className="p-5 space-y-4 animate-in fade-in duration-150">
                {/* Material Grade & Surface Finish Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">Steel Material Grade *</label>
                    <select
                      value={gradeId || metalGrade}
                      onChange={(e) => {
                        const val = e.target.value;
                        const foundGrade = materialGrades.find((g) => g.id === val || g.code === val);
                        if (foundGrade) {
                          setGradeId(foundGrade.id);
                          setMetalGrade(foundGrade.code);
                        } else {
                          setGradeId('');
                          setMetalGrade(val);
                        }
                      }}
                      className="w-full h-9 border border-slate-300 rounded-xl px-2.5 bg-white text-slate-800 text-xs focus:outline-none focus:border-indigo-600 font-medium"
                    >
                      {materialGrades.length > 0 ? (
                        <>
                          {materialGrades.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name} ({g.code}) — {g.density} g/cm³
                            </option>
                          ))}
                          <option value="MS">Mild Steel (MS - 7.85 g/cm³)</option>
                          <option value="IS 2062">IS 2062 Structural Steel (7.85 g/cm³)</option>
                          <option value="SS 304">Stainless Steel 304 (7.93 g/cm³)</option>
                          <option value="SS 202">Stainless Steel 202 (7.80 g/cm³)</option>
                          <option value="Aluminium">Aluminium (2.70 g/cm³)</option>
                        </>
                      ) : (
                        <>
                          <option value="MS">Mild Steel (MS - 7.85 g/cm³)</option>
                          <option value="IS 2062">IS 2062 Structural Steel (7.85 g/cm³)</option>
                          <option value="SS 304">Stainless Steel 304 (7.93 g/cm³)</option>
                          <option value="SS 202">Stainless Steel 202 (7.80 g/cm³)</option>
                          <option value="Aluminium">Aluminium (2.70 g/cm³)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">Surface Coating / Powder Coat</label>
                    <select
                      value={finishCoating}
                      onChange={(e) => setFinishCoating(e.target.value)}
                      className="w-full h-9 border border-slate-300 rounded-xl px-2.5 bg-white text-slate-800 text-xs focus:outline-none focus:border-indigo-600 font-medium"
                    >
                      <option value="Matte Black Powder Coated">Matte Black Powder Coated (SEWEN Standard)</option>
                      <option value="Gloss Black Powder Coated">Gloss Black Powder Coated</option>
                      <option value="Golden / Brass PVD Finish">Golden / Brass PVD Finish</option>
                      <option value="White Powder Coated">White Powder Coated</option>
                      <option value="Mill Finish">Mill Finish / Raw Steel</option>
                      <option value="Galvanized">Hot Dip Galvanized (HDG)</option>
                      <option value="Brushed Satin">Brushed Satin / SS Finish</option>
                    </select>
                  </div>

                  {isTubeOrPipeType && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Tube Profile</label>
                      <select
                        value={tubeProfile}
                        onChange={(e) => setTubeProfile(e.target.value)}
                        className="w-full h-9 border border-slate-300 rounded-xl px-2.5 bg-white text-slate-800 text-xs focus:outline-none focus:border-indigo-600 font-medium"
                      >
                        <option value="Square">Square Hollow Pipe (SHS - e.g. 25x25mm)</option>
                        <option value="Rectangular">Rectangular Hollow Pipe (RHS - e.g. 50x25mm)</option>
                        <option value="Round">Round Pipe / Tube</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Dynamic Dimensional Fields by Shape */}
                <div className="pt-2 border-t border-indigo-100">
                  {/* Tube / Pipe */}
                  {isTubeOrPipeType && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {(tubeProfile === 'Square' || tubeProfile === 'Rectangular') && (
                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 mb-1">
                            {tubeProfile === 'Square' ? 'Side Width (mm) *' : 'Outer Width (mm) *'}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g. 25"
                            value={outerWidth}
                            onChange={(e) => setOuterWidth(e.target.value)}
                            className="w-full h-8 border border-slate-300 rounded-lg px-2.5 bg-white text-slate-800 font-mono text-xs focus:outline-none focus:border-indigo-600"
                          />
                        </div>
                      )}
                      {tubeProfile === 'Rectangular' && (
                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 mb-1">Outer Height (mm) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g. 50"
                            value={outerHeight}
                            onChange={(e) => setOuterHeight(e.target.value)}
                            className="w-full h-8 border border-slate-300 rounded-lg px-2.5 bg-white text-slate-800 font-mono text-xs focus:outline-none focus:border-indigo-600"
                          />
                        </div>
                      )}
                      {tubeProfile === 'Round' && (
                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 mb-1">Outer Diameter (OD mm) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g. 25.4"
                            value={outerDiameter}
                            onChange={(e) => setOuterDiameter(e.target.value)}
                            className="w-full h-8 border border-slate-300 rounded-lg px-2.5 bg-white text-slate-800 font-mono text-xs focus:outline-none focus:border-indigo-600"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">Wall Thickness (mm) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 2.0"
                          value={wallThickness}
                          onChange={(e) => setWallThickness(e.target.value)}
                          className="w-full h-8 border border-slate-300 rounded-lg px-2.5 bg-white text-slate-800 font-mono text-xs focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">Pipe Length (mm)</label>
                        <input
                          type="number"
                          step="1"
                          placeholder="e.g. 6000 (6 meters)"
                          value={tubeLength}
                          onChange={(e) => setTubeLength(e.target.value)}
                          className="w-full h-8 border border-slate-300 rounded-lg px-2.5 bg-white text-slate-800 font-mono text-xs focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>
                  )}

                  {/* Sheet / Plate (default) */}
                  {!isRodType && !isAngleType && !isBeamOrChannelType && !isFlatBarType && !isTubeOrPipeType && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">Sheet Thickness</label>
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g. 2.0"
                            value={sheetThickness}
                            onChange={(e) => setSheetThickness(e.target.value)}
                            className="w-full h-8 border border-slate-300 rounded-lg px-2.5 bg-white text-slate-800 font-mono text-xs focus:outline-none focus:border-indigo-600"
                          />
                          <select
                            value={sheetThicknessUnit}
                            onChange={(e) => setSheetThicknessUnit(e.target.value)}
                            className="h-8 border border-slate-300 rounded-lg px-2 bg-white text-slate-700 text-xs"
                          >
                            <option value="mm">mm</option>
                            <option value="gauge">gauge</option>
                            <option value="inch">in</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">Sheet Dimensions (L × W mm)</label>
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="number"
                            step="1"
                            placeholder="Length (e.g. 2440)"
                            value={sheetLength}
                            onChange={(e) => setSheetLength(e.target.value)}
                            className="w-1/2 h-8 border border-slate-300 rounded-lg px-2 bg-white text-slate-800 font-mono text-xs focus:outline-none focus:border-indigo-600"
                          />
                          <span className="text-slate-400 text-xs">×</span>
                          <input
                            type="number"
                            step="1"
                            placeholder="Width (e.g. 1220)"
                            value={sheetWidth}
                            onChange={(e) => setSheetWidth(e.target.value)}
                            className="w-1/2 h-8 border border-slate-300 rounded-lg px-2 bg-white text-slate-800 font-mono text-xs focus:outline-none focus:border-indigo-600"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Weight Calculation & Action */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-indigo-100 bg-white/80 p-3 rounded-xl">
                  <div className="flex items-center gap-5 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 font-sans block text-[10px]">Weight / Piece:</span>
                      <span className="font-bold text-indigo-950 text-sm">{weightPerPiece ? `${Number(weightPerPiece).toFixed(3)} kg` : '—'}</span>
                    </div>
                    {isTubeOrPipeType && (
                      <div>
                        <span className="text-slate-500 font-sans block text-[10px]">Weight / Meter:</span>
                        <span className="font-bold text-indigo-950 text-sm">{weightPerMeter ? `${Number(weightPerMeter).toFixed(3)} kg/m` : '—'}</span>
                      </div>
                    )}
                    {metalCalcError && (
                      <span className="text-rose-600 text-xs font-sans font-medium">{metalCalcError}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMetalCalcError('');
                      const rho = 7.85; // MS Mild steel standard density

                      if (isTubeOrPipeType) {
                        const t = parseFloat(wallThickness);
                        const l = parseFloat(tubeLength) || 1000;
                        if (!t || t <= 0) {
                          setMetalCalcError('Please enter valid Wall Thickness (> 0 mm).');
                          return;
                        }
                        let area = 0;
                        if (tubeProfile === 'Square') {
                          const side = parseFloat(outerWidth);
                          if (!side || side <= 0 || t >= side / 2) {
                            setMetalCalcError(`Side width must be > 0 and > 2× wall thickness (${2 * t} mm).`);
                            return;
                          }
                          area = 4 * t * (side - t);
                        } else if (tubeProfile === 'Rectangular') {
                          const ow = parseFloat(outerWidth);
                          const oh = parseFloat(outerHeight);
                          if (!ow || !oh || ow <= 0 || oh <= 0 || t >= ow / 2 || t >= oh / 2) {
                            setMetalCalcError(`Outer width & height must be > 0 and > 2× wall thickness (${2 * t} mm).`);
                            return;
                          }
                          area = 2 * t * (ow + oh - 2 * t);
                        } else {
                          const od = parseFloat(outerDiameter);
                          if (!od || od <= 0 || t >= od / 2) {
                            setMetalCalcError(`Outer diameter must be > 0 and > 2× wall thickness (${2 * t} mm).`);
                            return;
                          }
                          area = Math.PI * (od - t) * t;
                        }
                        const wtPerMeter = (area * rho) / 1000;
                        const wtPerPiece = wtPerMeter * (l / 1000);
                        const roundMeter = Math.round(wtPerMeter * 1000) / 1000;
                        const roundPiece = Math.round(wtPerPiece * 1000) / 1000;
                        setWeightPerMeter(String(roundMeter));
                        setWeightPerPiece(String(roundPiece));
                        if (isWeightItem || !theoreticalWeight) setTheoreticalWeight(String(roundPiece));
                      } else {
                        const l = parseFloat(sheetLength);
                        const w = parseFloat(sheetWidth);
                        const t = parseFloat(sheetThickness);
                        if (!l || !w || !t || l <= 0 || w <= 0 || t <= 0) {
                          setMetalCalcError('Please enter valid Sheet Length, Width, and Thickness (> 0).');
                          return;
                        }
                        const wt = (l * w * t * rho) / 1000000;
                        const rounded = Math.round(wt * 1000) / 1000;
                        setWeightPerPiece(String(rounded));
                        if (isWeightItem || !theoreticalWeight) setTheoreticalWeight(String(rounded));
                      }
                    }}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Sparkles size={13} /> Compute Theoretical Weight
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/inventory/items')}
            >
              Cancel
            </Button>
            <Button type="submit" icon={Save} disabled={isUploadingImage}>
              {isUploadingImage ? 'Saving Product...' : (isEditMode ? `Update Item` : `Save & Register Product`)}
            </Button>
          </div>
        </form>
      </div>

      {/* Inline Unit Create Modal */}
      {showNewUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-4 sm:p-5 space-y-4 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Scale size={16} className="text-blue-600" /> Add Unit of Measure
              </h3>
              <button
                onClick={() => setShowNewUnitModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateUnit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Unit Code / Symbol</label>
                <input
                  required
                  value={newUnitCode}
                  onChange={(e) => setNewUnitCode(e.target.value)}
                  placeholder="e.g. BDL, REEL, CTN"
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-mono uppercase text-xs"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Full Unit Label</label>
                <input
                  required
                  value={newUnitLabel}
                  onChange={(e) => setNewUnitLabel(e.target.value)}
                  placeholder="e.g. Bundle (BDL), Carton (CTN)"
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewUnitModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" icon={Plus}>
                  Save Unit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
