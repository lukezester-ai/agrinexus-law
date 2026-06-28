"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Search, Calendar, FileText, Sparkles, Check, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '../../lib/utils';

// --- Sub-components ---

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  return <nav className="fixed top-0 left-0 right-0 z-50 glass h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <span className="text-white font-bold text-[15px] tracking-tight font-body">AgriNexus</span>
      </div>
      <button onClick={() => setIsOpen(!isOpen)} className="text-white p-2 focus:outline-none" aria-label="Toggle menu">
        
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 stroke-[1.5px]" />}
      </button>

      <AnimatePresence>
        {isOpen && <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: -20
      }} className="absolute top-16 left-0 right-0 bg-[#0A0A0A] border-b border-[#222222] p-6 flex flex-col gap-4">
          
            <Link href="/" className="text-white font-medium text-lg" onClick={() => setIsOpen(false)}>Начало</Link>
            <Link href="/statistiki" className="text-[#888888] font-medium text-lg" onClick={() => setIsOpen(false)}>Статистика</Link>
            <Link href="/srokove" className="text-[#888888] font-medium text-lg" onClick={() => setIsOpen(false)}>Срокове</Link>
            <Link href="/documents" className="text-[#888888] font-medium text-lg" onClick={() => setIsOpen(false)}>Документи</Link>
            <Link href="/document-review" className="text-[#888888] font-medium text-lg" onClick={() => setIsOpen(false)}>AI Анализ</Link>
          </motion.div>}
      </AnimatePresence>
    </nav>;
};

const AuroraBackground = ({
  children
}: {
  children: React.ReactNode;
}) => {
  return <div className="relative overflow-hidden bg-[#0A0A0A] min-h-[90vh] flex flex-col items-center justify-center pt-16">
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-purple-600/30 aurora-blob animate-aurora" style={{
      animationDuration: '12s'
    }} />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/20 aurora-blob animate-aurora" style={{
      animationDuration: '16s'
    }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-600/10 aurora-blob animate-aurora" style={{
      animationDuration: '10s'
    }} />
      
      <div className="relative z-10 w-full px-6">
        {children}
      </div>
    </div>;
};

const Ticker = () => {
  const items = [{
    text: "Краен срок за субсидии: 15 Април",
    color: "bg-red-500"
  }, {
    text: "Нови насоки за еко-схеми",
    color: "bg-amber-500"
  }, {
    text: "Прием на документи отворен",
    color: "bg-green-500"
  }, {
    text: "Актуализация на Държавен фонд Земеделие",
    color: "bg-blue-500"
  }];

  return <div className="bg-black py-2.5 overflow-hidden border-y border-[#111111]">
      <motion.div animate={{
      x: [0, -1000]
    }} transition={{
      repeat: Infinity,
      duration: 25,
      ease: "linear"
    }} className="flex whitespace-nowrap gap-12">
        
        {[...items, ...items].map((item, idx) => <div key={idx} className="flex items-center gap-3">
            <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]", item.color)} />
            <span className="text-white text-[11px] font-medium tracking-wide uppercase font-body">{item.text}</span>
          </div>)}
      </motion.div>
    </div>;
};

const FeatureCard = ({
  icon: Icon,
  title,
  body,
  href
}: {
  icon: any;
  title: string;
  body: string;
  href: string;
}) => {
  return <Link href={href} className="bg-[#181818] rounded-[16px] border border-[#1E1E1E] p-6 flex flex-col gap-4 block hover:border-[#3B82F6]/40 transition-colors">
      <div className="w-10 h-10 flex items-center justify-center bg-[#1e1e1e] rounded-xl">
        <Icon className="w-6 h-6 text-[#3B82F6] stroke-[1.5px]" />
      </div>
      <div className="space-y-1">
        <h3 className="text-[22px] text-white font-heading italic leading-tight">{title}</h3>
        <p className="text-[14px] text-[#888888] font-body leading-relaxed">{body}</p>
      </div>
      <div className="flex items-center gap-1.5 text-[#3B82F6] text-[14px] font-medium mt-1">
        Виж <ArrowRight className="w-4 h-4" />
      </div>
    </Link>;
};

const TrustItem = ({
  text
}: {
  text: string;
}) => <div className="flex items-center gap-3">
    <div className="w-5 h-5 rounded-full bg-[#1A1A1A]/5 flex items-center justify-center flex-shrink-0">
      <Check className="w-3.5 h-3.5 text-[#1A1A1A]" />
    </div>
    <span className="text-[14px] text-[#444444] font-body">{text}</span>
  </div>;

// --- Main Page ---

export const AgriNexusLanding = () => {
  const suggestions = ["Субсидии 2025", "Еко-схеми", "Бизнес план"];
  return <main className="bg-[#0A0A0A] text-white min-h-screen selection:bg-primary/30">
      <NavBar />
      
      {/* Hero Section */}
      <AuroraBackground>
        <div className="flex flex-col items-center text-center space-y-6 pt-8">
          <motion.span initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} className="text-[11px] text-[#888888] font-body font-bold uppercase tracking-[0.1em]">
            
            AI АСИСТЕНТ
          </motion.span>
          
          <motion.h1 initial={{
          opacity: 0,
          y: 15
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.1
        }} className="text-[48px] font-heading italic leading-[1.0] text-white max-w-[300px] mx-auto tracking-[-0.02em]">
            
            Отговори за вашето стопанство.
          </motion.h1>
          
          <motion.p initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.2
        }} className="text-[16px] text-[#888888] font-body leading-normal px-4">
            
            Търсете субсидии, документи и срокове на едно място.
          </motion.p>
          
          <motion.div initial={{
          opacity: 0,
          scale: 0.95
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          delay: 0.3
        }} className="w-full flex flex-col gap-4 pt-4">
            
            <Link href="/search" className="relative group block">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Search className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <div className="w-full h-[52px] bg-[#181818] border border-[#222222] rounded-xl pl-12 pr-4 flex items-center text-[15px] text-[#888888]">
                Какви документи ми трябват за...
              </div>
            </Link>
            
            <Link href="/search" className="w-full h-[54px] bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl font-medium text-[17px] flex items-center justify-center gap-2 transition-colors active:scale-[0.98]">
              Питай AI <ArrowRight className="w-5 h-5" />
            </Link>
            
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {suggestions.map(text => <Link key={text} href={`/search?q=${encodeURIComponent(text)}`} className="px-4 py-1.5 bg-[#181818] border border-[#1E1E1E] rounded-full text-[13px] text-[#888888] hover:text-white transition-colors">
                
                  {text}
                </Link>)}
            </div>
          </motion.div>
        </div>
      </AuroraBackground>

      {/* Ticker */}
      <Ticker />

      {/* Feature Grid */}
      <section className="px-6 py-16 flex flex-col gap-4">
        <FeatureCard icon={Calendar} title="Провери срокове" body="Никога не изпускайте важна дата за кандидатстване. Персонализирани известия за вашето стопанство." href="/srokove" />
        
        <FeatureCard icon={FileText} title="Намери документ" body="Пълен достъп до бланки, наредби и закони, преведени на достъпен език от нашия AI." href="/documents" />
        
        <FeatureCard icon={Sparkles} title="AI преглед" body="Качете документ и получете незабавен анализ за съответствие с най-новите изисквания." href="/document-review" />
        
      </section>

      {/* Trust Section */}
      <section className="px-6 pb-12">
        <div className="bg-[#FDF4EE] rounded-3xl p-8 flex flex-col gap-6">
          <div className="space-y-4">
            <span className="text-[11px] text-[#1A1A1A]/60 font-body font-bold uppercase tracking-[0.1em]">ИЗТОЧНИЦИ</span>
            <h2 className="text-[28px] text-[#1A1A1A] font-heading italic leading-tight">Всеки отговор — проверим.</h2>
          </div>
          <div className="flex flex-col gap-4">
            <TrustItem text="Директни връзки към ДФЗ" />
            <TrustItem text="Наредби от МЗМ" />
            <TrustItem text="Европейски директиви" />
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="px-6 py-12 flex flex-col items-center gap-6 border-t border-[#111111]">
        <div className="flex items-center gap-2">
          <div className="px-5 py-2 bg-[#181818] border border-[#222222] rounded-full text-[13px] font-medium text-white/70">€0 Старт</div>
          <div className="px-5 py-2 bg-[#3B82F6] rounded-full text-[13px] font-bold text-white shadow-lg shadow-blue-500/20">€19 Про</div>
          <div className="px-5 py-2 bg-[#181818] border border-[#222222] rounded-full text-[13px] font-medium text-white/70">€39 Бизнес</div>
        </div>
        <p className="text-[14px] text-[#555555] text-center max-w-[200px]">Цени, създадени за малки и големи стопанства.</p>
      </section>

      {/* Final CTA */}
      <section className="relative px-6 py-24 overflow-hidden border-t border-[#111111]">
        <div className="absolute inset-0 bg-[#0A0A0A]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-600/10 blur-[120px]" />
        </div>
        <div className="relative z-10 flex flex-col items-center text-center gap-8">
          <h2 className="text-[36px] font-heading italic leading-tight max-w-[280px]">Започни с AgriNexus.</h2>
          <Link href="/register" className="w-full h-[54px] bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl font-medium text-[17px] flex items-center justify-center gap-2 transition-colors shadow-xl shadow-blue-500/10">
            Регистрирай се <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#080F0B] px-6 pt-16 pb-12 flex flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-6">
          <span className="text-white font-bold text-[18px] font-body tracking-tight">AgriNexus</span>
          <div className="flex flex-col items-center gap-4">
            <Link href="/documents" className="text-[13px] text-[#555555] font-medium hover:text-white transition-colors">Документи</Link>
            <Link href="/privacy" className="text-[13px] text-[#555555] font-medium hover:text-white transition-colors">Поверителност</Link>
            <Link href="/kalkulator" className="text-[13px] text-[#555555] font-medium hover:text-white transition-colors">Калкулатори</Link>
            <Link href="/document-review" className="text-[13px] text-[#555555] font-medium hover:text-white transition-colors">AI Преглед</Link>
          </div>
        </div>
        <p className="text-[13px] text-[#333333] font-body">© 2025 AgriNexus.Law</p>
      </footer>
    </main>;
};
