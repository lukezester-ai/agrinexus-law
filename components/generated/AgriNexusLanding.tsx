"use client";

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
const FEATURES: Feature[] = [{
  label: 'СРОКОВЕ',
  title: 'Провери срокове',
  description: 'Интелигентно проследяване на крайни дати за кандидатстване по ДФЗ и активните кампании.',
  theme: 'light'
}, {
  label: 'ДОКУМЕНТИ',
  title: 'Намери документ',
  description: 'Пълен архив от наредби, образци и заявления в PDF формат на едно място.',
  theme: 'black'
}, {
  label: 'AI ПРЕГЛЕД',
  title: 'AI преглед',
  description: 'Автоматичен анализ на вашите договори и писма за съответствие с актуалните изисквания.',
  theme: 'dark'
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
  answer: 'AgriNexus предлага безплатен базов достъп до търсачката и документите. Пълният AI анализ и персонализираните консултации са част от нашите абонаментни планове за фермери.'
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
const TESTIMONIALS: TestimonialCard[] = [{
  quote: 'Намерих всички документи за биосертификат за 5 минути. Преди прекарвах часове в сайтове на ДФЗ.',
  initials: 'ГД',
  name: 'Георги Димитров',
  role: 'Зърнопроизводство, Плевен'
}, {
  quote: 'Асистентът ми обясни точно кои са сроковете за директни плащания — с линк към наредбата. Страхотно.',
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
const MOBILE_BULLETS: MobileFeatureBullet[] = [{
  bold: 'Офлайн достъп',
  muted: 'Работи и без интернет на полето'
}, {
  bold: 'Известия',
  muted: 'Автоматично при нови срокове'
}, {
  bold: 'Бърз достъп',
  muted: 'Документи, срокове и калкулатори'
}];
const Features = () => {
  const featureIcons: React.ReactElement[] = [<IconCalendar key="calendar" size={28} color="#0071E3" />, <IconDocText key="doc" size={28} color="#FFFFFF" />, <IconSparkles key="sparkles" size={28} color="rgba(255,255,255,0.7)" />];
  return <section className="bg-[#F5F5F7]" style={{
    padding: '100px 48px'
  }}>
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        {FEATURES.map((feat, idx) => {
        const bg = feat.theme === 'light' ? '#FFFFFF' : feat.theme === 'black' ? '#000000' : '#1D1D1F';
        const textColor = feat.theme === 'light' ? '#1D1D1F' : '#FFFFFF';
        const labelColor = feat.theme === 'light' ? '#0071E3' : 'rgba(255,255,255,0.5)';
        const descColor = feat.theme === 'light' ? '#6E6E73' : 'rgba(255,255,255,0.5)';
        const linkColor = feat.theme === 'light' ? '#0071E3' : '#0071E3';
        return <div key={feat.label} className="rounded-[18px] flex flex-col items-center text-center" style={{
          backgroundColor: bg,
          padding: '80px 40px'
        }}>
              <div style={{
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
                {featureIcons[idx]}
              </div>
              <span style={{
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 600,
            color: labelColor,
            marginBottom: '16px',
            display: 'block'
          }}>
                {feat.label}
              </span>
              <h3 style={{
            fontSize: '32px',
            fontWeight: 700,
            color: textColor,
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            marginBottom: '16px'
          }}>
                {feat.title}
              </h3>
              <p style={{
            fontSize: '17px',
            lineHeight: 1.6,
            color: descColor,
            marginBottom: '32px'
          }}>
                {feat.description}
              </p>
              <a href={feat.href} style={{
            fontSize: '17px',
            fontWeight: 500,
            color: linkColor,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            textDecoration: 'none'
          }} className="hover:underline">
                <span>Виж всички</span>
                <IconChevronRight size={16} color={linkColor} />
              </a>
            </div>;
      })}
      </div>
    </section>;
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
const Stats = () => <section className="bg-[#FFFFFF]" style={{
  paddingTop: '0',
  paddingBottom: '100px',
  paddingLeft: '48px',
  paddingRight: '48px'
}}>
    <div className="max-w-[1100px] mx-auto">
      <div className="flex flex-col md:flex-row items-stretch" style={{
      borderTop: '1px solid #D2D2D7'
    }}>
        {[{
        number: '59',
        label: 'Чат записа'
      }, {
        number: '51 / 51',
        label: 'RAG индекс'
      }, {
        number: '8,342',
        label: 'Посетители'
      }].map((stat, idx) => <div key={stat.label} className="flex flex-col items-center justify-center text-center flex-1 py-12" style={{
        borderLeft: idx > 0 ? '1px solid #D2D2D7' : 'none'
      }}>
            <span style={{
          fontSize: '56px',
          fontWeight: 700,
          color: '#1D1D1F',
          lineHeight: 1,
          marginBottom: '8px',
          display: 'block'
        }}>
              {stat.number}
            </span>
            <span style={{
          fontSize: '15px',
          color: '#6E6E73',
          lineHeight: 1.6
        }}>{stat.label}</span>
          </div>)}
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
        {CATEGORIES.map(cat => <a key={cat.name} href={cat.href} className="agri-category-tile bg-[#FFFFFF] rounded-[18px] flex flex-col items-center text-left cursor-pointer" style={{
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
          </a>)}
      </div>
    </div>
  </section>;
const Testimonials = () => <section className="bg-[#F5F5F7]" style={{
  paddingTop: '0',
  paddingBottom: '100px',
  paddingLeft: '48px',
  paddingRight: '48px'
}}>
    <div className="max-w-[1100px] mx-auto">
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
          ФЕРМЕРИ СПОДЕЛЯТ
        </span>
        <h2 style={{
        fontSize: 'clamp(32px, 4.5vw, 56px)',
        fontWeight: 700,
        color: '#1D1D1F',
        lineHeight: 1.05,
        letterSpacing: '-0.025em'
      }}>
          Реални резултати.
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{
      alignItems: 'stretch'
    }}>
        {TESTIMONIALS.map(card => <div key={card.name} className="bg-[#FFFFFF] rounded-[18px] flex flex-col" style={{
        padding: '36px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)'
      }}>
            <div style={{
          fontSize: '48px',
          fontWeight: 700,
          color: '#D2D2D7',
          lineHeight: 1,
          marginBottom: '16px'
        }} aria-hidden="true">
              &ldquo;
            </div>
            <p style={{
          fontSize: '17px',
          color: '#1D1D1F',
          lineHeight: 1.6,
          marginBottom: '32px',
          flex: 1
        }}>
              {card.quote}
            </p>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#1D1D1F] flex items-center justify-center shrink-0" style={{
            width: '40px',
            height: '40px'
          }}>
                <span style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#FFFFFF'
            }}>{card.initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#1D1D1F',
              lineHeight: 1.3
            }}>{card.name}</div>
                <div style={{
              fontSize: '13px',
              color: '#6E6E73',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
                  {card.role}
                </div>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                {[1, 2, 3, 4, 5].map(star => <svg key={star} width="13" height="13" viewBox="0 0 13 13" fill="#0071E3" aria-hidden="true">
                    <polygon points="6.5,1 8.2,4.9 12.5,5.3 9.4,8 10.4,12.3 6.5,10 2.6,12.3 3.6,8 0.5,5.3 4.8,4.9" />
                  </svg>)}
              </div>
            </div>
          </div>)}
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
          <a href="/srokove" style={{
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
          </a>
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
          AgriNexus срещу самостоятелно търсене.
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
            }}>AgriNexus Law</span>
              <span style={{
              backgroundColor: '#0071E3',
              color: '#FFFFFF',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '980px',
              letterSpacing: '0.05em'
            }}>
                AI
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
          }}>Самостоятелно</span>
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
              <AnimatePresence>
                {openIndex === idx && <motion.div initial={{
              height: 0,
              opacity: 0
            }} animate={{
              height: 'auto',
              opacity: 1
            }} exit={{
              height: 0,
              opacity: 0
            }} transition={{
              duration: 0.3,
              ease: 'easeOut'
            }} style={{
              overflow: 'hidden'
            }}>
                    <p style={{
                paddingTop: '16px',
                fontSize: '17px',
                color: '#6E6E73',
                lineHeight: 1.6
              }}>
                      {faq.answer}
                    </p>
                  </motion.div>}
              </AnimatePresence>
            </div>)}
        </div>
      </div>
    </section>;
};
const AIChatCTA = () => {
  const [activeTab, setActiveTab] = React.useState(0);
  const [question, setQuestion] = React.useState('');
  const [answer, setAnswer] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState('');
  const characterIds = ['elena', 'boris', 'viktoria'] as const;

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const incomingQuestion = new URLSearchParams(window.location.search).get('chatQ')?.trim();
    if (incomingQuestion) {
      setQuestion(incomingQuestion);
      window.setTimeout(() => document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }
  }, []);

  const sendQuestion = async () => {
    const trimmed = question.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setError('');
    setAnswer('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: characterIds[activeTab],
          messages: [{ role: 'user', content: trimmed }],
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(typeof payload.error === 'string' ? payload.error : 'AI request failed.');
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const payload = await response.json();
        setAnswer(typeof payload.response === 'string' ? payload.response : 'Empty response.');
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setAnswer(await response.text());
        return;
      }

      const decoder = new TextDecoder();
      let fullText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setAnswer(fullText);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request error.');
    } finally {
      setIsSending(false);
    }
  };

  return <section id="chat" className="bg-[#FFFFFF]" style={{
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

            <div className="flex-1 bg-[#F5F5F7] rounded-xl flex items-center justify-center" style={{
            padding: '24px',
            marginBottom: '24px'
          }}>
              {answer || error ? <div style={{
              width: '100%',
              maxHeight: '180px',
              overflow: 'auto',
              fontSize: '14px',
              color: error ? '#B42318' : '#1D1D1F',
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap'
            }}>
                {error || answer}
              </div> : <p style={{
              fontSize: '15px',
              color: '#6E6E73',
              fontStyle: 'italic',
              textAlign: 'center'
            }}>
                Задай казус: култура, регион, документ или срок.
              </p>}
            </div>

            <form className="flex items-center gap-3" onSubmit={event => {
              event.preventDefault();
              void sendQuestion();
            }}>
              <input type="text" value={question} onChange={e => setQuestion(e.currentTarget.value)} placeholder="Напишете съобщение..." className="flex-1 bg-[#F5F5F7] rounded-xl text-[#1D1D1F]" style={{
              height: '48px',
              padding: '0 16px',
              fontSize: '15px',
              outline: 'none',
              border: 'none'
            }} />
              <button type="submit" disabled={isSending || !question.trim()} className="agri-btn-primary" style={{
              height: '48px',
              fontSize: '15px',
              flexShrink: 0,
              opacity: isSending || !question.trim() ? 0.65 : 1,
              cursor: isSending || !question.trim() ? 'not-allowed' : 'pointer'
            }}>
                {isSending ? '\u041f\u0440\u0430\u0449\u0430\u043c...' : '\u0418\u0437\u043f\u0440\u0430\u0442\u0438 \u2192'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>;
};
const MobileAppCTA = () => <section className="bg-[#000000]" style={{
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
          Инсталирай като app. Работи офлайн.
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

        <div className="flex flex-wrap gap-4">
          <a href="/profile" className="agri-btn-primary" style={{
          backgroundColor: '#FFFFFF',
          color: '#000000',
          fontSize: '15px',
          textDecoration: 'none'
        }}>
            Инсталирай App
          </a>
          <a href="/document-review" className="agri-btn-ghost" style={{
          color: '#FFFFFF',
          borderColor: 'rgba(255,255,255,0.3)',
          fontSize: '15px',
          textDecoration: 'none'
        }}>
            Виж демо →
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
const Footer = () => <footer className="bg-[#F5F5F7]" style={{
  borderTop: '1px solid #D2D2D7',
  padding: '32px 48px'
}}>
    <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div style={{
      fontSize: '13px',
      color: '#6E6E73'
    }}>© 2025 AgriNexus.Law. Всички права запазени.</div>
      <div className="flex flex-wrap items-center justify-center gap-6">
        {FOOTER_LINKS.map(link => <a key={link.label} href={link.href} style={{
        fontSize: '13px',
        color: '#6E6E73',
        textDecoration: 'none',
        transition: 'color 200ms ease-out'
      }} className="hover:text-[#1D1D1F]">
            {link.label}
          </a>)}
      </div>
      <div style={{
      fontSize: '13px',
      color: '#6E6E73'
    }}>Посетители: 8 342</div>
    </div>
  </footer>;

// --- Main Export ---
export const AgriNexusLanding = () => <div className="min-h-screen bg-[#FFFFFF] text-[#1D1D1F]" style={{
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif"
}}>
    <style>{GLOBAL_STYLES}</style>
    <Navbar />
    <main>
      <Hero />
      <LiveTicker />
      <Features />
      <HowItWorks />
      <Stats />
      <Categories />
      <Testimonials />
      <Deadlines />
      <ComparisonTable />
      <Trust />
      <FAQ />
      <AIChatCTA />
      <MobileAppCTA />
    </main>
    <Footer />
  </div>;


