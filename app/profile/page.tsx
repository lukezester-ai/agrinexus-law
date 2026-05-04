"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Check, FolderOpen, Wheat } from "lucide-react";
import { loadFarmProfile, persistFarmProfile } from "@/lib/farm-profile";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";

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
  const auth = useAuthUser();
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

    const supabase = createBrowserSupabaseClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.auth.updateUser({
          data: {
            farm_profile: {
              farm_type: snapshot.farm_type,
              region: snapshot.region,
              total_decares: snapshot.total_decares,
              crops: snapshot.crops,
              livestock: snapshot.livestock,
              is_organic: snapshot.is_organic,
            },
          },
        });
        if (error) console.error("Supabase farm_profile metadata:", error);
      }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen agri-page-bg">
      <nav className="sticky top-0 z-20 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-teal-100/80 dark:border-stone-800 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white">
            <ArrowLeft size={16} />
            <span className="text-sm">Към началото</span>
          </Link>
          <div className="flex items-center gap-3">
            {auth.status === "signed_in" && (
              <Link
                href="/moya-ferma"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm text-[#0d9488] dark:text-teal-400 font-medium hover:underline">
                <Wheat size={14} aria-hidden />
                Моя ферма
              </Link>
            )}
            <div className="font-medium text-base dark:text-stone-100">Профил на стопанството</div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {auth.status === "anonymous" && (
          <div className="mb-6 rounded-xl border border-amber-200/90 dark:border-amber-800/50 bg-amber-50/90 dark:bg-amber-950/25 px-4 py-3 text-sm text-amber-950 dark:text-amber-100/95 leading-relaxed">
            За личен панел „Моя ферма“ с профил, документи и инструменти —{" "}
            <Link href="/vhod" className="font-semibold underline hover:no-underline">
              влез с имейл
            </Link>
            .
          </div>
        )}

        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🌾</div>
          <h1 className="text-2xl font-medium mb-2 dark:text-stone-50">Разкажи ни за стопанството си</h1>
          <p className="text-stone-600 dark:text-stone-400">
            Колкото повече знаем, толкова по-точни ще са отговорите от Елена, Борис и Виктория.
          </p>
        </div>

        <div className="bg-white dark:bg-stone-900/95 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 space-y-6">
          
          <div>
            <label className="block text-sm font-medium mb-2 text-stone-800 dark:text-stone-100">Тип стопанство</label>
            <select 
              value={profile.farm_type}
              onChange={(e) => setProfile({...profile, farm_type: e.target.value})}
              className="w-full px-4 py-3 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-400"
            >
              <option value="">Избери...</option>
              {FARM_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-stone-800 dark:text-stone-100">Област</label>
            <select 
              value={profile.region}
              onChange={(e) => setProfile({...profile, region: e.target.value})}
              className="w-full px-4 py-3 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-400"
            >
              <option value="">Избери...</option>
              {REGIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-stone-800 dark:text-stone-100">Размер (декари)</label>
            <input 
              type="number"
              value={profile.total_decares}
              onChange={(e) => setProfile({...profile, total_decares: e.target.value})}
              placeholder="напр. 50"
              className="w-full px-4 py-3 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-400"
            />
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">1 хектар = 10 декара</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-stone-800 dark:text-stone-100">Какво отглеждаш?</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_CROPS.map(crop => (
                <button
                  key={crop}
                  type="button"
                  onClick={() => toggleCrop(crop)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition ${
                    !profile.crops.includes(crop) ? "bg-white dark:bg-stone-800 dark:text-stone-200 dark:border-stone-600 text-[#1c1917]" : ""
                  }`}
                  style={{
                    background: profile.crops.includes(crop) ? "#0d9488" : undefined,
                    color: profile.crops.includes(crop) ? "white" : undefined,
                    borderColor: profile.crops.includes(crop) ? "#0d9488" : "#e7e5e4"
                  }}
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
            <label htmlFor="organic" className="text-sm dark:text-stone-300">
              Биологично производство (имам сертификат или съм в преход)
            </label>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
            style={{ background: "#0d9488" }}
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

          <p className="text-xs text-stone-500 dark:text-stone-400 text-center">
            Профилът се пази в браузъра ти (localStorage) и се вкарва автоматично в чата за по-персонални отговори — не се качва към наш сървър.
          </p>

          <Link
            href="/documents"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-medium border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800/80 transition">
            <FolderOpen size={16} aria-hidden />
            Мои документи (PDF и др.)
          </Link>
        </div>

        <Link 
          href="/"
          className="block text-center mt-6 text-sm text-stone-600 dark:text-teal-300/90 hover:text-stone-900 dark:hover:text-white"
        >
          Готов съм - към чата →
        </Link>
      </div>
    </div>
  );
}
