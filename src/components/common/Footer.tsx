import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Globe, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-christ-navy text-white pt-16 pb-12 border-t border-christ-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Col 1: Branding */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-christ-gold text-christ-navy flex items-center justify-center font-serif text-xl font-bold">
                CU
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-white">ANVESHA</span>
                <p className="text-xs text-christ-gold font-medium">INTER PU FEST 2026</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Official Inter Pre-University Sports and Cultural Fest organized by Christ University, Kengeri Campus, Mysore Road, Bengaluru.
            </p>
            <div className="flex items-center space-x-2 text-xs text-christ-gold font-semibold pt-2">
              <Shield className="w-4 h-4" />
              <span>Verified Enterprise Management Portal</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-sm font-bold text-christ-gold uppercase tracking-wider mb-4 font-serif">Quick Navigation</h4>
            <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
              <li><Link to="/#about" className="hover:text-christ-gold transition-colors">About Fest</Link></li>
              <li><Link to="/#events" className="hover:text-christ-gold transition-colors">Events & Rules</Link></li>
              <li><Link to="/#timeline" className="hover:text-christ-gold transition-colors">Event Schedule</Link></li>
              <li><Link to="/#rules" className="hover:text-christ-gold transition-colors">Participation Criteria</Link></li>
              <li><Link to="/register" className="text-christ-gold font-semibold hover:underline">Institution Registration</Link></li>
            </ul>
          </div>

          {/* Col 3: Portal Access */}
          <div>
            <h4 className="text-sm font-bold text-christ-gold uppercase tracking-wider mb-4 font-serif">Crew Portals</h4>
            <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
              <li><Link to="/login" className="hover:text-christ-gold transition-colors">Registration Team Desk</Link></li>
              <li><Link to="/login" className="hover:text-christ-gold transition-colors">Hospitality Verification Desk</Link></li>
              <li><Link to="/login" className="hover:text-christ-gold transition-colors">Event Faculty Score Portal</Link></li>
              <li><Link to="/login" className="hover:text-christ-gold transition-colors">Certificate Generation Portal</Link></li>
              <li><Link to="/login" className="hover:text-christ-gold transition-colors">Officials Analytics & Reports</Link></li>
              <li><Link to="/login" className="hover:text-christ-gold transition-colors">Chief Administrator Portal</Link></li>
            </ul>
          </div>

          {/* Col 4: Contact & Venue */}
          <div>
            <h4 className="text-sm font-bold text-christ-gold uppercase tracking-wider mb-4 font-serif">Campus Contact</h4>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-christ-gold shrink-0 mt-0.5" />
                <span>Christ University, Kanmanike, Kumbalgodu, Mysore Road, Bangalore, Karnataka - 560074, India.</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-christ-gold shrink-0" />
                <span>080-40129100 / 080-40129200</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-christ-gold shrink-0" />
                <span>anvesha@fest.christuniversity.in</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Globe className="w-4 h-4 text-christ-gold shrink-0" />
                <span>www.christuniversity.in</span>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-700/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© 2026 Christ University, Bengaluru. All rights reserved. ANVESHA Inter PU Fest.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0 font-medium">
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer">Terms of Participation</span>
            <span className="hover:text-white cursor-pointer">Official Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
