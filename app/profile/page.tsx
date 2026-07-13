"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Save, Check, FolderOpen } from "lucide-react";
import { SitePageShell } from "@/components/site-page-shell";
import { loadFarmProfile, persistFarmProfile } from "@/lib/farm-profile";
import TwoFactorSetup from "@/components/two-factor-setup";

const REGIONS = [
  "Благоевград", "Бургас", "Варна", "Велико Търново", "Видин", "Враца",
  "Габрово", "Добрич", "Кърджали", "Кюстендил", "Ловеч", "Монтана",
  "Пазарджик", "Перник", "Плевен", "Пловдив", "Разград", "Русе",
  "Силистра", "Сливен", "Смолян", "София", "Стара Загора", "Търговище",
  "Хасково", "Шумен", "Ямбол"
];

const FARM_TYPES = [
  "Растениевъдство",
  "Животновъдство",
  "Смесено стопанство",
  "Овошки и трайни насаждения",
  "Лозарство",
  "Зеленчукопроизводство",
  "Биологично производство",
  "Пчеларство"
];

const COMMON_CROPS = [
  "Пшеница", "Ечемик", "Царевица", "Слънчоглед", "Рапица",
  "Лозя", "Ябълки", "Череши", "Сливи", "Праскови",
  "Картофи", "Домати", "Краставици", "Чушки", "Лук"
];

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    farm_type: "",
    region: "",
    total_decares: "",
    crops: [] as string[],
    livestock: [] as string[],
    is_organic: false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const snap = loadFarmProfile();
    if (snap) {
      setProfile({
        farm_type: snap.farm_type,
        region: snap.region,
        total_decares: snap.total_decares ? String(snap.total_decares) : "",
        crops: snap.crops || [],
        livestock: snap.livestock || [],
        is_organic: snap.is_organic,
      });
    }
  }, []);

  const toggleCrop = (crop: string) => {
    setProfile(prev => ({
      ...prev,
      crops: prev.crops.includes(crop) 
        ? prev.crops.filter(c => c !== crop)
        : [...prev.crops, crop]
    }));
  };

  const handleSave = async () => {
    const snapshot = {
      ...profile,
      total_decares: profile.total_decares ? Number(profile.total_decares) : 0,
      livestock: profile.livestock || [],
    };
    persistFarmProfile(snapshot);

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SitePageShell maxWidth="2xl" subheader={<p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Настройки и профил на стопанството</p>}>
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-fuchsia-600 text-4xl shadow-lg shadow-emerald-500/25 animate-float" aria-hidden>
            🌾
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-fuchsia-600">
            Разкажи ни за стопанството си
          </h1>
          <p className="mt-2.5 text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
            Колкото повече знаем за твоите площи и култури, толкова по-точни ще са анализите от Елена, Борис и Виктория.
          </p>
        </div>

        <div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-950/80 p-6 sm:p-10 shadow-[0_24px_60px_-15px_rgba(16,185,129,0.15)] backdrop-blur-2xl space-y-7">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Тип стопанство</label>
            <select 
              value={profile.farm_type}
              onChange={(e) => setProfile({...profile, farm_type: e.target.value})}
              className="w-full px-4 py-3.5 border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-800 dark:text-slate-100"
            >
              <option value="">Избери тип стопанство...</option>
              {FARM_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Област (Регион)</label>
            <select 
              value={profile.region}
              onChange={(e) => setProfile({...profile, region: e.target.value})}
              className="w-full px-4 py-3.5 border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-800 dark:text-slate-100"
            >
              <option value="">Избери област...</option>
              {REGIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Общ размер на площите (декари)</label>
            <input 
              type="number"
              value={profile.total_decares}
              onChange={(e) => setProfile({...profile, total_decares: e.target.value})}
              placeholder="напр. 50 или 1200"
              className="w-full px-4 py-3.5 border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-800 dark:text-slate-100"
            />
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1.5">
              <span>💡 Ориентир: 1 хектар (ha) = 10 декара (da)</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">Какво отглеждаш? (Избери всички приложими)</label>
            <div className="flex flex-wrap gap-2.5">
              {COMMON_CROPS.map(crop => (
                <button
                  key={crop}
                  type="button"
                  onClick={() => toggleCrop(crop)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-200 ${
                    profile.crops.includes(crop)
                      ? "border-emerald-500 bg-gradient-to-r from-emerald-600 via-teal-600 to-fuchsia-600 text-white shadow-md shadow-emerald-600/20 scale-105"
                      : "border-slate-200/90 bg-slate-50/70 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 hover:border-emerald-400 hover:bg-white"
                  }`}
                >
                  {crop}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-950/20 p-4 flex items-center gap-3.5">
            <input 
              type="checkbox"
              id="organic"
              checked={profile.is_organic}
              onChange={(e) => setProfile({...profile, is_organic: e.target.checked})}
              className="w-5 h-5 rounded border-emerald-500 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="organic" className="text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer leading-snug">
              Биологично производство (имам валиден сертификат или съм в преходен период)
            </label>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-fuchsia-600 text-white font-extrabold text-base shadow-lg shadow-emerald-600/25 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {saved ? (
              <>
                <Check size={20} className="animate-bounce" />
                <span>Профилът е успешно запазен!</span>
              </>
            ) : (
              <>
                <Save size={20} />
                <span>Запази профил на стопанството</span>
              </>
            )}
          </button>

          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 text-center leading-relaxed">
            🔒 Профилът се пази локално в твоя браузър (localStorage) и се подава автоматично към AI чата за персонализация. Не се споделя с трети страни.
          </p>

          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <Link
              href="/documents"
              className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl text-sm font-extrabold border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-all">
              <FolderOpen size={18} aria-hidden className="text-emerald-600 dark:text-emerald-400" />
              <span>Мои документи и файлове (PDF архив)</span>
            </Link>
          </div>

          <div className="pt-2">
            <TwoFactorSetup />
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-extrabold text-sm shadow-md hover:scale-105 transition-all"
          >
            <span>Готов съм — към AI Чата</span>
            <span>→</span>
          </Link>
        </div>
    </SitePageShell>
  );
}
