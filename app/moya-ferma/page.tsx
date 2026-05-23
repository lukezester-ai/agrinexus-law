"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, MapPin, Wheat, Sprout, CircleCheck } from "lucide-react";

type FarmProfile = {
  region: string;
  crops: string;
  isBio: boolean;
};

export default function MoyaFermaPage() {
  const [profile, setProfile] = useState<FarmProfile>({
    region: "",
    crops: "",
    isBio: false,
  });
  
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // При зареждане, опитай да вземеш профила от localStorage
    try {
      const stored = localStorage.getItem("agrinexus_farm_profile");
      if (stored) {
        setProfile(JSON.parse(stored));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("agrinexus_farm_profile", JSON.stringify(profile));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6">
          <ArrowLeft size={16} /> Назад към началото
        </Link>
        
        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="p-8 border-b border-white/10 bg-teal-50/50 dark:bg-teal-950/20">
            <h1 className="font-display text-3xl font-black text-slate-950 dark:text-white flex items-center gap-3">
              <Sprout className="text-teal-600 dark:text-teal-400" /> Моята ферма
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
              Въведи данните за своето стопанство. AI асистентът автоматично ще филтрира сроковете и съветите, 
              за да ти показва само това, което касае твоите култури и регион.
            </p>
          </div>

          <form onSubmit={handleSave} className="p-6 grid gap-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Wheat size={18} className="text-emerald-600" /> Отглеждани култури
              </label>
              <input 
                value={profile.crops}
                onChange={e => setProfile({...profile, crops: e.target.value})}
                placeholder="Напр. Пшеница, Слънчоглед, Царевица..."
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
              <p className="text-xs text-slate-500">Изброй културите, разделени със запетая.</p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <MapPin size={18} className="text-teal-600" /> Регион / Област
              </label>
              <input 
                value={profile.region}
                onChange={e => setProfile({...profile, region: e.target.value})}
                placeholder="Напр. Добрич, Плевен, Пловдив..."
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                <input 
                  type="checkbox"
                  checked={profile.isBio}
                  onChange={e => setProfile({...profile, isBio: e.target.checked})}
                  className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-slate-800"
                />
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">Биологично производство</span>
                  <span className="text-xs text-slate-500">Отбележи, ако стопанството ти е сертифицирано като био.</span>
                </div>
              </label>
            </div>

            {saved && (
              <div className="p-4 bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 rounded-2xl flex items-center gap-3 text-sm font-bold border border-teal-200 dark:border-teal-800/50">
                <CircleCheck size={18} /> Профилът е запазен успешно! AI асистентът вече го взема предвид.
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-teal-700 dark:hover:bg-teal-100 font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-lg"
            >
              <Save size={18} /> Запази профила
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
