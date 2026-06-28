import React from 'react';
import Link from 'next/link';

export const SiteFooter: React.FC = () => {
  return <footer className="bg-[#080F0B] px-6 pt-16 pb-12 flex flex-col items-center gap-12">
      <div className="flex flex-col items-center gap-6">
        <span className="text-white font-bold text-[18px] font-body tracking-tight">AgriNexus</span>
        <div className="flex flex-col items-center gap-4">
          <Link href="/documents" className="text-[13px] text-[#555555] font-medium hover:text-white transition-colors">Документи</Link>
          <Link href="/privacy" className="text-[13px] text-[#555555] font-medium hover:text-white transition-colors">Поверителност</Link>
          <Link href="/srokove" className="text-[13px] text-[#555555] font-medium hover:text-white transition-colors">Срокове</Link>
          <Link href="/document-review" className="text-[13px] text-[#555555] font-medium hover:text-white transition-colors">AI Преглед</Link>
        </div>
      </div>
      <p className="text-[13px] text-[#333333] font-body">© 2025 AgriNexus.Law</p>
    </footer>;
};
