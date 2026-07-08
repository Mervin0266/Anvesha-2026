import React, { useState } from 'react';
import { Bell, Search, UserCheck, Shield, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, text: 'St. Joseph PU registered 3 teams.', time: '10 mins ago', type: 'info' },
    { id: 2, text: 'Group Dance score sheet submitted.', time: '1 hour ago', type: 'success' },
    { id: 3, text: 'Edit request pending for Football.', time: '2 hours ago', type: 'warning' }
  ];

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      
      {/* Title & Breadcrumbs */}
      <div>
        <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
          <span>ANVESHA Portal</span>
          <span>/</span>
          <span className="text-christ-navy font-semibold uppercase">{user?.role.replace(/_/g, ' ')}</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight font-serif mt-0.5">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
      </div>

      {/* Right Tools: Search, Notifications, Profile */}
      <div className="flex items-center space-x-4">
        
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search team, chest #, ID..."
            className="pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-christ-navy focus:ring-1 focus:ring-christ-navy w-48 transition-all"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-600 hover:text-christ-navy rounded-lg hover:bg-slate-100 relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white animate-pulse" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase">System Alerts</span>
                <span className="text-[10px] text-christ-gold font-semibold bg-christ-navy/10 px-2 py-0.5 rounded-full">Real-time</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className="p-3 text-xs hover:bg-slate-50 flex items-start space-x-2.5">
                    {n.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> :
                     n.type === 'warning' ? <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> :
                     <Bell className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}
                    <div>
                      <p className="font-medium text-slate-800">{n.text}</p>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-christ-navy text-christ-gold flex items-center justify-center font-bold text-xs shadow-sm">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-bold text-slate-800">{user?.name}</p>
            <p className="text-[10px] text-slate-500 capitalize">{user?.role.replace(/_/g, ' ')}</p>
          </div>
        </div>

      </div>

    </header>
  );
};
