import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, ArrowRight, MapPin, Calendar, ChevronLeft, Shield, Users, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, getRoleDashboardPath } = useAuth();
  const [inputCredential, setInputCredential] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);
    try {
      const loggedInUser = await login(inputCredential);
      const targetPath = getRoleDashboardPath(loggedInUser.role, loggedInUser.eventId);
      navigate(targetPath);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans overflow-hidden">

      {/* ── LEFT PANEL — Brand & Hero ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between overflow-hidden">
        {/* Background image with overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/images/54803382962_a491a06135_o.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-christ-navy/95 via-christ-navy/85 to-christ-darkNavy/90" />
        
        {/* Decorative gold diagonal stripe */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #C5A059 0px, #C5A059 1px, transparent 1px, transparent 32px)',
          }}
        />

        {/* Top: Logo */}
        <div className="relative z-10 px-10 pt-10">
          <Link to="/" className="inline-flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-xl bg-christ-gold/20 border border-christ-gold/30 flex items-center justify-center font-serif text-xl font-bold text-christ-gold backdrop-blur-sm">
              CU
            </div>
            <div>
              <p className="text-white font-extrabold text-xl tracking-tight leading-none">ANVESHA</p>
              <p className="text-christ-gold/80 text-[10px] font-bold tracking-widest uppercase">Christ University</p>
            </div>
          </Link>
        </div>

        {/* Middle: Main branding copy */}
        <div className="relative z-10 px-10 py-10 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-christ-gold/10 border border-christ-gold/25 rounded-full px-4 py-1.5">
            <Shield className="w-3.5 h-3.5 text-christ-gold" />
            <span className="text-christ-gold text-[11px] font-bold uppercase tracking-widest">Crew Authentication Portal</span>
          </div>

          <div>
            <h1 className="text-5xl font-extrabold text-white font-serif leading-tight tracking-tight">
              ANVESHA<br />
              <span className="text-christ-gold">2026</span>
            </h1>
            <p className="text-slate-300 text-sm mt-4 leading-relaxed max-w-sm">
              The premier Inter Pre-University Sports &amp; Cultural Championship — uniting talent, grit, and spirit across Karnataka.
            </p>
          </div>

          {/* Event info chips */}
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-lg px-3 py-2 text-white/90">
              <MapPin className="w-3.5 h-3.5 text-christ-gold shrink-0" />
              <span>Kengeri Campus, Mysore Road</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-lg px-3 py-2 text-white/90">
              <Calendar className="w-3.5 h-3.5 text-christ-gold shrink-0" />
              <span>July 04 – 05, 2026</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            {[
              { icon: Users, label: 'Institutions', value: '50+' },
              { icon: Trophy, label: 'Events', value: '9' },
              { icon: Users, label: 'Participants', value: '1000+' },
            ].map((stat) => (
              <div key={stat.label} className="text-center space-y-1">
                <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Footer note */}
        <div className="relative z-10 px-10 pb-8">
          <p className="text-slate-500 text-[10px]">
            © 2026 Christ University, Bengaluru. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL — Login Form ── */}
      <div className="w-full lg:w-[48%] flex flex-col justify-center bg-white min-h-screen px-6 sm:px-12 lg:px-16 xl:px-20 relative">
        
        {/* Mobile-only top bar */}
        <div className="lg:hidden absolute top-0 left-0 right-0 bg-christ-navy px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-christ-gold/20 border border-christ-gold/30 flex items-center justify-center font-serif font-bold text-christ-gold text-sm">
              CU
            </div>
            <div>
              <p className="text-white font-extrabold text-base tracking-tight leading-none">ANVESHA</p>
              <p className="text-christ-gold/70 text-[9px] font-bold tracking-widest uppercase">2026</p>
            </div>
          </Link>
          <Link to="/" className="flex items-center space-x-1 text-white/70 text-xs font-medium hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto pt-24 lg:pt-0 pb-8 space-y-8">

          {/* Form header */}
          <div className="space-y-2">
            <div className="hidden lg:flex items-center space-x-2 mb-2">
              <Link to="/" className="flex items-center text-xs text-slate-400 hover:text-christ-navy transition-colors font-medium space-x-1">
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back to Home</span>
              </Link>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-christ-navy font-serif tracking-tight">
              Welcome back
            </h2>
            <p className="text-slate-500 text-sm">Sign in to your crew or admin portal to continue.</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start space-x-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              <div className="w-5 h-5 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-rose-600 font-bold text-[10px]">!</span>
              </div>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            
            {/* Username field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                Email or Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-slate-400 group-focus-within:text-christ-navy transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder="e.g. admin or admin@anvesha.in"
                  value={inputCredential}
                  onChange={(e) => setInputCredential(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-christ-navy focus:border-transparent bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-christ-navy transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-christ-navy focus:border-transparent bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-christ-navy transition-colors text-[10px] font-bold tracking-wide"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              id="login-submit-btn"
              disabled={isLoggingIn}
              className="relative w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden group"
              style={{
                background: isLoggingIn
                  ? '#001630'
                  : 'linear-gradient(135deg, #002147 0%, #003070 100%)',
                color: '#fff',
                boxShadow: '0 4px 20px rgba(0,33,71,0.3)',
              }}
            >
              <span className="relative z-10">
                {isLoggingIn ? 'Authenticating…' : 'Sign In & Continue'}
              </span>
              {!isLoggingIn && (
                <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
              )}
              {isLoggingIn && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
              )}
              {/* Gold shimmer layer on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-christ-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity -translate-x-full group-hover:translate-x-full duration-700" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-[11px] text-slate-400 font-medium">or</span>
            </div>
          </div>

          {/* Back link */}
          <div className="text-center">
            <Link
              to="/"
              className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-christ-navy font-medium transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Return to Main Homepage</span>
            </Link>
          </div>

          {/* Footer note */}
          <p className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100">
            This portal is for authorised Christ University ANVESHA 2026 event crew and administrators only.
          </p>
        </div>
      </div>
    </div>
  );
};
