import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, BarChart3, ArrowRight, Mail, Building2, CheckCircle2, Cpu, Database, Globe2 } from 'lucide-react';
import { GlobalNav } from './GlobalNav';
import { SiteFooter } from './SiteFooter';
import { SponsorTierCard } from './SponsorTierCard';
const tiers = [{
  tier: 'Regional' as const,
  price: '$5k',
  period: 'yr',
  description: 'Ideal for local agricultural cooperatives and regional technology distributors looking to boost visibility.',
  features: ['Logo placement on regional dashboards', 'Access to regional crop metrics', 'Quarterly impact reports', 'Community forum recognition', '2 Staff licenses for data access'],
  isFeatured: false
}, {
  tier: 'Research' as const,
  price: '$25k',
  period: 'yr',
  description: 'Designed for academic institutions and R&D focused corporations driving the next wave of soil science.',
  features: ['Advanced data collaboration rights', 'Premium branding across research papers', 'API access (Standard Rate)', 'Joint webinar opportunities', '10 Staff licenses for full toolset', 'Priority feature requests'],
  isFeatured: true
}, {
  tier: 'Global' as const,
  price: 'Custom',
  description: 'The ultimate partnership level for global enterprises shaping the future of decentralized agriculture.',
  features: ['Full strategic partnership status', 'Unlimited API access (Unrestricted)', 'Direct integration with enterprise ERPs', 'Advisory board seat invitation', 'Custom white-label dashboards', 'Dedicated account success manager'],
  isFeatured: false
}];
const strategyPoints = [{
  icon: <Cpu className="w-5 h-5 text-[#1a6b45]" />,
  title: 'Decentralized Infrastructure',
  description: 'We fund our open-source intelligence layer through strategic partnerships rather than restrictive paywalls, ensuring data remains accessible to small-scale farmers.'
}, {
  icon: <Database className="w-5 h-5 text-[#1a6b45]" />,
  title: 'Data Integrity',
  description: "Partner funding allows us to maintain neutral, bias-free AI models that aren't beholden to specific fertilizer or chemical manufacturers."
}, {
  icon: <Globe2 className="w-5 h-5 text-[#1a6b45]" />,
  title: 'Global Scalability',
  description: 'Every dollar from sponsors helps deploy satellite monitoring and IoT sensor networks in underserved agricultural regions worldwide.'
}];
const inputBase = 'w-full px-4 py-3 rounded-xl border border-[#c8c0e0] bg-white/80 text-[#1a2030] placeholder:text-[#1a2030]/35 outline-none focus:border-[#1a6b45] focus:ring-4 focus:ring-[#1a6b45]/10';
const inputTransition = {
  transition: 'border-color 150ms cubic-bezier(0.25, 0, 0, 1), box-shadow 150ms cubic-bezier(0.25, 0, 0, 1)'
};
export const SponsorshipPortal: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    interest: 'regional',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };
  return <div className="min-h-screen text-[#1a2030] font-body selection:bg-[#1a6b45]/20 selection:text-[#1a2030]">
      <GlobalNav />

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-36 overflow-hidden pastel-hero-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }} className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight mb-7 leading-[1.08] text-[#1a2030]">
              Power the open intelligence layer for{' '}
              <span className="italic text-[#1a6b45] accent-glow">modern farming.</span>
            </h1>
            <p className="text-xl md:text-2xl text-[#1a2030]/60 mb-10 leading-relaxed font-light mx-auto" style={{
            maxWidth: '62ch'
          }}>
              Join a network of visionary partners funding the infrastructure for a resilient, data-driven agricultural future.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="#tiers" className="w-full sm:w-auto px-8 py-[14px] bg-[#1a6b45] text-white font-bold rounded-full flex items-center justify-center group" style={{
              transition: 'background-color 150ms cubic-bezier(0.25, 0, 0, 1)'
            }} onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#155937';
            }} onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#1a6b45';
            }}>
                <span>View Tiers</span>
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-150" />
              </a>
              <a href="#contact" className="w-full sm:w-auto px-8 py-[14px] border border-[#b8c8d8] text-[#1a2030] font-bold rounded-full flex items-center justify-center" style={{
              transition: 'background-color 150ms cubic-bezier(0.25, 0, 0, 1), border-color 150ms cubic-bezier(0.25, 0, 0, 1)'
            }} onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(255,255,255,0.55)';
              (e.currentTarget as HTMLAnchorElement).style.borderColor = '#8aa0b4';
            }} onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '';
              (e.currentTarget as HTMLAnchorElement).style.borderColor = '#b8c8d8';
            }}>
                Contact Sales
              </a>
            </div>
          </motion.div>
        </div>

        {/* Soft radial orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full -mr-64 -mt-64" style={{
          background: 'radial-gradient(circle, rgba(180,210,245,0.45) 0%, transparent 70%)'
        }} />
          <div className="absolute bottom-0 left-0 w-[550px] h-[550px] rounded-full -ml-40 -mb-40" style={{
          background: 'radial-gradient(circle, rgba(200,185,240,0.4) 0%, transparent 70%)'
        }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full" style={{
          background: 'radial-gradient(circle, rgba(195,230,205,0.3) 0%, transparent 70%)'
        }} />
        </div>
      </section>

      {/* ── Strategy ── */}
      <section className="py-24 md:py-32 border-y border-white/60 pastel-strategy-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#1a6b45] mb-4 block">
                Funding by Partners
              </span>
              <h2 className="text-4xl md:text-[2.75rem] font-serif font-bold mb-6 leading-tight text-[#1a2030]">
                An ecosystem designed for{' '}
                <span className="border-b-[3px] border-[#1a6b45]/22 pb-0.5">independence.</span>
              </h2>
              <p className="text-[1.0625rem] text-[#1a2030]/60 mb-12 leading-[1.75]" style={{
              maxWidth: '68ch'
            }}>
                Traditional ag-tech models often lock critical data behind expensive subscriptions, creating an
                information gap. AgriNexus operates on a "Partner-First" model where institutional and corporate
                sponsors fund the platform's core infrastructure, keeping essential intelligence free for those
                working the soil.
              </p>

              <div className="space-y-7">
                {strategyPoints.map((point, idx) => <motion.div key={point.title} initial={{
                opacity: 0,
                x: -16
              }} whileInView={{
                opacity: 1,
                x: 0
              }} transition={{
                delay: idx * 0.1,
                duration: 0.45
              }} viewport={{
                once: true
              }} className="flex items-start gap-4">
                    <div className="flex-shrink-0 p-2.5 bg-white/70 border border-[#d4d0ea]/40 rounded-xl backdrop-blur-sm">
                      {point.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-bold mb-1.5 text-[#1a2030]">{point.title}</h3>
                      <p className="text-sm text-[#1a2030]/55 leading-relaxed" style={{
                    maxWidth: '56ch'
                  }}>
                        {point.description}
                      </p>
                    </div>
                  </motion.div>)}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-[#1a2030] rounded-3xl overflow-hidden relative shadow-2xl group">
                <img src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=2000&auto=format&fit=crop" alt="Modern sustainable farm monitored by technology" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a2030] via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-8 left-8 right-8 p-5 glass-panel rounded-2xl">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-2.5 h-2.5 bg-[#1a6b45] rounded-full animate-pulse flex-shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                      Active Partner Network
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-white/88">
                    "AgriNexus has democratized field-level intelligence in ways we never thought possible. Their
                    sponsorship model is the blueprint for ethical tech."
                  </p>
                  <div className="mt-4 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#c8d8e8] overflow-hidden flex-shrink-0">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Dr. Elena Rostova avatar" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">Dr. Elena Rostova</p>
                      <p className="text-[10px] text-white/55 uppercase tracking-wide leading-tight mt-0.5">
                        Agro-Ecology Lead, Pan-European Research
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative orb */}
              <div aria-hidden="true" className="absolute -top-6 -right-6 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{
              background: 'radial-gradient(circle, rgba(26,107,69,0.18) 0%, transparent 70%)'
            }} />

              {/* Stat chip */}
              <div className="absolute -bottom-10 -left-10 p-4 bg-white/82 backdrop-blur-sm border border-[#d0cce8]/60 rounded-2xl shadow-xl flex items-center gap-3">
                <BarChart3 className="text-[#1a6b45] w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-[#1a2030]/50 uppercase font-bold tracking-wider leading-none mb-1">
                    Impact Generated
                  </p>
                  <p className="text-lg font-bold text-[#1a2030] leading-none">+$12.4M</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tiers ── */}
      <section id="tiers" className="py-24 md:py-32 pastel-tiers-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <h2 className="text-4xl md:text-[2.75rem] font-serif font-bold mb-4 text-[#1a2030] leading-tight">
            Choose your impact.
          </h2>
          <p className="text-[1.0625rem] text-[#1a2030]/58 mx-auto leading-relaxed" style={{
          maxWidth: '64ch'
        }}>
            Select a tier that aligns with your organization's goals. Each level offers unique branding and data access benefits.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 items-stretch">
            {tiers.map((tier, index) => <motion.div key={tier.tier} initial={{
            opacity: 0,
            y: 28
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: index * 0.1,
            duration: 0.45
          }} viewport={{
            once: true
          }} className="h-full">
                <SponsorTierCard {...tier} onCtaClick={() => {
              document.getElementById('contact')?.scrollIntoView({
                behavior: 'smooth'
              });
              setFormData(prev => ({
                ...prev,
                interest: tier.tier.toLowerCase()
              }));
            }} />
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="py-24 overflow-hidden" style={{
      background: 'linear-gradient(160deg, #242e4a 0%, #1c2b3c 45%, #192634 70%, #1f2d38 100%)'
    }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[28px] overflow-hidden shadow-2xl" style={{
          background: 'rgba(28, 36, 58, 0.97)',
          border: '1px solid rgba(200,215,240,0.11)'
        }}>
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left — info panel */}
              <div className="p-8 md:p-14 lg:p-16 relative overflow-hidden">
                <h2 className="text-[2rem] md:text-4xl font-serif font-bold mb-5 leading-tight text-white">
                  Start the collaboration.
                </h2>
                <p className="text-[#c8d8e8]/65 mb-12 text-[1.0625rem] leading-relaxed" style={{
                maxWidth: '44ch'
              }}>
                  Fill out the form to receive our full partnership brochure and schedule a consultation with our
                  strategic accounts team.
                </p>

                <div className="space-y-7">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-[#1a6b45]" style={{
                    background: 'rgba(255,255,255,0.07)'
                  }}>
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#c8d8e8]/38 tracking-[0.18em] mb-0.5">
                        Email Us
                      </p>
                      <p className="text-base font-medium text-white">partners@agrinexus.io</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-[#1a6b45]" style={{
                    background: 'rgba(255,255,255,0.07)'
                  }}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#c8d8e8]/38 tracking-[0.18em] mb-0.5">
                        HQ Location
                      </p>
                      <p className="text-base font-medium text-white">Zurich Innovation Hub, CH</p>
                    </div>
                  </div>
                </div>

                {/* Background grid pattern */}
                <div aria-hidden="true" className="absolute top-0 left-0 w-full h-full opacity-[0.025] pointer-events-none">
                  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>
              </div>

              {/* Right — form panel */}
              <div className="p-8 md:p-14 lg:p-16 text-[#1a2030]" style={{
              background: 'linear-gradient(150deg, #f4f1fc 0%, #eaf3f8 50%, #eef6f0 100%)'
            }}>
                {formSubmitted ? <motion.div initial={{
                opacity: 0,
                scale: 0.92
              }} animate={{
                opacity: 1,
                scale: 1
              }} transition={{
                duration: 0.35
              }} className="h-full flex flex-col items-center justify-center text-center gap-6">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-[#1a6b45]" style={{
                  background: 'rgba(26,107,69,0.1)'
                }}>
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-serif font-bold mb-3 text-[#1a2030]">Request Received</h3>
                      <p className="text-[#1a2030]/58 text-[0.9375rem] leading-relaxed" style={{
                    maxWidth: '44ch'
                  }}>
                        Thank you for your interest in AgriNexus. One of our strategy directors will contact you
                        within 24 business hours.
                      </p>
                    </div>
                    <button onClick={() => setFormSubmitted(false)} className="text-sm font-semibold text-[#1a2030]/38 hover:text-[#1a6b45]" style={{
                  transition: 'color 150ms cubic-bezier(0.25, 0, 0, 1)'
                }}>
                      Send another request
                    </button>
                  </motion.div> : <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1a2030]/42 block">
                          Full Name
                        </label>
                        <input required type="text" placeholder="Jane Doe" className={inputBase} style={inputTransition} value={formData.name} onChange={e => setFormData({
                      ...formData,
                      name: e.target.value
                    })} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1a2030]/42 block">
                          Work Email
                        </label>
                        <input required type="email" placeholder="jane@company.com" className={inputBase} style={inputTransition} value={formData.email} onChange={e => setFormData({
                      ...formData,
                      email: e.target.value
                    })} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1a2030]/42 block">
                        Organization
                      </label>
                      <input required type="text" placeholder="Organization Ltd." className={inputBase} style={inputTransition} value={formData.organization} onChange={e => setFormData({
                    ...formData,
                    organization: e.target.value
                  })} />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1a2030]/42 block">
                        Interested Tier
                      </label>
                      <select className={inputBase + ' appearance-none cursor-pointer'} style={inputTransition} value={formData.interest} onChange={e => setFormData({
                    ...formData,
                    interest: e.target.value
                  })}>
                        <option value="regional">Regional Sponsor</option>
                        <option value="research">Research Partner</option>
                        <option value="global">Global Patron</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1a2030]/42 block">
                        Project Vision
                      </label>
                      <textarea rows={4} placeholder="Tell us how you'd like to collaborate..." className={inputBase + ' resize-none'} style={inputTransition} value={formData.message} onChange={e => setFormData({
                    ...formData,
                    message: e.target.value
                  })} />
                    </div>

                    <button type="submit" className="w-full py-[14px] bg-[#1a6b45] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md text-sm" style={{
                  transition: 'background-color 150ms cubic-bezier(0.25, 0, 0, 1)'
                }} onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#155937';
                }} onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1a6b45';
                }}>
                      <span>Send Partnership Inquiry</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <p className="text-[10px] text-center text-[#1a2030]/36 leading-relaxed pt-0.5">
                      By submitting this form, you agree to our privacy policy and consent to being contacted regarding
                      partnership opportunities. We respect your data privacy and will never share your information with
                      third parties.
                    </p>
                  </form>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quote ── */}
      <section className="py-24 pastel-quote-bg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <blockquote className="text-[1.875rem] md:text-[2.25rem] font-serif italic text-[#1a2030]/75 leading-[1.35] mb-12" style={{
          maxWidth: '62ch',
          margin: '0 auto 3rem'
        }}>
            "The future of food security depends not just on the quality of our seeds, but on the transparency of our
            intelligence."
          </blockquote>
          <div className="flex flex-col items-center gap-1.5 mt-12">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{
            background: 'rgba(26,107,69,0.1)'
          }}>
              <Leaf className="text-[#1a6b45] w-6 h-6" />
            </div>
            <p className="font-bold text-[#1a2030] text-sm">AgriNexus Strategic Board</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#1a2030]/38">
              Commitment to Open Data, 2024
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>;
};