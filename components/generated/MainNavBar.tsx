"use client";

import React from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface NavLinkProps {
  label: string;
  href: string;
  active?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({
  label,
  href,
  active
}) => <Link href={href} className={`px-4 py-2 text-sm font-medium transition-all duration-200 hover:text-white ${active ? 'text-white' : 'text-zinc-400'}`}>
    {label}
  </Link>;

export const MainNavBar: React.FC<{
  activeScreen?: string;
}> = ({
  activeScreen = 'Home'
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const links = [{
    label: 'Начало',
    screen: 'Home',
    href: '/'
  }, {
    label: 'Статистика',
    screen: 'Statistics',
    href: '/statistiki'
  }, {
    label: 'Срокове',
    screen: 'Deadlines',
    href: '/srokove'
  }, {
    label: 'Документи',
    screen: 'Documents',
    href: '/documents'
  }, {
    label: 'AI Анализ',
    screen: 'AI Review',
    href: '/document-review'
  }];

  return <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-4 py-6 pointer-events-none">
      <div className="flex items-center justify-between w-full max-w-7xl px-6 py-3 bg-zinc-950/40 backdrop-blur-xl border border-zinc-800/50 rounded-full pointer-events-auto">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:rotate-6 transition-transform">
              <span className="text-white font-bold text-lg leading-none">A</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white serif-heading">AgriNexus</span>
          </Link>

          <div className="hidden md:flex items-center">
            {links.map(link => <NavLink key={link.screen} label={link.label} href={link.href} active={activeScreen === link.screen} />)}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/vhod" className="hidden md:flex items-center gap-2 px-5 py-2 bg-white text-black text-sm font-semibold rounded-full hover:bg-zinc-200 transition-colors">
            Вход
            <ArrowRight size={16} />
          </Link>
          
          <button className="md:hidden text-zinc-400 hover:text-white" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isOpen && <div className="absolute top-24 left-4 right-4 bg-zinc-950/95 backdrop-blur-2xl border border-zinc-800 p-6 rounded-3xl md:hidden pointer-events-auto flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
          {links.map(link => <Link key={link.screen} href={link.href} className={`text-lg font-medium ${activeScreen === link.screen ? 'text-white' : 'text-zinc-400'}`} onClick={() => setIsOpen(false)}>
              {link.label}
            </Link>)}
          <hr className="border-zinc-800 my-2" />
          <Link href="/vhod" className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-center block">
            Вход в системата
          </Link>
        </div>}
    </nav>;
};
