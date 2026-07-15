"use client";

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LandingChatProvider, useLandingChat } from '@/components/landing-chat-drawer';
import { LandingLiveStats } from '@/components/landing-live-stats';
import { LandingSocialProof } from '@/components/landing-social-proof';
import { PricingPlans } from '@/components/pricing-plans';

// --- Types ---
interface NavLink {
  label: string;
  href: string;
}
interface Feature {
  label: string;
  title: string;
  description: string;
  theme: 'light' | 'dark' | 'black';
  href: string;
}
interface Category {
  name: string;
  subtitle: string;
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
interface TickerItem {
  dotColor: string;
  text: string;
}
interface HowItWorksStep {
  title: string;
  description: string;
}
interface ComparisonRow {
  feature: string;
  agri: 'check' | 'text';
  agriText?: string;
  manual: 'x' | 'text';
  manualText?: string;
}
interface MobileFeatureBullet {
  bold: string;
  muted: string;
}
interface ProfileChip {
  label: string;
  expert: string;
}

// --- Mock Data ---
const NAV_LINKS: NavLink[] = [{
  label: 'Моята ферма',
  href: '/moya-ferma'
}, {
  label: 'Документи',
  href: '/documents'
}, {
  label: 'AI преглед',
  href: '/search'
}, {
  label: 'Срокове',
  href: '/srokove'
}, {
  label: 'Калкулатори',
  href: '/kalkulator'
}, {
  label: 'Статистики',
  href: '/statistiki'
}];
const FEATURES: Feature[] = [{
  label: 'СРОКОВЕ',
  title: 'Провери срокове',
  description: 'Интелигентно проследяване на крайни дати за кандидатстване по ДФЗ и активните кампании.',
  theme: 'light',
  href: '/srokove'
}, {
  label: 'ДОКУМЕНТИ',
  title: 'Намери документ',
  description: 'Пълен архив от наредби, образци и заявления в PDF формат на едно място.',
  theme: 'black',
  href: '/documents'
}, {
  label: 'AI ПРЕГЛЕД',
  title: 'AI преглед',
  description: 'Автоматичен анализ на вашите договори и писма за съответствие с актуалните изисквания.',
  theme: 'dark',
  href: '/document-review'
}];
const CATEGORIES: Category[] = [{
  name: 'Субсидии',
  subtitle: 'Директни плащания'
}, {
  name: 'Закони',
  subtitle: 'Наредби и укази'
}, {
  name: 'Сертификати',
  subtitle: 'Био и качество'
}, {
  name: 'Био производство',
  subtitle: 'Еко стандарти'
}, {
  name: 'Растителна защита',
  subtitle: 'Дневници и препарати'
}, {
  name: 'ЕС регламенти',
  subtitle: 'Общи политики'
}, {
  name: 'Образци',
  subtitle: 'Заявления и бланки'
}, {
  name: 'Калкулатори',
  subtitle: 'Бюджет и ДДС'
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
  answer: 'Търсенето и сроковете са безплатни. Платените планове са в EUR (€) с 7 дни безплатен trial. Вижте /ceni.'
}];
const CHAT_TABS = ['Право', 'Поле', 'Финанси'];
const SEARCH_CHIPS = ['Документи за био сертификат', 'Срокове директни плащания', 'Дневници при био стопанство'];
const PROFILE_CHIPS: ProfileChip[] = [{
  label: 'Право',
  expert: 'Елена'
}, {
  label: 'Поле',
  expert: 'Борис'
}, {
  label: 'Финанси',
  expert: 'Виктория'
}];
const TICKER_ITEMS: TickerItem[] = [{
  dotColor: '#FF3B30',
  text: 'АКТИВНО · Директни плащания — краен срок 15 юни 2025'
}, {
  dotColor: '#FF9F0A',
  text: 'ПРЕДСТОИ · Еко-схеми — прием от 1 юли 2025'
}, {
  dotColor: '#FF3B30',
  text: 'АКТИВНО · Авансови плащания — документи до 30 май 2025'
}, {
  dotColor: '#30D158',
  text: 'ОТВОРЕНО · Биологично производство — регистрация'
}, {
  dotColor: '#FF3B30',
  text: 'АКТИВНО · ПРСР Мярка 11 — краен срок 20 юни'
}];
const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [{
  title: 'Задай въпрос',
  description: 'Напишете въпроса си на разговорен български — за субсидии, срокове или документи.'
}, {
  title: 'AI търси в наредбите',
  description: 'Системата претърсва официалните наредби на ДФЗ и Министерството.'
}, {
  title: 'Получи отговор',
  description: 'Получавате ясен отговор с директен линк към нормативния акт.'
}];
const COMPARISON_ROWS: ComparisonRow[] = [{
  feature: '18 секторни агро-модула (Зърно, Животновъдство, Овощарство, Пчелин)',
  agri: 'check',
  manual: 'x'
}, {
  feature: 'Автоматично счетоводство с НАП XML, ДДС и банков импорт',
  agri: 'check',
  manual: 'x'
}, {
  feature: 'Нормативни дневници за БАБХ и ВетИС регистри',
  agri: 'check',
  manual: 'x'
}, {
  feature: 'GIS карта на парцелите, сеитбооборот и фири в силози',
  agri: 'check',
  manual: 'x'
}, {
  feature: 'Търсене на закони и субсидии с точен цитат от ДФЗ и МЗ',
  agri: 'check',
  manual: 'x'
}, {
  feature: 'AI правен преглед на договори и агрономически анализ (RAG)',
  agri: 'check',
  manual: 'x'
}, {
  feature: 'Актуални срокове за директни плащания, СЕУ и екосхеми',
  agri: 'check',
  manual: 'x'
}, {
  feature: 'Необходимо време за пълна администрация и отчетност',
  agri: 'text',
  agriText: '< 5 минути на ден',
  manual: 'text',
  manualText: 'Часове ръчен труд'
}];
const MOBILE_BULLETS: MobileFeatureBullet[] = [{
  bold: 'PWA приложение',
  muted: 'Инсталирай на телефона за бърз достъп'
}, {
  bold: 'Live данни',
  muted: 'Срокове и архив от официални източници'
}, {
  bold: 'Бърз достъп',
  muted: 'Документи, срокове и калкулатори'
}];

// --- Inline SVG Icons ---

const IconSearch = ({
  size = 20,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 20 20" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <circle cx="9" cy="9" r="6" />
    <line x1="13.5" y1="13.5" x2="18" y2="18" />
  </svg>;
const IconChevronRight = ({
  size = 16,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <polyline points="5,2 11,8 5,14" />
  </svg>;
const IconPlus = ({
  size = 20,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 20 20" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <line x1="10" y1="3" x2="10" y2="17" />
    <line x1="3" y1="10" x2="17" y2="10" />
  </svg>;
const IconMinus = ({
  size = 20,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 20 20" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <line x1="3" y1="10" x2="17" y2="10" />
  </svg>;
const IconArrowRight = ({
  size = 20,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 20 20" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <line x1="3" y1="10" x2="17" y2="10" />
    <polyline points="11,4 17,10 11,16" />
  </svg>;
const IconCalendar = ({
  size = 28,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 22 22" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <rect x="2" y="4" width="18" height="16" rx="2.5" />
    <line x1="7" y1="2" x2="7" y2="6" />
    <line x1="15" y1="2" x2="15" y2="6" />
    <line x1="2" y1="9" x2="20" y2="9" />
    <line x1="6" y1="13" x2="9" y2="13" />
    <line x1="13" y1="13" x2="16" y2="13" />
  </svg>;
const IconDocText = ({
  size = 28,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 22 22" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <path d="M4 2 H14 L18 6 V20 Q18 21 17 21 H5 Q4 21 4 20 V3 Q4 2 5 2 Z" />
    <polyline points="14,2 14,7 18,7" />
    <line x1="7" y1="11" x2="15" y2="11" />
    <line x1="7" y1="14" x2="15" y2="14" />
    <line x1="7" y1="17" x2="12" y2="17" />
  </svg>;
const IconSparkles = ({
  size = 28,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 22 22" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <path d="M11 2 L12.2 8.4 L18 11 L12.2 13.6 L11 20 L9.8 13.6 L4 11 L9.8 8.4 Z" />
    <path d="M18 2 L18.7 4.3 L21 5 L18.7 5.7 L18 8 L17.3 5.7 L15 5 L17.3 4.3 Z" />
    <path d="M4 15 L4.5 16.5 L6 17 L4.5 17.5 L4 19 L3.5 17.5 L2 17 L3.5 16.5 Z" />
  </svg>;
const IconBanknote = ({
  size = 20,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 18 18" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <rect x="1" y="4" width="16" height="10" rx="1.5" />
    <ellipse cx="9" cy="9" rx="2.5" ry="2.5" />
    <line x1="3" y1="7" x2="3" y2="11" />
    <line x1="15" y1="7" x2="15" y2="11" />
  </svg>;
const IconScales = ({
  size = 20,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 18 18" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <line x1="9" y1="1" x2="9" y2="17" />
    <line x1="3" y1="4" x2="15" y2="4" />
    <line x1="3" y1="4" x2="1" y2="9" />
    <line x1="15" y1="4" x2="17" y2="9" />
    <path d="M1 9 Q2 12 3 9" />
    <path d="M15 9 Q16 12 17 9" />
    <line x1="6" y1="17" x2="12" y2="17" />
  </svg>;
const IconRosette = ({
  size = 20,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 18 18" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <circle cx="9" cy="9" r="7" />
    <circle cx="9" cy="9" r="3" />
    <line x1="9" y1="2" x2="9" y2="6" />
    <line x1="9" y1="12" x2="9" y2="16" />
    <line x1="2" y1="9" x2="6" y2="9" />
    <line x1="12" y1="9" x2="16" y2="9" />
  </svg>;
const IconLeaf = ({
  size = 20,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 18 18" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <path d="M3 15 C5 11 6 7 16 2 C16 2 16 12 9 14 C7 14.5 5 14 3 15 Z" />
    <line x1="3" y1="15" x2="8" y2="10" />
  </svg>;
const IconShieldCheck = ({
  size = 20,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 18 18" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <path d="M9 1 L16 4 L16 9 C16 13 12.5 16.5 9 17 C5.5 16.5 2 13 2 9 L2 4 Z" />
    <polyline points="5.5,9 7.5,11 12.5,7" />
  </svg>;
const IconGlobe = ({
  size = 20,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 18 18" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <circle cx="9" cy="9" r="7" />
    <ellipse cx="9" cy="9" rx="3" ry="7" />
    <line x1="2" y1="9" x2="16" y2="9" />
    <line x1="3" y1="5" x2="15" y2="5" />
    <line x1="3" y1="13" x2="15" y2="13" />
  </svg>;
const IconDoc = ({
  size = 20,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 18 18" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <path d="M3 1.5 H11 L14.5 5 V16 Q14.5 16.5 14 16.5 H4 Q3.5 16.5 3.5 16 V2 Q3.5 1.5 4 1.5 Z" />
    <polyline points="11,1.5 11,5.5 14.5,5.5" />
    <line x1="6" y1="9" x2="12" y2="9" />
    <line x1="6" y1="12" x2="12" y2="12" />
    <line x1="6" y1="15" x2="9" y2="15" />
  </svg>;
const IconCalculator = ({
  size = 20,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 18 18" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <rect x="2" y="1" width="14" height="16" rx="2" />
    <rect x="4.5" y="3.5" width="9" height="3" rx="0.5" />
    <circle cx="5.5" cy="10" r="0.8" />
    <circle cx="9" cy="10" r="0.8" />
    <circle cx="12.5" cy="10" r="0.8" />
    <circle cx="5.5" cy="13.5" r="0.8" />
    <circle cx="9" cy="13.5" r="0.8" />
    <circle cx="12.5" cy="13.5" r="0.8" />
  </svg>;
const IconCheckShield = ({
  size = 24,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 22 22" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <path d="M11 2 L19 5.5 L19 11 C19 16 15.5 19.5 11 21 C6.5 19.5 3 16 3 11 L3 5.5 Z" />
    <polyline points="7,11 9.5,13.5 15,8.5" />
  </svg>;
const IconLink = ({
  size = 24,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 22 22" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <path d="M8 13 C6 15 6 18 8.5 19.5 C11 21 14 20 15.5 18 L17 16 C18.5 14 18 11 16 9.5" />
    <path d="M14 9 C16 7 16 4 13.5 2.5 C11 1 8 2 6.5 4 L5 6 C3.5 8 4 11 6 12.5" />
    <line x1="9" y1="13" x2="13" y2="9" />
  </svg>;
const IconLock = ({
  size = 24,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 22 22" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <rect x="4" y="10" width="14" height="10" rx="2" />
    <path d="M7 10 V7 A4 4 0 0 1 15 7 V10" />
    <circle cx="11" cy="15" r="1.5" />
  </svg>;
const IconPersonCircle = ({
  size = 16,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5" />
    <circle cx="8" cy="6" r="2" />
    <path d="M3 13.5 C3.5 11 5.5 9.5 8 9.5 C10.5 9.5 12.5 11 13 13.5" />
  </svg>;
const IconLeafSmall = ({
  size = 16,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <path d="M2 13.5 C4 10 5 6.5 14 2 C14 2 14 11 7.5 12.5 C5.5 13 3.5 12.5 2 13.5 Z" />
    <line x1="2" y1="13.5" x2="7" y2="9" />
  </svg>;
const IconChartBar = ({
  size = 16,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <rect x="1.5" y="7" width="3" height="7" rx="0.5" />
    <rect x="6.5" y="4" width="3" height="10" rx="0.5" />
    <rect x="11.5" y="1.5" width="3" height="12.5" rx="0.5" />
  </svg>;
const IconMessage = ({
  size = 28,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>;
const IconMagnify = ({
  size = 28,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <line x1="16.5" y1="16.5" x2="22" y2="22" />
  </svg>;
const IconCheckCircle = ({
  size = 28,
  color = 'currentColor'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="7,12 10,15 17,9" />
  </svg>;
const IconCheckFilled = ({
  size = 20,
  color = '#0071E3'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 20 20" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <circle cx="10" cy="10" r="9" />
    <polyline points="6,10 9,13 14,7" />
  </svg>;
const IconXCircle = ({
  size = 20,
  color = '#D2D2D7'
}: {
  size?: number;
  color?: string;
}) => <svg width={size} height={size} viewBox="0 0 20 20" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <circle cx="10" cy="10" r="9" />
    <line x1="7" y1="7" x2="13" y2="13" />
    <line x1="13" y1="7" x2="7" y2="13" />
  </svg>;

// Category icon map
const CATEGORY_ICONS: Record<string, React.ReactElement> = {
  'Субсидии': <IconBanknote size={20} color="currentColor" />,
  'Закони': <IconScales size={20} color="currentColor" />,
  'Сертификати': <IconRosette size={20} color="currentColor" />,
  'Био производство': <IconLeaf size={20} color="currentColor" />,
  'Растителна защита': <IconShieldCheck size={20} color="currentColor" />,
  'ЕС регламенти': <IconGlobe size={20} color="currentColor" />,
  'Образци': <IconDoc size={20} color="currentColor" />,
  'Калкулатори': <IconCalculator size={20} color="currentColor" />
};
const PROFILE_ICONS: Record<string, React.ReactElement> = {
  'Право': <IconPersonCircle size={16} color="#6E6E73" />,
  'Поле': <IconLeafSmall size={16} color="#6E6E73" />,
  'Финанси': <IconChartBar size={16} color="#6E6E73" />
};

// --- Global keyframe styles ---
const GLOBAL_STYLES = `
  @keyframes agri-ticker-scroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes agri-live-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.35; transform: scale(1.3); }
  }
  .agri-ticker-track {
    animation: agri-ticker-scroll 35s linear infinite;
    white-space: nowrap;
    display: flex;
    align-items: center;
  }
  .agri-live-dot {
    animation: agri-live-pulse 1.8s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .agri-ticker-track, .agri-live-dot {
      animation: none;
    }
  }
  .agri-nav-link {
    font-size: 14px;
    font-weight: 500;
    color: #475569;
    text-decoration: none;
    transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1);
    padding: 6px 12px;
    border-radius: 9999px;
  }
  .agri-nav-link:hover {
    color: #0f766e;
    background-color: rgba(16, 185, 129, 0.08);
  }
  .farm-module-card {
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    border: 1px solid rgba(226, 232, 240, 0.8);
  }
  .farm-module-card:hover {
    background: linear-gradient(135deg, rgba(236, 253, 245, 0.95), rgba(253, 244, 255, 0.95)) !important;
    transform: translateY(-5px) scale(1.015);
    border-color: rgba(16, 185, 129, 0.5) !important;
    box-shadow: 0 20px 40px -15px rgba(16, 185, 129, 0.18), 0 0 20px -5px rgba(217, 70, 239, 0.1);
  }
  .agri-btn-primary {
    background: linear-gradient(135deg, #0f766e 0%, #10b981 60%, #d946ef 100%);
    color: #ffffff;
    font-size: 16px;
    font-weight: 600;
    padding: 0 26px;
    height: 48px;
    border-radius: 9999px;
    border: none;
    cursor: pointer;
    box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.35), 0 0 15px -3px rgba(217, 70, 239, 0.25);
    transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .agri-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 32px -5px rgba(16, 185, 129, 0.45), 0 0 25px -2px rgba(217, 70, 239, 0.35);
    filter: brightness(1.08);
  }
  .agri-btn-primary:active {
    transform: scale(0.98);
  }
  .agri-btn-ghost {
    background: rgba(255, 255, 255, 0.85);
    color: #0f172a;
    font-size: 16px;
    font-weight: 600;
    padding: 0 26px;
    height: 48px;
    border-radius: 9999px;
    border: 1px solid rgba(15, 23, 42, 0.15);
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
    transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    backdrop-filter: blur(12px);
  }
  .agri-btn-ghost:hover {
    background: rgba(248, 250, 252, 1);
    border-color: rgba(16, 185, 129, 0.4);
    color: #0f766e;
    transform: translateY(-2px);
    box-shadow: 0 10px 20px -8px rgba(16, 185, 129, 0.15);
  }
  .agri-category-tile {
    transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1);
    border: 1px solid rgba(226, 232, 240, 0.8);
  }
  .agri-category-tile:hover {
    transform: translateY(-4px);
    border-color: rgba(16, 185, 129, 0.5);
    box-shadow: 0 18px 36px -12px rgba(16, 185, 129, 0.16), 0 0 24px -6px rgba(217, 70, 239, 0.1);
  }
  .agri-deadline-row {
    transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .agri-deadline-row:hover {
    background: linear-gradient(90deg, rgba(236, 253, 245, 0.6), rgba(253, 244, 255, 0.6));
    transform: translateX(6px);
  }
  .agri-comparison-row {
    transition: background-color 150ms ease-out;
  }
  .agri-comparison-row:hover {
    background-color: rgba(241, 245, 249, 0.7);
  }
  .agri-faq-row {
    transition: all 200ms ease-out;
    border-radius: 12px;
  }
  .agri-faq-row:hover {
    background-color: rgba(248, 250, 252, 0.85);
  }
  button:focus-visible,
  a:focus-visible,
  input:focus-visible {
    outline: 2px solid #10b981;
    outline-offset: 2px;
  }
`;

// --- Sub-components ---

const Navbar = () => (
  <header className="fixed top-3 left-0 right-0 z-50 px-3 sm:px-6 flex justify-center pointer-events-none">
    <nav className="framer-pill-dock pointer-events-auto w-full max-w-6xl rounded-2xl px-4 py-2.5 flex items-center justify-between transition-all duration-300">
      <Link href="/" className="flex items-center gap-2.5 group" style={{ textDecoration: 'none' }}>
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-fuchsia-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
          <IconLeaf size={18} color="#FFFFFF" />
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold tracking-tight text-slate-900 leading-none">
            AgriNexus
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-fuchsia-600 mt-0.5">
            Law & Farm AI
          </span>
        </div>
      </Link>

      <div className="hidden lg:flex items-center gap-1">
        {NAV_LINKS.map(link => (
          <Link key={link.label} href={link.href} className="agri-nav-link">
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2.5">
        <Link href="/vhod" className="text-xs font-semibold text-slate-600 hover:text-emerald-600 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors" style={{ textDecoration: 'none' }}>
          Вход
        </Link>
        <Link href="/document-review" className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-fuchsia-600 shadow-sm hover:opacity-95 transition-opacity" style={{ textDecoration: 'none' }}>
          <span>AI преглед</span>
          <IconSparkles size={14} color="#FFFFFF" />
        </Link>
        <Link href="/search" aria-label="Търсене" className="h-9 w-9 rounded-full bg-slate-100/80 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 flex items-center justify-center transition-colors" style={{ textDecoration: 'none' }}>
          <IconSearch size={18} color="currentColor" />
        </Link>
      </div>
    </nav>
  </header>
);
const Hero = () => {
  const router = useRouter();
  const { openChat } = useLandingChat();
  const [query, setQuery] = React.useState('');

  const goSearch = () => {
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  return (
    <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 sm:px-8 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/80" style={{ paddingTop: '130px', paddingBottom: '90px' }}>
      {/* Ambient Fuchsia & Emerald Glow Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="animate-emerald-glow absolute top-[15%] left-[10%] w-[420px] h-[420px] rounded-full bg-emerald-400/20 blur-[100px]" />
        <div className="animate-fuchsia-glow absolute top-[25%] right-[12%] w-[460px] h-[460px] rounded-full bg-fuchsia-400/18 blur-[110px]" />
        <div className="absolute bottom-[10%] left-[30%] w-[380px] h-[380px] rounded-full bg-cyan-400/15 blur-[95px] animate-float" />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_45%,black_40%,transparent_100%)]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-800 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.2)] mb-6 backdrop-blur-md"
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-fuchsia-600 font-extrabold">
            AI АСИСТЕНТ ЗА ФЕРМЕРИ И ЗЕМЕДЕЛСКО ПРАВО
          </span>
        </motion.div>

        {/* Hero Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className="font-extrabold text-slate-900 tracking-tight leading-[1.08] mb-6 max-w-3xl"
          style={{ fontSize: 'clamp(38px, 6vw, 68px)' }}
        >
          <span className="block">Отговори и решения за</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-fuchsia-600">
            вашето стопанство.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="text-slate-600 font-normal leading-relaxed max-w-2xl mb-10"
          style={{ fontSize: 'clamp(16px, 2vw, 19px)' }}
        >
          Търсете субсидии, наредби, договори и срокове на едно място. Получавайте мигновени отговори с <span className="font-semibold text-slate-800">точни цитати от ДФЗ и МЗ</span>.
        </motion.p>

        {/* Elevated Interactive Search Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
          className="w-full max-w-2xl relative mb-8"
        >
          <div className="glass-panel-pro rounded-[22px] p-2 sm:p-2.5 flex flex-col sm:flex-row items-center gap-2 shadow-[0_24px_60px_-15px_rgba(16,185,129,0.2),0_10px_30px_-10px_rgba(217,70,239,0.15)] border border-slate-200/90 group focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
            <div className="flex items-center gap-3 px-3 w-full sm:w-auto flex-1">
              <IconSearch size={22} color="#0f766e" />
              <input
                type="text"
                placeholder="Напр. изисквания за директни плащания 2025, БИСС, екосхеми..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    goSearch();
                  }
                }}
                className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 font-medium text-base sm:text-lg focus:outline-none py-2"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => openChat(query || undefined)}
                className="agri-btn-primary btn-shimmer w-full sm:w-auto py-3 px-6 text-base whitespace-nowrap shadow-md shadow-emerald-600/25"
              >
                <span>AI Анализ</span>
                <IconSparkles size={18} color="#FFFFFF" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Quick Search Chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-2 max-w-2xl"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">
            Чести търсения:
          </span>
          {SEARCH_CHIPS.map((chip, idx) => (
            <Link
              key={chip}
              href={`/search?q=${encodeURIComponent(chip)}`}
              className="group inline-flex items-center gap-1.5 bg-white/80 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-fuchsia-500 text-slate-600 hover:text-white border border-slate-200/80 hover:border-transparent rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105"
              style={{ textDecoration: 'none' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:bg-white transition-colors" />
              <span>{chip}</span>
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const LiveTicker = () => <div className="w-full bg-[#000000] overflow-hidden" style={{
  height: '44px'
}}>
    <div className="flex items-center h-full">
      <div className="flex items-center gap-2 shrink-0 h-full" style={{
      paddingLeft: '16px',
      paddingRight: '20px',
      borderRight: '1px solid rgba(255,255,255,0.1)'
    }}>
        <span className="agri-live-dot w-[7px] h-[7px] rounded-full bg-[#0071E3] block shrink-0" />
        <span style={{
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        color: '#0071E3',
        textTransform: 'uppercase'
      }}>
          LIVE
        </span>
      </div>

      <div className="flex-1 overflow-hidden h-full flex items-center" style={{
      WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 94%, transparent 100%)',
      maskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 94%, transparent 100%)'
    }}>
        <div className="agri-ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => <span key={`ticker-${idx}`} className="inline-flex items-center" style={{
          gap: '8px'
        }}>
              <span className="inline-block rounded-full shrink-0" style={{
            width: '6px',
            height: '6px',
            backgroundColor: item.dotColor
          }} />
              <span style={{
            fontSize: '13px',
            fontWeight: 500,
            color: '#FFFFFF',
            letterSpacing: '0.01em'
          }}>
                {item.text}
              </span>
              <span style={{
            color: '#555555',
            fontSize: '13px',
            fontWeight: 500,
            margin: '0 20px'
          }}>·</span>
            </span>)}
        </div>
      </div>
    </div>
  </div>;
const Features = () => {
  const featureIcons: React.ReactElement[] = [
    <IconCalendar key="calendar" size={28} color="#10B981" />,
    <IconDocText key="doc" size={28} color="#D946EF" />,
    <IconSparkles key="sparkles" size={28} color="#0EA5E9" />
  ];
  return (
    <section className="relative py-24 px-4 sm:px-8 overflow-hidden bg-slate-50/80">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {FEATURES.map((feat, idx) => {
          const isHighlight = idx === 1;
          return (
            <div
              key={feat.label}
              className={`rounded-[28px] flex flex-col items-center text-center p-8 sm:p-10 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden ${
                isHighlight
                  ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white shadow-[0_20px_50px_-15px_rgba(217,70,239,0.3)] border border-fuchsia-500/30'
                  : 'glass-panel-pro card-hover-pro text-slate-900 border border-slate-200/80'
              }`}
            >
              {isHighlight && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/20 rounded-full blur-2xl pointer-events-none" />
              )}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-md transition-transform duration-300 group-hover:scale-110 ${
                isHighlight ? 'bg-fuchsia-500/20 border border-fuchsia-400/30' : 'bg-emerald-500/10 border border-emerald-400/20'
              }`}>
                {featureIcons[idx]}
              </div>
              <span className={`text-xs uppercase tracking-widest font-bold mb-3 ${
                isHighlight ? 'text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-400' : 'text-emerald-600'
              }`}>
                {feat.label}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4 leading-snug">
                {feat.title}
              </h3>
              <p className={`text-sm sm:text-base leading-relaxed mb-8 flex-1 ${
                isHighlight ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {feat.description}
              </p>
              <Link
                href={feat.href}
                style={{ textDecoration: 'none' }}
                className={`inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full transition-all duration-300 ${
                  isHighlight
                    ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white hover:opacity-90 shadow-lg shadow-fuchsia-500/25'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white border border-emerald-200/60'
                }`}
              >
                <span>Виж всички</span>
                <IconChevronRight size={16} color="currentColor" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
};
const HowItWorks = () => {
  const stepIcons = [<IconMessage key="msg" size={28} color="#1D1D1F" />, <IconMagnify key="mag" size={28} color="#1D1D1F" />, <IconCheckCircle key="chk" size={28} color="#1D1D1F" />];
  return <section className="bg-[#FFFFFF]" style={{
    padding: '100px 48px'
  }}>
      <div className="max-w-[1100px] mx-auto text-center">
        <span style={{
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 600,
        color: '#0071E3',
        marginBottom: '16px',
        display: 'block'
      }}>
          КАК РАБОТИ
        </span>
        <h2 style={{
        fontSize: 'clamp(36px, 4.5vw, 56px)',
        fontWeight: 700,
        color: '#1D1D1F',
        lineHeight: 1.05,
        letterSpacing: '-0.025em',
        marginBottom: '20px'
      }}>
          Три стъпки до отговора.
        </h2>
        <p style={{
        fontSize: '17px',
        lineHeight: 1.6,
        color: '#6E6E73',
        marginBottom: '48px'
      }}>
          Без PDF-та, без търсене по сайтове.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center">
          {HOW_IT_WORKS_STEPS.map((step, idx) => <div key={step.title} className="flex flex-col md:flex-row items-center flex-1">
              <div className="flex flex-col items-center text-center px-8 flex-1">
                <div className="rounded-2xl bg-[#F5F5F7] flex items-center justify-center" style={{
              width: '64px',
              height: '64px',
              marginBottom: '20px'
            }}>
                  {stepIcons[idx]}
                </div>
                <h3 style={{
              fontSize: '19px',
              fontWeight: 700,
              color: '#1D1D1F',
              marginBottom: '12px'
            }}>
                  {step.title}
                </h3>
                <p style={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: '#6E6E73',
              maxWidth: '200px'
            }}>
                  {step.description}
                </p>
              </div>
              {idx < HOW_IT_WORKS_STEPS.length - 1 && <div className="hidden md:flex items-center shrink-0" style={{
            width: '60px'
          }}>
                  <svg width="60" height="2" viewBox="0 0 60 2" fill="none" aria-hidden="true">
                    <line x1="0" y1="1" x2="60" y2="1" stroke="#D2D2D7" strokeWidth="1" strokeDasharray="4 4" />
                  </svg>
                </div>}
            </div>)}
        </div>
      </div>
    </section>;
};
const FARM_MODULES = [
  { label: 'Парцели', href: '/moya-ferma/polita', desc: 'Карта и регистър на полетата с площи, култури и геолокация' },
  { label: 'Склад', href: '/moya-ferma/sklad', desc: 'Наличие на торове, препарати, резервни части и консумативи' },
  { label: 'Счетоводство', href: '/moya-ferma/schetovodstvo', desc: 'Приходи/разходи, ДДС, банкови сметки и НАП XML експорт' },
  { label: 'Машини', href: '/moya-ferma/mashini', desc: 'Технически прегледи, застраховки, гориво и сервиз' },
  { label: 'Реколта', href: '/moya-ferma/rekolta', desc: 'Добиви по парцели, култури и години' },
  { label: 'Сеитбооборот', href: '/moya-ferma/seitbooborot', desc: 'План за ротация на културите и предшественици' },
  { label: 'Химизация', href: '/moya-ferma/himizacia', desc: 'БАБХ дневник за РЗ с PDF експорт и препарати' },
  { label: 'Календар', href: '/moya-ferma/kalendar', desc: 'Напомняния за срокове, прегледи и кампании' },
  { label: 'Банки', href: '/moya-ferma/banki', desc: 'Банкови сметки, транзакции и CSV импорт от банка' },
  { label: 'ЧР', href: '/moya-ferma/choveshki-resursi', desc: 'Трудови договори, присъствие, отпуски и заплати' },
  { label: 'ДМА', href: '/moya-ferma/dma', desc: 'Дълготрайни активи с амортизация и график' },
  { label: 'Архив', href: '/moya-ferma/dokumenti', desc: 'Хранилище за договори, ДФЗ писма, протоколи и фактури' },
];
const FarmDashboard = () => <section className="bg-[#FFFFFF]" style={{
padding: '100px 48px'
}}>
    <div className="max-w-[1100px] mx-auto">
      <span style={{
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      fontWeight: 600,
      color: '#0071E3',
      marginBottom: '16px',
      display: 'block',
      textAlign: 'center'
    }}>
        УПРАВЛЕНИЕ НА ФЕРМАТА
      </span>
      <h2 style={{
      fontSize: 'clamp(36px, 4.5vw, 56px)',
      fontWeight: 700,
      color: '#1D1D1F',
      textAlign: 'center',
      lineHeight: 1.05,
      letterSpacing: '-0.025em',
      marginBottom: '16px'
    }}>
        Всичко за твоето стопанство
      </h2>
      <p style={{
      fontSize: '17px',
      lineHeight: 1.6,
      color: '#6E6E73',
      textAlign: 'center',
      maxWidth: '600px',
      margin: '0 auto 56px'
    }}>
        От проследяване на парцелите до НАП декларации — 12 модула в едно табло.
      </p>
      <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '16px'
    }}>
        {FARM_MODULES.map(mod => <a key={mod.href} href={mod.href} className="farm-module-card" style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        borderRadius: '16px',
        backgroundColor: '#F5F5F7',
        textDecoration: 'none',
        transition: 'background-color 0.2s, transform 0.2s',
        border: '1px solid transparent'
      }}>
            <span style={{
          fontSize: '15px',
          fontWeight: 700,
          color: '#1D1D1F',
          marginBottom: '6px'
        }}>{mod.label}</span>
            <span style={{
          fontSize: '13px',
          lineHeight: 1.5,
          color: '#6E6E73'
        }}>{mod.desc}</span>
          </a>)}
      </div>
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <a href="/moya-ferma" className="agri-btn-primary" style={{
        display: 'inline-flex',
        fontSize: '15px'
      }}>
            Към Моята ферма →
          </a>
      </div>
    </div>
  </section>;

const Categories = () => <section className="bg-[#F5F5F7]" style={{
  padding: '100px 48px'
}}>
    <div className="max-w-[1100px] mx-auto text-center">
      <span style={{
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      fontWeight: 600,
      color: '#0071E3',
      marginBottom: '16px',
      display: 'block'
    }}>
        КАТЕГОРИИ
      </span>
      <h2 style={{
      fontSize: 'clamp(32px, 4vw, 48px)',
      fontWeight: 700,
      color: '#1D1D1F',
      lineHeight: 1.05,
      letterSpacing: '-0.025em',
      marginBottom: '20px'
    }}>
        Бърз достъп до най-честите казуси.
      </h2>
      <p style={{
      fontSize: '17px',
      lineHeight: 1.6,
      color: '#6E6E73',
      marginBottom: '48px'
    }}>
        Открийте бързи отговори в нашата систематизирана база.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CATEGORIES.map(cat => <Link key={cat.name} href={cat.name === "Образци" ? "/образци" : `/search?q=${encodeURIComponent(cat.name)}`} className="agri-category-tile bg-[#FFFFFF] rounded-[18px] flex flex-col items-center text-left" style={{
        padding: '32px',
        textAlign: 'center',
        background: '#FFFFFF',
        textDecoration: 'none'
      }}>
            <div style={{
          marginBottom: '12px',
          color: '#6E6E73',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
              {CATEGORY_ICONS[cat.name]}
            </div>
            <h4 style={{
          fontSize: '17px',
          fontWeight: 700,
          color: '#1D1D1F',
          marginBottom: '6px',
          display: 'block'
        }}>
              {cat.name}
            </h4>
            <p style={{
          fontSize: '14px',
          color: '#6E6E73',
          lineHeight: 1.5
        }}>{cat.subtitle}</p>
          </Link>)}
      </div>
    </div>
  </section>;
const Deadlines = () => <section className="bg-[#FFFFFF]" style={{
  padding: '100px 48px'
}}>
    <div className="max-w-[1100px] mx-auto">
      <div style={{
      marginBottom: '48px'
    }}>
        <span style={{
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 600,
        color: '#0071E3',
        marginBottom: '16px',
        display: 'block'
      }}>
          ОПЕРАТИВЕН ФОКУС
        </span>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 style={{
          fontSize: 'clamp(32px, 4vw, 48px)',
          fontWeight: 700,
          color: '#1D1D1F',
          lineHeight: 1.05,
          letterSpacing: '-0.025em'
        }}>
            Последни промени и срокове.
          </h2>
          <Link href="/srokove" style={{
          fontSize: '17px',
          color: '#0071E3',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          textDecoration: 'none',
          whiteSpace: 'nowrap'
        }} className="hover:underline">
            <span>Виж всички</span>
            <IconChevronRight size={16} color="#0071E3" />
          </Link>
        </div>
      </div>

      <div className="flex flex-col">
        {DEADLINES.map(item => <div key={item.title} className="agri-deadline-row flex flex-col md:flex-row md:items-center group cursor-pointer rounded-xl" style={{
        padding: '24px 16px',
        borderBottom: '1px solid #D2D2D7',
        margin: '0 -16px'
      }}>
            <div style={{
          marginBottom: '12px',
          width: '140px',
          flexShrink: 0
        }} className="md:mb-0">
              <span style={{
            backgroundColor: '#F5F5F7',
            color: '#6E6E73',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '4px 8px',
            borderRadius: '4px',
            display: 'inline-block'
          }}>
                {item.type}
              </span>
            </div>
            <div style={{
          flex: 1
        }}>
              <h4 style={{
            fontSize: '17px',
            fontWeight: 700,
            color: '#1D1D1F',
            marginBottom: '4px'
          }}>
                {item.title}
              </h4>
              <p style={{
            fontSize: '15px',
            color: '#6E6E73',
            lineHeight: 1.5
          }}>{item.subtitle}</p>
            </div>
            <div className="hidden md:flex transition-colors" style={{
          marginLeft: '16px',
          color: '#D2D2D7'
        }}>
              <IconArrowRight size={20} color="#D2D2D7" />
            </div>
          </div>)}
      </div>
    </div>
  </section>;
const ComparisonTable = () => <section className="bg-[#FFFFFF]" style={{
  paddingTop: '0',
  paddingBottom: '100px',
  paddingLeft: '48px',
  paddingRight: '48px'
}}>
    <div className="max-w-[900px] mx-auto">
      <div className="text-center" style={{
      marginBottom: '48px'
    }}>
        <span style={{
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 600,
        color: '#0071E3',
        marginBottom: '16px',
        display: 'block'
      }}>
          СРАВНЕНИЕ
        </span>
        <h2 style={{
        fontSize: 'clamp(28px, 3.5vw, 48px)',
        fontWeight: 700,
        color: '#1D1D1F',
        lineHeight: 1.05,
        letterSpacing: '-0.025em'
      }}>
          AgriNexus срещу разпокъсано управление.
        </h2>
      </div>

      <div style={{
      borderRadius: '18px',
      border: '1px solid #D2D2D7',
      overflow: 'hidden'
    }}>
        {/* Header */}
        <div className="grid grid-cols-3">
          <div style={{
          backgroundColor: '#F5F5F7',
          padding: '20px 32px',
          borderBottom: '1px solid #D2D2D7'
        }} />
          <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px 32px',
          borderBottom: '2px solid #0071E3',
          borderLeft: '1px solid #D2D2D7',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px'
        }}>
            <div className="flex items-center gap-2">
              <span style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#1D1D1F'
            }}>AgriNexus 360°</span>
              <span style={{
              backgroundColor: '#0071E3',
              color: '#FFFFFF',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '980px',
              letterSpacing: '0.05em'
            }}>
                AI & ERP
              </span>
            </div>
          </div>
          <div style={{
          backgroundColor: '#F5F5F7',
          padding: '20px 32px',
          borderBottom: '1px solid #D2D2D7',
          borderLeft: '1px solid #D2D2D7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
            <span style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#6E6E73'
          }}>Ръчно / Традиционно</span>
          </div>
        </div>

        {/* Rows */}
        {COMPARISON_ROWS.map((row, idx) => <div key={row.feature} className="agri-comparison-row grid grid-cols-3" style={{
        borderBottom: idx < COMPARISON_ROWS.length - 1 ? '1px solid #F0F0F0' : 'none'
      }}>
            <div style={{
          padding: '22px 32px',
          display: 'flex',
          alignItems: 'center'
        }}>
              <span style={{
            fontSize: '15px',
            color: '#1D1D1F',
            textAlign: 'left'
          }}>{row.feature}</span>
            </div>
            <div style={{
          padding: '22px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderLeft: '1px solid #F0F0F0'
        }}>
              {row.agri === 'check' ? <IconCheckFilled size={20} color="#0071E3" /> : <span style={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#1D1D1F'
          }}>{row.agriText}</span>}
            </div>
            <div style={{
          padding: '22px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderLeft: '1px solid #F0F0F0'
        }}>
              {row.manual === 'x' ? <IconXCircle size={20} color="#D2D2D7" /> : <span style={{
            fontSize: '15px',
            color: '#6E6E73'
          }}>{row.manualText}</span>}
            </div>
          </div>)}
      </div>
    </div>
  </section>;
const Trust = () => <section className="bg-[#000000]" style={{
  padding: '100px 48px',
  textAlign: 'center'
}}>
    <div className="max-w-[1100px] mx-auto">
      <span style={{
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      fontWeight: 600,
      color: '#6E6E73',
      marginBottom: '16px',
      display: 'block'
    }}>
        ИЗТОЧНИЦИ И ДОСТОВЕРНОСТ
      </span>
      <h2 style={{
      fontSize: 'clamp(32px, 4.5vw, 56px)',
      fontWeight: 700,
      color: '#FFFFFF',
      lineHeight: 1.05,
      letterSpacing: '-0.025em',
      marginBottom: '20px'
    }}>
        Всеки отговор — проверим.
      </h2>
      <p style={{
      fontSize: '17px',
      lineHeight: 1.6,
      color: '#EBEBF0',
      maxWidth: '560px',
      margin: '0 auto 48px'
    }}>
        Всички данни стъпват върху официалните наредби на ДФЗ и Министерството на земеделието.
      </p>

      <div style={{
      display: 'inline-block',
      marginBottom: '48px'
    }}>
        <span style={{
        backgroundColor: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        color: '#FFFFFF',
        fontSize: '12px',
        padding: '6px 16px',
        borderRadius: '980px',
        display: 'inline-block'
      }}>
          SSL Protected
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3" style={{
      borderTop: '1px solid rgba(255,255,255,0.1)',
      paddingTop: '48px',
      gap: '0'
    }}>
        {[{
        icon: <IconCheckShield size={24} color="#86868B" />,
        title: 'Официални данни',
        body: 'Директна връзка с API на ДФЗ, МЗ и БАБХ. Актуализации на всеки 30 минути за максимална прецизност.'
      }, {
        icon: <IconLink size={24} color="#86868B" />,
        title: 'Проверима логика',
        body: 'Нашият AI не просто отговаря, той посочва източника. Всеки отговор съдържа линк към официалния нормативен акт.'
      }, {
        icon: <IconLock size={24} color="#86868B" />,
        title: 'Защита на данните',
        body: 'Криптиране на банково ниво и пълно съответствие с GDPR. Без споделяне с трети страни.'
      }].map((item, idx) => <div key={item.title} className="flex flex-col items-center" style={{
        padding: '0 32px',
        borderLeft: idx > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none'
      }}>
            <div style={{
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
              {item.icon}
            </div>
            <h4 style={{
          fontSize: '19px',
          fontWeight: 700,
          color: '#FFFFFF',
          marginBottom: '12px'
        }}>
              {item.title}
            </h4>
            <p style={{
          fontSize: '15px',
          color: '#EBEBF0',
          lineHeight: 1.6
        }}>{item.body}</p>
          </div>)}
      </div>
    </div>
  </section>;
const FAQ = () => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);
  return <section className="bg-[#F5F5F7]" style={{
    padding: '100px 48px'
  }}>
      <div className="max-w-[800px] mx-auto">
        <span style={{
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 600,
        color: '#0071E3',
        marginBottom: '16px',
        display: 'block',
        textAlign: 'center'
      }}>
          ВЪПРОСИ И ОТГОВОРИ
        </span>
        <h2 style={{
        fontSize: 'clamp(32px, 4vw, 48px)',
        fontWeight: 700,
        color: '#1D1D1F',
        textAlign: 'center',
        lineHeight: 1.05,
        letterSpacing: '-0.025em',
        marginBottom: '48px'
      }}>
          Често задавани въпроси.
        </h2>

        <div className="bg-[#FFFFFF] rounded-[18px]" style={{
        padding: '8px 32px'
      }}>
          {FAQS.map((faq, idx) => <div key={faq.question} className={cn('agri-faq-row', idx !== FAQS.length - 1 && 'border-b border-[#D2D2D7]')} style={{
          padding: '24px 8px'
        }}>
              <button onClick={() => setOpenIndex(openIndex === idx ? null : idx)} className="w-full flex items-center justify-between text-left" style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0
          }}>
                <span style={{
              fontSize: '17px',
              fontWeight: 700,
              color: '#1D1D1F',
              paddingRight: '32px',
              lineHeight: 1.4
            }}>
                  {faq.question}
                </span>
                <span style={{
              color: '#6E6E73',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center'
            }}>
                  {openIndex === idx ? <IconMinus size={20} /> : <IconPlus size={20} />}
                </span>
              </button>
              <div className={cn("transition-all duration-300 overflow-hidden", openIndex === idx ? "max-h-96 opacity-100" : "max-h-0 opacity-0")} aria-hidden={openIndex !== idx}>
                <p style={{
                  paddingTop: openIndex === idx ? '16px' : '0px',
                  fontSize: '17px',
                  color: '#6E6E73',
                  lineHeight: 1.6
                }}>
                  {faq.answer}
                </p>
              </div>
            </div>)}
        </div>
      </div>
    </section>;
};
const AIChatCTA = () => {
  const { openChat } = useLandingChat();
  const [activeTab, setActiveTab] = React.useState(0);
  const [draft, setDraft] = React.useState('');
  const tabQueries = ['Какви документи трябват за БИСС?', 'Срокове за заявления ДФЗ 2026', 'Ориентировъчни субсидии за декар'];

  const submitQuestion = () => {
    const q = draft.trim();
    if (!q) return;
    openChat(q);
  };

  return <section className="bg-[#FFFFFF]" style={{
    padding: '100px 48px'
  }}>
      <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="w-full lg:w-[45%]">
          <span style={{
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
          color: '#0071E3',
          marginBottom: '16px',
          display: 'block'
        }}>
            AI АСИСТЕНТ
          </span>
          <h2 style={{
          fontSize: 'clamp(32px, 4vw, 48px)',
          fontWeight: 700,
          color: '#1D1D1F',
          lineHeight: 1.05,
          letterSpacing: '-0.025em',
          marginBottom: '20px'
        }}>
            Задай въпрос към специалист.
          </h2>
          <p style={{
          fontSize: '17px',
          color: '#6E6E73',
          lineHeight: 1.6,
          marginBottom: '48px'
        }}>
            Нашият AI не е просто чат-бот. Това е екип от дигитални експерти, специализирани в различни аспекти на земеделието.
          </p>
          <div className="flex flex-wrap gap-3">
            {PROFILE_CHIPS.map(chip => <div key={chip.expert} className="bg-[#F5F5F7] rounded-full flex items-center gap-2" style={{
            fontSize: '14px',
            color: '#1D1D1F',
            padding: '10px 16px',
            fontWeight: 500
          }}>
                {PROFILE_ICONS[chip.label]}
                <span>
                  {chip.label} · {chip.expert}
                </span>
              </div>)}
          </div>
        </div>

        <div className="w-full lg:w-[55%]">
          <div className="bg-white rounded-[18px] flex flex-col" style={{
          border: '1px solid #D2D2D7',
          padding: '40px',
          height: '400px'
        }}>
            <div className="flex gap-8" style={{
            borderBottom: '1px solid #D2D2D7',
            marginBottom: '24px'
          }}>
              {CHAT_TABS.map((tab, idx) => <button key={tab} onClick={() => setActiveTab(idx)} style={{
              paddingBottom: '12px',
              fontSize: '15px',
              fontWeight: 500,
              color: activeTab === idx ? '#1D1D1F' : '#6E6E73',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === idx ? '2px solid #0071E3' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'color 150ms ease-out'
            }}>
                  {tab}
                </button>)}
            </div>

            <div className="flex-1 bg-[#F5F5F7] rounded-xl flex flex-col justify-center" style={{
            padding: '24px',
            marginBottom: '24px',
            minHeight: '120px'
          }}>
              <p style={{
              fontSize: '15px',
              color: '#6E6E73',
              textAlign: 'center',
              marginBottom: '12px'
            }}>
                {tabQueries[activeTab]}
              </p>
              <button
                type="button"
                onClick={() => openChat(tabQueries[activeTab])}
                className="agri-btn-primary text-center"
                style={{
              display: 'block',
              fontSize: '14px',
              padding: '10px 16px',
              width: '100%'
            }}>
                Питай AI →
              </button>
            </div>

            <div className="flex items-center gap-3">
              <input type="text" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submitQuestion();
            }
          }} placeholder="Напишете въпрос..." className="flex-1 bg-[#F5F5F7] rounded-xl text-[#1D1D1F]" style={{
              height: '48px',
              padding: '0 16px',
              fontSize: '15px',
              outline: 'none',
              border: 'none'
            }} />
              <button type="button" onClick={submitQuestion} className="agri-btn-primary" style={{
              height: '48px',
              fontSize: '15px',
              flexShrink: 0
            }}>
                Изпрати →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
const MobileAppCTA = () => {
  const triggerInstallPwa = () => {
    if (typeof window !== 'undefined') {
      if ((window as any).__deferredPwaPrompt) {
        (window as any).__deferredPwaPrompt.prompt();
      } else {
        window.dispatchEvent(new Event('agrinexus:install-pwa'));
      }
    }
  };
  const openInstallHelp = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('agrinexus:open-help'));
    }
  };
  return <section className="bg-[#000000]" style={{
  padding: '100px 48px'
}}>
    <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row items-center gap-16">
      <div className="w-full lg:w-1/2">
        <span style={{
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 600,
        color: '#6E6E73',
        marginBottom: '16px',
        display: 'block'
      }}>
          МОБИЛНО ПРИЛОЖЕНИЕ
        </span>
        <h2 style={{
        fontSize: 'clamp(36px, 4.5vw, 56px)',
        fontWeight: 700,
        color: '#FFFFFF',
        lineHeight: 1.05,
        letterSpacing: '-0.025em',
        marginBottom: '20px'
      }}>
          AgriNexus в джоба ти.
        </h2>
        <p style={{
        fontSize: '17px',
        lineHeight: 1.6,
        color: '#EBEBF0',
        marginBottom: '48px'
      }}>
          Инсталирай като PWA от браузъра (Chrome / Edge → „Инсталирай приложението“). Работи с бърз достъп и офлайн функционалност директно на вашия телефон или компютър.
        </p>

        <ul style={{
        listStyle: 'none',
        padding: 0,
        margin: '0 0 48px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
          {MOBILE_BULLETS.map(bullet => <li key={bullet.bold} className="flex items-start gap-3">
              <div className="rounded-full flex items-center justify-center shrink-0" style={{
            width: '20px',
            height: '20px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            marginTop: '2px'
          }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="2,5 4,7 8,3" />
                </svg>
              </div>
              <div>
                <span style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#FFFFFF'
            }}>{bullet.bold}</span>
                <span style={{
              fontSize: '15px',
              color: '#EBEBF0'
            }}> — {bullet.muted}</span>
              </div>
            </li>)}
        </ul>

        <div className="flex flex-wrap items-center gap-4">
          <button type="button" onClick={triggerInstallPwa} className="agri-btn-primary flex items-center gap-2 shadow-lg shadow-emerald-500/20" style={{
          backgroundColor: '#10B981',
          color: '#FFFFFF',
          fontSize: '15px',
          fontWeight: 700
        }}>
            <span>📲 Инсталирай приложението (PWA)</span>
          </button>
          <button type="button" onClick={openInstallHelp} className="agri-btn-ghost flex items-center gap-1.5" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: '#FFFFFF',
          fontSize: '14px',
          padding: '12px 20px',
          borderRadius: '980px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
            <span>❓ Как да инсталирам</span>
          </button>
          <a href="/document-review" className="agri-btn-ghost inline-flex items-center" style={{
          color: '#FFFFFF',
          borderColor: 'rgba(255,255,255,0.3)',
          fontSize: '15px',
          textDecoration: 'none',
          padding: '12px 24px',
          borderRadius: '980px',
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
            AI преглед на документ →
          </a>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center">
        <div style={{
        width: '260px',
        height: '480px',
        borderRadius: '40px',
        border: '2.5px solid #333333',
        backgroundColor: '#111111',
        boxShadow: '0 40px 80px rgba(255,255,255,0.04)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
          <div style={{
          width: '80px',
          height: '20px',
          backgroundColor: '#000000',
          borderRadius: '10px',
          marginBottom: '12px',
          flexShrink: 0
        }} />
          <div style={{
          flex: 1,
          width: '100%',
          backgroundColor: '#1C1C1E',
          borderRadius: '32px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
            <div style={{
            textAlign: 'center',
            marginBottom: '4px'
          }}>
              <span style={{
              fontSize: '12px',
              color: '#FFFFFF',
              fontWeight: 600
            }}>AgriNexus</span>
            </div>
            <div style={{
            backgroundColor: '#2C2C2E',
            borderRadius: '10px',
            height: '34px'
          }} />
            <div style={{
            backgroundColor: '#2C2C2E',
            borderRadius: '10px',
            height: '60px'
          }} />
            <div style={{
            backgroundColor: '#2C2C2E',
            borderRadius: '10px',
            height: '60px'
          }} />
            <div style={{
            backgroundColor: '#2C2C2E',
            borderRadius: '10px',
            height: '44px'
          }} />
            <div style={{
            flex: 1
          }} />
            <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            paddingBottom: '4px'
          }}>
              {[true, false, false, false].map((active, i) => <div key={i} style={{
              width: '6px',
              height: '6px',
              borderRadius: '3px',
              backgroundColor: active ? '#FFFFFF' : '#444444'
            }} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>;
};

const Footer = () => <footer className="bg-[#F5F5F7]" style={{
  borderTop: '1px solid #D2D2D7',
  padding: '32px 48px'
}}>
    <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div style={{
      fontSize: '13px',
      color: '#6E6E73'
    }}>© 2026 AgriNexus — собственост на AgriNexus Ltd (info@agrinexus.eu). Всички права запазени.</div>
      <div className="flex flex-wrap items-center justify-center gap-6">
        {[{ label: 'Цени', href: '/ceni' }, { label: 'Документи', href: '/documents' }, { label: 'Срокове', href: '/srokove' }, { label: 'Калкулатори', href: '/kalkulator' }, { label: 'AI преглед', href: '/document-review' }, { label: 'Общи условия', href: '/terms' }, { label: 'Поверителност', href: '/privacy' }].map(item => <Link key={item.label} href={item.href} style={{
        fontSize: '13px',
        color: '#6E6E73',
        textDecoration: 'none',
        transition: 'color 200ms ease-out'
      }} className="hover:text-[#1D1D1F]">
            {item.label}
          </Link>)}
      </div>
    </div>
  </footer>;

// --- Main Export ---
const AgriNexusLandingInner = () => <div className="min-h-screen bg-[#FFFFFF] text-[#1D1D1F]" style={{
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif"
}}>
    <style>{GLOBAL_STYLES}</style>
    <Navbar />
    <main>
      <Hero />
      <LiveTicker />
      <Features />
      <HowItWorks />
      <FarmDashboard />
      <LandingLiveStats />
      <Categories />
      <LandingSocialProof />
      <Deadlines />
      <ComparisonTable />
      <section className="bg-[#FFFFFF]" style={{ padding: '100px 48px' }}>
        <div className="max-w-[1100px] mx-auto">
          <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: '#0071E3', marginBottom: '16px', display: 'block', textAlign: 'center' }}>
            ЦЕНИ И ПЛАНОВЕ
          </span>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, color: '#1D1D1F', textAlign: 'center', lineHeight: 1.05, letterSpacing: '-0.025em', marginBottom: '48px' }}>
            Избери своя план
          </h2>
          <PricingPlans />
        </div>
      </section>
      <Trust />
      <FAQ />
      <AIChatCTA />
      <MobileAppCTA />
    </main>
    <Footer />
  </div>;

export const AgriNexusLanding = () => (
  <LandingChatProvider>
    <AgriNexusLandingInner />
  </LandingChatProvider>
);