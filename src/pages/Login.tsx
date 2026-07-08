import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, User, Lock, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, getRoleDashboardPath } = useAuth();
  const [inputCredential, setInputCredential] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const showDemoCredentials = false;

  const demoAccounts = [
    { label: 'Admin', email: 'admin@anvesha.in', pass: 'admin123', role: 'admin' },
    { label: 'Registration', email: 'registration@anvesha.in', pass: 'reg123', role: 'registration_team' },
    { label: 'Hospitality', email: 'hospitality@anvesha.in', pass: 'hosp123', role: 'hospitality_team' },
    { label: 'Event Coordinator', email: 'football@anvesha.in', pass: 'foot123', role: 'faculty_football' },
    { label: 'Certificate Team', email: 'certificate@anvesha.in', pass: 'cert123', role: 'certificate_team' },
    { label: 'Official', email: 'official@anvesha.in', pass: 'off123', role: 'officials' }
  ];

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

  const handleQuickSwitch = async (acc: typeof demoAccounts[0]) => {
    setInputCredential(acc.email);
    setPassword(acc.pass);
    setIsLoggingIn(true);
    setError(null);
    try {
      const loggedInUser = await login(acc.email);
      const targetPath = getRoleDashboardPath(loggedInUser.role, loggedInUser.eventId);
      navigate(targetPath);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-christ-lightBg flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      
      {/* Brand Logo Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link to="/" className="inline-flex items-center space-x-3 group">
          <div className="w-12 h-12 rounded-xl bg-christ-navy text-christ-gold flex items-center justify-center font-serif text-2xl font-bold shadow-md">
            CU
          </div>
          <div className="text-left">
            <span className="font-extrabold text-2xl tracking-tight text-christ-navy">ANVESHA</span>
            <p className="text-xs text-christ-gold font-bold">CREW AUTHENTICATION PORTAL</p>
          </div>
        </Link>
        <h2 className="text-xl font-bold text-slate-800 font-serif">Single Sign-On for Event Crew & Officials</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-christ-card border border-slate-200/80 rounded-2xl sm:px-10 space-y-6">
          
          {error && (
            <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-xs font-medium rounded-r-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Email / Username *</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. admin@anvesha.in"
                  value={inputCredential}
                  onChange={(e) => setInputCredential(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none bg-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-xl text-xs font-bold text-christ-navy bg-christ-gold hover:bg-christ-lightGold shadow-christ-gold transition-all"
            >
              <span>{isLoggingIn ? 'Authenticating...' : 'Sign In & Redirect'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Role Switcher Grid */}
          {showDemoCredentials && (
            <div className="pt-6 border-t border-slate-200">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="w-4 h-4 text-christ-gold" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-serif">Quick Demo Credentials (Click to Auto-Fill & Login)</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleQuickSwitch(acc)}
                    className="p-2.5 bg-slate-50 hover:bg-christ-navy hover:text-white border border-slate-200 rounded-lg text-left transition-all group"
                  >
                    <strong className="block text-slate-900 group-hover:text-christ-gold font-bold text-xs truncate">{acc.label}</strong>
                    <span className="text-[10px] text-slate-500 group-hover:text-slate-200 block truncate">{acc.email} / {acc.pass}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {showDemoCredentials && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] text-slate-500 font-medium">
              <span className="font-bold text-christ-navy block mb-0.5 font-serif">Pro-Tip for Event Coordinators:</span>
              You can log in with any specific event coordinator credentials (e.g. <code className="font-mono text-christ-navy">football_girls@anvesha.in</code>, <code className="font-mono text-christ-navy">vball@anvesha.in</code>, <code className="font-mono text-christ-navy">dance@anvesha.in</code>) and the system will automatically route you to that event's dedicated dashboard.
            </div>
          )}

          <div className="text-center pt-2">
            <Link to="/" className="text-xs font-semibold text-christ-navy hover:underline">
              ← Return to Main Homepage
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};
