import { AgriNexusLanding } from "@/components/generated/AgriNexusLanding";

export default function Home() {
  return (
    <>
      <div className="relative z-50 flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3 text-center text-sm font-bold text-white shadow-lg">
        Нови модули: <a href="/moya-ferma" className="underline underline-offset-2 hover:text-emerald-100">Счетоводство</a>, <a href="/moya-ferma/sklad" className="underline underline-offset-2 hover:text-emerald-100">Склад</a>, <a href="/moya-ferma/mashini" className="underline underline-offset-2 hover:text-emerald-100">Машини</a>, <a href="/moya-ferma/rekolta" className="underline underline-offset-2 hover:text-emerald-100">Реколта</a>, <a href="/moya-ferma/seitbooborot" className="underline underline-offset-2 hover:text-emerald-100">Сеитбооборот</a>, <a href="/moya-ferma/himizacia" className="underline underline-offset-2 hover:text-emerald-100">Химизация</a>
      </div>
      <AgriNexusLanding />
    </>
  );
}
