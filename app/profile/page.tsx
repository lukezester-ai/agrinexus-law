"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Save, Check, FolderOpen } from "lucide-react";
import { SitePageShell } from "@/components/site-page-shell";
import { loadFarmProfile, persistFarmProfile } from "@/lib/farm-profile";

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
    <SitePageShell maxWidth="2xl" subheader={<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Профил на стопанството</p>}>
        <div className="mb-8 text-center">
          <div className="mb-3 text-4xl" aria-hidden>
            🌾
          </div>
          <h1 className="font-display text-2xl font-black tracking-tight text-slate-950 dark:text-white">Разкажи ни за стопанството си</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Колкото повече знаем, толкова по-точни ще са отговорите от Елена, Борис и Виктория.
          </p>
        </div>

        <div className="surface-card space-y-6 p-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-800 dark:text-slate-100">Тип стопанство</label>
            <select 
              value={profile.farm_type}
              onChange={(e) => setProfile({...profile, farm_type: e.target.value})}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
            >
              <option value="">Избери...</option>
              {FARM_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-800 dark:text-slate-100">Област</label>
            <select 
              value={profile.region}
              onChange={(e) => setProfile({...profile, region: e.target.value})}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
            >
              <option value="">Избери...</option>
              {REGIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-800 dark:text-slate-100">Размер (декари)</label>
            <input 
              type="number"
              value={profile.total_decares}
              onChange={(e) => setProfile({...profile, total_decares: e.target.value})}
              placeholder="напр. 50"
              className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">1 хектар = 10 декара</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-800 dark:text-slate-100">Какво отглеждаш?</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_CROPS.map(crop => (
                <button
                  key={crop}
                  type="button"
                  onClick={() => toggleCrop(crop)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition ${
                    profile.crops.includes(crop)
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-200 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  {crop}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input 
              type="checkbox"
              id="organic"
              checked={profile.is_organic}
              onChange={(e) => setProfile({...profile, is_organic: e.target.checked})}
              className="w-4 h-4"
            />
            <label htmlFor="organic" className="text-sm dark:text-slate-300">
              Биологично производство (имам сертификат или съм в преход)
            </label>
          </div>

          <button
            onClick={handleSave}
            className="brand-cta-bg w-full py-3 text-white rounded-lg text-sm font-medium transition shadow-sm hover:brightness-105 flex items-center justify-center gap-2"
          >
            {saved ? (
              <>
                <Check size={16} />
                Запазено!
              </>
            ) : (
              <>
                <Save size={16} />
                Запази профил
              </>
            )}
          </button>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Профилът се пази в браузъра ти (localStorage) и се вкарва автоматично в чата за по-персонални отговори — не се качва към наш сървър.
          </p>

          <Link
            href="/documents"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition">
            <FolderOpen size={16} aria-hidden />
            Мои документи (PDF и др.)
          </Link>
        </div>

        <Link
          href="/"
          className="mt-6 block text-center text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
        >
          Готов съм — към чата →
        </Link>
    </SitePageShell>
  );
}
