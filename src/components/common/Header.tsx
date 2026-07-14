import React, { useState } from 'react';
import { Bell, Search, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const notifications = [
    { id: 1, text: 'St. Joseph PU registered 3 teams.', time: '10 mins ago', type: 'info' },
    { id: 2, text: 'Group Dance score sheet submitted.', time: '1 hour ago', type: 'success' },
    { id: 3, text: 'Edit request pending for Football.', time: '2 hours ago', type: 'warning' }
  ];

  const roleLabel = user?.role?.replace(/_/g, ' ') ?? '';

  return (
    <header className="bg-white border-b border-slate-100 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm min-h-[60px]">

      {/* Left: Title (with left margin for mobile hamburger) */}
      <div className="ml-12 lg:ml-0 min-w-0 flex-1 mr-4">
        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-medium mb-0.5">
          <span className="hidden sm:inline">ANVESHA Portal</span>
          <span className="hidden sm:inline">/</span>
          <span className="font-bold text-christ-navy uppercase tracking-wide">{roleLabel}</span>
        </div>
        <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight font-serif leading-tight truncate">{title}</h1>
        {subtitle && <p className="hidden sm:block text-[11px] text-slate-400 font-medium mt-0.5 truncate">{subtitle}</p>}
      </div>

      {/* Right: Tools */}
      <div className="flex items-center space-x-1 sm:space-x-3 shrink-0">

        {/* Search — desktop always visible, mobile toggleable */}
        <div className={`relative transition-all duration-200 ${showSearch ? 'block' : 'hidden sm:block'}`}>
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search team, chest #, ID..."
            className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-christ-navy focus:ring-2 focus:ring-christ-navy/10 w-40 sm:w-48 transition-all bg-slate-50 focus:bg-white"
          />
        </div>

        {/* Search toggle (mobile only) */}
        <button
          onClick={() => setShowSearch(v => !v)}
          className="sm:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white animate-pulse" />
          </button>

          {showNotifications && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div>
                    <span className="text-xs font-bold text-slate-800">System Alerts</span>
                    <span className="ml-2 text-[10px] text-christ-gold font-bold bg-christ-navy/10 px-2 py-0.5 rounded-full">Live</span>
                  </div>
                  <button onClick={() => setShowNotifications(false)} className="p-1 rounded-lg hover:bg-slate-200 transition-colors">
                    <X className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="p-3 text-xs hover:bg-slate-50 flex items-start space-x-2.5 transition-colors cursor-pointer">
                      {n.type === 'success'
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        : n.type === 'warning'
                        ? <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        : <Bell className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
                      <div>
                        <p className="font-semibold text-slate-800 leading-snug">{n.text}</p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                  <span className="text-[11px] text-christ-navy font-bold cursor-pointer hover:underline">View all notifications</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User badge */}
        <div className="flex items-center space-x-2.5 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-christ-navy to-[#003070] text-christ-gold flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden md:block leading-tight">
            <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{user?.name}</p>
            <p className="text-[10px] text-slate-400 capitalize">{roleLabel}</p>
          </div>
        </div>

      </div>
    </header>
  );
};
