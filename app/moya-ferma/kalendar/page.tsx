"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Plus, Bell, Tractor, FlaskConical, Combine, Receipt, ShoppingCart, RefreshCw, Loader2 } from "lucide-react";
import { SitePageShell } from "@/components/site-page-shell";

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: "reminder" | "service" | "application" | "harvest" | "invoice" | "purchase";
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, any>;
};

const TYPE_COLORS: Record<string, string> = {
  service: "bg-red-500",
  application: "bg-orange-500",
  harvest: "bg-green-500",
  reminder: "bg-blue-500",
  invoice: "bg-purple-500",
  purchase: "bg-purple-500",
};

const TYPE_ICONS: Record<string, any> = {
  service: Tractor,
  application: FlaskConical,
  harvest: Combine,
  reminder: Bell,
  invoice: Receipt,
  purchase: ShoppingCart,
};

const TYPE_LABELS: Record<string, string> = {
  service: "Сервиз",
  application: "Химизация",
  harvest: "Реколта",
  reminder: "Напомняне",
  invoice: "Фактура",
  purchase: "Покупка",
};

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function monthKey(y: number, m: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

export default function KalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDate, setFormDate] = useState(formatDate(now));
  const [saving, setSaving] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/farm/calendar?month=${monthKey(year, month)}`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch { setEvents([]); }
    setLoading(false);
  }, [year, month]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const eventsByDay: Record<string, CalendarEvent[]> = {};
  events.forEach(e => {
    const d = e.date.slice(0, 10);
    if (!eventsByDay[d]) eventsByDay[d] = [];
    eventsByDay[d].push(e);
  });

  const selectedEvents = selectedDay ? eventsByDay[selectedDay] || [] : [];

  const handleAddReminder = async () => {
    if (!formTitle.trim() || !formDate) return;
    setSaving(true);
    try {
      await fetch("/api/farm/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formTitle.trim(), description: formDesc.trim() || null, dueDate: formDate }),
      });
      setShowAddModal(false);
      setFormTitle("");
      setFormDesc("");
      setFormDate(formatDate(now));
      fetchEvents();
    } catch {}
    setSaving(false);
  };

  const todayStr = formatDate(now);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[100px]" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayEvents = eventsByDay[dateStr] || [];
    const isToday = dateStr === todayStr;
    cells.push(
      <button
        key={dateStr}
        onClick={() => setSelectedDay(dateStr)}
        className={`min-h-[80px] sm:min-h-[100px] rounded-xl border p-1.5 text-left transition hover:shadow-md ${
          isToday
            ? "border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-900/20"
            : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
        }`}
      >
        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
          isToday ? "bg-emerald-500 text-white" : "text-slate-700 dark:text-slate-300"
        }`}>
          {d}
        </span>
        <div className="mt-1 flex flex-wrap gap-0.5">
          {dayEvents.slice(0, 3).map(ev => (
            <span key={ev.id} className={`h-1.5 w-1.5 rounded-full ${TYPE_COLORS[ev.type] || "bg-slate-400"}`} title={ev.title} />
          ))}
          {dayEvents.length > 3 && (
            <span className="text-[10px] font-bold text-slate-400">+{dayEvents.length - 3}</span>
          )}
        </div>
      </button>
    );
  }

  return (
    <SitePageShell maxWidth="7xl" subheader={
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Календар</p>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700">
          <Plus size={14} /> Напомняне
        </button>
      </div>
    }>
      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button onClick={prevMonth} className="rounded-xl border border-slate-200 p-2 transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {new Date(year, month).toLocaleDateString("bg-BG", { month: "long", year: "numeric" })}
        </h2>
        <button onClick={nextMonth} className="rounded-xl border border-slate-200 p-2 transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7 gap-1.5">
        {DAY_NAMES.map(n => (
          <div key={n} className="text-center text-xs font-bold text-slate-500 dark:text-slate-400">{n}</div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1.5">
          {cells}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400">
        {Object.entries(TYPE_COLORS).map(([key, color]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
            {TYPE_LABELS[key]}
          </span>
        ))}
      </div>

      {/* Day modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setSelectedDay(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {new Date(selectedDay).toLocaleDateString("bg-BG", { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <button onClick={() => setSelectedDay(null)} className="rounded-lg p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            {selectedEvents.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Няма събития за този ден</p>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map(ev => {
                  const Icon = TYPE_ICONS[ev.type] || Bell;
                  return (
                    <div key={ev.id} className={`flex items-start gap-3 rounded-2xl border-l-4 p-3 ${
                      ev.type === "service" ? "border-l-red-500 bg-red-50 dark:bg-red-900/10" :
                      ev.type === "application" ? "border-l-orange-500 bg-orange-50 dark:bg-orange-900/10" :
                      ev.type === "harvest" ? "border-l-green-500 bg-green-50 dark:bg-green-900/10" :
                      ev.type === "reminder" ? "border-l-blue-500 bg-blue-50 dark:bg-blue-900/10" :
                      "border-l-purple-500 bg-purple-50 dark:bg-purple-900/10"
                    }`}>
                      <Icon size={16} className="mt-0.5 shrink-0 text-slate-600 dark:text-slate-400" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{ev.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{TYPE_LABELS[ev.type] || ev.type}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add reminder modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ново напомняне</h3>
              <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Заглавие" className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
              <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Описание (по избор)" rows={3} className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
              <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-white" />
              <button onClick={handleAddReminder} disabled={saving || !formTitle.trim() || !formDate} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Добави
              </button>
            </div>
          </div>
        </div>
      )}
    </SitePageShell>
  );
}
