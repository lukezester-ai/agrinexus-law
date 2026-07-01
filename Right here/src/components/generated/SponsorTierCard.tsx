import React from 'react';
import { Check, ArrowRight, Zap, Shield, Globe } from 'lucide-react';
interface SponsorTierCardProps {
  tier: 'Regional' | 'Research' | 'Global';
  price?: string;
  period?: string;
  description: string;
  features: string[];
  isFeatured?: boolean;
  ctaText?: string;
  onCtaClick?: () => void;
}
export const SponsorTierCard: React.FC<SponsorTierCardProps> = ({
  tier,
  price,
  period = 'year',
  description,
  features,
  isFeatured = false,
  ctaText = 'Become a Partner',
  onCtaClick
}) => {
  const getIcon = () => {
    switch (tier) {
      case 'Regional':
        return <Zap className={`w-7 h-7 ${isFeatured ? 'text-[#5ce8a0]' : 'text-[#1a6b45]'}`} />;
      case 'Research':
        return <Shield className={`w-7 h-7 ${isFeatured ? 'text-[#5ce8a0]' : 'text-[#1a6b45]'}`} />;
      case 'Global':
        return <Globe className={`w-7 h-7 ${isFeatured ? 'text-[#5ce8a0]' : 'text-[#1a6b45]'}`} />;
      default:
        return <Zap className={`w-7 h-7 ${isFeatured ? 'text-[#5ce8a0]' : 'text-[#1a6b45]'}`} />;
    }
  };
  if (isFeatured) {
    return <div className="relative flex flex-col p-8 rounded-2xl h-full frosted-card-featured shadow-2xl scale-[1.03] z-10" style={{
      border: '1.5px solid rgba(26, 107, 69, 0.65)'
    }}>
        <div className="absolute -top-[14px] left-1/2 -translate-x-1/2 px-4 py-[5px] rounded-full text-[10px] font-bold uppercase tracking-[0.18em] text-white whitespace-nowrap" style={{
        background: '#1a6b45'
      }}>
          Most Strategic
        </div>

        <div className="mb-5">
          <div className="mb-4 p-2.5 rounded-xl inline-flex items-center justify-center" style={{
          background: 'rgba(92,232,160,0.1)'
        }}>
            {getIcon()}
          </div>
          <h3 className="text-2xl font-serif font-bold mb-2 text-white leading-snug">
            {tier} <span className="font-light opacity-70">Partner</span>
          </h3>
          <p className="text-sm leading-relaxed text-[#c8d8e8]/75" style={{
          maxWidth: '36ch'
        }}>
            {description}
          </p>
        </div>

        <div className="mb-7 pb-7" style={{
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
          {price ? <div className="flex items-baseline gap-1.5">
              <span className="text-[2.6rem] font-bold text-white leading-none tracking-tight">{price}</span>
              <span className="text-sm font-medium text-[#c8d8e8]/55 leading-none">/{period}</span>
            </div> : <div className="text-2xl font-bold text-white leading-none py-1">Custom Scope</div>}
        </div>

        <div className="flex-grow mb-8">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4 text-[#5ce8a0]">
            What's Included
          </h4>
          <ul className="space-y-3.5">
            {features.map(feature => <li key={feature} className="flex items-start gap-3">
                <Check className="w-[18px] h-[18px] flex-shrink-0 mt-0.5 text-[#5ce8a0]" strokeWidth={2.5} />
                <span className="text-sm text-[#c8d8e8]/85 leading-snug">{feature}</span>
              </li>)}
          </ul>
        </div>

        <button onClick={onCtaClick} className="w-full py-[14px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-[#0f1e14] shadow-lg" style={{
        background: 'linear-gradient(135deg, #4dd49a 0%, #2db87a 100%)',
        transition: 'opacity 150ms cubic-bezier(0.25, 0, 0, 1)'
      }} onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.opacity = '0.88';
      }} onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.opacity = '1';
      }}>
          <span>{ctaText}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>;
  }
  return <div className="relative flex flex-col p-8 rounded-2xl h-full frosted-card" style={{
    border: '1.5px solid rgba(200, 210, 230, 0.65)',
    transition: 'box-shadow 150ms cubic-bezier(0.25, 0, 0, 1), border-color 150ms cubic-bezier(0.25, 0, 0, 1)'
  }} onMouseEnter={e => {
    const el = e.currentTarget as HTMLDivElement;
    el.style.boxShadow = '0 8px 32px rgba(26,107,69,0.1)';
    el.style.borderColor = 'rgba(26,107,69,0.3)';
  }} onMouseLeave={e => {
    const el = e.currentTarget as HTMLDivElement;
    el.style.boxShadow = '';
    el.style.borderColor = 'rgba(200, 210, 230, 0.65)';
  }}>
      <div className="mb-5">
        <div className="mb-4 p-2.5 rounded-xl inline-flex items-center justify-center" style={{
        background: 'rgba(26,107,69,0.07)'
      }}>
          {getIcon()}
        </div>
        <h3 className="text-2xl font-serif font-bold mb-2 text-[#1a2030] leading-snug">
          {tier} <span className="font-light text-[#1a2030]/55">Partner</span>
        </h3>
        <p className="text-sm leading-relaxed text-[#1a2030]/60" style={{
        maxWidth: '36ch'
      }}>
          {description}
        </p>
      </div>

      <div className="mb-7 pb-7" style={{
      borderBottom: '1px solid rgba(26,32,48,0.08)'
    }}>
        {price ? <div className="flex items-baseline gap-1.5">
            <span className="text-[2.6rem] font-bold text-[#1a2030] leading-none tracking-tight">{price}</span>
            <span className="text-sm font-medium text-[#1a2030]/45 leading-none">/{period}</span>
          </div> : <div className="text-2xl font-bold text-[#1a2030] leading-none py-1">Custom Scope</div>}
      </div>

      <div className="flex-grow mb-8">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4 text-[#1a2030]/38">
          What's Included
        </h4>
        <ul className="space-y-3.5">
          {features.map(feature => <li key={feature} className="flex items-start gap-3">
              <Check className="w-[18px] h-[18px] flex-shrink-0 mt-0.5 text-[#1a6b45]" strokeWidth={2.5} />
              <span className="text-sm text-[#1a2030]/72 leading-snug">{feature}</span>
            </li>)}
        </ul>
      </div>

      <button onClick={onCtaClick} className="w-full py-[14px] bg-[#1a6b45] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2" style={{
      transition: 'background-color 150ms cubic-bezier(0.25, 0, 0, 1)'
    }} onMouseEnter={e => {
      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#155937';
    }} onMouseLeave={e => {
      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1a6b45';
    }}>
        <span>{ctaText}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>;
};