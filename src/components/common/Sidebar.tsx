import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  UserCheck, Hotel, Trophy, Award, BarChart3, Shield, LogOut,
  Home, Menu, X, ChevronRight, Upload, UserPlus, Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

interface SidebarProps {
  currentRole: UserRole;
}

const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  admin:               { label: 'Chief Admin',       color: 'text-christ-gold',   bg: 'bg-christ-gold/15' },
  registration_team:   { label: 'Registration Team', color: 'text-blue-300',      bg: 'bg-blue-400/15' },
  hospitality_team:    { label: 'Hospitality Desk',  color: 'text-emerald-300',   bg: 'bg-emerald-400/15' },
  certificate_team:    { label: 'Certificate Desk',  color: 'text-purple-300',    bg: 'bg-purple-400/15' },
  officials:           { label: 'Officials (View)',   color: 'text-slate-300',     bg: 'bg-slate-400/15' },
};

export const Sidebar: React.FC<SidebarProps> = ({ currentRole }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const meta = ROLE_META[currentRole] ?? { label: currentRole.replace(/_/g, ' '), color: 'text-amber-300', bg: 'bg-amber-400/15' };

  const getNavItems = () => {
    const items: { label: string; path: string; icon: React.ElementType; badge?: string }[] = [];

    if (currentRole === 'admin') {
      items.push(
        { label: 'Admin Control Center',     path: '/dashboard/admin',          icon: Shield },
        { label: 'Registration Details',     path: '/dashboard/admin/registrations', icon: UserCheck },
        { label: 'Bulk Institution Import',  path: '/dashboard/admin/import',   icon: Upload },
        { label: 'Crew & Users Management',  path: '/dashboard/admin/users',    icon: Users },
        { label: 'Spot Registration',        path: '/dashboard/registration/spot', icon: UserPlus },
        { label: 'Registration Verification',path: '/dashboard/verification',   icon: UserCheck },
        { label: 'Hospitality Management',   path: '/dashboard/hospitality',    icon: Hotel },
        { label: 'Sports Dashboard',         path: '/dashboard/sports',         icon: Trophy },
        { label: 'Culturals Dashboard',      path: '/dashboard/culturals',      icon: Trophy },
        { label: 'Fun Activities Dashboard', path: '/dashboard/fun-activities', icon: Trophy },
        { label: 'Certificate Desk',         path: '/dashboard/certificates',   icon: Award },
        { label: 'Reports & Analytics',      path: '/dashboard/reports',        icon: BarChart3 }
      );
    } else if (currentRole === 'registration_team') {
      items.push(
        { label: 'Verification Desk', path: '/dashboard/verification', icon: UserCheck },
        { label: 'Spot Registration', path: '/dashboard/registration/spot', icon: UserPlus }
      );
    } else if (currentRole === 'hospitality_team') {
      items.push({ label: 'Hospitality Desk', path: '/dashboard/hospitality', icon: Hotel });
    } else if (currentRole === 'certificate_team') {
      items.push({ label: 'Certificate Generator', path: '/dashboard/certificates', icon: Award });
    } else if (currentRole === 'officials') {
      items.push({ label: 'Reports & Analytics', path: '/dashboard/reports', icon: BarChart3 });
    } else {
      const evtId = user?.eventId || '';
      const isSports = evtId.startsWith('sports_');
      const isFun = evtId === 'cultural_open_mic' || evtId === 'cultural_treasure_hunt';
      
      if (isSports) {
        items.push({ label: 'Sports Dashboard', path: '/dashboard/sports', icon: Trophy });
      } else if (isFun) {
        items.push({ label: 'Fun Activities Dashboard', path: '/dashboard/fun-activities', icon: Trophy });
      } else {
        items.push({ label: 'Culturals Dashboard', path: '/dashboard/culturals', icon: Trophy });
      }
    }

    return items;
  };

  const navItems = getNavItems();

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Brand */}
      <div className="px-5 py-4 border-b border-white/10 shrink-0" style={{ background: 'rgba(0,0,0,0.2)' }}>
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-christ-gold flex items-center justify-center font-serif text-lg font-black text-christ-navy shrink-0">
            CU
          </div>
          <div>
            <p className="font-extrabold text-base tracking-tight text-white leading-none">ANVESHA</p>
            <p className="text-[10px] text-christ-gold/80 font-bold tracking-widest uppercase mt-0.5">Crew Portal · 2026</p>
          </div>
        </div>
      </div>

      {/* User card */}
      <div className="px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-christ-gold/30 to-christ-gold/10 border border-christ-gold/30 flex items-center justify-center font-black text-christ-gold text-sm shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate leading-tight">{user?.name}</p>
            <span className={`inline-block text-[10px] font-bold uppercase tracking-wider mt-0.5 px-1.5 py-0.5 rounded-md ${meta.color} ${meta.bg}`}>
              {meta.label}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 min-h-0 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-white/30 font-serif">
          Main Menu
        </p>

        {navItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={idx}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-christ-gold text-christ-navy font-bold shadow-lg'
                    : 'text-slate-300 hover:bg-white/8 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
            </NavLink>
          );
        })}

        <div className="pt-5">
          <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-white/30 font-serif">
            Quick Links
          </p>
          <NavLink
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:bg-white/8 hover:text-white transition-all"
          >
            <Home className="w-4 h-4 shrink-0" />
            <span>Return to Homepage</span>
          </NavLink>
        </div>
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-white/10 shrink-0 mt-auto" style={{ background: 'rgba(0,0,0,0.2)' }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-500/20 hover:text-rose-100 transition-all border border-rose-500/20 hover:border-rose-400/40"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile hamburger trigger ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-xl bg-christ-navy text-white flex items-center justify-center shadow-lg border border-white/10"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Mobile slide-over backdrop ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile slide-over drawer ── */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 flex flex-col h-screen transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'linear-gradient(180deg, #001630 0%, #002147 100%)' }}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent />
      </aside>

      {/* ── Desktop fixed static sidebar ── */}
      <aside
        className="hidden lg:flex w-64 xl:w-72 flex-col shrink-0 h-screen sticky top-0 z-30 border-r border-white/5 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #001630 0%, #002147 100%)' }}
      >
        <SidebarContent />
      </aside>
    </>
  );
};
