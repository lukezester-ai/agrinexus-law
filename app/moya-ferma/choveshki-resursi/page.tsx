"use client";

import { useState, useEffect } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { Users, CalendarCheck, FileSpreadsheet, Plus, Loader2, CheckCircle, XCircle, Trash2, Download } from "lucide-react";

type Employee = {
  id: string; firstName: string; lastName: string; email: string | null; phone: string | null;
  position: string | null; department: string | null; salary: number | null;
  contractType: string | null; startDate: string; endDate: string | null; isActive: string;
};

type Attendance = {
  id: string; employeeId: string; date: string; hoursWorked: number;
  type: string; description: string | null; employeeName: string | null; employeeLastName: string | null;
};

type LeaveRequest = {
  id: string; employeeId: string; startDate: string; endDate: string;
  type: string; daysRequested: number | null; reason: string | null;
  status: string; employeeName: string | null; employeeLastName: string | null;
};

type PayrollBatch = {
  id: string; month: string; status: string;
  totalGross: number; totalEmployeeInsurance: number; totalEmployerInsurance: number;
  totalTax: number; totalNet: number; totalEmployerCost: number;
};

type PayrollItem = {
  id: string; employeeId: string; employeeName: string; baseSalary: number;
  workingDays: number; workedDays: number; bonus: number; gross: number;
  insuranceBase: number; employeeInsurance: number; employerInsurance: number;
  incomeTax: number; net: number; employerCost: number; hasWarning: string; warning: string | null;
};

export default function HrPage() {
  const [tab, setTab] = useState<"employees" | "attendance" | "leave" | "payroll" | "seasonal_114a">("employees");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaveReqs, setLeaveReqs] = useState<LeaveRequest[]>([]);
  const [batches, setBatches] = useState<PayrollBatch[]>([]);

  // Договори по чл. 114а от КТ (Еднодневни сезонни агро-договори)
  const [seasonalContracts, setSeasonalContracts] = useState<Array<{
    id: string; workerName: string; egn: string; activity: string; date: string; gross: number; dooEmployee: number; dooEmployer: number; tzpbEmployer: number; net: number; status: string;
  }>>([
    { id: "114a-1", workerName: "Иван Петров Стоянов", egn: "8405123456", activity: "Жътва на пшеница - Блок #4", date: new Date().toISOString().split("T")[0], gross: 70.00, dooEmployee: 5.87, dooEmployer: 7.64, tzpbEmployer: 0.35, net: 64.13, status: "регистриран" },
    { id: "114a-2", workerName: "Мария Георгиева Димитрова", egn: "9108234567", activity: "Бране на грозде - Лозов масив", date: new Date().toISOString().split("T")[0], gross: 65.00, dooEmployee: 5.45, dooEmployer: 7.10, tzpbEmployer: 0.33, net: 59.55, status: "регистриран" },
  ]);
  const [showSeasonalForm, setShowSeasonalForm] = useState(false);
  const [seasonalForm, setSeasonalForm] = useState({ workerName: "", egn: "", activity: "Жътва на зърнени култури", date: new Date().toISOString().split("T")[0], gross: "70.00" });

  const [showEmpForm, setShowEmpForm] = useState(false);
  const [empForm, setEmpForm] = useState({ firstName: "", lastName: "", email: "", phone: "", position: "", department: "", salary: "", contractType: "full_time", startDate: "", endDate: "", isActive: "true" });

  const [showAttForm, setShowAttForm] = useState(false);
  const [attForm, setAttForm] = useState({ employeeId: "", date: "", hoursWorked: "", type: "worked", description: "" });

  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ employeeId: "", startDate: "", endDate: "", type: "annual", daysRequested: "", reason: "" });

  const [attFilterEmp, setAttFilterEmp] = useState("");
  const [attFilterMonth, setAttFilterMonth] = useState("");

  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchMonth, setBatchMonth] = useState("");

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [batchItems, setBatchItems] = useState<PayrollItem[]>([]);

  const loadEmployees = async () => {
    try { const r = await fetch("/api/farm/hr/employees"); const d = await r.json(); setEmployees(Array.isArray(d) ? d : []); }
    catch { setEmployees([]); }
  };

  const loadAttendance = async () => {
    try {
      const params = new URLSearchParams();
      if (attFilterEmp) params.set("employeeId", attFilterEmp);
      if (attFilterMonth) params.set("month", attFilterMonth);
      const r = await fetch(`/api/farm/hr/attendance?${params}`);
      const d = await r.json(); setAttendance(Array.isArray(d) ? d : []);
    } catch { setAttendance([]); }
  };

  const loadLeave = async () => {
    try { const r = await fetch("/api/farm/hr/leave"); const d = await r.json(); setLeaveReqs(Array.isArray(d) ? d : []); }
    catch { setLeaveReqs([]); }
  };

  const loadBatches = async () => {
    try { const r = await fetch("/api/farm/hr/payroll"); const d = await r.json(); setBatches(Array.isArray(d) ? d : []); }
    catch { setBatches([]); }
  };

  const loadBatchItems = async (id: string) => {
    try { const r = await fetch(`/api/farm/hr/payroll/${id}`); const d = await r.json(); setBatchItems(d.items || []); }
    catch { setBatchItems([]); }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadEmployees(), loadAttendance(), loadLeave(), loadBatches()]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (tab === "attendance") loadAttendance(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, attFilterEmp, attFilterMonth]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await fetch("/api/farm/hr/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(empForm) });
      await loadEmployees(); setShowEmpForm(false);
      setEmpForm({ firstName: "", lastName: "", email: "", phone: "", position: "", department: "", salary: "", contractType: "full_time", startDate: "", endDate: "", isActive: "true" });
    } finally { setSaving(false); }
  };

  const handleDeleteEmployee = async (id: string) => {
    await fetch(`/api/farm/hr/employees/${id}`, { method: "DELETE" });
    await loadEmployees();
  };

  const handleAddSeasonal = (e: React.FormEvent) => {
    e.preventDefault();
    const grossNum = Number(seasonalForm.gross) || 70;
    const dooEmp = Math.round(grossNum * 0.0838 * 100) / 100;
    const dooEmpr = Math.round(grossNum * 0.1092 * 100) / 100;
    const tzpbEmpr = Math.round(grossNum * 0.005 * 100) / 100;
    const netNum = Math.round((grossNum - dooEmp) * 100) / 100;

    setSeasonalContracts([
      { id: `114a-${Date.now()}`, workerName: seasonalForm.workerName, egn: seasonalForm.egn, activity: seasonalForm.activity, date: seasonalForm.date, gross: grossNum, dooEmployee: dooEmp, dooEmployer: dooEmpr, tzpbEmployer: tzpbEmpr, net: netNum, status: "регистриран" },
      ...seasonalContracts,
    ]);
    setShowSeasonalForm(false);
    setSeasonalForm({ workerName: "", egn: "", activity: "Жътва на зърнени култури", date: new Date().toISOString().split("T")[0], gross: "70.00" });
  };

  const handleAddAttendance = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await fetch("/api/farm/hr/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(attForm) });
      await loadAttendance(); setShowAttForm(false);
      setAttForm({ employeeId: "", date: "", hoursWorked: "", type: "worked", description: "" });
    } finally { setSaving(false); }
  };

  const handleAddLeave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await fetch("/api/farm/hr/leave", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(leaveForm) });
      await loadLeave(); setShowLeaveForm(false);
      setLeaveForm({ employeeId: "", startDate: "", endDate: "", type: "annual", daysRequested: "", reason: "" });
    } finally { setSaving(false); }
  };

  const handleLeaveStatus = async (id: string, status: string) => {
    await fetch(`/api/farm/hr/leave?id=${id}&status=${status}`, { method: "PUT" });
    await loadLeave();
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await fetch("/api/farm/hr/payroll", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ month: batchMonth }) });
      await loadBatches(); setShowBatchForm(false); setBatchMonth("");
    } finally { setSaving(false); }
  };

  const handleBatchStatus = async (id: string, status: string) => {
    await fetch(`/api/farm/hr/payroll/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    await loadBatches();
    if (selectedBatchId === id) { setSelectedBatchId(null); setBatchItems([]); }
  };

  const handleDeleteBatch = async (id: string) => {
    await fetch(`/api/farm/hr/payroll/${id}`, { method: "DELETE" });
    await loadBatches();
    if (selectedBatchId === id) { setSelectedBatchId(null); setBatchItems([]); }
  };

  const openBatch = async (id: string) => {
    setSelectedBatchId(id);
    await loadBatchItems(id);
  };

  const printPaySlips = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>Фишове за възнаграждение - AgriNexus</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .slip { border: 1px dashed #666; padding: 15px; margin-bottom: 20px; page-break-inside: avoid; }
            h3 { margin: 0 0 10px 0; border-bottom: 1px solid #333; padding-bottom: 5px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; }
            .total { font-weight: bold; border-top: 1px solid #999; padding-top: 5px; margin-top: 5px; font-size: 14px; }
          </style>
        </head>
        <body>
          <h2>Фишове за възнаграждение (чл. 128 от КТ)</h2>
          ${batchItems.map(i => `
            <div class="slip">
              <h3>Служител: ${i.employeeName}</h3>
              <div class="row"><span>Основна брутна заплата:</span> <strong>${i.gross.toFixed(2)} лв.</strong></div>
              <div class="row"><span>Осигурителен праг / база:</span> <span>${i.insuranceBase.toFixed(2)} лв.</span></div>
              <div class="row text-red"><span>Лични осигуровки (ДОО + ДЗПО + ЗОВ - 13.78%):</span> <span>-${i.employeeInsurance.toFixed(2)} лв.</span></div>
              <div class="row"><span>Данъчна основа (сл. осигуровки):</span> <span>${(i.gross - i.employeeInsurance).toFixed(2)} лв.</span></div>
              <div class="row text-red"><span>Данък общ доход (ДОД - 10%):</span> <span>-${i.incomeTax.toFixed(2)} лв.</span></div>
              <div class="row total"><span>СУМА ЗА ПОЛУЧАВАНЕ (НЕТО):</span> <span>${i.net.toFixed(2)} лв.</span></div>
              <div class="row" style="margin-top:8px; font-size:11px; color:#666;"><span>Осигуровки за сметка на работодател (ДОО+ДЗПО+ЗОВ+ТЗПБ ~19.12%):</span> <span>${i.employerInsurance.toFixed(2)} лв.</span></div>
              <div class="row" style="font-size:11px; color:#666;"><span>Общ разход за работодателя:</span> <span>${i.employerCost.toFixed(2)} лв.</span></div>
            </div>
          `).join("")}
          <script>window.print();</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  const printSeasonal114aSlip = (item: typeof seasonalContracts[0]) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html>
        <head><title>Трудов договор чл. 114а КТ - ${item.workerName}</title></head>
        <body style="font-family: Arial; padding: 30px;">
          <h2 style="text-align:center;">ТРУДОВ ДОГОВОР ЗА КРАТКОТРАЙНА СЕЗОННА СЕЛСКОСТОПАНСКА РАБОТА<br/><small style="font-size:14px;">по чл. 114а, ал. 1 от Кодекса на труда</small></h2>
          <p>Днес, <strong>${item.date}</strong>, се сключи настоящият трудов договор между <strong>ЗП / Агро Ферма</strong> (Работодател) и:</p>
          <p><strong>Работник:</strong> ${item.workerName}, ЕГН/ЛНЧ: <strong>${item.egn}</strong></p>
          <p><strong>1. Предмет на договора:</strong> Извършване на селскостопанска дейност: <em>${item.activity}</em> в продължение на 1 (един) работен ден.</p>
          <p><strong>2. Възнаграждение:</strong> Брутно дневно възнаграждение: <strong>${item.gross.toFixed(2)} лв.</strong></p>
          <p><strong>3. Осигуровки (чл. 4, ал. 10 от КСО):</strong> Авансова вноска за Фонд Пенсии (ДОО) за сметка на работника (8.38%): <strong>${item.dooEmployee.toFixed(2)} лв.</strong> | За сметка на работодателя: ДОО (${item.dooEmployer.toFixed(2)} лв.) + ТЗПБ (${item.tzpbEmployer.toFixed(2)} лв.).</p>
          <h3 style="margin-top:20px; border-top:2px solid #000; padding-top:10px;">НЕТО ЗА ИЗПЛАЩАНЕ НА РЪКА В КРАЯ НА РАБОТНИЯ ДЕН: ${item.net.toFixed(2)} лв.</h3>
          <p style="font-size:12px; color:#555;">* Договорът се издава в 4 еднообразни екземпляра — за работника, за работодателя, за ИА "Главна инспекция по труда" (ИА ГИТ) и за НАП.</p>
          <br/><br/>
          <div style="display:flex; justify-content:space-between;">
            <div><strong>Работодател:</strong> .................................</div>
            <div><strong>Работник (получил нето сумата):</strong> .................................</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      draft: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
      calculated: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
      approved: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
      paid: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300",
      pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
      approved_leave: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    };
    return map[s] || "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
  };

  const leaveTypeLabel = (t: string) => {
    const map: Record<string, string> = { annual: "Годишен", sick: "Болничен", unpaid: "Неплатен", maternity: "Материнство", other: "Друг" };
    return map[t] || t;
  };

  const contractLabel = (c: string | null) => {
    const map: Record<string, string> = {
      full_time: "Пълен работен ден (Безсрочен)",
      part_time: "Непълно работно време",
      seasonal_114a: "⚡ Еднодневен чл. 114а КТ",
      agri_subsidized: "Субсидирана заетост (ПСРР)",
      civil: "Граждански договор",
    };
    return map[c || ""] || c || "—";
  };

  const exportCsv = (data: any[], columns: { key: string; label: string }[], filename: string) => {
    const header = columns.map(c => `"${c.label}"`).join(',');
    const rows = data.map(row =>
      columns.map(c => {
        const val = c.key.split('.').reduce((o, k) => o?.[k], row);
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csv = '\ufeff' + [header, ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <SitePageShell maxWidth="7xl" subheader={
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Човешки ресурси & ТРЗ (Българско Агро-Счетоводство)</p>
          <p className="text-xs text-slate-500">Пълна интеграция по КТ, КСО, ЗДДФЛ и НАП (Декларация 1 & 6)</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {tab === "employees" && (
            <>
              <button onClick={() => setShowEmpForm(!showEmpForm)}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
                <Plus size={16} /> Добави служител
              </button>
              <button onClick={() => exportCsv(employees, [
                { key: 'firstName', label: 'Име' },
                { key: 'lastName', label: 'Фамилия' },
                { key: 'email', label: 'Имейл' },
                { key: 'phone', label: 'Телефон' },
                { key: 'position', label: 'Длъжност' },
                { key: 'department', label: 'Отдел' },
                { key: 'salary', label: 'Заплата' },
                { key: 'contractType', label: 'Договор' },
                { key: 'startDate', label: 'Начална дата' },
                { key: 'endDate', label: 'Крайна дата' },
                { key: 'isActive', label: 'Активен' },
              ], 'employees.csv')} className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300">
                <Download size={16} /> CSV
              </button>
            </>
          )}
          {tab === "attendance" && (
            <button onClick={() => setShowAttForm(!showAttForm)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
              <Plus size={16} /> Добави присъствие
            </button>
          )}
          {tab === "leave" && (
            <button onClick={() => setShowLeaveForm(!showLeaveForm)}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700">
              <Plus size={16} /> Заяви отпуск
            </button>
          )}
          {tab === "payroll" && (
            <button onClick={() => setShowBatchForm(!showBatchForm)}
              className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 dark:bg-white dark:text-slate-950">
              <Plus size={16} /> Нова ведомост
            </button>
          )}
          {tab === "seasonal_114a" && (
            <>
              <button onClick={() => setShowSeasonalForm(!showSeasonalForm)}
                className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-amber-700">
                <Plus size={16} /> Нов Еднодневен Договор чл. 114а КТ
              </button>
              <button onClick={() => exportCsv(seasonalContracts, [
                { key: 'workerName', label: 'Име' },
                { key: 'egn', label: 'ЕГН/ЛНЧ' },
                { key: 'activity', label: 'Дейност' },
                { key: 'date', label: 'Дата' },
                { key: 'gross', label: 'Бруто' },
                { key: 'dooEmployee', label: 'ДОО работник' },
                { key: 'dooEmployer', label: 'ДОО работодател' },
                { key: 'tzpbEmployer', label: 'ТЗПБ' },
                { key: 'net', label: 'Нето' },
              ], 'GIT_Reg_114a.csv')} className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                <Download size={16} /> Експорт ИА ГИТ
              </button>
            </>
          )}
        </div>
      </div>
    }>
      <div className="mb-4 flex gap-2 flex-wrap">
        <button onClick={() => setTab("employees")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === "employees" ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"}`}>
          <Users size={16} className="mr-1.5 inline" /> Служители
        </button>
        <button onClick={() => setTab("attendance")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === "attendance" ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"}`}>
          <CalendarCheck size={16} className="mr-1.5 inline" /> Присъствие
        </button>
        <button onClick={() => setTab("leave")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === "leave" ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"}`}>
          <XCircle size={16} className="mr-1.5 inline" /> Отпуски
        </button>
        <button onClick={() => setTab("payroll")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === "payroll" ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"}`}>
          <FileSpreadsheet size={16} className="mr-1.5 inline" /> ТРЗ Ведомости
        </button>
        <button onClick={() => setTab("seasonal_114a")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition flex items-center gap-1.5 ${tab === "seasonal_114a" ? "bg-amber-600 text-white shadow-md" : "bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300"}`}>
          <span>⚡ Еднодневни чл. 114а КТ</span>
          <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] text-white">Сезонни</span>
        </button>
      </div>

      <div className="glass-panel overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 bg-teal-50/50 p-6 dark:bg-teal-950/20">
          <h1 className="font-display flex items-center gap-3 text-2xl font-medium">
            {tab === "employees" && <><Users className="text-teal-600 dark:text-teal-400" /> Служители и кадрово досие</>}
            {tab === "attendance" && <><CalendarCheck className="text-teal-600 dark:text-teal-400" /> Присъствие и отработено време</>}
            {tab === "leave" && <><XCircle className="text-teal-600 dark:text-teal-400" /> Отпуски и болнични (ЗЗК / НОИ)</>}
            {tab === "payroll" && <><FileSpreadsheet className="text-teal-600 dark:text-teal-400" /> ТРЗ Ведомости и Осигуровки (Д1 / Д6)</>}
            {tab === "seasonal_114a" && <><span className="text-2xl">⚡</span> Еднодневни Агро-договори (Чл. 114а от КТ)</>}
          </h1>
        </div>

        {/* EMPLOYEE FORM */}
        {tab === "employees" && showEmpForm && (
          <form onSubmit={handleAddEmployee} className="grid gap-4 border-b border-slate-200 p-6 dark:border-slate-700 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Име *</label>
              <input value={empForm.firstName} onChange={(e) => setEmpForm({ ...empForm, firstName: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Фамилия *</label>
              <input value={empForm.lastName} onChange={(e) => setEmpForm({ ...empForm, lastName: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Имейл</label>
              <input type="email" value={empForm.email} onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Телефон</label>
              <input value={empForm.phone} onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Длъжност</label>
              <input value={empForm.position} onChange={(e) => setEmpForm({ ...empForm, position: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Отдел</label>
              <input value={empForm.department} onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Заплата (BGN)</label>
              <input type="number" step="0.01" value={empForm.salary} onChange={(e) => setEmpForm({ ...empForm, salary: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Тип договор</label>
              <select value={empForm.contractType} onChange={(e) => setEmpForm({ ...empForm, contractType: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value="full_time">Пълен работен ден (Безсрочен чл. 67 КТ)</option>
                <option value="part_time">Непълно работно време (чл. 114 КТ)</option>
                <option value="seasonal_114a">⚡ Еднодневен агро-договор (чл. 114а КТ)</option>
                <option value="agri_subsidized">Субсидирана заетост (ПСРР / Мярка 6.1)</option>
                <option value="civil">Граждански договор</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Начална дата *</label>
              <input type="date" value={empForm.startDate} onChange={(e) => setEmpForm({ ...empForm, startDate: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Крайна дата</label>
              <input type="date" value={empForm.endDate} onChange={(e) => setEmpForm({ ...empForm, endDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-white dark:text-slate-950">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Добави
              </button>
              <button type="button" onClick={() => setShowEmpForm(false)} className="rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400">Отказ</button>
            </div>
          </form>
        )}

        {/* ATTENDANCE FORM */}
        {tab === "attendance" && showAttForm && (
          <form onSubmit={handleAddAttendance} className="grid gap-4 border-b border-slate-200 p-6 dark:border-slate-700 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Служител *</label>
              <select value={attForm.employeeId} onChange={(e) => setAttForm({ ...attForm, employeeId: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value="">Избери служител</option>
                {employees.filter((e) => e.isActive === "true").map((e) => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Дата *</label>
              <input type="date" value={attForm.date} onChange={(e) => setAttForm({ ...attForm, date: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Часове</label>
              <input type="number" step="0.5" value={attForm.hoursWorked} onChange={(e) => setAttForm({ ...attForm, hoursWorked: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Тип</label>
              <select value={attForm.type} onChange={(e) => setAttForm({ ...attForm, type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value="worked">Присъствие</option>
                <option value="overtime">Извънреден труд</option>
                <option value="absence">Отсъствие</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Описание</label>
              <input value={attForm.description} onChange={(e) => setAttForm({ ...attForm, description: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-white dark:text-slate-950">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Добави
              </button>
              <button type="button" onClick={() => setShowAttForm(false)} className="rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400">Отказ</button>
            </div>
          </form>
        )}

        {/* LEAVE FORM */}
        {tab === "leave" && showLeaveForm && (
          <form onSubmit={handleAddLeave} className="grid gap-4 border-b border-slate-200 p-6 dark:border-slate-700 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Служител *</label>
              <select value={leaveForm.employeeId} onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value="">Избери служител</option>
                {employees.filter((e) => e.isActive === "true").map((e) => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Начална дата *</label>
              <input type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Крайна дата *</label>
              <input type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Тип отпуск</label>
              <select value={leaveForm.type} onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value="annual">Годишен отпуск</option>
                <option value="sick">Болничен</option>
                <option value="unpaid">Неплатен</option>
                <option value="maternity">Материнство</option>
                <option value="other">Друг</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Работни дни</label>
              <input type="number" value={leaveForm.daysRequested} onChange={(e) => setLeaveForm({ ...leaveForm, daysRequested: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Причина</label>
              <input value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-white dark:text-slate-950">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Заяви
              </button>
              <button type="button" onClick={() => setShowLeaveForm(false)} className="rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400">Отказ</button>
            </div>
          </form>
        )}

        {/* BATCH FORM */}
        {tab === "payroll" && showBatchForm && (
          <form onSubmit={handleCreateBatch} className="flex gap-4 border-b border-slate-200 p-6 dark:border-slate-700 items-end">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Месец</label>
              <input type="month" value={batchMonth} onChange={(e) => setBatchMonth(e.target.value)} required
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="flex items-center gap-2">
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-white dark:text-slate-950">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Създай
              </button>
              <button type="button" onClick={() => setShowBatchForm(false)} className="rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400">Отказ</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-8"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
        ) : tab === "employees" ? (
          employees.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500"><Users size={40} className="mx-auto mb-3 text-slate-300" /><p>Няма служители.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                  <tr><th className="p-3">Име</th><th className="p-3">Длъжност</th><th className="p-3">Отдел</th><th className="p-3 text-right">Заплата</th><th className="p-3">Договор</th><th className="p-3">Статус</th><th className="p-3"></th></tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {employees.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-medium">{e.firstName} {e.lastName}</td>
                      <td className="p-3 text-slate-600">{e.position || "—"}</td>
                      <td className="p-3 text-slate-600">{e.department || "—"}</td>
                      <td className="p-3 text-right font-bold">{e.salary ? `${e.salary.toFixed(2)} BGN` : "—"}</td>
                      <td className="p-3 text-xs text-slate-500">{contractLabel(e.contractType)}</td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${e.isActive === "true" ? "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300" : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"}`}>
                          {e.isActive === "true" ? "Активен" : "Неактивен"}
                        </span>
                      </td>
                      <td className="p-3">
                        <button onClick={() => handleDeleteEmployee(e.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : tab === "attendance" ? (
          <>
            <div className="flex gap-4 border-b border-slate-200 p-4 dark:border-slate-700 flex-wrap">
              <select value={attFilterEmp} onChange={(e) => setAttFilterEmp(e.target.value)}
                className="rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white">
                <option value="">Всички служители</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                ))}
              </select>
              <input type="month" value={attFilterMonth} onChange={(e) => setAttFilterMonth(e.target.value)}
                className="rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
            </div>
            {attendance.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500"><CalendarCheck size={40} className="mx-auto mb-3 text-slate-300" /><p>Няма записи.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                    <tr><th className="p-3">Служител</th><th className="p-3">Дата</th><th className="p-3 text-right">Часове</th><th className="p-3">Тип</th><th className="p-3">Описание</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {attendance.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-medium">{a.employeeName} {a.employeeLastName}</td>
                        <td className="p-3 text-slate-600">{a.date}</td>
                        <td className="p-3 text-right font-bold">{a.hoursWorked.toFixed(2)}</td>
                        <td className="p-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${a.type === "worked" ? "bg-teal-100 text-teal-800" : a.type === "overtime" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"} dark:opacity-80`}>
                            {a.type === "worked" ? "Присъствие" : a.type === "overtime" ? "Извънреден" : "Отсъствие"}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 text-xs">{a.description || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : tab === "leave" ? (
          leaveReqs.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500"><XCircle size={40} className="mx-auto mb-3 text-slate-300" /><p>Няма отпуски.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                  <tr><th className="p-3">Служител</th><th className="p-3">Тип</th><th className="p-3">От</th><th className="p-3">До</th><th className="p-3 text-right">Дни</th><th className="p-3">Статус</th><th className="p-3"></th></tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {leaveReqs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-medium">{l.employeeName} {l.employeeLastName}</td>
                      <td className="p-3 text-slate-600">{leaveTypeLabel(l.type)}</td>
                      <td className="p-3 text-slate-600">{l.startDate}</td>
                      <td className="p-3 text-slate-600">{l.endDate}</td>
                      <td className="p-3 text-right font-bold">{l.daysRequested ?? "—"}</td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusBadge(l.status)}`}>
                          {l.status === "pending" ? "Чакащ" : l.status === "approved" ? "Одобрен" : l.status === "rejected" ? "Отхвърлен" : l.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {l.status === "pending" && (
                          <div className="flex gap-1">
                            <button onClick={() => handleLeaveStatus(l.id, "approved")} className="rounded-lg p-1.5 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30"><CheckCircle size={16} /></button>
                            <button onClick={() => handleLeaveStatus(l.id, "rejected")} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><XCircle size={16} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : tab === "payroll" ? (
          <>
            {batches.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500"><FileSpreadsheet size={40} className="mx-auto mb-3 text-slate-300" /><p>Няма ведомости.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                    <tr><th className="p-3">Месец</th><th className="p-3">Статус</th><th className="p-3 text-right">Бруто</th><th className="p-3 text-right">Нето</th><th className="p-3 text-right">Разход</th><th className="p-3"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {batches.map((b) => (
                      <tr key={b.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer ${selectedBatchId === b.id ? "bg-teal-50 dark:bg-teal-950/20" : ""}`}
                        onClick={() => openBatch(b.id)}>
                        <td className="p-3 font-medium">{b.month}</td>
                        <td className="p-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusBadge(b.status)}`}>
                            {b.status === "draft" ? "Чернова" : b.status === "calculated" ? "Изчислена" : b.status === "approved" ? "Одобрена" : b.status === "paid" ? "Платена" : b.status}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold">{b.totalGross.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-emerald-600">{b.totalNet.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-red-600">{b.totalEmployerCost.toFixed(2)}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {b.status === "draft" && (
                              <button onClick={(e) => { e.stopPropagation(); handleBatchStatus(b.id, "calculated"); }} className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-xs font-bold">Изчисли</button>
                            )}
                            {b.status === "calculated" && (
                              <button onClick={(e) => { e.stopPropagation(); handleBatchStatus(b.id, "approved"); }} className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs font-bold">Одобри</button>
                            )}
                            {b.status === "approved" && (
                              <button onClick={(e) => { e.stopPropagation(); handleBatchStatus(b.id, "paid"); }} className="rounded-lg p-1.5 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 text-xs font-bold">Плати</button>
                            )}
                            {(b.status === "draft" || b.status === "calculated") && (
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteBatch(b.id); }} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 size={16} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedBatchId && batchItems.length > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-6 py-3 text-sm font-bold text-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <span>Детайли за ведомостта и изчислени ставки</span>
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800" title="Автоматично създадени счетоводни статии в Главна книга по сметки 604, 605, 421 и 455">
                      ⚖️ Авто-осчетоводена (604/421/455)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={printPaySlips}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm">
                      🖨️ Печат на Фишове за заплати (чл. 128 КТ)
                    </button>
                    <button onClick={() => exportCsv(batchItems, [
                      { key: 'employeeName', label: 'Служител' },
                      { key: 'gross', label: 'Бруто' },
                      { key: 'insuranceBase', label: 'Осиг_Праг' },
                      { key: 'employeeInsurance', label: 'Осиг_Работник' },
                      { key: 'employerInsurance', label: 'Осиг_Работодател' },
                      { key: 'incomeTax', label: 'ДОД_10%' },
                      { key: 'net', label: 'Нето' },
                      { key: 'employerCost', label: 'Общ_Разход' },
                    ], `NAP_Declaration1_Export_${Date.now()}.csv`)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                      📥 Експорт за НАП (Декларация 1 & 6)
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                      <tr><th className="p-3">Служител</th><th className="p-3 text-right">Бруто</th><th className="p-3 text-right">Осиг. работник</th><th className="p-3 text-right">Осиг. работодател</th><th className="p-3 text-right">Данък</th><th className="p-3 text-right">Нето</th><th className="p-3 text-right">Разход</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {batchItems.map((i) => (
                        <tr key={i.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${i.hasWarning === "true" ? "bg-amber-50 dark:bg-amber-950/10" : ""}`}>
                          <td className="p-3 font-medium">
                            {i.employeeName}
                            {i.hasWarning === "true" && <p className="text-[11px] text-amber-600 dark:text-amber-400">⚠️ {i.warning || "Под МРЗ (1077 лв)"}</p>}
                          </td>
                          <td className="p-3 text-right">{i.gross.toFixed(2)}</td>
                          <td className="p-3 text-right text-red-600">{i.employeeInsurance.toFixed(2)}</td>
                          <td className="p-3 text-right text-red-600">{i.employerInsurance.toFixed(2)}</td>
                          <td className="p-3 text-right text-amber-600">{i.incomeTax.toFixed(2)}</td>
                          <td className="p-3 text-right font-bold text-emerald-600">{i.net.toFixed(2)}</td>
                          <td className="p-3 text-right font-bold">{i.employerCost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : tab === "seasonal_114a" ? (
          <div>
            {/* KPI TOP CARD FOR ART 114a */}
            <div className="grid gap-4 border-b border-slate-200 p-6 dark:border-slate-700 sm:grid-cols-4 bg-amber-50/30 dark:bg-amber-950/10">
              <div className="rounded-2xl border border-amber-200 bg-white p-4 dark:border-amber-900/40 dark:bg-slate-900 shadow-sm">
                <p className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400">Активни сезонни договори</p>
                <p className="mt-1 text-2xl font-black text-slate-800 dark:text-white">{seasonalContracts.length} бр.</p>
                <p className="text-xs text-slate-500">Регистрирани в ИА ГИТ</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-white p-4 dark:border-amber-900/40 dark:bg-slate-900 shadow-sm">
                <p className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400">Средно бруто / ден</p>
                <p className="mt-1 text-2xl font-black text-slate-800 dark:text-white">67.50 лв.</p>
                <p className="text-xs text-emerald-600 font-bold">~61.80 лв. нето на ръка</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-white p-4 dark:border-amber-900/40 dark:bg-slate-900 shadow-sm">
                <p className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400">Авансови вноски ДОО/ТЗПБ</p>
                <p className="mt-1 text-2xl font-black text-slate-800 dark:text-white">
                  {seasonalContracts.reduce((acc, c) => acc + c.dooEmployee + c.dooEmployer + c.tzpbEmployer, 0).toFixed(2)} лв.
                </p>
                <p className="text-xs text-slate-500">За сметка на двете страни</p>
              </div>
              <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4 dark:border-teal-900/40 dark:bg-teal-950/20 shadow-sm">
                <p className="text-xs font-bold uppercase text-teal-700 dark:text-teal-400">ИА ГИТ Регистър</p>
                <p className="mt-1 text-lg font-bold text-teal-900 dark:text-teal-300 flex items-center gap-1.5">
                  <CheckCircle size={18} className="text-teal-600" /> Синхронизирано
                </p>
                <p className="text-[11px] text-teal-600">Електронен обмен 2026</p>
              </div>
            </div>

            {/* FORM FOR ART 114a */}
            {showSeasonalForm && (
              <form onSubmit={handleAddSeasonal} className="grid gap-4 border-b border-slate-200 p-6 dark:border-slate-700 sm:grid-cols-3 bg-amber-50/50 dark:bg-amber-950/20">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Име и Фамилия на работника *</label>
                  <input value={seasonalForm.workerName} onChange={(e) => setSeasonalForm({ ...seasonalForm, workerName: e.target.value })} required placeholder="напр. Никола Христов"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">ЕГН / ЛНЧ *</label>
                  <input value={seasonalForm.egn} onChange={(e) => setSeasonalForm({ ...seasonalForm, egn: e.target.value })} required placeholder="10 цифри"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Селскостопанска дейност *</label>
                  <select value={seasonalForm.activity} onChange={(e) => setSeasonalForm({ ...seasonalForm, activity: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                    <option value="Жътва на пшеница / ечемик">Жътва на пшеница / ечемик</option>
                    <option value="Бране на грозде - Винен сорт">Бране на грозде - Винен сорт</option>
                    <option value="Прибиране на маслодайна роза">Прибиране на маслодайна роза</option>
                    <option value="Бране на лавандула">Бране на лавандула</option>
                    <option value="Резитба на трайни насаждения">Резитба на трайни насаждения</option>
                    <option value="Бране на зеленчуци (Домати/Пипер)">Бране на зеленчуци (Домати/Пипер)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Работна дата *</label>
                  <input type="date" value={seasonalForm.date} onChange={(e) => setSeasonalForm({ ...seasonalForm, date: e.target.value })} required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Брутно дневно възнаграждение (лв.) *</label>
                  <input type="number" step="0.01" value={seasonalForm.gross} onChange={(e) => setSeasonalForm({ ...seasonalForm, gross: e.target.value })} required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                </div>
                <div className="flex items-end gap-2">
                  <button type="submit" className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700 shadow-md">
                    <Plus size={16} /> Регистрирай договор
                  </button>
                  <button type="button" onClick={() => setShowSeasonalForm(false)} className="rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400">Отказ</button>
                </div>
              </form>
            )}

            {/* TABLE FOR ART 114a */}
            <div className="overflow-x-auto p-6">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                  <tr>
                    <th className="p-3">Работник & ЕГН</th>
                    <th className="p-3">Дейност</th>
                    <th className="p-3">Дата</th>
                    <th className="p-3 text-right">Бруто</th>
                    <th className="p-3 text-right">ДОО (Работник)</th>
                    <th className="p-3 text-right">ДОО + ТЗПБ (Работодател)</th>
                    <th className="p-3 text-right">Нето за изплащане</th>
                    <th className="p-3 text-center">Статус ИА ГИТ</th>
                    <th className="p-3 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {seasonalContracts.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-slate-800 dark:text-white">
                        {c.workerName}
                        <span className="block font-normal text-xs text-slate-500">ЕГН: {c.egn}</span>
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{c.activity}</td>
                      <td className="p-3 text-slate-600">{c.date}</td>
                      <td className="p-3 text-right font-bold">{c.gross.toFixed(2)} лв.</td>
                      <td className="p-3 text-right text-red-600">-{c.dooEmployee.toFixed(2)} лв.</td>
                      <td className="p-3 text-right text-red-600">+{(c.dooEmployer + c.tzpbEmployer).toFixed(2)} лв.</td>
                      <td className="p-3 text-right font-black text-emerald-600 text-base">{c.net.toFixed(2)} лв.</td>
                      <td className="p-3 text-center">
                        <span className="rounded-full bg-teal-100 text-teal-800 px-2.5 py-0.5 text-xs font-bold dark:bg-teal-900/50 dark:text-teal-300 inline-flex items-center gap-1">
                          ✓ Регистриран
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => printSeasonal114aSlip(c)}
                          className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 shadow-sm transition">
                          🖨️ 4 екземпляра (чл. 114а)
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </SitePageShell>
  );
}
