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
  const [tab, setTab] = useState<"employees" | "attendance" | "leave" | "payroll">("employees");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaveReqs, setLeaveReqs] = useState<LeaveRequest[]>([]);
  const [batches, setBatches] = useState<PayrollBatch[]>([]);

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
  }, []);

  useEffect(() => { if (tab === "attendance") loadAttendance(); }, [tab, attFilterEmp, attFilterMonth]);

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
    const map: Record<string, string> = { full_time: "Пълен работен ден", part_time: "Непълно работно време", civil: "Граждански договор" };
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
        <p className="text-sm font-semibold">Човешки ресурси</p>
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
          <FileSpreadsheet size={16} className="mr-1.5 inline" /> Ведомости
        </button>
      </div>

      <div className="glass-panel overflow-hidden rounded-3xl">
        <div className="border-b border-white/10 bg-teal-50/50 p-6 dark:bg-teal-950/20">
          <h1 className="font-display flex items-center gap-3 text-2xl font-medium">
            {tab === "employees" && <><Users className="text-teal-600 dark:text-teal-400" /> Служители</>}
            {tab === "attendance" && <><CalendarCheck className="text-teal-600 dark:text-teal-400" /> Присъствие</>}
            {tab === "leave" && <><XCircle className="text-teal-600 dark:text-teal-400" /> Отпуски</>}
            {tab === "payroll" && <><FileSpreadsheet className="text-teal-600 dark:text-teal-400" /> Ведомости</>}
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
                <option value="full_time">Пълен работен ден</option>
                <option value="part_time">Непълно работно време</option>
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
        ) : (
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
                <div className="bg-slate-50 px-6 py-3 text-sm font-bold text-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                  Детайли за ведомостта
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                      <tr><th className="p-3">Служител</th><th className="p-3 text-right">Бруто</th><th className="p-3 text-right">Осиг. работник</th><th className="p-3 text-right">Осиг. работодател</th><th className="p-3 text-right">Данък</th><th className="p-3 text-right">Нето</th><th className="p-3 text-right">Разход</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {batchItems.map((i) => (
                        <tr key={i.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${i.hasWarning === "true" ? "bg-amber-50 dark:bg-amber-950/10" : ""}`}>
                          <td className="p-3 font-medium">{i.employeeName}</td>
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
        )}
      </div>
    </SitePageShell>
  );
}
