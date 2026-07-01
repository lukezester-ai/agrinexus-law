import React from 'react';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
const footerSections = [{
  title: 'Platform',
  links: [{
    label: 'Intelligence Feed',
    href: '#'
  }, {
    label: 'Market Forecasts',
    href: '#'
  }, {
    label: 'Satellite Insights',
    href: '#'
  }, {
    label: 'API Access',
    href: '#'
  }]
}, {
  title: 'Company',
  links: [{
    label: 'About Us',
    href: '#'
  }, {
    label: 'Methodology',
    href: '/academy'
  }, {
    label: 'Sponsorship',
    href: '/sponsors'
  }, {
    label: 'Contact',
    href: '#'
  }]
}, {
  title: 'Resources',
  links: [{
    label: 'AgriNexus Academy',
    href: '/academy'
  }, {
    label: 'Documentation',
    href: '#'
  }, {
    label: 'Support Center',
    href: '#'
  }, {
    label: 'Privacy Policy',
    href: '#'
  }]
}];
const socialLinkStyle = {
  transition: 'color 150ms cubic-bezier(0.25, 0, 0, 1)'
};
const footerLinkStyle = {
  transition: 'color 150ms cubic-bezier(0.25, 0, 0, 1)'
};
export const SiteFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();
  return <footer className="pt-16 pb-8 border-t" style={{
    background: 'linear-gradient(165deg, #252f48 0%, #1c2840 40%, #1e3038 75%, #243040 100%)',
    borderColor: 'rgba(195, 215, 240, 0.1)'
  }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="mb-5">
              <span className="font-serif text-3xl font-bold text-white">
                Agri<span className="text-[#4dd49a]">Nexus</span>
              </span>
            </div>
            <p className="text-[#c8d8e8]/65 mb-8 max-w-sm leading-relaxed text-sm">
              Empowering global agriculture through decentralized intelligence. Bridging the gap between soil health and market success with 18 specialized AI agents.
            </p>
            <div className="flex gap-5">
              <a href="#" className="text-[#c8d8e8]/55 hover:text-[#4dd49a]" style={socialLinkStyle}>
                <Twitter className="w-[18px] h-[18px]" />
              </a>
              <a href="#" className="text-[#c8d8e8]/55 hover:text-[#4dd49a]" style={socialLinkStyle}>
                <Linkedin className="w-[18px] h-[18px]" />
              </a>
              <a href="#" className="text-[#c8d8e8]/55 hover:text-[#4dd49a]" style={socialLinkStyle}>
                <Github className="w-[18px] h-[18px]" />
              </a>
              <a href="#" className="text-[#c8d8e8]/55 hover:text-[#4dd49a]" style={socialLinkStyle}>
                <Mail className="w-[18px] h-[18px]" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          {footerSections.map(section => <div key={section.title}>
              <h3 className="font-semibold text-sm mb-5 text-white uppercase tracking-[0.12em]">{section.title}</h3>
              <ul className="space-y-3.5">
                {section.links.map(link => <li key={link.label}>
                    <a href={link.href} className="text-[#c8d8e8]/50 hover:text-[#4dd49a] text-sm" style={footerLinkStyle}>
                      {link.label}
                    </a>
                  </li>)}
              </ul>
            </div>)}
        </div>

        {/* Legal Disclaimer */}
        <div className="pt-8 border-t" style={{
        borderColor: 'rgba(195,215,240,0.1)'
      }}>
          <div className="p-5 rounded-xl mb-8" style={{
          background: 'rgba(255,255,255,0.04)'
        }}>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4dd49a] mb-2.5">Commodity Trading Disclaimer</h4>
            <p className="text-xs text-[#c8d8e8]/45 leading-relaxed">
              AgriNexus provides agricultural intelligence and market forecasts for informational purposes only. Trading commodities involves significant risk of loss and is not suitable for all investors. Past performance of AI agents is not indicative of future results. All information provided is subject to change without notice. AgriNexus does not provide financial or investment advice. Users should consult with licensed professionals before making any financial decisions.
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center text-[11px] text-[#c8d8e8]/30 gap-4">
            <p>© {currentYear} AgriNexus Technologies. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-[#4dd49a]" style={footerLinkStyle}>Terms of Service</a>
              <a href="#" className="hover:text-[#4dd49a]" style={footerLinkStyle}>Cookie Policy</a>
              <a href="#" className="hover:text-[#4dd49a]" style={footerLinkStyle}>Security</a>
            </div>
          </div>
        </div>
      </div>
    </footer>;
};