import { AgriNexusLanding } from "@/components/generated/AgriNexusLanding";

export default function Home() {
  return (
    <>
      <div className="relative z-50 overflow-hidden bg-gradient-to-r from-slate-950 via-emerald-950/90 to-fuchsia-950/90 px-4 py-2.5 text-center text-xs sm:text-sm font-medium text-white shadow-[0_4px_24px_-4px_rgba(16,185,129,0.25)] border-b border-white/10 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-fuchsia-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300 border border-emerald-400/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            УПРАВЛЕНИЕ НА СТОПАНСТВОТО
          </span>
          <span className="text-slate-200">
            Опитайте всички 18 секторни модула в <a href="/moya-ferma" className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-fuchsia-400 hover:opacity-80 transition-opacity underline decoration-emerald-500/50 underline-offset-4">Моята ферма</a>:
          </span>
          <span className="text-slate-400 text-xs hidden sm:inline">
            🌾 Зърнопроизводство · 🐄 Животновъдство (ВетИС) · 🍎 Овощарство & Лозя · 🐝 Пчеларство · 📊 Счетоводство
          </span>
        </div>
      </div>
      <AgriNexusLanding />
    </>
  );
}

