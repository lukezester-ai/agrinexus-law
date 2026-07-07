"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: string;
  created_at: string;
};

const TYPE_COLORS: Record<string, string> = {
  low_stock: "border-l-red-500",
  service_due: "border-l-orange-500",
  invoice_due: "border-l-purple-500",
  reminder: "border-l-blue-500",
  info: "border-l-slate-400",
};

export function NotificationBell() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifs = async () => {
    try {
      const res = await fetch("/api/farm/notifications?unreadOnly=true");
      const data = await res.json();
      setNotifs(Array.isArray(data) ? data : []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const markAllRead = async () => {
    await fetch("/api/farm/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifs([]);
  };

  const unreadCount = notifs.length;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => { setOpen(!open); if (!open) fetchNotifs(); }} className="relative rounded-lg p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800">
        <Bell size={18} className="text-slate-600 dark:text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <span className="text-sm font-bold text-slate-900 dark:text-white">Известия</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700">
                <CheckCheck size={14} /> Всички прочетени
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6"><Loader2 size={18} className="animate-spin text-slate-400" /></div>
            ) : notifs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">Няма нови известия</div>
            ) : (
              notifs.slice(0, 10).map((n) => (
                <Link key={n.id} href={n.link || '#'} onClick={() => setOpen(false)}
                  className={`block border-l-4 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800 ${TYPE_COLORS[n.type] || 'border-l-slate-400'}`}>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{n.title}</p>
                  {n.message && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{n.message}</p>}
                  <p className="mt-1 text-[10px] text-slate-400">{new Date(n.created_at).toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
