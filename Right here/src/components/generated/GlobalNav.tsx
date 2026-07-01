import React, { useState } from 'react';
import { Menu, X, Globe, ChevronDown } from 'lucide-react';
const navLinks = [{
  name: 'Solutions',
  href: '#solutions'
}, {
  name: 'Dashboard',
  href: '/dashboard'
}, {
  name: 'Sponsors',
  href: '/sponsors'
}, {
  name: 'Academy',
  href: '/academy'
}];
const navLinkStyle = {
  transition: 'color 150ms cubic-bezier(0.25, 0, 0, 1)'
};
export const GlobalNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<'EN' | 'BG'>('EN');
  return <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b" style={{
    background: 'rgba(238, 234, 252, 0.84)',
    borderColor: 'rgba(200, 192, 230, 0.32)'
  }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <span className="font-serif text-[1.375rem] font-bold text-[#1a2030]">
              Agri<span className="text-[#1a6b45]">Nexus</span>
            </span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => <a key={link.name} href={link.href} className="text-[#1a2030]/65 hover:text-[#1a2030] px-3 py-2 text-sm font-medium rounded-lg hover:bg-white/40" style={navLinkStyle}>
                {link.name}
              </a>)}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => setLanguage(language === 'EN' ? 'BG' : 'EN')} className="flex items-center gap-1 text-xs font-semibold text-[#1a2030]/55 hover:text-[#1a2030] px-2.5 py-1.5 border rounded-full hover:bg-white/40" style={{
            borderColor: 'rgba(190,182,225,0.55)',
            transition: 'color 150ms cubic-bezier(0.25, 0, 0, 1), background-color 150ms cubic-bezier(0.25, 0, 0, 1)'
          }}>
              <Globe className="w-3.5 h-3.5" />
              <span>{language}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <button className="text-[#1a2030]/75 hover:text-[#1a2030] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/40" style={{
            transition: 'color 150ms cubic-bezier(0.25, 0, 0, 1), background-color 150ms cubic-bezier(0.25, 0, 0, 1)'
          }}>
              Login
            </button>
            <button className="px-5 py-[7px] rounded-lg text-sm font-semibold text-white shadow-sm" style={{
            background: '#1a6b45',
            transition: 'background-color 150ms cubic-bezier(0.25, 0, 0, 1)'
          }} onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#155937';
          }} onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1a6b45';
          }}>
              Join Now
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-[#1a2030] hover:bg-white/40 focus:outline-none" style={{
            transition: 'background-color 150ms cubic-bezier(0.25, 0, 0, 1)'
          }} aria-label={isOpen ? 'Close menu' : 'Open menu'}>
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && <div className="md:hidden border-b animate-in fade-in slide-in-from-top-4 duration-200" style={{
      background: 'rgba(238,234,252,0.97)',
      borderColor: 'rgba(200,192,230,0.32)'
    }}>
          <div className="px-4 pt-2 pb-4 space-y-1">
            {navLinks.map(link => <a key={link.name} href={link.href} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#1a2030]/75 hover:text-[#1a2030] hover:bg-white/50" style={navLinkStyle}>
                {link.name}
              </a>)}
            <div className="pt-4 pb-1 border-t flex flex-col gap-3 mt-2" style={{
          borderColor: 'rgba(200,192,230,0.35)'
        }}>
              <button onClick={() => setLanguage(language === 'EN' ? 'BG' : 'EN')} className="flex items-center gap-2 text-sm font-medium text-[#1a2030]/65 px-1">
                <Globe className="w-4 h-4" />
                <span>Language: {language}</span>
              </button>
              <button className="w-full text-left text-[#1a2030] font-semibold py-2 px-1 text-sm hover:text-[#1a6b45]" style={navLinkStyle}>
                Login
              </button>
              <button className="w-full text-center font-semibold py-3 rounded-lg text-white text-sm" style={{
            background: '#1a6b45',
            transition: 'background-color 150ms cubic-bezier(0.25, 0, 0, 1)'
          }} onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#155937';
          }} onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1a6b45';
          }}>
                Join Now
              </button>
            </div>
          </div>
        </div>}
    </nav>;
};