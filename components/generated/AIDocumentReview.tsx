"use client";

import React, { useState, useRef } from 'react';
import { CloudUpload, FileText, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Send, AlertTriangle, Calendar, MoreVertical, CheckCircle2 } from 'lucide-react';
import { MainNavBar } from './MainNavBar';
import { AuroraBackground } from './AuroraBackground';
import { SiteFooter } from './SiteFooter';
import { cn } from '../../lib/utils';

// --- Types ---

interface Message {
  role: 'user' | 'assistant';
  content: string;
  risks?: string[];
}

interface RiskItem {
  id: string;
  title: string;
  description: string;
}

interface DateItem {
  date: string;
  label: string;
}

// --- Mock Data ---

const INITIAL_MESSAGES: Message[] = [{
  role: 'user',
  content: 'Какви са задълженията на наемателя?'
}, {
  role: 'assistant',
  content: 'Съгласно раздел IV от договора, **наемателят** има следните основни задължения:\n\n1. Да заплаща договореното наемно възнаграждение в срок до **30-ти септември** на текущата стопанска година.\n2. Да ползва земята по предназначение (земеделско ползване).\n3. Да не преотдава имота на трети лица без писменото съгласие на наемодателя.'
}, {
  role: 'user',
  content: 'Има ли рискови клаузи?'
}, {
  role: 'assistant',
  content: 'Открих две клаузи, които изискват повишено внимание. Те касаят едностранното прекратяване и поддръжката на мелиоративните съоръжения.',
  risks: ['Клауза 12.3: Едностранно прекратяване', 'Клауза 7.2: Мелиоративни съоръжения']
}];

const RISKS: RiskItem[] = [{
  id: '1',
  title: 'Едностранно прекратяване',
  description: 'Наемодателят може да прекрати договора с 1-месечно предизвестие без неустойка.'
}, {
  id: '2',
  title: 'Мелиоративни съоръжения',
  description: 'Всички разходи за ремонт на напоителни системи са за сметка на наемателя.'
}];

const KEY_DATES: DateItem[] = [{
  date: '15.10.2024',
  label: 'Начало на стопанската година'
}, {
  date: '30.09.2025',
  label: 'Краен срок за плащане на рента'
}, {
  date: '01.10.2029',
  label: 'Край на срока на договора'
}];

const LEASE_CONTRACT_TEXT = `
ДОГОВОР ЗА АРЕНДА НА ЗЕМЕДЕЛСКА ЗЕМЯ

Днес, 15.10.2024 г., в гр. Плевен, се сключи настоящият договор между:
1. ИВАН ГЕОРГИЕВ ПЕТРОВ, ЕГН 750102XXXX, наричан за краткост НАЕМОДАТЕЛ, от една страна, и
2. "АГРО ТЕРА" ЕООД, ЕИК 20456XXXX, представлявано от Елена Стойчева, наричана за краткост НАЕМАТЕЛ.

I. ПРЕДМЕТ НА ДОГОВОРА
Чл. 1. Наемодателят предоставя за временно и възмездно ползване собствената си земеделска земя, представляваща ПИ № 042012 в землището на с. Обнова, общ. Левски, с площ от 45.200 дка.

II. СРОК НА ДОГОВОРА
Чл. 2. Договорът се сключва за срок от 5 (пет) стопански години, считано от датата на подписването му.

III. НАЕМНА ЦЕНА И НАЧИН НА ПЛАЩАНЕ
Чл. 3. Наемателят се задължава да заплаща на наемодателя годишна наемна цена в размер на 80.00 лв. (осемдесет лева) на декар.
Чл. 4. Наемната цена се заплаща ежегодно в срок до 30-ти септември на съответната година по банков път или в брой срещу разписка.

IV. ПРАВА И ЗАДЪЛЖЕНИЯ НА СТРАНИТЕ
Чл. 5. Наемателят е длъжен да ползва имота с грижата на добър стопанин, съгласно предназначението му.
Чл. 6. Всички текущи разходи по ползването на земята са за сметка на Наемателя.
Чл. 7. (2) Всички разходи за поддръжка и ремонт на съществуващите мелиоративни съоръжения на територията на имота са за сметка на Наемателя.

V. ПРЕКРАТЯВАНЕ НА ДОГОВОРА
Чл. 12. (3) Наемодателят има право да прекрати договора едностранно с едномесечно писмено предизвестие, в случай че получи по-изгодна оферта за продажба на имота.
`;

// --- Component ---

export const AIDocumentReview: React.FC = () => {
  const [isUploaded, setIsUploaded] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState('Law');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleUpload = () => {
    setIsUploaded(true);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessages: Message[] = [...messages, {
      role: 'user',
      content: inputValue
    }];
    setMessages(newMessages);
    setInputValue('');

    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Анализирам документа за вашия въпрос. Въз основа на текста на Чл. 3 и Чл. 4, плащането трябва да бъде извършено по банков път или в брой до края на стопанската година.'
      }]);
      chatEndRef.current?.scrollIntoView({
        behavior: 'smooth'
      });
    }, 1000);
  };

  return <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-blue-600/30">
      <MainNavBar activeScreen="AI Review" />
      
      <AuroraBackground className="flex-grow pt-32 pb-20">
        <main className="max-w-7xl mx-auto px-6">
          
          <div className="mb-12">
            <h1 className="text-6xl md:text-7xl font-serif italic mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              AI Преглед на документи
            </h1>
            <p className="text-xl md:text-2xl text-zinc-500 font-medium max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-1000">
              Провери договор, ДФЗ документ или писмо
            </p>
          </div>

          {!isUploaded ? (
            <div className="group relative h-[300px] rounded-3xl bg-[#181818] border-2 border-dashed border-zinc-800 hover:border-blue-500/50 hover:bg-[#1c1c1c] transition-all duration-300 flex flex-col items-center justify-center cursor-pointer animate-in zoom-in-95 duration-500" onClick={handleUpload}>
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 mb-6 group-hover:scale-110 transition-transform">
                <CloudUpload size={48} className="text-blue-500 stroke-[1.5px]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Пусни PDF или DOCX тук</h3>
              <p className="text-zinc-500 mb-6">или</p>
              <button className="px-8 py-3 bg-[#181818] border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:text-white transition-colors">
                Избери файл
              </button>
              <p className="absolute bottom-6 text-xs font-medium text-zinc-600 tracking-wider uppercase">
                PDF, DOCX, DOC · Макс. 10MB
              </p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6 min-h-[800px] animate-in fade-in zoom-in-95 duration-700">
              
              <div className="flex-[5.5] flex flex-col bg-[#111111] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-blue-500" />
                    <span className="font-medium text-sm">Договор_аренда_2024.pdf</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-zinc-800 rounded-lg p-1">
                      <button className="p-1 hover:text-blue-400 transition-colors"><ZoomOut size={16} /></button>
                      <span className="px-3 text-xs font-mono">100%</span>
                      <button className="p-1 hover:text-blue-400 transition-colors"><ZoomIn size={16} /></button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span>1 / 4</span>
                    </div>
                  </div>
                </div>

                <div className="flex-grow p-8 md:p-12 overflow-y-auto bg-zinc-950/20 scrollbar-thin">
                  <div className="max-w-3xl mx-auto bg-[#1a1a1a] p-10 rounded-lg shadow-inner border border-zinc-800/50 font-serif leading-relaxed text-zinc-300 whitespace-pre-wrap select-text">
                    {LEASE_CONTRACT_TEXT}
                  </div>
                </div>

                <div className="p-4 border-t border-zinc-800 flex justify-center gap-4 bg-zinc-900/50">
                  <button className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"><ChevronLeft size={20} /></button>
                  <button className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"><ChevronRight size={20} /></button>
                </div>
              </div>

              <div className="flex-[4.5] flex flex-col gap-6">
                
                <div className="flex flex-col bg-[#111111] border border-zinc-800 rounded-3xl overflow-hidden h-[500px] shadow-2xl">
                  <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                    <h3 className="text-sm font-bold tracking-widest uppercase">AI Анализ</h3>
                    <div className="flex bg-zinc-800 p-1 rounded-lg">
                      {['Право', 'Данъци', 'Субсидии'].map(tab => <button key={tab} onClick={() => setActiveTab(tab === 'Право' ? 'Law' : tab)} className={cn("px-3 py-1 text-xs font-semibold rounded-md transition-all", tab === 'Право' && activeTab === 'Law' || tab !== 'Право' && activeTab === tab ? "bg-blue-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300")}>
                          {tab === 'Право' ? 'Право · Елена' : tab}
                        </button>)}
                    </div>
                  </div>

                  <div className="flex-grow p-6 overflow-y-auto flex flex-col gap-6 scrollbar-thin">
                    {messages.map((msg, i) => <div key={i} className={cn("max-w-[85%] p-4 rounded-2xl flex flex-col gap-2 animate-in slide-in-from-bottom-2", msg.role === 'user' ? "self-end bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-900/20" : "self-start bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-none")}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.content.split('**').map((part, idx) => idx % 2 === 1 ? <strong key={idx} className="text-blue-400">{part}</strong> : part)}
                        </p>
                        {msg.risks && <div className="mt-2 flex flex-wrap gap-2">
                            {msg.risks.map((risk, idx) => <span key={idx} className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase rounded-md flex items-center gap-1">
                                <AlertTriangle size={10} />
                                {risk}
                              </span>)}
                          </div>}
                      </div>)}
                    <div ref={chatEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex gap-3">
                    <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Задай въпрос за документа..." className="flex-grow bg-[#181818] border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors" />
                    <button type="submit" className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all active:scale-95">
                      <Send size={18} />
                    </button>
                  </form>
                </div>

                <div className="bg-[#111111] border border-zinc-800 rounded-3xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} className="text-red-500" />
                      <h3 className="text-sm font-bold tracking-widest uppercase text-red-500">Открити Рискове</h3>
                    </div>
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-xs font-bold rounded-full">2</span>
                  </div>
                  <div className="space-y-3">
                    {RISKS.map(risk => <div key={risk.id} className="p-4 bg-zinc-900/50 border border-red-500/20 rounded-2xl hover:border-red-500/40 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-sm font-bold text-zinc-200">{risk.title}</h4>
                          <MoreVertical size={14} className="text-zinc-600 group-hover:text-zinc-400 cursor-pointer" />
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed">{risk.description}</p>
                      </div>)}
                  </div>
                </div>

                <div className="bg-[#111111] border border-zinc-800 rounded-3xl p-6 shadow-2xl">
                  <div className="flex items-center gap-2 mb-6">
                    <Calendar size={18} className="text-blue-500" />
                    <h3 className="text-sm font-bold tracking-widest uppercase text-blue-500">Ключови Дати</h3>
                  </div>
                  <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-800">
                    {KEY_DATES.map((item, idx) => <div key={idx} className="flex gap-4 relative">
                        <div className="z-10 mt-1">
                          {idx === 0 ? <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-600 flex items-center justify-center">
                              <CheckCircle2 size={12} className="text-blue-400" />
                            </div> : <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                            </div>}
                        </div>
                        <div>
                          <p className="text-xs font-mono text-blue-400 font-bold mb-0.5">{item.date}</p>
                          <p className="text-sm text-zinc-300 font-medium">{item.label}</p>
                        </div>
                      </div>)}
                  </div>
                </div>

              </div>
            </div>
          )}
        </main>
      </AuroraBackground>

      <SiteFooter />
    </div>;
};
