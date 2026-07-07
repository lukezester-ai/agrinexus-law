import { AgriNexusLanding } from "@/components/generated/AgriNexusLanding";

export default function Home() {
  return (
    <>
      <div className="relative z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3 text-center text-sm font-bold text-white shadow-lg">
        <a href="/moya-ferma" className="underline underline-offset-2 hover:text-emerald-100">Моята ферма</a> — Счетоводство, Склад, Машини, Реколта, Сеитбооборот, Химизация, Банки, ЧР, ДМА, Календар
      </div>
      <AgriNexusLanding />
    </>
  );
}
