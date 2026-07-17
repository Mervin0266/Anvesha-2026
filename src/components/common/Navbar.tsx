import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Award, Calendar, HelpCircle, Phone, UserCheck, Menu, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, getRoleDashboardPath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) setScrolled(true);
      else setScrolled(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'glass-header shadow-christ-card py-3 border-b border-slate-200/80' 
        : 'bg-white/80 backdrop-blur-md py-4 border-b border-slate-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo & Branding */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg bg-christ-navy text-christ-gold flex items-center justify-center font-serif text-xl font-bold shadow-md group-hover:scale-105 transition-transform">
              CU
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-christ-navy">ANVESHA</span>
                <span className="text-xs bg-christ-gold/20 text-christ-navy font-semibold px-2 py-0.5 rounded-full border border-christ-gold/30">2026</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">CHRIST UNIVERSITY • INTER PU FEST</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-700">
            <Link to="/#about" className="hover:text-christ-navy transition-colors">About</Link>
            <Link to="/#events" className="hover:text-christ-navy transition-colors">Events</Link>
            <Link to="/#timeline" className="hover:text-christ-navy transition-colors">Timeline</Link>
            <Link to="/#rules" className="hover:text-christ-navy transition-colors">Rules</Link>
            <Link to="/#contact" className="hover:text-christ-navy transition-colors">Contact</Link>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isHomePage && (
              user ? (
                <button
                  onClick={() => navigate(getRoleDashboardPath(user.role, user.eventId))}
                  className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg bg-christ-navy text-white hover:bg-christ-darkNavy transition-all shadow-sm"
                >
                  <UserCheck className="w-4 h-4 text-christ-gold" />
                  <span>Dashboard ({user.name.split(' ')[0]})</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg text-christ-navy border border-christ-navy/30 hover:bg-christ-navy/5 transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-christ-navy" />
                  <span>Crew Login</span>
                </Link>
              )
            )}

            <Link
              to="/register"
              className="inline-flex items-center space-x-2 px-5 py-2.5 text-xs font-bold rounded-lg bg-christ-gold text-christ-navy shadow-christ-gold hover:bg-christ-lightGold transition-all transform hover:-translate-y-0.5"
            >
              <span>Register Institution</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-700 hover:text-christ-navy focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3">
          <Link to="/#about" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-700 py-1">About</Link>
          <Link to="/#events" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-700 py-1">Events</Link>
          <Link to="/#timeline" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-700 py-1">Timeline</Link>
          <Link to="/#rules" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-700 py-1">Rules</Link>
          <Link to="/#contact" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-700 py-1">Contact</Link>
          
          <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2">
            {isHomePage && (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center px-4 py-2 text-xs font-semibold rounded-lg text-christ-navy border border-christ-navy/30"
              >
                Crew Login
              </Link>
            )}
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center px-4 py-2.5 text-xs font-bold rounded-lg bg-christ-gold text-christ-navy"
            >
              Register Institution
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
