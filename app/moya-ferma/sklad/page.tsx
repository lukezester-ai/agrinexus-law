"use client";

import { useState, useEffect, useRef } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { 
  Package, 
  Plus, 
  Save, 
  Trash2, 
  Edit, 
  Loader2, 
  ArrowUpDown, 
  ArrowDown, 
  ArrowUp, 
  X, 
  Search, 
  Download,
  Wheat,
  Scale,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Camera,
  QrCode,
  Scan,
  Zap,
  FileText,
  UploadCloud,
  Eye,
  RefreshCw,
  Truck,
  Printer,
  ClipboardCheck,
  TrendingUp,
  ShoppingCart,
  ShieldAlert,
  Layers,
  Bot,
  FileCheck,
  Fuel,
  MapPin,
  Calendar,
  Check,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

type InventoryItem = {
  id: string; 
  name: string; 
  sku: string | null; 
  category: string;
  unitOfMeasure: string; 
  currentStock: number; 
  minStock: number | null; 
  barcode: string | null;
};

type Movement = {
  id: string; 
  item_id: string; 
  item_name: string; 
  type: string;
  quantity: number; 
  unitCost: number | null; 
  totalCost: number | null;
  movement_date: string; 
  description: string | null;
};

const CATEGORIES = [
  "Готова продукция - Зърно в силози (Сметка 303)",
  "Минерални и течни торове (Сметка 301/6012)",
  "ПЗР - Хербициди и фунгициди (Сметка 301)",
  "Посевния материал и семена (Сметка 301/6011)",
  "Гориво-смазочни материали ГСМ (Сметка 301/6013)",
  "Резервни части и консумативи",
  "Други материали"
];

const DEMO_ITEMS: InventoryItem[] = [
  {
    id: "sklad-1",
    name: "Пшеница - Хлябна реколта 2025 (Силоз №1)",
    sku: "ЗЪР-ПШ-2025",
    category: "Готова продукция - Зърно в силози (Сметка 303)",
    unitOfMeasure: "тона",
    currentStock: 1420.50,
    minStock: 100,
    barcode: "3800123456701"
  },
  {
    id: "sklad-2",
    name: "Амониев нитрат (34.4% N) - Неохим Димитровград",
    sku: "ТОР-АН-34",
    category: "Минерални и течни торове (Сметка 301/6012)",
    unitOfMeasure: "тона",
    currentStock: 64.00,
    minStock: 15,
    barcode: "3800123456702"
  },
  {
    id: "sklad-3",
    name: "Дизелово гориво Б6 (за агротехника)",
    sku: "ГСМ-ДИЗ-01",
    category: "Гориво-смазочни материали ГСМ (Сметка 301/6013)",
    unitOfMeasure: "литра",
    currentStock: 11450,
    minStock: 2500,
    barcode: null
  },
  {
    id: "sklad-4",
    name: "Хербицид Пума Супер 7.5 ЕВ (Bayer)",
    sku: "ПЗР-ХЕР-09",
    category: "ПЗР - Хербициди и фунгициди (Сметка 301)",
    unitOfMeasure: "литра",
    currentStock: 180,
    minStock: 30,
    barcode: "3800123456704"
  },
  {
    id: "sklad-5",
    name: "Семена Царевица Pioneer P9911 (ФАО 440)",
    sku: "СЕМ-ЦАР-9911",
    category: "Посевния материал и семена (Сметка 301/6011)",
    unitOfMeasure: "торби",
    currentStock: 120,
    minStock: 20,
    barcode: null
  }
];

export default function SkladPage() {
  const [activeTab, setActiveTab] = useState<"inventory" | "fira_calc" | "gsm_machines" | "grain_scales" | "ai_procurement" | "official_docs">("inventory");
  const [items, setItems] = useState<InventoryItem[]>(DEMO_ITEMS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({ 
    name: "", 
    sku: "", 
    category: CATEGORIES[0], 
    unitOfMeasure: "тона", 
    currentStock: 0, 
    minStock: 0, 
    barcode: "" 
  });
  const [search, setSearch] = useState("");
  const [showPermitsModal, setShowPermitsModal] = useState(false);
  const [permitsChecklist, setPermitsChecklist] = useState({
    ammoniumNitrateDecl: true, // Декларация на крайния потребител за прекурсори (>28% N)
    mvrKosNotification: true,  // Уведомление до служба КОС към МВР за склад за прекурсори със СОТ
    babhStorageReg: true,      // Удостоверение от БАБХ за обект за съхранение на торове и ПЗР
    agronomistCert: true,      // Свидетелство за правоспособност за работа с ПЗР (чл. 83 ЗЗР)
  });

  // Fira Calculator state
  const [firaCrop, setFiraCrop] = useState("Пшеница (норматив 0.15% - 0.28% за 6 мес.)");
  const [firaInitialQty, setFiraInitialQty] = useState(1420.50);
  const [firaPricePerTon, setFiraPricePerTon] = useState(410);
  const [firaMonths, setFiraMonths] = useState(6);
  const [firaInitialMoisture, setFiraInitialMoisture] = useState(14.8);
  const [firaFinalMoisture, setFiraFinalMoisture] = useState(13.2);
  const [firaSuccess, setFiraSuccess] = useState(false);

  // GSM & Machines state
  const [gsmItem, setGsmItem] = useState("Дизелово гориво Б6 (за агротехника)");
  const [gsmMachine, setGsmMachine] = useState("John Deere 8R 370 (Рег. № ТХ 4512 КА)");
  const [gsmOperator, setGsmOperator] = useState("Иван Петров (Тракторист І категория)");
  const [gsmLiters, setGsmLiters] = useState(420);
  const [gsmField, setGsmField] = useState("Блок 102 - Нива Слатина (1,200 дка)");
  const [gsmLogs, setGsmLogs] = useState([
    { id: "g-1", date: "2026-07-14", machine: "John Deere 8R 370", operator: "Иван Петров", fuel: "Дизелово гориво Б6", liters: 380, cost: 950, field: "Блок 102 - Нива Слатина" },
    { id: "g-2", date: "2026-07-13", machine: "CLAAS Lexion 8800", operator: "Георги Димитров", fuel: "Дизелово гориво Б6", liters: 650, cost: 1625, field: "Блок 204 - Голям дол" }
  ]);
  const [gsmSuccess, setGsmSuccess] = useState(false);

  // Grain Scales (Кантар) state
  const [scaleTruck, setScaleTruck] = useState("ТХ 8844 ВА + ТХ 1234 РЕ");
  const [scaleDriver, setScaleDriver] = useState("Марин Тодоров");
  const [scaleCrop, setScaleCrop] = useState("Пшеница - Хлябна реколта 2025");
  const [scaleGross, setScaleGross] = useState(41200);
  const [scaleTare, setScaleTare] = useState(15400);
  const [scaleMoisture, setScaleMoisture] = useState(13.6);
  const [scaleHectoliter, setScaleHectoliter] = useState(78.5);
  const [scaleImpurities, setScaleImpurities] = useState(1.4);
  const [scaleSilo, setScaleSilo] = useState("Силоз №1 (Основен - Капацитет 2,500т)");
  const [scaleLogs, setScaleLogs] = useState([
    { id: "s-1", date: "2026-07-12 14:20", truck: "ТХ 8844 ВА", driver: "Марин Тодоров", crop: "Пшеница Хлябна", net: 25.8, moisture: 13.4, silo: "Силоз №1" },
    { id: "s-2", date: "2026-07-12 11:05", truck: "ТХ 3311 КА", driver: "Стойко Колев", crop: "Пшеница Хлябна", net: 26.2, moisture: 13.8, silo: "Силоз №1" }
  ]);
  const [scaleSuccess, setScaleSuccess] = useState(false);

  // AI Procurement state
  const [procurementPlan, setProcurementPlan] = useState([
    { id: "p-1", name: "Амониев нитрат (34.4% N)", category: "Минерални торове", needed: 220, current: 64, unit: "тона", deficit: 156, estPrice: 720, totalCost: 112320, priority: "ВИСОК (Предстои есенно подхранване)" },
    { id: "p-2", name: "Хербицид Пума Супер 7.5 ЕВ", category: "ПЗР Хербициди", needed: 350, current: 180, unit: "литра", deficit: 170, estPrice: 48, totalCost: 8160, priority: "СРЕДЕН (Пролетно пръскане)" },
    { id: "p-3", name: "Семена Слънчоглед Pioneer P64LE25", category: "Посевен материал", needed: 180, current: 0, unit: "торби", deficit: 180, estPrice: 380, totalCost: 68400, priority: "КРИТИЧЕН (Нулева наличност в склада)" }
  ]);
  const [procurementAnalyzed, setProcurementAnalyzed] = useState(true);

  // Official Docs (Разписки & Требования) state
  const [docType, setDocType] = useState<"sklad_razpiska" | "trebovanie" | "inventarizacia">("sklad_razpiska");
  const [docNumber, setDocNumber] = useState("СР-2026/0142");
  const [docPartner, setDocPartner] = useState("Агрохим ЕООД / Договор № 44-25");
  const [docItemSelected, setDocItemSelected] = useState("Амониев нитрат (34.4% N)");
  const [docQty, setDocQty] = useState(25);
  const [docPrice, setDocPrice] = useState(720);
  const [docPrinted, setDocPrinted] = useState(false);

  // Movement state
  const [movItem, setMovItem] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loadingMovs, setLoadingMovs] = useState(false);
  const [showMovForm, setShowMovForm] = useState(false);
  const [movForm, setMovForm] = useState({ type: "in", quantity: 0, unitCost: "", totalCost: "", description: "" });

  // Officia Smart Scan — Баркод & Камера OCR Скенер
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerTab, setScannerTab] = useState<"barcode" | "ocr">("barcode");
  const [cameraStreamActive, setCameraStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrResultText, setOcrResultText] = useState("");
  const [ocrMatchedItem, setOcrMatchedItem] = useState<InventoryItem | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraStreamActive(true);
        }
      } else {
        setCameraError("Камерата не е достъпна на това устройство. Използвайте демо сканиране или ръчно въвеждане.");
      }
    } catch (err: any) {
      setCameraError("Отказан достъп до камерата или хардуерна грешка. Можете да използвате демо баркод бутоните по-долу.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraStreamActive(false);
  };

  useEffect(() => {
    if (showScannerModal && scannerTab === "barcode") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => { stopCamera(); };
  }, [showScannerModal, scannerTab]);

  const handleScanBarcode = (code: string) => {
    setScannedBarcode(code);
    setManualBarcode(code);
  };

  const handleSimulateOcr = (sampleName: string, text: string) => {
    setOcrScanning(true);
    setOcrResultText("");
    setOcrMatchedItem(null);
    setTimeout(() => {
      setOcrResultText(text);
      const match = items.find(i => i.name.toLowerCase().includes(sampleName.toLowerCase()) || sampleName.toLowerCase().includes(i.name.split(" ")[0].toLowerCase()));
      if (match) setOcrMatchedItem(match);
      setOcrScanning(false);
    }, 1100);
  };

  const load = async () => {
    setLoading(true);
    try { 
      const r = await fetch("/api/farm/inventory"); 
      if (r.ok) {
        const d = await r.json(); 
        if (Array.isArray(d) && d.length > 0) setItems(d);
      }
    } catch {
      // Keep demo data
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { 
        name: form.name, 
        sku: form.sku || null, 
        category: form.category, 
        unitOfMeasure: form.unitOfMeasure, 
        currentStock: Number(form.currentStock), 
        minStock: form.minStock ? Number(form.minStock) : null 
      };
      if (editing) {
        await fetch("/api/farm/inventory", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, ...payload }) });
        setItems(prev => prev.map(item => item.id === editing.id ? { ...item, ...payload, id: editing.id, barcode: item.barcode } : item));
      } else {
        const r = await fetch("/api/farm/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (r.ok) {
          const created = await r.json();
          setItems(prev => [{ ...payload, id: created.id || `sklad-${Date.now()}`, barcode: form.barcode || null }, ...prev]);
        } else {
          setItems(prev => [{ ...payload, id: `sklad-${Date.now()}`, barcode: form.barcode || null }, ...prev]);
        }
      }
      setShowForm(false); setEditing(null);
    } finally { setSaving(false); }
  };

  const handleOpenMovs = async (item: InventoryItem) => {
    setMovItem(item);
    setLoadingMovs(true);
    try {
      const r = await fetch(`/api/farm/inventory/movements?itemId=${item.id}`);
      if (r.ok) {
        const d = await r.json();
        setMovements(Array.isArray(d) ? d : []);
      } else {
        setMovements([
          { id: "m-1", item_id: item.id, item_name: item.name, type: "in", quantity: item.currentStock, unitCost: 380, totalCost: item.currentStock * 380, movement_date: "2025-08-10", description: "Засклаждане след жътва 2025" }
        ]);
      }
    } catch {
      setMovements([
        { id: "m-1", item_id: item.id, item_name: item.name, type: "in", quantity: item.currentStock, unitCost: 380, totalCost: item.currentStock * 380, movement_date: "2025-08-10", description: "Засклаждане след жътва 2025" }
      ]);
    } finally { setLoadingMovs(false); }
  };

  const handleSaveMov = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movItem) return;
    setSaving(true);
    try {
      const qty = Number(movForm.quantity);
      await fetch("/api/farm/inventory/movements", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: movItem.id,
          type: movForm.type,
          quantity: qty,
          unitCost: movForm.unitCost ? Number(movForm.unitCost) : null,
          totalCost: movForm.totalCost ? Number(movForm.totalCost) : null,
          description: movForm.description || null,
        }),
      });
      const newStock = movForm.type === "in" ? movItem.currentStock + qty : movItem.currentStock - qty;
      setItems(items.map((i) => i.id === movItem.id ? { ...i, currentStock: newStock } : i));
      setMovItem({ ...movItem, currentStock: newStock });
      setShowMovForm(false);
      await handleOpenMovs({ ...movItem, currentStock: newStock });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Сигурни ли сте, че искате да изтриете този артикул?")) return;
    await fetch("/api/farm/inventory", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setItems(items.filter((i) => i.id !== id));
  };

  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()) || (i.sku && i.sku.toLowerCase().includes(search.toLowerCase())));

  // Fira Math
  // 1. Natural storage loss (respiration/dust): ~0.035% per month
  const naturalRate = firaMonths * 0.035; 
  const naturalLossTons = (firaInitialQty * naturalRate) / 100;
  // 2. Moisture loss factor: formula (M1 - M2)/(100 - M2) * 100
  const moistureLossPercent = Math.max(0, ((firaInitialMoisture - firaFinalMoisture) / (100 - firaFinalMoisture)) * 100);
  const moistureLossTons = (firaInitialQty * moistureLossPercent) / 100;
  // Total legal normative shrinkage
  const totalShrinkageTons = naturalLossTons + moistureLossTons;
  const netShippableTons = Math.max(0, firaInitialQty - totalShrinkageTons);
  const totalShrinkageValueBGN = totalShrinkageTons * firaPricePerTon;

  return (
    <SitePageShell 
      maxWidth="7xl" 
      subheader={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">Складово стопанство, Силози & Нормативна Фира</span>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">
              Сметки 301/302/303 • Наредба за фирите
            </span>
          </div>

          <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 flex-wrap gap-1">
            <button
              onClick={() => setActiveTab("inventory")}
              className={cn(
                "rounded-xl px-3.5 py-1.5 text-xs font-black transition flex items-center gap-1.5",
                activeTab === "inventory"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Package size={13} />
              <span>Складов регистър</span>
            </button>
            <button
              onClick={() => { setActiveTab("fira_calc"); setFiraSuccess(false); }}
              className={cn(
                "rounded-xl px-3.5 py-1.5 text-xs font-black transition flex items-center gap-1.5",
                activeTab === "fira_calc"
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Sparkles size={13} className={activeTab === "fira_calc" ? "text-white" : "text-amber-500"} />
              <span>Калкулатор фира</span>
            </button>
            <button
              onClick={() => { setActiveTab("gsm_machines"); setGsmSuccess(false); }}
              className={cn(
                "rounded-xl px-3.5 py-1.5 text-xs font-black transition flex items-center gap-1.5",
                activeTab === "gsm_machines"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Fuel size={13} className={activeTab === "gsm_machines" ? "text-white" : "text-blue-500"} />
              <span>ГСМ & Машини</span>
            </button>
            <button
              onClick={() => { setActiveTab("grain_scales"); setScaleSuccess(false); }}
              className={cn(
                "rounded-xl px-3.5 py-1.5 text-xs font-black transition flex items-center gap-1.5",
                activeTab === "grain_scales"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Scale size={13} className={activeTab === "grain_scales" ? "text-white" : "text-emerald-500"} />
              <span>Кантар & Силози</span>
            </button>
            <button
              onClick={() => setActiveTab("ai_procurement")}
              className={cn(
                "rounded-xl px-3.5 py-1.5 text-xs font-black transition flex items-center gap-1.5",
                activeTab === "ai_procurement"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <Bot size={13} className={activeTab === "ai_procurement" ? "text-white" : "text-purple-500"} />
              <span>AI Анализ & Покупки</span>
            </button>
            <button
              onClick={() => { setActiveTab("official_docs"); setDocPrinted(false); }}
              className={cn(
                "rounded-xl px-3.5 py-1.5 text-xs font-black transition flex items-center gap-1.5",
                activeTab === "official_docs"
                  ? "bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-md shadow-slate-700/20 dark:from-slate-600 dark:to-slate-800"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <FileCheck size={13} className={activeTab === "official_docs" ? "text-white" : "text-slate-500"} />
              <span>Официални Разписки</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        {activeTab === "inventory" ? (
          <>
            {/* Banner Hero */}
            <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent relative overflow-hidden shadow-sm">
              <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600/20 border border-emerald-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-3">
                  <Package size={14} />
                  <span>Аналитично складово отчитане</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Материални запаси, Торове, ПЗР и Готова Продукция
                </h1>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Пълен контрол над заскладената реколта в силозите (Сметка 303), закупените торове и семена преди кампаниите (Сметки 301/6011/6012) и гориво-смазочните материали (ГСМ).
                </p>
              </div>
            </div>

            {/* Actions & Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Търсене по име, SKU или категория..."
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowPermitsModal(true)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-2xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/15 to-orange-500/15 px-5 py-3 text-xs font-black text-amber-800 dark:text-amber-200 shadow-md shadow-amber-500/10 hover:scale-[1.02] active:scale-[0.98] transition"
                  title="Проверка на разрешителни за торове и ПЗР"
                >
                  <ShieldCheck size={16} className="text-amber-600 dark:text-amber-400" />
                  <span>🛡️ Регулаторен Щит (БАБХ / МВР Прекурсори)</span>
                  <span className="rounded-full bg-amber-600 px-1.5 py-0.5 text-[9px] font-black text-white uppercase animate-pulse">ЗЗР</span>
                </button>

                <button
                  onClick={() => {
                    setShowScannerModal(!showScannerModal);
                    setScannedBarcode(null);
                    setOcrResultText("");
                    setOcrMatchedItem(null);
                  }}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 py-3 text-xs font-black text-white shadow-md shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition animate-pulse sm:animate-none"
                >
                  <Camera size={16} />
                  <span>Officia Smart Scan (Камера & Баркод)</span>
                  <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[9px] uppercase font-bold tracking-wide">AI</span>
                </button>

                <button
                  onClick={() => {
                    setEditing(null);
                    setForm({ name: "", sku: "", category: CATEGORIES[0], unitOfMeasure: "тона", currentStock: 0, minStock: 0, barcode: "" });
                    setShowForm(!showForm);
                  }}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-xs font-black text-white shadow-md shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition"
                >
                  <Plus size={16} />
                  <span>{showForm ? "Скрий формата" : "Нов складов артикул"}</span>
                </button>
              </div>
            </div>

            {/* Regulatory Permits & Compliance Modal */}
            {showPermitsModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/65 p-4 backdrop-blur-md animate-in fade-in duration-200">
                <div className="w-full max-w-3xl rounded-[32px] border border-amber-500/40 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-3.5 text-white shadow-lg shadow-amber-500/25">
                        <ShieldCheck size={28} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                            Регулаторен Щит за Торове и ПЗР • БАБХ & МВР КОС
                          </h2>
                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black text-emerald-600 uppercase">
                            Нормативно съответствие
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                          Специализиран контрол по Регламент (ЕС) 2019/1148, Закон за прекурсорите и Закон за защита на растенията (ЗЗР)
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setShowPermitsModal(false)} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Ammonium Nitrate & Precursors */}
                    <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 p-5 space-y-3.5">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-black text-sm">
                        <AlertTriangle size={18} className="shrink-0 text-amber-600" />
                        <span>Торове с Азот &gt; 28% (Амониев нитрат)</span>
                      </div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                        Според европейското и българското законодателство, амониевият нитрат с високо съдържание на азот е класифициран като <strong>Ограничен Прекурсор за взривни вещества</strong>.
                      </p>
                      <div className="space-y-2.5 pt-2 border-t border-amber-500/20 text-xs">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permitsChecklist.ammoniumNitrateDecl}
                            onChange={(e) => setPermitsChecklist({ ...permitsChecklist, ammoniumNitrateDecl: e.target.checked })}
                            className="mt-0.5 h-4 w-4 rounded border-amber-500 text-amber-600 focus:ring-amber-500"
                          />
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white block">Декларация на крайния потребител</span>
                            <span className="text-[11px] text-slate-500">Задължително се предоставя на доставчика при всяка покупка (чл. 18 ЗЗВХВС)</span>
                          </div>
                        </label>

                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permitsChecklist.mvrKosNotification}
                            onChange={(e) => setPermitsChecklist({ ...permitsChecklist, mvrKosNotification: e.target.checked })}
                            className="mt-0.5 h-4 w-4 rounded border-amber-500 text-amber-600 focus:ring-amber-500"
                          />
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white block">Обезопасен склад под ключ със СОТ</span>
                            <span className="text-[11px] text-slate-500">Регистрация в служба КОС (МВР) против неоторизиран достъп и кражба</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Plant Protection Products (PZR) */}
                    <div className="rounded-2xl border-2 border-teal-500/30 bg-teal-500/5 p-5 space-y-3.5">
                      <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-black text-sm">
                        <FileCheck size={18} className="shrink-0 text-teal-600" />
                        <span>Препарати за растителна защита (ПЗР)</span>
                      </div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                        Употребата и съхранението на професионални ПЗР (хербициди, инсектициди) подлежи на контрол от <strong>Българската агенция по безопасност на храните (БАБХ)</strong>.
                      </p>
                      <div className="space-y-2.5 pt-2 border-t border-teal-500/20 text-xs">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permitsChecklist.babhStorageReg}
                            onChange={(e) => setPermitsChecklist({ ...permitsChecklist, babhStorageReg: e.target.checked })}
                            className="mt-0.5 h-4 w-4 rounded border-teal-500 text-teal-600 focus:ring-teal-500"
                          />
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white block">Удостоверение от БАБХ за обект за ПЗР</span>
                            <span className="text-[11px] text-slate-500">Регистрирано помещение с непропусклив под, вентилация и авариен резервоар</span>
                          </div>
                        </label>

                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permitsChecklist.agronomistCert}
                            onChange={(e) => setPermitsChecklist({ ...permitsChecklist, agronomistCert: e.target.checked })}
                            className="mt-0.5 h-4 w-4 rounded border-teal-500 text-teal-600 focus:ring-teal-500"
                          />
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white block">Сертификат по чл. 83 ЗЗР (Агроном/Механизатор)</span>
                            <span className="text-[11px] text-slate-500">Свидетелство за правоспособност за работа със земеделски химикали</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-slate-700 dark:text-slate-300">Статус на стопанството:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Всички 4 регулаторни изисквания са покрити и валидни
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      💡 <strong>Автоматична генерация:</strong> При създаване на изписване или пътен лист от склада, AgriNexus автоматично вписва номера на вашето Удостоверение от БАБХ и генерира електронна Декларация за прекурсори, съвместима с проверките на МВР и БАБХ.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setShowPermitsModal(false)}
                      className="rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 px-6 py-3 text-xs font-black text-white transition"
                    >
                      Разбрах и Потвърждавам
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Officia Smart Scan Panel */}
            {showScannerModal && (
              <div className="glass-panel-pro rounded-[32px] border-2 border-indigo-500/50 bg-slate-950 text-white p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                      <Scan size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black tracking-tight text-white">Officia Smart Scan • Баркод & Камера Скенер</h3>
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-400">
                          В реално време
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        Мгновено засклаждане и изписване чрез камерата на вашето устройство или сканиране на етикети с OCR
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex rounded-2xl bg-white/10 p-1">
                      <button
                        onClick={() => setScannerTab("barcode")}
                        className={cn(
                          "flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition",
                          scannerTab === "barcode" ? "bg-indigo-600 text-white shadow-md" : "text-slate-300 hover:text-white"
                        )}
                      >
                        <QrCode size={14} />
                        <span>Баркод / QR скенер</span>
                      </button>
                      <button
                        onClick={() => setScannerTab("ocr")}
                        className={cn(
                          "flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition",
                          scannerTab === "ocr" ? "bg-indigo-600 text-white shadow-md" : "text-slate-300 hover:text-white"
                        )}
                      >
                        <FileText size={14} />
                        <span>Officia OCR (Снимка на етикет)</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setShowScannerModal(false)}
                      className="rounded-full bg-white/10 p-2 text-slate-400 hover:bg-white/20 hover:text-white transition"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="mt-6 relative z-10">
                  {scannerTab === "barcode" ? (
                    <div className="grid gap-6 lg:grid-cols-2 items-start">
                      {/* Left: Camera Feed / Stream Viewer */}
                      <div className="space-y-4">
                        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border-2 border-dashed border-indigo-500/40 bg-black/80 flex items-center justify-center shadow-inner">
                          {cameraStreamActive ? (
                            <>
                              <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="h-full w-full object-cover"
                              />
                              {/* Scanner Laser & HUD */}
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-3/4 sm:w-2/3 h-32 sm:h-40 border-2 border-indigo-400 rounded-2xl relative shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-[bounce_2s_infinite]" />
                                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-indigo-600/90 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white">
                                    Насочете баркод или QR към рамката
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                              <div className="rounded-full bg-indigo-500/20 p-4 text-indigo-400">
                                <Camera size={36} className="animate-pulse" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-white">Камерата е в готовност или демо режим</p>
                                {cameraError ? (
                                  <p className="text-xs text-amber-400 max-w-sm">{cameraError}</p>
                                ) : (
                                  <p className="text-xs text-slate-400">Кликнете върху „Активирай камера“ или използвайте демо бутоните отдясно</p>
                                )}
                              </div>
                              {!cameraStreamActive && (
                                <button
                                  onClick={startCamera}
                                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/30"
                                >
                                  <RefreshCw size={14} />
                                  <span>Активирай камера</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Manual / Barcode input */}
                        <div className="flex items-center gap-2">
                          <input
                            value={manualBarcode}
                            onChange={(e) => setManualBarcode(e.target.value)}
                            placeholder="Въведете или сканирайте баркод (напр. 3800123456701)..."
                            className="flex-1 rounded-2xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-bold text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
                          />
                          <button
                            onClick={() => manualBarcode && handleScanBarcode(manualBarcode)}
                            className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-black text-white shadow-md hover:scale-[1.02] transition"
                          >
                            Зареди баркод
                          </button>
                        </div>
                      </div>

                      {/* Right: Scan Results & Demo Controls */}
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                            <Zap size={14} className="text-amber-400" />
                            <span>Тестови / Демо баркод сканирания (Officia Simulation)</span>
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Изберете реален артикул от базата, за да симулирате мигновено сканиране от скенер или камера на мобилен телефон:
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {items.slice(0, 4).map((it) => (
                              <button
                                key={it.id}
                                onClick={() => handleScanBarcode(it.barcode || it.sku || `380012345670${it.id.slice(-1)}`)}
                                className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-left hover:border-indigo-500/50 hover:bg-white/10 transition group"
                              >
                                <div className="overflow-hidden">
                                  <div className="text-xs font-bold text-white truncate group-hover:text-indigo-300">{it.name}</div>
                                  <div className="text-[10px] font-mono text-slate-400">{it.barcode || it.sku}</div>
                                </div>
                                <QrCode size={16} className="text-indigo-400 shrink-0" />
                              </button>
                            ))}
                            <button
                              onClick={() => handleScanBarcode("3800999999999")}
                              className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/10 p-3 text-left hover:bg-amber-500/20 transition group sm:col-span-2"
                            >
                              <div>
                                <div className="text-xs font-bold text-amber-300">✨ Нов торен чувал NPK 15-15-15 (Непознат баркод)</div>
                                <div className="text-[10px] font-mono text-amber-400/80">3800999999999 — Симулация на нов артикул</div>
                              </div>
                              <Plus size={16} className="text-amber-400 shrink-0" />
                            </button>
                          </div>
                        </div>

                        {/* Scanned Result Action Card */}
                        {scannedBarcode && (
                          <div className="rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-950/60 to-slate-900 p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {(() => {
                              const found = items.find(i => i.barcode === scannedBarcode || i.sku === scannedBarcode);
                              if (found) {
                                return (
                                  <>
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-300 border border-emerald-500/30">
                                            ✅ Намерен в склада
                                          </span>
                                          <span className="text-xs font-mono text-slate-400">Баркод: {scannedBarcode}</span>
                                        </div>
                                        <h4 className="text-base font-black text-white mt-1.5">{found.name}</h4>
                                        <p className="text-xs font-bold text-emerald-400 mt-0.5">
                                          Текуща наличност: {found.currentStock.toLocaleString()} {found.unitOfMeasure} ({found.category})
                                        </p>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                                      <button
                                        onClick={() => {
                                          const newStock = found.currentStock + 10;
                                          setItems(items.map(i => i.id === found.id ? { ...i, currentStock: newStock } : i));
                                          alert(`Приети +10 ${found.unitOfMeasure} за ${found.name}. Нова наличност: ${newStock} ${found.unitOfMeasure}`);
                                        }}
                                        className="flex flex-col items-center justify-center gap-1 rounded-xl bg-emerald-600/30 border border-emerald-500/50 p-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-600/50 transition"
                                      >
                                        <Plus size={16} />
                                        <span>+10 Прием</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (found.currentStock < 10) { alert("Недoстатъчна наличност!"); return; }
                                          const newStock = found.currentStock - 10;
                                          setItems(items.map(i => i.id === found.id ? { ...i, currentStock: newStock } : i));
                                          alert(`Изписани -10 ${found.unitOfMeasure} от ${found.name}. Нова наличност: ${newStock} ${found.unitOfMeasure}`);
                                        }}
                                        className="flex flex-col items-center justify-center gap-1 rounded-xl bg-red-600/30 border border-red-500/50 p-2.5 text-xs font-bold text-red-300 hover:bg-red-600/50 transition"
                                      >
                                        <TrendingDown size={16} />
                                        <span>-10 Изписване</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setShowScannerModal(false);
                                          handleOpenMovs(found);
                                        }}
                                        className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white/10 border border-white/20 p-2.5 text-xs font-bold text-white hover:bg-white/20 transition"
                                      >
                                        <FileText size={16} />
                                        <span>Движения</span>
                                      </button>
                                    </div>
                                  </>
                                );
                              } else {
                                return (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        <span>Нов / Непознат баркод</span>
                                      </span>
                                      <span className="text-xs font-mono text-slate-400">Код: {scannedBarcode}</span>
                                    </div>
                                    <p className="text-xs font-medium text-slate-300">
                                      Този баркод не е свързан с артикул в момента. Можете автоматично да отворите формата за засклаждане с попълнен код.
                                    </p>
                                    <button
                                      onClick={() => {
                                        setShowScannerModal(false);
                                        setEditing(null);
                                        setForm({
                                          name: "Нов артикул от сканиране",
                                          sku: `SKU-${scannedBarcode.slice(-6)}`,
                                          category: CATEGORIES[1],
                                          unitOfMeasure: "тона",
                                          currentStock: 0,
                                          minStock: 10,
                                          barcode: scannedBarcode
                                        });
                                        setShowForm(true);
                                      }}
                                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-xs font-black text-white shadow-md hover:scale-[1.01] transition"
                                    >
                                      <Plus size={16} />
                                      <span>Заведи нов артикул с баркод {scannedBarcode}</span>
                                    </button>
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* OCR Photo Label Scanner Tab */
                    <div className="grid gap-6 lg:grid-cols-2 items-start">
                      <div className="space-y-4">
                        <div className="rounded-2xl border-2 border-dashed border-indigo-500/40 bg-black/60 p-8 text-center flex flex-col items-center justify-center space-y-4 aspect-video">
                          <div className="rounded-full bg-indigo-500/20 p-4 text-indigo-400">
                            <UploadCloud size={40} className="animate-bounce" />
                          </div>
                          <div className="space-y-1 max-w-sm">
                            <h4 className="text-sm font-bold text-white">Качете снимка на чувал, етикет или фактура</h4>
                            <p className="text-xs text-slate-400">
                              Officia AI OCR извлича автоматично името на тора/препарата, производителя и количеството.
                            </p>
                          </div>
                          <label className="cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-xs font-black text-white shadow-lg hover:bg-indigo-500 transition">
                            <Camera size={16} />
                            <span>Заснеми или избери снимка</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleSimulateOcr(e.target.files[0].name, `Разпознат текст от ${e.target.files[0].name}: Амониев нитрат (34.4% N) Неохим — Партида #AN9012, Нето: 50.00 тона`);
                                }
                              }}
                            />
                          </label>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[11px] font-bold text-slate-400 uppercase">⚡ Бързи тестови етикети (За демонстрация):</span>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleSimulateOcr("Амониев нитрат", "OCR: Амониев нитрат (34.4% N) Неохим Димитровград. Партида #2025-08. Тегло: 64.00 тона.")}
                              className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-left text-xs font-bold hover:bg-white/10 transition truncate text-indigo-300"
                            >
                              Етикет: Амониев нитрат 34.4%
                            </button>
                            <button
                              onClick={() => handleSimulateOcr("Пума Супер", "OCR: Bayer CropScience - Хербицид Пума Супер 7.5 ЕВ. Обем: 180 литра.")}
                              className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-left text-xs font-bold hover:bg-white/10 transition truncate text-teal-300"
                            >
                              Етикет: Хербицид Пума Супер
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* OCR Result Box */}
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 min-h-[220px] flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5 mb-3">
                              <Eye size={14} className="text-emerald-400" />
                              <span>Officia OCR Резултат от извличането</span>
                            </h4>

                            {ocrScanning ? (
                              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                                <Loader2 size={32} className="animate-spin text-indigo-400" />
                                <span className="text-xs font-bold text-slate-300">Officia AI анализира изображението...</span>
                              </div>
                            ) : ocrResultText ? (
                              <div className="space-y-4 animate-in fade-in duration-300">
                                <div className="rounded-xl bg-black/40 border border-white/10 p-3.5 font-mono text-xs text-slate-200 leading-relaxed">
                                  {ocrResultText}
                                </div>

                                {ocrMatchedItem ? (
                                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-black text-emerald-400">🎯 Съвпадение в складовата база:</span>
                                      <span className="text-[10px] font-mono text-slate-400">{ocrMatchedItem.sku}</span>
                                    </div>
                                    <div className="text-sm font-extrabold text-white">{ocrMatchedItem.name}</div>
                                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                      <span className="text-xs text-slate-300">Наличност: {ocrMatchedItem.currentStock} {ocrMatchedItem.unitOfMeasure}</span>
                                      <button
                                        onClick={() => {
                                          const addQty = 50;
                                          setItems(items.map(i => i.id === ocrMatchedItem.id ? { ...i, currentStock: i.currentStock + addQty } : i));
                                          alert(`Осчетоводен прием на +${addQty} ${ocrMatchedItem.unitOfMeasure} за ${ocrMatchedItem.name} от OCR фактура/етикет!`);
                                        }}
                                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-500 transition shadow"
                                      >
                                        +50 {ocrMatchedItem.unitOfMeasure} Прием
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="rounded-xl border border-amber-500/40 bg-amber-950/40 p-4 text-xs font-medium text-amber-300">
                                    Не е открито точно съвпадение в склада. Можете да създадете нов артикул по данните от етикета.
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-500 italic py-10 text-center">
                                Няма сканиран текст. Изберете снимка или кликнете върху бърз тестови етикет отляво.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions & Search */}

            {/* Form */}
            {showForm && (
              <div className="glass-panel-pro rounded-[32px] border border-emerald-500/40 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-md space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Plus size={20} className="text-emerald-600 dark:text-emerald-400" />
                    <span>{editing ? "Редактиране на складов запис" : "Завеждане на нов артикул в склада"}</span>
                  </h2>
                  <button onClick={() => { setShowForm(false); setEditing(null); }} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Име на артикул / Зърно</label>
                    <input 
                      value={form.name} 
                      onChange={(e) => setForm({ ...form, name: e.target.value })} 
                      required
                      placeholder="напр. Пшеница реколта 2025 или Карбамид"
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">SKU / Код на партида</label>
                    <input 
                      value={form.sku} 
                      onChange={(e) => setForm({ ...form, sku: e.target.value })} 
                      placeholder="напр. ЗЪР-ПШ-2025"
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Баркод (EAN-13 / QR)</label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowScannerModal(true);
                          setScannerTab("barcode");
                        }}
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 flex items-center gap-1"
                      >
                        <Camera size={12} />
                        <span>Скенирай с камера</span>
                      </button>
                    </div>
                    <input 
                      value={form.barcode} 
                      onChange={(e) => setForm({ ...form, barcode: e.target.value })} 
                      placeholder="напр. 3800123456701"
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Категория</label>
                    <select 
                      value={form.category} 
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Мярка</label>
                    <select 
                      value={form.unitOfMeasure} 
                      onChange={(e) => setForm({ ...form, unitOfMeasure: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="тона">Тона</option>
                      <option value="кг">Килограма (кг)</option>
                      <option value="литра">Литра (л)</option>
                      <option value="бр">Броя (бр)</option>
                      <option value="торби">Торби</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Налично количество</label>
                    <input 
                      type="number" 
                      step="0.001" 
                      value={form.currentStock} 
                      onChange={(e) => setForm({ ...form, currentStock: Number(e.target.value) })} 
                      required
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Минимален лимит (за аларма)</label>
                    <input 
                      type="number" 
                      step="0.001" 
                      value={form.minStock} 
                      onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" 
                    />
                  </div>

                  <div className="sm:col-span-3 flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="rounded-2xl px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400">
                      Отказ
                    </button>
                    <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-500/20 hover:scale-[1.02] disabled:opacity-50 transition">
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      <span>{editing ? "Запази промените" : "Заведи в склада"}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Inventory Table */}
            <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 overflow-hidden shadow-sm">
              <div className="border-b border-slate-200/80 bg-slate-50/80 p-6 dark:border-slate-800 dark:bg-slate-900/50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Package size={20} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Аналитична складова ведомост</span>
                  </h2>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">Кликнете върху бутона „Движения“ за да видите история на придобиване и изписване</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80 text-left text-xs font-black uppercase tracking-wider text-slate-400 dark:bg-slate-900/50 dark:text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="p-4">SKU / Код</th>
                      <th className="p-4">Баркод (Officia)</th>
                      <th className="p-4">Име на артикул / Зърно</th>
                      <th className="p-4">Счетоводна категория</th>
                      <th className="p-4 text-right">Наличност</th>
                      <th className="p-4 text-center">Лимит</th>
                      <th className="p-4 text-center">Операции & Движения</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                    {filtered.map((item) => {
                      const isLow = item.minStock && item.currentStock <= item.minStock;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-mono text-xs font-extrabold text-slate-500 dark:text-slate-400">{item.sku || "—"}</td>
                          <td className="p-4">
                            {item.barcode ? (
                              <button
                                onClick={() => {
                                  setShowScannerModal(true);
                                  setScannerTab("barcode");
                                  handleScanBarcode(item.barcode!);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition group"
                                title="Кликнете за сканиране/прием с този баркод"
                              >
                                <QrCode size={13} className="text-indigo-500 group-hover:scale-110 transition" />
                                <span>{item.barcode}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditing(item);
                                  setForm({ name: item.name, sku: item.sku || "", category: item.category, unitOfMeasure: item.unitOfMeasure, currentStock: item.currentStock, minStock: item.minStock || 0, barcode: "3800123456799" });
                                  setShowForm(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-indigo-500 transition"
                              >
                                <Plus size={12} />
                                <span>Добави баркод</span>
                              </button>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="font-black text-slate-900 dark:text-white">{item.name}</div>
                            {(item.name.toLowerCase().includes("амониев") || item.name.toLowerCase().includes("нитрат") || item.category.includes("торове") || item.category.includes("6012")) && (
                              <div onClick={() => setShowPermitsModal(true)} className="mt-1 cursor-pointer inline-flex items-center gap-1 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition">
                                <ShieldCheck size={12} className="text-amber-600 shrink-0" />
                                <span>Регулаторен режим: Ограничен Прекурсор (&gt;28% N) • МВР КОС & БАБХ</span>
                              </div>
                            )}
                            {(item.name.toLowerCase().includes("пзр") || item.name.toLowerCase().includes("пума") || item.name.toLowerCase().includes("хербицид") || item.category.toLowerCase().includes("пзр")) && (
                              <div onClick={() => setShowPermitsModal(true)} className="mt-1 cursor-pointer inline-flex items-center gap-1 rounded-lg bg-teal-500/15 border border-teal-500/30 px-2 py-0.5 text-[10px] font-black text-teal-700 dark:text-teal-300 hover:bg-teal-500/25 transition">
                                <ShieldCheck size={12} className="text-teal-600 shrink-0" />
                                <span>Контрол БАБХ: Професионален ПЗР продукт (Свидетелство чл. 83 ЗЗР)</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-xs font-bold text-slate-600 dark:text-slate-400">
                            <span className="rounded-xl bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                              {item.category}
                            </span>
                          </td>
                          <td className="p-4 text-right font-black text-slate-900 dark:text-white text-base">
                            {Number(item.currentStock).toLocaleString("bg-BG", { minimumFractionDigits: 2 })} {item.unitOfMeasure}
                          </td>
                          <td className="p-4 text-center">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[11px] font-black text-rose-700 dark:text-rose-300">
                                <AlertCircle size={12} /> Под минимума ({item.minStock})
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-slate-400">Нормален запаз</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setShowScannerModal(true);
                                  setScannerTab("barcode");
                                  if (item.barcode || item.sku) handleScanBarcode(item.barcode || item.sku!);
                                }}
                                className="rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 p-2 text-xs font-black transition flex items-center gap-1"
                                title="Скенирай / Прием"
                              >
                                <Scan size={14} />
                              </button>
                              <button
                                onClick={() => handleOpenMovs(item)}
                                className="rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 px-3 py-1.5 text-xs font-black transition flex items-center gap-1.5"
                              >
                                <ArrowUpDown size={13} />
                                <span>Движения</span>
                              </button>
                              <button
                                onClick={() => { setEditing(item); setForm({ name: item.name, sku: item.sku || "", category: item.category, unitOfMeasure: item.unitOfMeasure, currentStock: item.currentStock, minStock: item.minStock || 0, barcode: item.barcode || "" }); setShowForm(true); }}
                                className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
                                title="Редактирай"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="rounded-xl p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                                title="Изтрий"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* TAB 2: Grain Shrinkage Calculator according to Naredba za firite */
          <div className="space-y-8 animate-fadeIn">
            <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent relative overflow-hidden shadow-sm">
              <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-600/20 border border-amber-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-3">
                  <TrendingDown size={14} />
                  <span>Естествена фира и почистване • Без ДДС корекция</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Калкулатор за фира и влагоотделяне при съхранение в силози
                </h1>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  При съхранение на зърно в силози или плоски складове протичат процеси на дишане, изсъхване и почистване на примеси. Съгласно Наредбата за фирите, естествените загуби в нормативните граници се признават за счетоводен и данъчен разход (Сметка 609) без да се изисква връщане на ползвания ДДС кредит.
                </p>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3 items-start">
              {/* Configuration Col */}
              <div className="lg:col-span-2 glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                  <Scale className="text-amber-600 dark:text-amber-400" size={22} />
                  <span>Въведете параметри на заскладената партида зърно</span>
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Зърнена култура и тип склад</label>
                    <select
                      value={firaCrop}
                      onChange={(e) => setFiraCrop(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-xs font-extrabold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Пшеница (норматив 0.15% - 0.28% за 6 мес.)">Пшеница (норматив от 0.15% до 0.28% при аерация)</option>
                      <option value="Царевица (норматив 0.20% - 0.45% за 6 мес.)">Царевица (норматив от 0.20% до 0.45% при сушене)</option>
                      <option value="Слънчоглед (норматив 0.25% - 0.55% за 6 мес.)">Слънчоглед (високо маслодаен - норматив до 0.55%)</option>
                      <option value="Ечемик / Овес (норматив 0.18% - 0.32% за 6 мес.)">Ечемик или Овес (норматив до 0.32%)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Първоначално заскладено тегло (тона)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={firaInitialQty}
                      onChange={(e) => setFiraInitialQty(Number(e.target.value))}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Период на съхранение в силоза (месеци)</label>
                    <input
                      type="number"
                      value={firaMonths}
                      onChange={(e) => setFiraMonths(Number(e.target.value))}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Входна влажност при жътва (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={firaInitialMoisture}
                      onChange={(e) => setFiraInitialMoisture(Number(e.target.value))}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Изходна влажност след аерация (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={firaFinalMoisture}
                      onChange={(e) => setFiraFinalMoisture(Number(e.target.value))}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Счетоводна / борсова цена за тон (лв)</label>
                    <input
                      type="number"
                      value={firaPricePerTon}
                      onChange={(e) => setFiraPricePerTon(Number(e.target.value))}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Формула на изчисление: Фира от съхранение + Влагоотделяне</span>
                  <button
                    onClick={() => setFiraSuccess(true)}
                    className="rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-3.5 text-xs font-extrabold text-white shadow-md shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    <span>Изпиши фирата в Сметка 609 (Без ДДС)</span>
                  </button>
                </div>

                {firaSuccess && (
                  <div className="rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-4 flex items-start gap-3 text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <h4 className="font-black text-slate-900 dark:text-white">Успешно осчетоводяване на нормативната фира!</h4>
                      <p className="font-medium leading-relaxed">
                        Количеството от <strong className="font-mono">{totalShrinkageTons.toFixed(2)} тона</strong> беше изписано по <strong>Сметка 609 (Други разходи за фира)</strong> в кореспонденция със <strong>Сметка 303 (Готова продукция)</strong>. Поради съответствие с Наредбата, не се изисква корекция на ползвания данъчен кредит по ЗДДС.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Results Breakdown Box */}
              <div className="glass-panel-pro rounded-[32px] border border-amber-500/40 bg-gradient-to-b from-white via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 p-6 sm:p-8 space-y-6 shadow-md">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="rounded-2xl bg-amber-500/15 p-3 text-amber-600 dark:text-amber-400">
                    <Scale size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Резултат по Наредбата</h3>
                    <p className="text-xs font-semibold text-slate-500">Нормативен акт за фирите</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 bg-slate-50/80 dark:bg-slate-800/50 space-y-1">
                    <span className="text-[11px] font-bold uppercase text-slate-400">Естествена фира от дишане и прах ({naturalRate.toFixed(3)}%)</span>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{naturalLossTons.toFixed(2)} тона</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 bg-slate-50/80 dark:bg-slate-800/50 space-y-1">
                    <span className="text-[11px] font-bold uppercase text-slate-400">Влагоотделяне при сушене ({moistureLossPercent.toFixed(2)}%)</span>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{moistureLossTons.toFixed(2)} тона</p>
                  </div>

                  <div className="rounded-2xl border border-amber-500/50 bg-amber-500/10 p-4.5 space-y-1">
                    <span className="text-xs font-extrabold uppercase text-amber-800 dark:text-amber-300">Общо призната фира без ДДС</span>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{totalShrinkageTons.toFixed(2)} тона</p>
                    <span className="block text-xs font-bold text-slate-600 dark:text-slate-400">Стойност: {totalShrinkageValueBGN.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} лв</span>
                  </div>

                  <div className="rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-4.5 space-y-1">
                    <span className="text-xs font-extrabold uppercase text-emerald-800 dark:text-emerald-300">Нето експортно тегло (За продажба)</span>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{netShippableTons.toLocaleString("bg-BG", { minimumFractionDigits: 2 })} тона</p>
                    <span className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Чисто търговско тегло в силоза</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GSM & MACHINES */}
        {activeTab === "gsm_machines" && (
          <div className="space-y-6">
            <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent relative overflow-hidden shadow-sm">
              <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-600/20 border border-blue-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-3">
                  <Fuel size={14} />
                  <span>Лимит-карти & Пътни Листове</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  ГСМ за Агротехника и Трактористи (Сметка 301/6013)
                </h2>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Изписвайте дизел и масла директно по машини и оператори. Автоматично изчислява разхода на декар, създава електронен пътен лист и предотвратява злоупотреби.
                </p>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="glass-panel-pro rounded-[32px] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm lg:col-span-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Fuel className="text-blue-600" size={20} />
                  <span>Ново изписване на ГСМ</span>
                </h3>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Гориво-смазочен материал</label>
                    <select
                      value={gsmItem}
                      onChange={(e) => setGsmItem(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-xs font-extrabold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Дизелово гориво Б6 (за агротехника)">Дизелово гориво Б6 (Наличност: 11,450 л)</option>
                      <option value="Моторно масло John Deere Plus-50 II (15W-40)">Моторно масло Plus-50 II 15W-40 (Наличност: 180 л)</option>
                      <option value="Хидравлично масло Hy-Gard">Хидравлично масло Hy-Gard (Наличност: 95 л)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Агромашина / Трактор / Комбайн</label>
                    <select
                      value={gsmMachine}
                      onChange={(e) => setGsmMachine(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-xs font-extrabold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="John Deere 8R 370 (Рег. № ТХ 4512 КА)">John Deere 8R 370 (Рег. № ТХ 4512 КА)</option>
                      <option value="CLAAS Lexion 8800 (Рег. № ТХ 9911 РА)">CLAAS Lexion 8800 (Рег. № ТХ 9911 РА)</option>
                      <option value="Fendt 1050 Vario (Рег. № ТХ 7722 СА)">Fendt 1050 Vario (Рег. № ТХ 7722 СА)</option>
                      <option value="JCB 541-70 Agri Plus (Товарач)">JCB 541-70 Agri Plus (Товарач)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Тракторист / Оператор</label>
                    <select
                      value={gsmOperator}
                      onChange={(e) => setGsmOperator(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-xs font-extrabold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Иван Петров (Тракторист І категория)">Иван Петров (Тракторист І категория)</option>
                      <option value="Георги Димитров (Механизатор)">Георги Димитров (Механизатор)</option>
                      <option value="Николай Стоянов (Оператор Комбайн)">Николай Стоянов (Оператор Комбайн)</option>
                      <option value="Стойко Тодоров (Шофьор)">Стойко Тодоров (Шофьор)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Количество за зареждане (Литри)</label>
                    <input
                      type="number"
                      value={gsmLiters}
                      onChange={(e) => setGsmLiters(Number(e.target.value))}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Поле / Блок (За отнасяне по Сметка 6111)</label>
                    <select
                      value={gsmField}
                      onChange={(e) => setGsmField(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-xs font-extrabold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Блок 102 - Нива Слатина (1,200 дка / Пшеница)">Блок 102 - Нива Слатина (1,200 дка / Пшеница)</option>
                      <option value="Блок 204 - Голям дол (850 дка / Слънчоглед)">Блок 204 - Голям дол (850 дка / Слънчоглед)</option>
                      <option value="Блок 301 - Равнище (1,450 дка / Царевица)">Блок 301 - Равнище (1,450 дка / Царевица)</option>
                      <option value="Общо стопанство / Вътрешен транспорт">Общо стопанство / Вътрешен транспорт</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      const cost = gsmLiters * 2.50;
                      setGsmLogs([
                        { id: `g-${Date.now()}`, date: new Date().toISOString().split("T")[0], machine: gsmMachine.split(" ")[0] + " " + gsmMachine.split(" ")[1], operator: gsmOperator.split(" ")[0] + " " + gsmOperator.split(" ")[1], fuel: gsmItem.split(" ")[0] + " " + gsmItem.split(" ")[1], liters: gsmLiters, cost, field: gsmField.split(" ")[0] + " " + gsmField.split(" ")[1] },
                        ...gsmLogs
                      ]);
                      setGsmSuccess(true);
                    }}
                    className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-xs font-extrabold text-white shadow-md shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    <span>Запиши в Лимит-Карта и Изпиши ГСМ</span>
                  </button>

                  {gsmSuccess && (
                    <div className="rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-3.5 flex items-start gap-2.5 text-emerald-800 dark:text-emerald-200 text-xs">
                      <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-black">Записано успешно!</span> {gsmLiters} л бяха изписани за {gsmMachine.split(" ")[0]} ({gsmOperator.split(" ")[0]}).
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-panel-pro rounded-[32px] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Дневник на пътните листове и лимит-карти</h3>
                    <p className="text-xs font-semibold text-slate-500">Автоматично изчисление на стойност (2.50 лв/л средна цена)</p>
                  </div>
                  <button className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5">
                    <Download size={14} /> Експорт PDF/Excel
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase">
                        <th className="pb-3">Дата</th>
                        <th className="pb-3">Машина</th>
                        <th className="pb-3">Оператор</th>
                        <th className="pb-3">Гориво</th>
                        <th className="pb-3 text-right">Количество</th>
                        <th className="pb-3 text-right">Стойност</th>
                        <th className="pb-3">Поле / Обект</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {gsmLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 font-semibold">
                          <td className="py-3 font-mono text-slate-500">{log.date}</td>
                          <td className="py-3 font-black text-slate-900 dark:text-white">{log.machine}</td>
                          <td className="py-3 text-slate-700 dark:text-slate-300">{log.operator}</td>
                          <td className="py-3 text-blue-600 dark:text-blue-400 font-bold">{log.fuel}</td>
                          <td className="py-3 text-right font-black text-slate-900 dark:text-white">{log.liters} л</td>
                          <td className="py-3 text-right font-black text-emerald-600 dark:text-emerald-400">{log.cost.toFixed(2)} лв</td>
                          <td className="py-3 text-slate-600 dark:text-slate-400">{log.field}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GRAIN SCALES & SILOS */}
        {activeTab === "grain_scales" && (
          <div className="space-y-6">
            <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent relative overflow-hidden shadow-sm">
              <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600/20 border border-emerald-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-3">
                  <Scale size={14} />
                  <span>Кантарна Бележка & Лабораторен Анализ</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Електронен Кантар за Зърно и Силозно Стопанство (Сметка 303)
                </h2>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Записвайте бруто, тара и нето тегло на камионите при прием в силозите. Автоматичен контрол на влага, хектолитър и примеси по стандарт.
                </p>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="glass-panel-pro rounded-[32px] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm lg:col-span-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Truck className="text-emerald-600" size={20} />
                  <span>Нов Кантар (Прием / Експорт)</span>
                </h3>

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Камион + Ремарке (Рег. №)</label>
                    <input
                      type="text"
                      value={scaleTruck}
                      onChange={(e) => setScaleTruck(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Шофьор / Превозвач</label>
                    <input
                      type="text"
                      value={scaleDriver}
                      onChange={(e) => setScaleDriver(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Зърнена култура / Партида</label>
                    <select
                      value={scaleCrop}
                      onChange={(e) => setScaleCrop(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-xs font-extrabold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Пшеница - Хлябна реколта 2025">Пшеница - Хлябна реколта 2025</option>
                      <option value="Царевица Pioneer (ФАО 440)">Царевица Pioneer (ФАО 440)</option>
                      <option value="Слънчоглед Високомаслодаен">Слънчоглед Високомаслодаен</option>
                      <option value="Ечемик Пивоварен">Ечемик Пивоварен</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Бруто (кг)</label>
                      <input
                        type="number"
                        value={scaleGross}
                        onChange={(e) => setScaleGross(Number(e.target.value))}
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-xs font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Тара (кг)</label>
                      <input
                        type="number"
                        value={scaleTare}
                        onChange={(e) => setScaleTare(Number(e.target.value))}
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-xs font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-center">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-800 dark:text-emerald-300">Чисто Нето Тегло</span>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {Math.max(0, (scaleGross - scaleTare) / 1000).toFixed(2)} тона
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">({Math.max(0, scaleGross - scaleTare)} кг)</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">Влага (%)</label>
                      <input
                        type="number" step="0.1"
                        value={scaleMoisture}
                        onChange={(e) => setScaleMoisture(Number(e.target.value))}
                        className={cn("w-full rounded-xl border px-2.5 py-2 text-xs font-black outline-none", scaleMoisture > 14 ? "border-rose-500 bg-rose-500/10 text-rose-600" : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white")}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">Хект. (кг/хл)</label>
                      <input
                        type="number" step="0.1"
                        value={scaleHectoliter}
                        onChange={(e) => setScaleHectoliter(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-xs font-black text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">Примеси (%)</label>
                      <input
                        type="number" step="0.1"
                        value={scaleImpurities}
                        onChange={(e) => setScaleImpurities(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-xs font-black text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  {scaleMoisture > 14 && (
                    <div className="rounded-xl bg-amber-500/15 border border-amber-500/30 p-2 text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>Внимание: Влага над 14%! Изисква се сушене или аерация в силоза.</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Прием в Силоз / База</label>
                    <select
                      value={scaleSilo}
                      onChange={(e) => setScaleSilo(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-xs font-extrabold text-slate-900 dark:text-white outline-none"
                    >
                      <option value="Силоз №1 (Основен - Капацитет 2,500т)">Силоз №1 (Основен - Капацитет 2,500т)</option>
                      <option value="Силоз №2 (Резервен - Капацитет 1,800т)">Силоз №2 (Резервен - Капацитет 1,800т)</option>
                      <option value="Плосък склад - Северна База">Плосък склад - Северна База</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      const net = (scaleGross - scaleTare) / 1000;
                      setScaleLogs([
                        { id: `s-${Date.now()}`, date: new Date().toLocaleDateString("bg-BG") + " " + new Date().toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" }), truck: scaleTruck.split(" ")[0] + " " + scaleTruck.split(" ")[1], driver: scaleDriver, crop: scaleCrop.split(" - ")[0], net, moisture: scaleMoisture, silo: scaleSilo.split(" ")[0] + " " + scaleSilo.split(" ")[1] },
                        ...scaleLogs
                      ]);
                      setScaleSuccess(true);
                    }}
                    className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-xs font-extrabold text-white shadow-md shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    <span>Запиши Кантарна Бележка & Прием</span>
                  </button>

                  {scaleSuccess && (
                    <div className="rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-3 flex items-start gap-2 text-emerald-800 dark:text-emerald-200 text-xs">
                      <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-black">Кантарният запис е създаден!</span> Тегло от {((scaleGross - scaleTare) / 1000).toFixed(2)}т заскладено в {scaleSilo.split(" ")[0]} {scaleSilo.split(" ")[1]}.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-panel-pro rounded-[32px] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Дневник на кантарните бележки (Вход/Изход Силози)</h3>
                    <p className="text-xs font-semibold text-slate-500">Пълен лабораторен контрол на всяка партида</p>
                  </div>
                  <button className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5">
                    <Printer size={14} /> Печат на Дневник
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase">
                        <th className="pb-3">Време</th>
                        <th className="pb-3">Камион</th>
                        <th className="pb-3">Шофьор</th>
                        <th className="pb-3">Култура</th>
                        <th className="pb-3 text-right">Нето Тегло</th>
                        <th className="pb-3 text-center">Влага</th>
                        <th className="pb-3">Силоз</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {scaleLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 font-semibold">
                          <td className="py-3 font-mono text-slate-500">{log.date}</td>
                          <td className="py-3 font-black text-slate-900 dark:text-white">{log.truck}</td>
                          <td className="py-3 text-slate-700 dark:text-slate-300">{log.driver}</td>
                          <td className="py-3 text-emerald-600 dark:text-emerald-400 font-bold">{log.crop}</td>
                          <td className="py-3 text-right font-black text-slate-900 dark:text-white">{log.net.toFixed(2)} тона</td>
                          <td className="py-3 text-center">
                            <span className={cn("rounded-md px-2 py-0.5 font-black", log.moisture > 14 ? "bg-rose-500/15 text-rose-600" : "bg-emerald-500/15 text-emerald-600")}>
                              {log.moisture}%
                            </span>
                          </td>
                          <td className="py-3 text-slate-600 dark:text-slate-400 font-bold">{log.silo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AI PROCUREMENT */}
        {activeTab === "ai_procurement" && (
          <div className="space-y-6">
            <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent relative overflow-hidden shadow-sm">
              <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-purple-600/20 border border-purple-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 mb-3">
                  <Bot size={14} />
                  <span>AI Планиране & Оптимизация</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  AI Анализатор на Запасите и Списък за Покупки (Procurement Plan)
                </h2>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Изкуственият интелект сравнява планираните площи в сеитбооборота (10,000 дка общо) с текущите наличности в склада и определя точния дефицит за предстоящия агротехнически сезон.
                </p>
              </div>
            </div>

            <div className="glass-panel-pro rounded-[32px] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <ShoppingCart className="text-purple-600" size={20} />
                    <span>Списък с необходими доставки (Пролет/Есен 2026)</span>
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">Автоматично изчислен дефицит по нормативи и сеитбена карта</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setProcurementAnalyzed(true)}
                    className="rounded-2xl bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-black text-white transition flex items-center gap-2 shadow-md shadow-purple-500/20"
                  >
                    <RefreshCw size={14} className="animate-spin-once" />
                    <span>Преизчисли по Сеитбооборот</span>
                  </button>
                  <button className="rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 px-4 py-2 text-xs font-black text-white transition flex items-center gap-2">
                    <Download size={14} /> Експорт Запитване до Доставчик
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase">
                      <th className="pb-3">Материал / Торове / Семена</th>
                      <th className="pb-3">Категория</th>
                      <th className="pb-3 text-right">Нужно за Сезона</th>
                      <th className="pb-3 text-right">Налично в Склада</th>
                      <th className="pb-3 text-right">Дефицит за Покупка</th>
                      <th className="pb-3 text-right">Прогнозна Стойност</th>
                      <th className="pb-3 text-center">Приоритет</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {procurementPlan.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 font-semibold">
                        <td className="py-3.5 font-black text-slate-900 dark:text-white">{p.name}</td>
                        <td className="py-3.5 text-slate-600 dark:text-slate-400 font-bold">{p.category}</td>
                        <td className="py-3.5 text-right font-black text-slate-900 dark:text-white">{p.needed} {p.unit}</td>
                        <td className="py-3.5 text-right font-bold text-slate-500">{p.current} {p.unit}</td>
                        <td className="py-3.5 text-right font-black text-rose-600 dark:text-rose-400 bg-rose-500/5 px-2 rounded-lg">
                          -{p.deficit} {p.unit}
                        </td>
                        <td className="py-3.5 text-right font-black text-slate-900 dark:text-white">{p.totalCost.toLocaleString("bg-BG")} лв</td>
                        <td className="py-3.5 text-center">
                          <span className={cn("rounded-md px-2.5 py-1 text-[10px] font-black uppercase", p.priority.includes("КРИТИЧЕН") ? "bg-rose-500/15 text-rose-600 border border-rose-500/30" : p.priority.includes("ВИСОК") ? "bg-amber-500/15 text-amber-600 border border-amber-500/30" : "bg-blue-500/15 text-blue-600 border border-blue-500/30")}>
                            {p.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4 flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-200">
                <div className="flex items-center gap-2.5">
                  <Bot size={20} className="text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>AI съвет: Доставката на слънчогледови семена и амониев нитрат трябва да се договори преди 15 август за гарантиране на най-добра цена с 12% отстъпка за ранно плащане.</span>
                </div>
                <button className="rounded-xl bg-purple-600 hover:bg-purple-700 px-3.5 py-1.5 text-white font-black transition shrink-0">
                  Генерирай Оферти
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: OFFICIAL DOCS */}
        {activeTab === "official_docs" && (
          <div className="space-y-6">
            <div className="glass-panel-pro rounded-[32px] p-6 sm:p-8 border border-slate-700/30 bg-gradient-to-br from-slate-800/10 via-slate-700/5 to-transparent relative overflow-hidden shadow-sm">
              <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-slate-700/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-3xl relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-700/20 border border-slate-700/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                  <FileCheck size={14} />
                  <span>Български Счетоводни Стандарти</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Официални Складови Разписки и Требования (PDF Бланки)
                </h2>
                <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  Генерирайте и отпечатайте с един клик законни счетоводни бланки с подписи на материално-отговорното лице (МОЛ), агроном и приемчик.
                </p>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="glass-panel-pro rounded-[32px] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm lg:col-span-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="text-slate-700 dark:text-slate-300" size={20} />
                  <span>Параметри на Документа</span>
                </h3>

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Тип счетоводен документ</label>
                    <select
                      value={docType}
                      onChange={(e: any) => setDocType(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-xs font-extrabold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-700"
                    >
                      <option value="sklad_razpiska">Складова Разписка (Приходен ордер)</option>
                      <option value="trebovanie">Искане за отпускане (Требование)</option>
                      <option value="inventarizacia">Инвентаризационен опис (Ревизия)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Номер на документ</label>
                    <input
                      type="text"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Контрагент / Основание</label>
                    <input
                      type="text"
                      value={docPartner}
                      onChange={(e) => setDocPartner(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Материал / Артикул</label>
                    <input
                      type="text"
                      value={docItemSelected}
                      onChange={(e) => setDocItemSelected(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Количество</label>
                      <input
                        type="number"
                        value={docQty}
                        onChange={(e) => setDocQty(Number(e.target.value))}
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-xs font-black text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Цена / лв</label>
                      <input
                        type="number"
                        value={docPrice}
                        onChange={(e) => setDocPrice(Number(e.target.value))}
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-xs font-black text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setDocPrinted(true)}
                    className="w-full rounded-2xl bg-gradient-to-r from-slate-800 to-slate-950 dark:from-slate-700 dark:to-slate-850 py-3.5 text-xs font-extrabold text-white shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Printer size={16} />
                    <span>Генерирай и Отпечатай PDF</span>
                  </button>

                  {docPrinted && (
                    <div className="rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-3 flex items-start gap-2 text-emerald-800 dark:text-emerald-200 text-xs">
                      <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-black">Бланката е готова!</span> Изпратена към принтер / готова за изтегляне в PDF формат с реквизити на МОЛ.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-panel-pro rounded-[32px] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm lg:col-span-2 flex flex-col justify-between bg-white dark:bg-slate-900">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6 font-mono text-xs text-slate-800 dark:text-slate-200">
                  <div className="flex justify-between items-start border-b border-slate-300 dark:border-slate-700 pb-4">
                    <div>
                      <h4 className="font-black text-base uppercase text-slate-900 dark:text-white">
                        {docType === "sklad_razpiska" ? "СКЛАДОВА РАЗПИСКА № " + docNumber : docType === "trebovanie" ? "ИСКАНЕ ЗА ОТПУСКАНЕ (ТРЕБОВАНИЕ) № " + docNumber : "ИНВЕНТАРИЗАЦИОНЕН ОПИС № " + docNumber}
                      </h4>
                      <p className="text-[11px] text-slate-500">Предприятие: АГРИ НЕКСУС ЕОП • Склад: Основен Хангар №1</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Дата: {new Date().toLocaleDateString("bg-BG")}</p>
                      <p className="text-[11px] text-slate-500">Сметка: 301 / 6111</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">Получател / Доставчик:</span>
                      <p className="font-extrabold text-slate-900 dark:text-white">{docPartner}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px] uppercase">Основание / Обект на влагане:</span>
                      <p className="font-extrabold text-slate-900 dark:text-white">Блок 102 - Нива Слатина (Сеитбооборот 2026)</p>
                    </div>
                  </div>

                  <table className="w-full text-left font-sans border border-slate-300 dark:border-slate-700">
                    <thead className="bg-slate-100 dark:bg-slate-800 font-black">
                      <tr>
                        <th className="p-2 border-b border-slate-300 dark:border-slate-700">№</th>
                        <th className="p-2 border-b border-slate-300 dark:border-slate-700">Наименование на стоката / материала</th>
                        <th className="p-2 border-b border-slate-300 dark:border-slate-700 text-right">Мярка</th>
                        <th className="p-2 border-b border-slate-300 dark:border-slate-700 text-right">К-во</th>
                        <th className="p-2 border-b border-slate-300 dark:border-slate-700 text-right">Ед. цена</th>
                        <th className="p-2 border-b border-slate-300 dark:border-slate-700 text-right">Сума (лв)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="font-bold">
                        <td className="p-2">1</td>
                        <td className="p-2">{docItemSelected}</td>
                        <td className="p-2 text-right">тона</td>
                        <td className="p-2 text-right">{docQty}</td>
                        <td className="p-2 text-right">{docPrice.toFixed(2)} лв</td>
                        <td className="p-2 text-right font-black">{(docQty * docPrice).toFixed(2)} лв</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-300 dark:border-slate-700 text-center font-sans">
                    <div>
                      <span className="block text-[11px] text-slate-400 font-bold">МОЛ / Предал:</span>
                      <div className="mt-4 border-b border-slate-400 w-24 mx-auto" />
                      <span className="text-[10px] font-semibold">/ Петър Иванов /</span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-400 font-bold">Приел / Агроном:</span>
                      <div className="mt-4 border-b border-slate-400 w-24 mx-auto" />
                      <span className="text-[10px] font-semibold">/ инж. Стоян Милев /</span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-400 font-bold">Глав. Счетоводител:</span>
                      <div className="mt-4 border-b border-slate-400 w-24 mx-auto" />
                      <span className="text-[10px] font-semibold">/ Виктория Димитрова /</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 px-4 py-2 text-xs font-black transition">
                    Изтегли в PDF
                  </button>
                  <button onClick={() => window.print()} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-black text-white transition flex items-center gap-1.5">
                    <Printer size={14} /> Отпечатай Бланката
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Movements Modal */}
      {movItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ArrowUpDown className="text-emerald-600" size={20} />
                  <span>Движения по партида: {movItem.name}</span>
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-1">Текуща наличност: {movItem.currentStock} {movItem.unitOfMeasure}</p>
              </div>
              <button onClick={() => setMovItem(null)} className="rounded-full p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 transition">
                <X size={18} />
              </button>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase text-slate-400">Хронология на операциите</span>
              <button
                onClick={() => setShowMovForm(!showMovForm)}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-black text-white transition flex items-center gap-1.5"
              >
                <Plus size={14} /> Нова операция
              </button>
            </div>

            {showMovForm && (
              <form onSubmit={handleSaveMov} className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Тип</label>
                  <select value={movForm.type} onChange={(e) => setMovForm({ ...movForm, type: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white">
                    <option value="in">↑ Засклаждане (Приход)</option>
                    <option value="out">↓ Изписване (Разход / Продажба)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Количество ({movItem.unitOfMeasure})</label>
                  <input type="number" step="0.001" value={movForm.quantity} onChange={(e) => setMovForm({ ...movForm, quantity: Number(e.target.value) })} required className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Ед. цена (лв)</label>
                  <input type="number" step="0.01" value={movForm.unitCost} onChange={(e) => setMovForm({ ...movForm, unitCost: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Основание / Фактура / Нива</label>
                  <input value={movForm.description} onChange={(e) => setMovForm({ ...movForm, description: e.target.value })} placeholder="напр. Жътва Нива Слатина" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white" />
                </div>
                <div className="flex items-end">
                  <button type="submit" disabled={saving} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2 text-xs font-black text-white transition">
                    Осчетоводи
                  </button>
                </div>
              </form>
            )}

            {loadingMovs ? (
              <div className="flex justify-center py-6"><Loader2 size={24} className="animate-spin text-emerald-600" /></div>
            ) : movements.length === 0 ? (
              <p className="py-6 text-center text-xs font-bold text-slate-400">Няма записани движения по тази партида.</p>
            ) : (
              <div className="max-h-64 space-y-2.5 overflow-y-auto">
                {movements.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                      <span className={cn("rounded-xl p-2 font-black text-xs flex items-center gap-1", m.type === "in" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/15 text-rose-700 dark:text-rose-300")}>
                        {m.type === "in" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        <span>{m.type === "in" ? "Приход" : "Изписване"}</span>
                      </span>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900 dark:text-white">{m.description || (m.type === "in" ? "Засклаждане" : "Изписване от склад")}</p>
                        <span className="text-[11px] font-semibold text-slate-500">{new Date(m.movement_date).toLocaleDateString("bg-BG")}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 dark:text-white">{m.type === "in" ? "+" : "-"}{Number(m.quantity).toFixed(2)} {movItem.unitOfMeasure}</p>
                      {m.totalCost && <span className="text-[11px] font-bold text-slate-500">Общо: {Number(m.totalCost).toFixed(2)} лв</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </SitePageShell>
  );
}
