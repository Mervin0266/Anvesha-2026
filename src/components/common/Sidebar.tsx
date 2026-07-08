import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  UserCheck, Hotel, Trophy, Award, BarChart3, Shield, LogOut, 
  FileText, Home, Activity, CheckSquare 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

interface SidebarProps {
  currentRole: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRole }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    const items = [];

    // System Admin gets access to all modules
    if (currentRole === 'admin') {
      items.push(
        { label: 'Admin Control Center', path: '/dashboard/admin', icon: Shield },
        { label: 'Registration Verification', path: '/dashboard/verification', icon: UserCheck },
        { label: 'Hospitality Management', path: '/dashboard/hospitality', icon: Hotel },
        { label: 'Event Faculty Scorecard', path: '/dashboard/event/sports_football', icon: Trophy },
        { label: 'Certificate Desk', path: '/dashboard/certificates', icon: Award },
        { label: 'Reports & Analytics', path: '/dashboard/reports', icon: BarChart3 }
      );
    } else if (currentRole === 'registration_team') {
      items.push(
        { label: 'Verification Desk', path: '/dashboard/verification', icon: UserCheck }
      );
    } else if (currentRole === 'hospitality_team') {
      items.push(
        { label: 'Hospitality Desk', path: '/dashboard/hospitality', icon: Hotel }
      );
    } else if (currentRole === 'certificate_team') {
      items.push(
        { label: 'Certificate Generator', path: '/dashboard/certificates', icon: Award }
      );
    } else if (currentRole === 'officials') {
      items.push(
        { label: 'Reports & Analytics', path: '/dashboard/reports', icon: BarChart3 }
      );
    } else {
      // Event Faculty
      const evtId = user?.eventId || 'sports_football';
      items.push(
        { label: 'My Event Scoreboard', path: `/dashboard/event/${evtId}`, icon: Trophy }
      );
    }

    return items;
  };

  return (
    <aside className="w-64 bg-christ-navy text-white flex flex-col shrink-0 border-r border-christ-gold/20 shadow-xl min-h-screen">
      
      {/* Brand Header */}
      <div className="p-5 border-b border-christ-gold/20 bg-christ-darkNavy">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-christ-gold text-christ-navy flex items-center justify-center font-serif text-lg font-bold">
            CU
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white">ANVESHA</span>
            <p className="text-[10px] text-christ-gold font-semibold tracking-wider uppercase">Crew Portal</p>
          </div>
        </div>
      </div>

      {/* Role Badge Container */}
      <div className="p-4 bg-white/5 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-christ-gold/20 border border-christ-gold/40 text-christ-gold flex items-center justify-center font-bold text-xs">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-white truncate">{user?.name}</p>
            <span className="inline-block text-[10px] font-semibold text-christ-gold uppercase tracking-wider">
              {currentRole.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-christ-gold/70 font-serif">
          Main Menu
        </div>

        {getNavItems().map((item, idx) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={idx}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-christ-gold text-christ-navy font-bold shadow-md'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}

        <div className="pt-6 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-christ-gold/70 font-serif">
          Public Site
        </div>
        <NavLink
          to="/"
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <Home className="w-4 h-4" />
          <span>Return to Homepage</span>
        </NavLink>
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-white/10 bg-christ-darkNavy">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:text-rose-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

    </aside>
  );
};
