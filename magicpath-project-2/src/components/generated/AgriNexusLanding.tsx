import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { askAi } from '../../api/ai';

// --- Types ---
interface NavLink {
  label: string;
  href: string;
}
interface Category {
  name: string;
  subtitle: string;
  icon: React.ReactNode;
}
interface DeadlineItem {
  type: 'СРОК' | 'ПРАВИЛА' | 'ДОКУМЕНТИ';
  title: string;
  subtitle: string;
}
interface FAQItem {
  question: string;
  answer: string;
}
interface HowItWorksStep {
  title: string;
  description: string;
}
interface TestimonialCard {
  quote: string;
  initials: string;
  name: string;
  role: string;
}
interface ComparisonRow {
  feature: string;
  agri: 'check' | 'text';
  agriText?: string;
  manual: 'x' | 'text';
  manualText?: string;
}
interface WhyCard {
  title: string;
  desc: string;
  pos: string;
  accent: string;
}

// --- Icons ---
const IcoChevronRight = ({
  size = 16,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="5,2 11,8 5,14" />
  </svg>;
const IcoCheckCircle = ({
  size = 20,
  color = '#3B82F6'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="8" />
    <polyline points="6.5,10 8.5,12.5 13.5,7.5" />
  </svg>;
const IcoXCircle = ({
  size = 20,
  color = '#555555'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="8" />
    <line x1="7" y1="7" x2="13" y2="13" />
    <line x1="13" y1="7" x2="7" y2="13" />
  </svg>;
const IcoPlus = ({
  size = 20,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="10" y1="4" x2="10" y2="16" />
    <line x1="4" y1="10" x2="16" y2="10" />
  </svg>;
const IcoMinus = ({
  size = 20,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="10" x2="16" y2="10" />
  </svg>;
const IcoFileText = ({
  size = 20,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2H5a1 1 0 00-1 1v14a1 1 0 001 1h10a1 1 0 001-1V6z" />
    <polyline points="12,2 12,6 16,6" />
    <line x1="7" y1="10" x2="13" y2="10" />
    <line x1="7" y1="13" x2="11" y2="13" />
  </svg>;
const IcoScale = ({
  size = 20,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2v16M4 18h12" />
    <path d="M4 7l-3 5h6L4 7z" />
    <path d="M16 7l-3 5h6l-3-5z" />
  </svg>;
const IcoLeaf = ({
  size = 20,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3s-8 0-11 6c-1.5 3 0 8 0 8s5-1.5 8-3c4-2 5-7 3-11z" />
    <path d="M3 17l5-5" />
  </svg>;
const IcoCertificate = ({
  size = 20,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="16" height="12" rx="1.5" />
    <circle cx="10" cy="16" r="2" />
    <line x1="7" y1="16" x2="2" y2="18" />
    <line x1="13" y1="16" x2="18" y2="18" />
    <line x1="6" y1="7" x2="14" y2="7" />
    <line x1="6" y1="10" x2="11" y2="10" />
  </svg>;
const IcoShield = ({
  size = 20,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2L3 5v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V5L10 2z" />
  </svg>;
const IcoFlask = ({
  size = 20,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 2h6M8 2v6L4 16a1 1 0 00.9 1.4h10.2A1 1 0 0016 16L12 8V2" />
    <line x1="6" y1="13" x2="14" y2="13" />
  </svg>;
const IcoGlobe = ({
  size = 20,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="8" />
    <path d="M2 10h16M10 2c-2.5 3-4 5-4 8s1.5 5 4 8M10 2c2.5 3 4 5 4 8s-1.5 5-4 8" />
  </svg>;
const IcoForm = ({
  size = 20,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="2" width="14" height="16" rx="1.5" />
    <line x1="7" y1="7" x2="13" y2="7" />
    <line x1="7" y1="10" x2="13" y2="10" />
    <line x1="7" y1="13" x2="10" y2="13" />
    <polyline points="12,12 14,14 17,11" />
  </svg>;
const IcoCalculator = ({
  size = 20,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="2" width="14" height="16" rx="1.5" />
    <rect x="6" y="5" width="8" height="3" rx="0.5" />
    <line x1="6" y1="12" x2="8" y2="12" />
    <line x1="10" y1="12" x2="12" y2="12" />
    <line x1="14" y1="12" x2="14" y2="14" />
    <line x1="13" y1="13" x2="15" y2="13" />
    <line x1="6" y1="15" x2="8" y2="15" />
    <line x1="10" y1="15" x2="12" y2="15" />
  </svg>;
const IcoClock = ({
  size = 28,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="14" cy="14" r="10" />
    <polyline points="14,8 14,14 18,17" />
  </svg>;
const IcoSearch = ({
  size = 28,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8" />
    <line x1="18.5" y1="18.5" x2="24" y2="24" />
  </svg>;
const IcoSpark = ({
  size = 28,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 3l2.5 7.5L24 13l-7.5 2.5L14 23l-2.5-7.5L4 13l7.5-2.5L14 3z" />
  </svg>;
const IcoLock = ({
  size = 28,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="13" width="16" height="11" rx="2" />
    <path d="M9 13V9a5 5 0 0110 0v4" />
    <circle cx="14" cy="19" r="1.5" />
  </svg>;
const IcoStar = ({
  size = 14,
  color = '#3B82F6'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 14 14" fill={color}>
    <path d="M7 1l1.8 3.6L13 5.3l-3 2.9.7 4L7 10.2 3.3 12.2l.7-4-3-2.9 4.2-.7z" />
  </svg>;

// --- Data ---
const NAV_LINKS: NavLink[] = [{
  label: 'Документи',
  href: '#docs'
}, {
  label: 'AI преглед',
  href: '#ai'
}, {
  label: 'Срокове',
  href: '#deadlines'
}, {
  label: 'Калкулатори',
  href: '#calc'
}, {
  label: 'Статистики',
  href: '#stats'
}];
const CATEGORIES: Category[] = [{
  name: 'Субсидии',
  subtitle: 'Директни плащания',
  icon: <IcoScale size={20} color="#3B82F6" />
}, {
  name: 'Закони',
  subtitle: 'Наредби и укази',
  icon: <IcoFileText size={20} color="#3B82F6" />
}, {
  name: 'Сертификати',
  subtitle: 'Био и качество',
  icon: <IcoCertificate size={20} color="#3B82F6" />
}, {
  name: 'Био производство',
  subtitle: 'Еко стандарти',
  icon: <IcoLeaf size={20} color="#3B82F6" />
}, {
  name: 'Растителна защита',
  subtitle: 'Дневници и препарати',
  icon: <IcoFlask size={20} color="#3B82F6" />
}, {
  name: 'ЕС регламенти',
  subtitle: 'Общи политики',
  icon: <IcoGlobe size={20} color="#3B82F6" />
}, {
  name: 'Образци',
  subtitle: 'Заявления и бланки',
  icon: <IcoForm size={20} color="#3B82F6" />
}, {
  name: 'Калкулатори',
  subtitle: 'Бюджет и ДДС',
  icon: <IcoCalculator size={20} color="#3B82F6" />
}];
const DEADLINES: DeadlineItem[] = [{
  type: 'СРОК',
  title: 'Директни плащания и корекции по заявления',
  subtitle: 'ДФЗ · проследяване на активните прозорци'
}, {
  type: 'ПРАВИЛА',
  title: 'Нови изисквания за пасища и ливади 2025',
  subtitle: 'Актуализирани разпоредби на Министерството'
}, {
  type: 'ДОКУМЕНТИ',
  title: 'Подаване на дневници за растителна защита',
  subtitle: 'Електронен регистър към БАБХ'
}];
const FAQS: FAQItem[] = [{
  question: 'Как работи AI асистентът с официалните документи?',
  answer: 'Нашият AI е обучен директно върху базата данни на ДФЗ и Министерството на земеделието. Той индексира всяка нова наредба в реално време (RAG технология), което му позволява да отговаря с цитати и препратки към конкретни членове и алинеи.'
}, {
  question: 'Мога ли да кача собствените си документи за проверка?',
  answer: 'Да, можете да качите вашите заявления в PDF формат. Системата ще ги сравни с актуалните изисквания за съответната кампания и ще ви сигнализира за пропуски или грешки.'
}, {
  question: 'Данните ми защитени ли са?',
  answer: 'Всички качени данни са криптирани и се използват единствено за вашия анализ. AgriNexus не споделя информация с трети страни или държавни институции без вашето изрично съгласие.'
}, {
  question: 'Как се актуализират сроковете?',
  answer: 'Сроковете се извличат автоматично от официалния календар на ДФЗ и оперативните програми. При промяна в крайните дати получавате незабавно известие.'
}, {
  question: 'Колко струва използването на платформата?',
  answer: 'AgriNexus предлага безплатен базов достъп до търсачката и документите. Пълният AI анализ и персонализираните консултации са част от нашите абонаментни планове за фермери.'
}];
const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [{
  title: 'Задай въпрос',
  description: 'Напишете въпроса си на разговорен български — за субсидии, срокове или документи.'
}, {
  title: 'AI търси в наредбите',
  description: 'Системата претърсва официалните наредби на ДФЗ и Министерството.'
}, {
  title: 'Получаваш отговор',
  description: 'Получавате ясен отговор с директен линк към нормативния акт.'
}, {
  title: 'Следваща стъпка',
  description: 'AI предлага следващи действия и свързани документи.'
}];
const TESTIMONIALS: TestimonialCard[] = [{
  quote: 'Намерих всички документи за биосертификат за 5 минути. Преди прекарвах часове в сайтове на ДФЗ.',
  initials: 'ГД',
  name: 'Георги Димитров',
  role: 'Зърнопроизводство, Плевен'
}, {
  quote: 'Асистентът обясни точно кои са сроковете за директни плащания — с линк към наредбата. Страхотно.',
  initials: 'ПМ',
  name: 'Петя Маринова',
  role: 'Биологично стопанство, Стара Загора'
}, {
  quote: 'Провери договора ми и откри клауза, която нямаше да забележа. Спести ми сериозни проблеми.',
  initials: 'СК',
  name: 'Стоян Колев',
  role: 'Животновъдство, Добрич'
}];
const COMPARISON_ROWS: ComparisonRow[] = [{
  feature: 'Намиране на информация',
  agri: 'check',
  manual: 'x'
}, {
  feature: 'Точен източник и цитат',
  agri: 'check',
  manual: 'x'
}, {
  feature: 'Следваща стъпка',
  agri: 'check',
  manual: 'x'
}, {
  feature: 'AI преглед на договор',
  agri: 'check',
  manual: 'x'
}, {
  feature: 'Актуални срокове',
  agri: 'check',
  manual: 'x'
}, {
  feature: 'Необходимо време',
  agri: 'text',
  agriText: '< 1 минута',
  manual: 'text',
  manualText: '30–60 минути'
}];
const WHY_CARDS: WhyCard[] = [{
  title: 'Официални данни',
  desc: 'Всяка информация е от проверени източници — ДФЗ, МЗ и БАБХ.',
  pos: 'top-[8%] left-[14%]',
  accent: '#7C3AED'
}, {
  title: 'Проверима логика',
  desc: 'С препратки към конкретни наредби и алинеи.',
  pos: 'top-[12%] right-[14%]',
  accent: '#3B82F6'
}, {
  title: 'Разработен за реалния свят',
  desc: 'Интегриран директно с вашите процеси.',
  pos: 'top-[48%] left-[8%]',
  accent: '#EC4899'
}, {
  title: 'Автономност с отговорност',
  desc: 'AI, който знае кога да включи човек.',
  pos: 'top-[52%] right-[8%]',
  accent: '#7C3AED'
}, {
  title: 'Прозрачен дизайн',
  desc: 'Лесен за разбиране и използване.',
  pos: 'bottom-[8%] left-[32%]',
  accent: '#3B82F6'
}];
const STAR_KEYS = [1, 2, 3, 4, 5];

// --- Global Styles ---
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

  .an-serif {
    font-family: Georgia, 'Times New Roman', serif;
    font-style: italic;
  }
  .an-sans {
    font-family: 'Inter', -apple-system, sans-serif;
  }

  .an-btn-primary {
    background-color: #3B82F6;
    color: #FFFFFF;
    border-radius: 8px;
    padding: 12px 28px;
    font-weight: 500;
    font-size: 15px;
    font-family: 'Inter', -apple-system, sans-serif;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background-color 200ms ease, transform 100ms ease;
    cursor: pointer;
    border: none;
  }
  .an-btn-primary:hover { background-color: #2563EB; }
  .an-btn-primary:active { transform: scale(0.98); }

  .an-btn-ghost {
    background-color: transparent;
    color: #FFFFFF;
    border: 1.5px solid rgba(255,255,255,0.3);
    border-radius: 8px;
    padding: 12px 28px;
    font-weight: 500;
    font-size: 15px;
    font-family: 'Inter', -apple-system, sans-serif;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background-color 200ms ease, border-color 200ms ease, color 200ms ease, transform 100ms ease;
    cursor: pointer;
  }
  .an-btn-ghost:hover { background-color: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.6); }
  .an-btn-ghost:active { transform: scale(0.98); }

  .an-category-tile {
    transition: border-color 200ms ease-out, background-color 200ms ease-out;
    cursor: pointer;
  }
  .an-category-tile:hover { border-color: #3B82F6 !important; background-color: #1F2A3A !important; }

  .an-nav-link {
    color: #888888;
    font-size: 14px;
    font-family: 'Inter', -apple-system, sans-serif;
    transition: color 200ms ease;
    text-decoration: none;
  }
  .an-nav-link:hover { color: #FFFFFF; }

  @media (prefers-reduced-motion: no-preference) {
    @keyframes aurora-1 {
      0%   { transform: translate(-20%, -20%) scale(1);    opacity: 0.6; }
      25%  { transform: translate(-6%, -32%) scale(1.15);  opacity: 0.8; }
      50%  { transform: translate(-28%, -8%) scale(0.9);   opacity: 0.5; }
      75%  { transform: translate(-12%, -26%) scale(1.1);  opacity: 0.7; }
      100% { transform: translate(-20%, -20%) scale(1);    opacity: 0.6; }
    }
    @keyframes aurora-2 {
      0%   { transform: translate(20%, -20%) scale(1.1);   opacity: 0.4; }
      33%  { transform: translate(5%, -10%) scale(0.85);   opacity: 0.55; }
      66%  { transform: translate(26%, -30%) scale(1.2);   opacity: 0.3; }
      100% { transform: translate(20%, -20%) scale(1.1);   opacity: 0.4; }
    }
    @keyframes aurora-3 {
      0%   { transform: translate(-50%, -50%) scale(0.9);  opacity: 0.35; }
      50%  { transform: translate(-36%, -44%) scale(1.2);  opacity: 0.55; }
      100% { transform: translate(-50%, -50%) scale(0.9);  opacity: 0.35; }
    }
    .aurora-blob-1 { animation: aurora-1 12s ease-in-out infinite; }
    .aurora-blob-2 { animation: aurora-2 16s ease-in-out infinite; }
    .aurora-blob-3 { animation: aurora-3 10s ease-in-out infinite; }
    @keyframes aurora-why-1 {
      0%   { transform: translate(-50%, -50%) scale(1);    opacity: 0.5; }
      50%  { transform: translate(-44%, -56%) scale(1.12); opacity: 0.7; }
      100% { transform: translate(-50%, -50%) scale(1);    opacity: 0.5; }
    }
    @keyframes aurora-why-2 {
      0%   { transform: translateY(-50%) scale(1);    opacity: 0.4; }
      50%  { transform: translateY(-44%) scale(1.1);  opacity: 0.6; }
      100% { transform: translateY(-50%) scale(1);    opacity: 0.4; }
    }
    .aurora-blob-why-1 { animation: aurora-why-1 20s ease-in-out infinite; }
    .aurora-blob-why-2 { animation: aurora-why-2 24s ease-in-out infinite; }
  }
`;

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = () => {
  const [aiAnswer, setAiAnswer] = React.useState('');
  const handleAsk = async () => {
    const resp = await askAi('Задайте вашия въпрос за фермери');
    setAiAnswer(resp.answer);
  };
  return <nav style={{
  backgroundColor: 'rgba(10,10,10,0.92)',
  backdropFilter: 'blur(20px)',
  borderBottom: '1px solid #1A1A1A'
}} className="fixed top-0 left-0 right-0 z-50 h-[56px] px-12 flex items-center justify-between">
    <span className="an-sans text-[15px] font-semibold text-white tracking-tight">AgriNexus</span>

    <div className="hidden md:flex items-center gap-7">
      {NAV_LINKS.map(link => <a key={link.label} href={link.href} className="an-nav-link">{link.label}</a>)}
    </div>

    <div className="flex items-center gap-6">
      <a href="#" className="an-nav-link">Вход</a>
      <button className="an-btn-primary !py-[7px] !px-[16px] !text-[13px]" onClick={handleAsk}>Питай AI</button>
    </div>
      {aiAnswer && (
        <div className="mt-2 p-2 bg-[#222] text-white rounded">
          {aiAnswer}
        </div>
      )}
  </nav>;

// ─── Hero ─────────────────────────────────────────────────────────────────────
const Hero = () => {
  const [aiAnswer, setAiAnswer] = React.useState('');
  const handleAsk = async () => {
    const resp = await askAi('Задайте вашия въпрос за фермери');
    setAiAnswer(resp.answer);
  };
  return <section className="relative w-full min-h-screen bg-[#0A0A0A] overflow-hidden flex items-center" style={{
  paddingTop: '140px',
  paddingBottom: '80px'
}}>
    <div className="aurora-blob-1 pointer-events-none" style={{
    position: 'absolute',
    top: 0,
    left: 0,
    width: '700px',
    height: '700px',
    background: 'radial-gradient(circle at center, rgba(139,92,246,0.5) 0%, rgba(59,130,246,0.3) 50%, transparent 70%)',
    filter: 'blur(100px)',
    zIndex: 0,
    transform: 'translate(-20%, -20%)'
  }} />
    <div className="aurora-blob-2 pointer-events-none" style={{
    position: 'absolute',
    top: 0,
    right: 0,
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle at center, rgba(236,72,153,0.3) 0%, transparent 70%)',
    filter: 'blur(100px)',
    zIndex: 0,
    transform: 'translate(20%, -20%)'
  }} />
    <div className="aurora-blob-3 pointer-events-none" style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle at center, rgba(59,130,246,0.25) 0%, transparent 70%)',
    filter: 'blur(100px)',
    zIndex: 0,
    transform: 'translate(-50%, -50%)'
  }} />

    <div className="relative w-full max-w-[1100px] mx-auto px-12 flex items-center justify-between gap-16" style={{
    zIndex: 1
  }}>
      <div className="max-w-[580px]">
        <div className="an-sans text-[12px] text-[#888888] uppercase tracking-[0.08em] mb-6">
          AI Асистент за Фермери
        </div>
        <h1 className="an-serif text-[80px] text-white leading-[0.95] tracking-[-0.02em] mb-7">
          <span className="block">Отговори за</span>
          <span className="block">вашето стопанство.</span>
        </h1>
        <p className="an-sans text-[17px] text-[#888888] leading-[1.6] max-w-[480px] mb-10">
          Търсете субсидии, договори и срокове на едно място. Ясни отговори с точен официален източник.
        </p>
        <div className="flex items-center gap-4 mb-5">
          <button className="an-btn-primary !px-7 !py-[13px]" onClick={handleAsk}>
            <span>Питай AI</span>
            <IcoChevronRight size={16} />
          </button>
          <button className="an-btn-ghost !px-7 !py-[13px]">Виж демо</button>
        </div>
        {aiAnswer && (
          <div className="mt-4 p-4 bg-[#111] text-white rounded">
            {aiAnswer}
          </div>
        )}
        <p className="an-sans text-[13px] text-[#555555]">14 дни безплатно · Не се изисква карта</p>
      </div>

      <div className="hidden lg:block shrink-0 w-[320px]">
        <div className="bg-[#181818] border border-[#222222] rounded-[16px] p-5" style={{
        boxShadow: '0 40px 80px rgba(0,0,0,0.6)'
      }}>
          <div className="flex gap-[6px] mb-5">
            <div className="w-[10px] h-[10px] rounded-full bg-[#383838]" />
            <div className="w-[10px] h-[10px] rounded-full bg-[#383838]" />
            <div className="w-[10px] h-[10px] rounded-full bg-[#383838]" />
          </div>
          <div className="flex flex-col gap-3 mb-4">
            <div className="self-end bg-[#3B82F6] text-white rounded-[14px] rounded-tr-[3px] px-[14px] py-[9px] an-sans text-[12px] leading-[1.5]" style={{
            maxWidth: '85%'
          }}>
              Какви документи са нужни за директни плащания?
            </div>
            <div className="self-start bg-[#242424] text-[#CCCCCC] rounded-[14px] rounded-tl-[3px] px-[14px] py-[9px] an-sans text-[12px] leading-[1.5]" style={{
            maxWidth: '88%'
          }}>
              За кампания 2025 са необходими: Заявление по образец ДФЗ-1, ДЗЕС карта...
            </div>
            <div className="self-end bg-[#3B82F6] text-white rounded-[14px] rounded-tr-[3px] px-[14px] py-[9px] an-sans text-[12px] leading-[1.5]" style={{
            maxWidth: '75%'
          }}>
              Кой е крайният срок?
            </div>
            <div className="self-start bg-[#242424] text-[#CCCCCC] rounded-[14px] rounded-tl-[3px] px-[14px] py-[9px] an-sans text-[12px] leading-[1.5]" style={{
            maxWidth: '85%'
          }}>
              Срокът е 15 юни 2025. ДФЗ Наредба 5/2024, чл. 12.
            </div>
          </div>
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-[8px] h-[38px] flex items-center px-3">
            <span className="an-sans text-[12px] text-[#444444]">Съобщение…</span>
          </div>
        </div>
      </div>
    </div>
  </section>;

// ─── Social Proof ─────────────────────────────────────────────────────────────
const SocialProof = () => <div className="w-full bg-[#0A0A0A] border-t border-[#1A1A1A] py-[44px] px-12 flex justify-center items-center gap-10 flex-wrap">
    <span className="an-sans text-[13px] text-[#555555]">Ползван от фермери и организации в</span>
    <div className="flex items-center gap-8">
      {['ДФЗ', 'Агро Пловдив', 'БАПА', 'Аграрен Университет'].map((name, idx) => <div key={name} className="flex items-center gap-8">
          {idx > 0 && <div style={{
        width: '1px',
        height: '16px',
        background: '#1E1E1E'
      }} />}
          <span className="an-sans text-[13px] font-medium text-[#444444] tracking-wide">{name}</span>
        </div>)}
    </div>
  </div>;

// ─── Why Section ──────────────────────────────────────────────────────────────
const WhySection = () => <section className="bg-[#111111] relative overflow-hidden flex justify-center items-center" style={{
  minHeight: '820px',
  padding: '100px 0'
}}>
    <div className="aurora-blob-why-1 pointer-events-none" style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '800px',
    height: '800px',
    background: 'radial-gradient(circle at center, rgba(139,92,246,0.2) 0%, transparent 70%)',
    filter: 'blur(90px)',
    zIndex: 0,
    transform: 'translate(-50%, -50%)'
  }} />
    <div className="aurora-blob-why-2 pointer-events-none" style={{
    position: 'absolute',
    top: '50%',
    right: '8%',
    width: '600px',
    height: '600px',
    background: 'radial-gradient(circle at center, rgba(59,130,246,0.14) 0%, transparent 70%)',
    filter: 'blur(70px)',
    zIndex: 0,
    transform: 'translateY(-50%)'
  }} />

    <h2 className="an-serif select-none" style={{
    position: 'absolute',
    fontSize: '200px',
    lineHeight: 1,
    background: 'linear-gradient(135deg, rgba(139,92,246,0.55) 0%, rgba(59,130,246,0.5) 50%, rgba(236,72,153,0.45) 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    zIndex: 0,
    letterSpacing: '-0.03em',
    pointerEvents: 'none'
  }}>
      Защо?
    </h2>

    {/* Desktop card layout */}
    <div className="relative w-full max-w-[1100px] mx-auto px-12 hidden md:block" style={{
    zIndex: 1,
    height: '620px'
  }}>
      {WHY_CARDS.map(card => <div key={card.title} className={`absolute rounded-[14px] p-7 max-w-[270px]  ${card.pos}`} style={{
      backgroundColor: '#1A1A1A',
      border: `1px solid #242424`,
      borderTop: `2px solid ${card.accent}`,
      boxShadow: '0 12px 40px rgba(0,0,0,0.6)'
    }}>
          <div className="an-sans text-[11px] text-[#555555] uppercase tracking-[0.1em] mb-2">Предимство</div>
          <h3 className="an-sans text-[16px] font-bold text-white mb-2 leading-snug">{card.title}</h3>
          <p className="an-sans text-[14px] text-[#888888] leading-[1.6]">{card.desc}</p>
        </div>)}
    </div>

    {/* Mobile fallback */}
    <div className="md:hidden flex flex-col gap-4 px-12 w-full" style={{
    zIndex: 1
  }}>
      {WHY_CARDS.map(card => <div key={card.title} className="rounded-[14px] p-7 w-full" style={{
      backgroundColor: '#1A1A1A',
      border: `1px solid #242424`,
      borderTop: `2px solid ${card.accent}`
    }}>
          <div className="an-sans text-[11px] text-[#555555] uppercase tracking-[0.1em] mb-2">Предимство</div>
          <h3 className="an-sans text-[16px] font-bold text-white mb-2">{card.title}</h3>
          <p className="an-sans text-[14px] text-[#888888] leading-[1.6]">{card.desc}</p>
        </div>)}
    </div>
  </section>;

// ─── Feature Cards ────────────────────────────────────────────────────────────
const FeatureCards = () => <section className="bg-[#0A0A0A] py-[100px] px-12">
    <div className="max-w-[1100px] mx-auto text-center mb-[64px]">
      <h2 className="an-serif text-[52px] text-white leading-tight mb-4">Всичко необходимо, нищо излишно.</h2>
      <p className="an-sans text-[17px] text-[#888888] leading-[1.6]">Ето как работи AgriNexus на практика.</p>
    </div>

    <div className="max-w-[1100px] mx-auto flex flex-col gap-8">

      {/* Card 1 — Deadlines */}
      <div className="bg-[#181818] border border-[#1E1E1E] rounded-[20px] p-16 flex flex-col md:flex-row gap-12 items-center">
        <div className="w-full md:w-[42%]">
          <div className="flex items-center gap-2 mb-5">
            <IcoClock size={28} color="#3B82F6" />
            <span className="an-sans text-[12px] text-[#888888] uppercase tracking-[0.08em]">Срокове</span>
          </div>
          <h3 className="an-serif text-[36px] text-white mb-4 leading-tight">Провери срокове.</h3>
          <p className="an-sans text-[16px] text-[#888888] leading-[1.6] mb-7">
            Интелигентно проследяване на крайни дати за кандидатстване по ДФЗ и активните кампании.
          </p>
          <a href="#" className="an-sans text-[14px] text-[#3B82F6] font-medium flex items-center gap-[6px] hover:text-[#2563EB] transition-colors">
            <span>Виж всички срокове</span>
            <IcoChevronRight size={14} color="#3B82F6" />
          </a>
        </div>
        <div className="w-full md:w-[58%]">
          <div className="bg-[#111111] rounded-[14px] border border-[#1E1E1E] overflow-hidden">
            <div className="border-b border-[#1E1E1E] px-5 py-3 flex items-center gap-2">
              <div className="w-[6px] h-[6px] rounded-full bg-[#282828]" />
              <div className="w-[6px] h-[6px] rounded-full bg-[#282828]" />
              <div className="w-[6px] h-[6px] rounded-full bg-[#282828]" />
              <span className="an-sans text-[11px] text-[#444444] ml-2">Срокове · 2025</span>
            </div>
            <div className="flex flex-col divide-y divide-[#1E1E1E]">
              <div className="px-5 py-4 flex items-start gap-4">
                <span className="an-sans text-[10px] font-bold tracking-wider uppercase px-2 py-[3px] rounded-[4px] bg-[#1A2540] text-[#3B82F6] shrink-0 mt-[2px]">СРОК</span>
                <div>
                  <div className="an-sans text-[13px] text-[#FFFFFF] mb-1">Директни плащания · корекции</div>
                  <div className="an-sans text-[12px] text-[#555555]">ДФЗ · до 15 юни 2025</div>
                </div>
              </div>
              <div className="px-5 py-4 flex items-start gap-4">
                <span className="an-sans text-[10px] font-bold tracking-wider uppercase px-2 py-[3px] rounded-[4px] bg-[#1A1A2A] text-[#7C6FCD] shrink-0 mt-[2px]">ПРАВИЛА</span>
                <div>
                  <div className="an-sans text-[13px] text-[#FFFFFF] mb-1">Нови изисквания за пасища 2025</div>
                  <div className="an-sans text-[12px] text-[#555555]">Министерство на земеделието</div>
                </div>
              </div>
              <div className="px-5 py-4 flex items-start gap-4">
                <span className="an-sans text-[10px] font-bold tracking-wider uppercase px-2 py-[3px] rounded-[4px] bg-[#2A1E00] text-[#C9A227] shrink-0 mt-[2px]">ДОКУМЕНТИ</span>
                <div>
                  <div className="an-sans text-[13px] text-[#FFFFFF] mb-1">Дневници за растителна защита</div>
                  <div className="an-sans text-[12px] text-[#555555]">Електронен регистър · БАБХ</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2 — Search */}
      <div className="bg-[#181818] border border-[#1E1E1E] rounded-[20px] p-16 flex flex-col md:flex-row gap-12 items-center">
        <div className="w-full md:w-[42%]">
          <div className="flex items-center gap-2 mb-5">
            <IcoSearch size={28} color="#3B82F6" />
            <span className="an-sans text-[12px] text-[#888888] uppercase tracking-[0.08em]">Документи</span>
          </div>
          <h3 className="an-serif text-[36px] text-white mb-4 leading-tight">Намери документ.</h3>
          <p className="an-sans text-[16px] text-[#888888] leading-[1.6] mb-7">
            Пълен архив от наредби, образци и заявления в PDF формат — всичко на едно място.
          </p>
          <a href="#" className="an-sans text-[14px] text-[#3B82F6] font-medium flex items-center gap-[6px] hover:text-[#2563EB] transition-colors">
            <span>Търси в базата</span>
            <IcoChevronRight size={14} color="#3B82F6" />
          </a>
        </div>
        <div className="w-full md:w-[58%]">
          <div className="bg-[#111111] rounded-[14px] border border-[#1E1E1E] overflow-hidden">
            <div className="border-b border-[#1E1E1E] px-5 py-3 flex items-center gap-2">
              <div className="w-[6px] h-[6px] rounded-full bg-[#282828]" />
              <div className="w-[6px] h-[6px] rounded-full bg-[#282828]" />
              <div className="w-[6px] h-[6px] rounded-full bg-[#282828]" />
              <span className="an-sans text-[11px] text-[#444444] ml-2">База с документи</span>
            </div>
            <div className="p-5">
              <div className="bg-[#181818] border border-[#242424] rounded-[8px] flex items-center gap-2 px-3 h-[38px] mb-4">
                <IcoSearch size={14} color="#555555" />
                <span className="an-sans text-[12px] text-[#444444]">Търси наредба, заявление…</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="bg-[#181818] border border-[#242424] rounded-[8px] p-3 flex items-center justify-between">
                  <div>
                    <div className="an-sans text-[13px] text-white mb-[2px]">Образец ДФЗ-1</div>
                    <div className="an-sans text-[11px] text-[#555555]">PDF · 245 KB · 2025</div>
                  </div>
                  <IcoFileText size={16} color="#3B82F6" />
                </div>
                <div className="bg-[#181818] border border-[#242424] rounded-[8px] p-3 flex items-center justify-between">
                  <div>
                    <div className="an-sans text-[13px] text-white mb-[2px]">ДЗЕС Карта 2025</div>
                    <div className="an-sans text-[11px] text-[#555555]">PDF · 1.2 MB · Актуален</div>
                  </div>
                  <IcoFileText size={16} color="#3B82F6" />
                </div>
                <div className="bg-[#181818] border border-[#242424] rounded-[8px] p-3 flex items-center justify-between">
                  <div>
                    <div className="an-sans text-[13px] text-white mb-[2px]">Наредба 5 / 2024</div>
                    <div className="an-sans text-[11px] text-[#555555]">PDF · 890 KB · ДФЗ</div>
                  </div>
                  <IcoFileText size={16} color="#3B82F6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3 — AI Review */}
      <div className="bg-[#181818] border border-[#1E1E1E] rounded-[20px] p-16 flex flex-col md:flex-row gap-12 items-center">
        <div className="w-full md:w-[42%]">
          <div className="flex items-center gap-2 mb-5">
            <IcoSpark size={28} color="#3B82F6" />
            <span className="an-sans text-[12px] text-[#888888] uppercase tracking-[0.08em]">AI Преглед</span>
          </div>
          <h3 className="an-serif text-[36px] text-white mb-4 leading-tight">AI преглед.</h3>
          <p className="an-sans text-[16px] text-[#888888] leading-[1.6] mb-7">
            Автоматичен анализ на вашите договори и писма за съответствие с актуалните изисквания.
          </p>
          <a href="#" className="an-sans text-[14px] text-[#3B82F6] font-medium flex items-center gap-[6px] hover:text-[#2563EB] transition-colors">
            <span>Качи документ</span>
            <IcoChevronRight size={14} color="#3B82F6" />
          </a>
        </div>
        <div className="w-full md:w-[58%]">
          <div className="bg-[#111111] rounded-[14px] border border-[#1E1E1E] overflow-hidden">
            <div className="border-b border-[#1E1E1E] px-5 py-3 flex items-center gap-2">
              <div className="w-[6px] h-[6px] rounded-full bg-[#282828]" />
              <div className="w-[6px] h-[6px] rounded-full bg-[#282828]" />
              <div className="w-[6px] h-[6px] rounded-full bg-[#282828]" />
              <span className="an-sans text-[11px] text-[#444444] ml-2">AI Преглед на документ</span>
            </div>
            <div className="p-5">
              <div className="border border-dashed border-[#2A2A2A] rounded-[10px] p-6 flex flex-col items-center justify-center gap-3 mb-4">
                <IcoFileText size={28} color="#444444" />
                <div className="text-center">
                  <div className="an-sans text-[13px] text-[#888888] mb-1">Пуснете PDF тук</div>
                  <div className="an-sans text-[11px] text-[#444444]">или изберете файл</div>
                </div>
                <button className="an-sans bg-[#222222] text-[#CCCCCC] text-[12px] px-4 py-[6px] rounded-[6px] border border-[#333333]">Избери файл</button>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 p-3 bg-[#0F1A0F] border border-[#1A2A1A] rounded-[8px]">
                  <IcoCheckCircle size={16} color="#3B82F6" />
                  <span className="an-sans text-[12px] text-[#888888]">Структурата на договора е коректна</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#1A1A0F] border border-[#2A2A1A] rounded-[8px]">
                  <IcoClock size={16} color="#C9A227" />
                  <span className="an-sans text-[12px] text-[#888888]">Срок за подаване: 15 юни 2025</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>;

// ─── How It Works ─────────────────────────────────────────────────────────────
const HowItWorks = () => <section className="bg-[#111111] py-[100px] px-12">
    <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row gap-16">
      <div className="w-full lg:w-[38%]">
        <h2 className="an-serif text-[56px] text-white leading-tight mb-4">Четири стъпки.</h2>
        <p className="an-sans text-[17px] text-[#888888] leading-[1.6] mb-10">От настройка до разговор за минути.</p>
        <div className="bg-[#181818] rounded-[16px] p-8 border border-[#1E1E1E]">
          <h3 className="an-sans text-[18px] font-bold text-white mb-2">Готов ли си?</h3>
          <p className="an-sans text-[15px] text-[#888888] leading-[1.6] mb-6">Опитай сам за под 5 минути.</p>
          <button className="an-btn-primary w-full !justify-center mb-4">
            <span>Питай AI</span>
            <IcoChevronRight size={16} />
          </button>
          <p className="an-sans text-[12px] text-[#555555] text-center">14 дни безплатно · Не се изисква карта</p>
        </div>
      </div>
      <div className="w-full lg:w-[62%] grid grid-cols-1 md:grid-cols-2 gap-5">
        {HOW_IT_WORKS_STEPS.map((step, idx) => <div key={step.title} className="bg-[#181818] border border-[#1E1E1E] rounded-[14px] p-7">
            <div className="an-sans text-[11px] text-[#3B82F6] uppercase font-bold tracking-[0.1em] mb-4">0{idx + 1}</div>
            <h4 className="an-sans text-[17px] font-bold text-white mb-3 leading-snug">{step.title}</h4>
            <p className="an-sans text-[14px] text-[#888888] leading-[1.6]">{step.description}</p>
          </div>)}
      </div>
    </div>
  </section>;

// ─── Stats ────────────────────────────────────────────────────────────────────
const Stats = () => <section className="bg-[#0A0A0A] border-y border-[#1A1A1A] py-[60px] px-12">
    <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[#1A1A1A]">
      <div className="flex-1 flex flex-col items-center justify-center py-8 md:py-0">
        <span className="an-serif text-[60px] text-white leading-none mb-2">59</span>
        <span className="an-sans text-[14px] text-[#888888]">Чат записа</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center py-8 md:py-0">
        <span className="an-serif text-[60px] text-white leading-none mb-2">51/51</span>
        <span className="an-sans text-[14px] text-[#888888]">RAG индекс</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center py-8 md:py-0">
        <span className="an-serif text-[60px] text-white leading-none mb-2">8,342</span>
        <span className="an-sans text-[14px] text-[#888888]">Посетители</span>
      </div>
    </div>
  </section>;

// ─── Categories ───────────────────────────────────────────────────────────────
const CategoriesSection = () => <section className="bg-[#111111] py-[100px] px-12">
    <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row gap-16">
      <div className="w-full lg:w-[28%]">
        <h2 className="an-serif text-[48px] text-white leading-tight mb-4">Бърз достъп.</h2>
        <p className="an-sans text-[17px] text-[#888888] leading-[1.6]">Открийте бързи отговори в нашата систематизирана документна база.</p>
      </div>
      <div className="w-full lg:w-[72%] grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CATEGORIES.map(cat => <div key={cat.name} className="an-category-tile bg-[#181818] border border-[#1E1E1E] rounded-[14px] p-6 flex items-start gap-4">
            <div className="mt-[2px] shrink-0">{cat.icon}</div>
            <div>
              <h4 className="an-sans text-[15px] font-bold text-white mb-1">{cat.name}</h4>
              <p className="an-sans text-[13px] text-[#888888]">{cat.subtitle}</p>
            </div>
          </div>)}
      </div>
    </div>
  </section>;

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TestimonialSection = () => <section className="bg-[#0A0A0A] py-[100px] px-12">
    <div className="max-w-[1100px] mx-auto">
      <div className="mb-[60px]">
        <h2 className="an-serif text-[56px] text-white leading-tight mb-4">Реални екипи, реални резултати.</h2>
        <p className="an-sans text-[17px] text-[#888888] leading-[1.6]">Вижте какво се случва, когато работата става по-лесна.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[32px]">
        {TESTIMONIALS.map(t => <div key={t.name} className="bg-[#181818] border border-[#1E1E1E] rounded-[18px] p-9 flex flex-col">
            <div className="flex items-center justify-center w-[52px] h-[52px] bg-[#1E1E1E] rounded-full border border-[#2A2A2A] mb-6 shrink-0">
              <span className="an-sans text-[15px] font-bold text-white">{t.initials}</span>
            </div>
            <p className="an-serif text-[17px] text-[#CCCCCC] leading-[1.7] mb-8 flex-1">
              <span className="text-[#2A2A2A] text-[48px] an-serif leading-none mr-1">"</span>
              {t.quote}
            </p>
            <div>
              <div className="an-sans text-[15px] font-bold text-white mb-1">{t.name}</div>
              <div className="an-sans text-[13px] text-[#888888] mb-4">{t.role}</div>
              <div className="flex gap-1">
                {STAR_KEYS.map(k => <IcoStar key={k} size={14} color="#3B82F6" />)}
              </div>
            </div>
          </div>)}
      </div>
    </div>
  </section>;

// ─── Comparison Table ─────────────────────────────────────────────────────────
const ComparisonTableSection = () => <section className="bg-[#111111] py-[100px] px-12">
    <div className="max-w-[900px] mx-auto text-center mb-[60px]">
      <h2 className="an-serif text-[48px] text-white leading-tight">AgriNexus срещу самостоятелно търсене.</h2>
    </div>
    <div className="max-w-[900px] mx-auto bg-[#181818] rounded-[18px] border border-[#1E1E1E] overflow-hidden">
      <div className="grid grid-cols-[2fr_1fr_1fr] border-b border-[#1E1E1E]">
        <div className="p-6" />
        <div className="p-6 flex items-center justify-center border-l border-[#1E1E1E]" style={{
        borderTop: '2px solid #3B82F6'
      }}>
          <span className="an-sans text-[15px] font-bold text-white">AgriNexus</span>
        </div>
        <div className="p-6 flex items-center justify-center border-l border-[#1E1E1E]">
          <span className="an-sans text-[15px] text-[#888888]">Сам</span>
        </div>
      </div>
      {COMPARISON_ROWS.map(row => <div key={row.feature} className="grid grid-cols-[2fr_1fr_1fr] border-b border-[#1E1E1E] last:border-0 hover:bg-[#1E1E1E] transition-colors">
          <div className="p-6 flex items-center">
            <span className="an-sans text-[15px] text-white">{row.feature}</span>
          </div>
          <div className="p-6 flex items-center justify-center border-l border-[#1E1E1E]">
            {row.agri === 'check' ? <IcoCheckCircle size={22} color="#3B82F6" /> : <span className="an-sans text-[15px] font-bold text-white">{row.agriText}</span>}
          </div>
          <div className="p-6 flex items-center justify-center border-l border-[#1E1E1E]">
            {row.manual === 'x' ? <IcoXCircle size={22} color="#555555" /> : <span className="an-sans text-[15px] text-[#888888]">{row.manualText}</span>}
          </div>
        </div>)}
    </div>
  </section>;

// ─── Deadlines ────────────────────────────────────────────────────────────────
const DeadlinesSection = () => <section className="bg-[#0A0A0A] py-[100px] px-12">
    <div className="max-w-[1100px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-[48px] gap-4">
        <h2 className="an-serif text-[48px] text-white leading-tight">Последни промени и срокове.</h2>
        <a href="#" className="an-sans text-[14px] text-[#3B82F6] font-medium flex items-center gap-[6px] hover:text-[#2563EB] transition-colors shrink-0">
          <span>Виж всички</span>
          <IcoChevronRight size={14} color="#3B82F6" />
        </a>
      </div>
      <div className="flex flex-col border-t border-[#1A1A1A]">
        {DEADLINES.map(item => <div key={item.title} className="flex flex-col md:flex-row md:items-center py-7 border-b border-[#1A1A1A] gap-4">
            <div className="w-[120px] shrink-0">
              <span className="an-sans text-[10px] font-bold tracking-[0.08em] uppercase px-[10px] py-[4px] rounded-[5px]" style={item.type === 'СРОК' ? {
            background: 'rgba(59,130,246,0.12)',
            color: '#3B82F6'
          } : item.type === 'ПРАВИЛА' ? {
            background: 'rgba(124,111,205,0.15)',
            color: '#7C6FCD'
          } : {
            background: 'rgba(201,162,39,0.12)',
            color: '#C9A227'
          }}>
                {item.type}
              </span>
            </div>
            <div>
              <h4 className="an-sans text-[16px] font-bold text-white mb-1">{item.title}</h4>
              <p className="an-sans text-[14px] text-[#888888]">{item.subtitle}</p>
            </div>
          </div>)}
      </div>
    </div>
  </section>;

// ─── Trust Section ────────────────────────────────────────────────────────────
const TrustSection = () => <section style={{
  background: '#FDF4EE'
}} className="py-[100px] px-12">
    <div className="max-w-[1100px] mx-auto text-center">
      <div className="an-sans text-[12px] text-[#888888] uppercase tracking-[0.08em] mb-7">Сигурност</div>
      <h2 className="an-serif text-[64px] text-[#1A1A1A] tracking-[-0.02em] leading-[1.1] mb-8">
        Всеки отговор — проверим.
      </h2>
      <div className="inline-flex items-center gap-2 border border-[#CCBBAA] rounded-full px-4 py-[5px] mb-16">
        <IcoLock size={14} color="#888888" />
        <span className="an-sans text-[13px] text-[#888888] font-medium">SSL Protected · GDPR Compliant</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
        <div>
          <div className="mb-4">
            <IcoShield size={28} color="#1A1A1A" />
          </div>
          <h4 className="an-sans text-[18px] font-bold text-[#1A1A1A] mb-3">Официални данни</h4>
          <p className="an-sans text-[16px] text-[#666666] leading-[1.65]">
            Директна връзка с API на ДФЗ, МЗ и БАБХ. Актуализации на всеки 30 минути за максимална прецизност.
          </p>
        </div>
        <div>
          <div className="mb-4">
            <IcoCheckCircle size={28} color="#1A1A1A" />
          </div>
          <h4 className="an-sans text-[18px] font-bold text-[#1A1A1A] mb-3">Проверима логика</h4>
          <p className="an-sans text-[16px] text-[#666666] leading-[1.65]">
            Нашият AI посочва източника за всеки отговор. Директен линк към официалния нормативен акт.
          </p>
        </div>
        <div>
          <div className="mb-4">
            <IcoLock size={28} color="#1A1A1A" />
          </div>
          <h4 className="an-sans text-[18px] font-bold text-[#1A1A1A] mb-3">Защита на данните</h4>
          <p className="an-sans text-[16px] text-[#666666] leading-[1.65]">
            Криптиране на банково ниво и пълно съответствие с GDPR. Без споделяне с трети страни.
          </p>
        </div>
      </div>
    </div>
  </section>;

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQSection = () => {
  const [open, setOpen] = React.useState<number | null>(0);
  return <section className="bg-[#0A0A0A] py-[100px] px-12">
      <div className="max-w-[800px] mx-auto">
        <h2 className="an-serif text-[56px] text-white leading-tight mb-12">
          Имате въпроси?<br />Ние имаме отговори.
        </h2>
        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => <div key={faq.question} className="bg-[#111111] border border-[#1E1E1E] rounded-[14px] overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left">
                <span className="an-sans text-[16px] font-medium text-white pr-8 leading-snug">{faq.question}</span>
                <span className="text-[#888888] shrink-0">
                  {open === i ? <IcoMinus size={20} color="#888888" /> : <IcoPlus size={20} color="#888888" />}
                </span>
              </button>
              <AnimatePresence>
                {open === i && <motion.div initial={{
              height: 0,
              opacity: 0
            }} animate={{
              height: 'auto',
              opacity: 1
            }} exit={{
              height: 0,
              opacity: 0
            }} transition={{
              duration: 0.28
            }} className="overflow-hidden">
                    <div className="px-6 pb-7 an-sans text-[15px] text-[#888888] leading-[1.65] border-t border-[#1A1A1A] pt-5">
                      {faq.answer}
                    </div>
                  </motion.div>}
              </AnimatePresence>
            </div>)}
        </div>
      </div>
    </section>;
};

// ─── AI Chat CTA ──────────────────────────────────────────────────────────────
const AIChatCTA = () => <section className="bg-[#111111] py-[100px] px-12">
    <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row gap-16 items-center">
      <div className="w-full lg:w-[44%]">
        <div className="an-sans text-[12px] text-[#888888] uppercase tracking-[0.08em] mb-5">AI Асистент</div>
        <h2 className="an-serif text-[48px] text-white leading-tight mb-6">Задай въпрос към специалист.</h2>
        <p className="an-sans text-[17px] text-[#888888] leading-[1.6] mb-8">
          Нашият AI не е просто чат-бот. Това е екип от дигитални експерти, специализирани в различни аспекти на земеделието.
        </p>
        <div className="flex flex-wrap gap-3">
          <div className="bg-[#181818] border border-[#1E1E1E] rounded-full px-4 py-[7px] flex items-center gap-2">
            <IcoScale size={14} color="#888888" />
            <span className="an-sans text-[13px] text-white">Право · Елена</span>
          </div>
          <div className="bg-[#181818] border border-[#1E1E1E] rounded-full px-4 py-[7px] flex items-center gap-2">
            <IcoLeaf size={14} color="#888888" />
            <span className="an-sans text-[13px] text-white">Поле · Борис</span>
          </div>
          <div className="bg-[#181818] border border-[#1E1E1E] rounded-full px-4 py-[7px] flex items-center gap-2">
            <IcoCalculator size={14} color="#888888" />
            <span className="an-sans text-[13px] text-white">Финанси · Виктория</span>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-[56%]">
        <div className="bg-[#181818] border border-[#1E1E1E] rounded-[18px] p-6 h-[400px] flex flex-col">
          <div className="flex gap-6 border-b border-[#1E1E1E] pb-3 mb-4">
            <span className="an-sans text-[14px] font-semibold text-white pb-3 -mb-[13px] border-b-2 border-[#3B82F6]">Право</span>
            <span className="an-sans text-[14px] font-medium text-[#888888] pb-3">Поле</span>
            <span className="an-sans text-[14px] font-medium text-[#888888] pb-3">Финанси</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="an-sans text-[14px] text-[#555555] italic text-center">Задай казус: култура, регион, документ или срок.</p>
          </div>
          <div className="bg-[#111111] rounded-[10px] p-[6px] flex items-center gap-2 border border-[#1E1E1E]">
            <input type="text" placeholder="Напишете съобщение…" className="bg-transparent outline-none an-sans text-[13px] text-white px-3 flex-1 placeholder:text-[#555555]" />
            <button className="an-btn-primary !px-4 !py-[7px] !text-[13px] shrink-0">Изпрати</button>
          </div>
        </div>
      </div>
    </div>
  </section>;

// ─── Final CTA ────────────────────────────────────────────────────────────────
const FinalCTA = () => <section className="bg-[#0A0A0A] py-[120px] px-12 overflow-hidden" style={{
  position: 'relative',
  textAlign: 'center'
}}>
    <div className="pointer-events-none" style={{
    position: 'absolute',
    bottom: 0,
    left: '50%',
    width: '900px',
    height: '500px',
    background: 'radial-gradient(ellipse at 50% 100%, rgba(139,92,246,0.45) 0%, rgba(59,130,246,0.3) 40%, transparent 70%)',
    filter: 'blur(120px)',
    transform: 'translateX(-50%) translateY(40%)',
    zIndex: 0
  }} />
    <div className="relative max-w-[800px] mx-auto" style={{
    zIndex: 1
  }}>
      <h2 className="an-serif text-[72px] text-white leading-tight mb-10 tracking-[-0.02em]">
        Започни с AgriNexus днес.
      </h2>
      <div className="flex items-center justify-center gap-4 mb-6">
        <button className="an-btn-primary !px-8 !py-[14px] !text-[16px]">
          <span>Питай AI</span>
          <IcoChevronRight size={16} />
        </button>
        <button className="an-btn-ghost !px-8 !py-[14px] !text-[16px]">Виж демо</button>
      </div>
      <p className="an-sans text-[13px] text-[#555555]">14 дни безплатно · Не се изисква карта</p>
    </div>
  </section>;

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer = () => <footer className="bg-[#0A0A0A] border-t border-[#1A1A1A] py-7 px-12">
    <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <span className="an-sans text-[13px] text-[#555555]">© 2025 AgriNexus.Law</span>
      <div className="flex items-center gap-8">
        {['Документи', 'AI преглед', 'Срокове', 'Калкулатори', 'Поверителност'].map(l => <a key={l} href="#" className="an-sans text-[13px] text-[#555555] hover:text-[#FFFFFF] transition-colors duration-200">{l}</a>)}
      </div>
      <span className="an-sans text-[13px] text-[#555555]">8,342 посетители тази седмица</span>
    </div>
  </footer>;

// ─── Root ─────────────────────────────────────────────────────────────────────
export const AgriNexusLanding = () => <div className="min-h-screen bg-[#0A0A0A] text-white" style={{
  overflowX: 'hidden'
}}>
    <style>{globalStyles}</style>
    <Navbar />
    <Hero />
    <SocialProof />
    <WhySection />
    <FeatureCards />
    <HowItWorks />
    <Stats />
    <CategoriesSection />
    <TestimonialSection />
    <ComparisonTableSection />
    <DeadlinesSection />
    <TrustSection />
    <FAQSection />
    <AIChatCTA />
    <FinalCTA />
    <Footer />
  </div>;