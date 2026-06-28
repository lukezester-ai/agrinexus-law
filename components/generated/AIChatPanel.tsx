"use client";

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

type ChatTab = 'Право' | 'Поле' | 'Финанси';

interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
  citation?: string;
}

const CHAT_TABS: ChatTab[] = ['Право', 'Поле', 'Финанси'];

const INITIAL_MESSAGES: ChatMessage[] = [{
  id: 'msg-1',
  role: 'ai',
  text: 'Директните плащания за кампания 2025 имат краен срок **15 юни**. Необходими документи: Заявление по образец ДФЗ-1, ДЗЕС карта.'
}, {
  id: 'msg-2',
  role: 'user',
  text: 'Има ли промяна в сроковете тази година?'
}, {
  id: 'msg-3',
  role: 'ai',
  text: 'Да, СМЕ промени от 02.2025 удължиха приема за директни плащания до **30 юни**. Източник: Наредба 5/2025, чл. 8.',
  citation: 'Наредба 5/2025 · чл. 8'
}];

const QUICK_CHIPS = ['Какви документи трябват?', 'Има промяна в сроковете?', 'Насоки ми за срок'];

const renderText = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`part-${i}`} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>;
    }
    return <span key={`part-${i}`}>{part}</span>;
  });
};

export const AIChatPanel: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<ChatTab>('Право');
  const [messages, setMessages] = React.useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      text: trimmed
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: 'ai',
        text: 'Анализирам запитването ви. Моля, проверете актуалната нормативна уредба на ДФ "Земеделие" за потвърждение.'
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 900);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend(inputValue);
    }
  };

  return <aside className="hidden xl:flex flex-col w-[340px] shrink-0 bg-[#111111] border-l border-[#1E1E1E] sticky top-[120px] self-start" style={{
    height: 'calc(100vh - 120px)'
  }}>
      <div className="shrink-0 px-5 pt-5 pb-0">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#888888] mb-4" style={{
        fontFamily: 'Inter, sans-serif'
      }}>
          Асистент
        </p>
        <div className="flex items-end gap-0 border-b border-[#1E1E1E]">
          {CHAT_TABS.map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={cn('relative px-4 pb-3 text-[14px] font-medium transition-colors', activeTab === tab ? 'text-white' : 'text-[#888888] hover:text-zinc-300')} style={{
          fontFamily: 'Inter, sans-serif'
        }}>
              {tab}
              {activeTab === tab && <motion.div layoutId="chat-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3B82F6]" />}
            </button>)}
        </div>
      </div>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map(msg => <motion.div key={msg.id} initial={{
          opacity: 0,
          y: 8
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.2
        }} className={cn('flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start')}>
              {msg.role === 'ai' ? <div className="flex items-start gap-2.5 max-w-[92%]">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-[#3B82F6] flex items-center justify-center mt-0.5">
                    <span className="text-white font-bold" style={{
                fontSize: '10px',
                fontFamily: 'Inter, sans-serif'
              }}>AI</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="bg-[#181818] border border-[#1E1E1E] px-4 py-3.5 text-[#CCCCCC] text-[14px] leading-relaxed" style={{
                borderRadius: '12px',
                borderTopLeftRadius: '4px',
                fontFamily: 'Inter, sans-serif',
                lineHeight: '1.6'
              }}>
                      {renderText(msg.text)}
                    </div>
                    {msg.citation && <div className="inline-flex self-start items-center px-2.5 py-1 bg-[#111111] border border-[#1E1E1E] text-[#888888]" style={{
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'Inter, sans-serif'
              }}>
                        {msg.citation}
                      </div>}
                  </div>
                </div> : <div className="max-w-[85%] bg-[#3B82F6] text-white px-4 py-3 text-[14px]" style={{
            borderRadius: '12px',
            borderTopRightRadius: '4px',
            fontFamily: 'Inter, sans-serif',
            lineHeight: '1.5'
          }}>
                  {msg.text}
                </div>}
            </motion.div>)}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 bg-[#0A0A0A] border-t border-[#1E1E1E] px-4 pt-3 pb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_CHIPS.map(chip => <button key={chip} onClick={() => handleSend(chip)} className="px-3 py-1.5 bg-[#181818] border border-[#1E1E1E] rounded-full text-[#888888] hover:text-zinc-300 hover:border-zinc-700 transition-colors" style={{
          fontSize: '13px',
          fontFamily: 'Inter, sans-serif'
        }}>
              {chip}
            </button>)}
        </div>

        <div className="flex items-center gap-2">
          <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder="Задай въпрос за срок..." className="flex-1 bg-[#181818] border border-[#222222] rounded-[10px] px-4 py-3 text-white placeholder:text-[#444444] focus:outline-none focus:border-[#3B82F6] transition-colors text-[14px]" style={{
          fontFamily: 'Inter, sans-serif'
        }} />
          <button onClick={() => handleSend(inputValue)} className="shrink-0 bg-[#3B82F6] hover:bg-blue-500 transition-colors flex items-center justify-center rounded-[8px] px-4 py-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </aside>;
};
