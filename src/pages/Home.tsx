import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Trophy, ShieldCheck, Calendar, Award,
  ArrowRight, MapPin, Phone, Mail, CheckCircle2, Sparkles, Clock
} from 'lucide-react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { useEvents } from '../contexts/EventsContext';
import { EventCategory } from '../types';

/* ─── helpers ───────────────────────────────────────────────── */
const getEventImage = (id: string): string => {
  const n = id.toLowerCase();
  if (n.includes('football_boys'))    return '/images/events/football_boys.jpg';
  if (n.includes('football_girls'))   return '/images/events/football_girls.jpg';
  if (n.includes('volleyball_boys'))  return '/images/events/volleyball_boys.jpg';
  if (n.includes('volleyball_girls')) return '/images/events/volleyball_girls.jpg';
  if (n.includes('basketball_boys'))  return '/images/events/basketball_boys.jpg';
  if (n.includes('basketball_girls')) return '/images/events/basketball_girls.jpg';
  if (n.includes('tug_of_war_boys')  || n.includes('tugofwar_boys'))  return '/images/events/tug_of_war_boys.jpg';
  if (n.includes('tug_of_war_girls') || n.includes('tugofwar_girls')) return '/images/events/tug_of_war_girls.jpg';
  if (n.includes('dance'))        return '/images/events/dance.jpg';
  if (n.includes('music'))        return '/images/events/music.jpg';
  if (n.includes('debate'))       return '/images/events/debate.jpg';
  if (n.includes('open_mic') || n.includes('openmic')) return '/images/events/open_mic.jpg';
  if (n.includes('treasure_hunt')) return '/images/events/treasure_hunt.jpg';
  return '/images/events/default.jpg';
};

const HERO_IMAGES = [
  '/images/fest-banner.jpeg',
  '/images/images/54804478864_83a7ab18a8_o.jpg',
  '/images/images/54804479024_964acda267_o.jpg',
  '/images/images/54803382962_a491a06135_o.jpg',
  '/images/images/54804479254_3b773ea6b7_o.jpg',
  '/images/images/54804486843_fcd3f03b8f_o.jpg',
  '/images/images/54804568260_62c289f9eb_o.jpg',
];

/* ─── Shared section label ──────────────────────────────────── */
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-block text-xs font-bold text-christ-gold uppercase tracking-widest bg-christ-gold/10 border border-christ-gold/30 px-4 py-1.5 rounded-full mb-4">
    {children}
  </span>
);

/* ─── Component ─────────────────────────────────────────────── */
export const Home: React.FC = () => {
  const { events } = useEvents();
  const [activeTab, setActiveTab] = useState<EventCategory>('SPORTS');
  const [bgIndex, setBgIndex]     = useState(0);
  const location = useLocation();

  useEffect(() => {
    const t = setInterval(() => setBgIndex(p => (p + 1) % HERO_IMAGES.length), 4800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        // Use a small timeout to allow the DOM to fully render/render content
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [location.pathname, location.hash]);

  /* Merge Boys/Girls sports into one catalog card if both divisions exist */
  const displayEvents = React.useMemo(() => {
    const filtered = events.filter(e => e.category === activeTab);
    if (activeTab === 'CULTURALS' || activeTab === 'FUN_ACTIVITIES') return filtered;
    
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach(e => {
      const base = e.name.replace(/\s*\((Boys|Girls)\)/i, '').trim();
      if (!groups[base]) groups[base] = [];
      groups[base].push(e);
    });
    
    return Object.keys(groups).map(base => {
      const group = groups[base];
      if (group.length > 1) {
        return { ...group[0], name: `${base} (Boys & Girls)` };
      } else {
        return group[0];
      }
    });
  }, [events, activeTab]);

  const timelineSteps = [
    { date: 'July 18, 2026', title: 'Registration & Document Deadline',      desc: 'Final submission of participant registrations, ID cards, and required documents.' },
    { date: 'July 18, 2026', title: 'Payment Verification',                  desc: 'Verification of registration fees and confirmation of successful payments.' },
    { date: 'July 22, 2026', title: 'Day 1 - Sports Events',      desc: 'Team reporting, registration verification, inauguration ceremony, and commencement of sports competitions.' },
    { date: 'July 23, 2026', title: 'Day 2 - Cultural Events',  desc: 'Cultural competitions, award ceremony, and remaining sports finals (if applicable).' },
  ];

  const rules = [
    { accent: 'navy', icon: '01', title: 'Maximum 2 Teams Per Event',           body: 'A PU Institution can enter at most TWO teams (Team A and Team B) per event. Registration of a third team (Team C) is strictly blocked for SPORTS & CULTURALS (bypassed for FUN ACTIVITIES).' },
    { accent: 'navy', icon: '02', title: 'Event Day Verification & Chest Numbers', body: 'Only participants verified by the Registration Team receive official Chest Numbers and populate Hospitality, Scoreboards, and Certificates.' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar />

      {/* ══════════════════════════════════════════════
          1. HERO  —  Image slideshow left, text right
      ══════════════════════════════════════════════ */}
      <section className="pt-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[88vh] items-stretch">

            {/* ── Left: Slideshow image ── */}
            <div className="relative overflow-hidden rounded-none lg:rounded-r-3xl min-h-[50vh] lg:min-h-full">
              {/* Images — subtle brightness so they show clearly */}
              {HERO_IMAGES.map((src, i) => (
                <div
                  key={src}
                  className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1000ms] ease-in-out ${i === bgIndex ? 'opacity-100' : 'opacity-0'}`}
                  style={{ backgroundImage: `url('${src}')` }}
                />
              ))}
              {/* Light vignette only on the right edge so images stay vivid */}
              <div
                className="absolute inset-0"
                style={{ backgroundImage: 'linear-gradient(to right, transparent 60%, rgba(0, 0, 0, 0.55) 100%)' }}
              />
              {/* Bottom text overlay — dark strip so caption is readable */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent px-6 pb-6 pt-20">
                <p className="text-xs font-semibold text-white/80 uppercase tracking-widest">ANVESHA 2026 — Glimpses</p>
              </div>
              {/* Slide dots — bottom right */}
              <div className="absolute bottom-5 right-5 flex space-x-1.5">
                {HERO_IMAGES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setBgIndex(i)}
                    className={`rounded-full transition-all duration-300 ${i === bgIndex ? 'w-5 h-2 bg-christ-gold' : 'w-2 h-2 bg-white/50 hover:bg-white/80'}`}
                  />
                ))}
              </div>
            </div>

            {/* ── Right: Text content ── */}
            <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-16 lg:py-0 space-y-7 bg-slate-50">

              <div className="inline-flex items-center space-x-2 self-start bg-christ-gold/10 border border-christ-gold/30 px-4 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-christ-gold" />
                <span className="text-xs font-bold text-christ-gold uppercase tracking-widest">Christ University Presents</span>
              </div>

              <div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-christ-navy leading-tight font-serif">
                  ANVESHA<br />
                  <span className="text-christ-gold italic">2026</span>
                </h1>
              </div>

              <p className="text-base text-slate-600 leading-relaxed max-w-lg">
                The premier Annual Inter Pre-University Sports &amp; Cultural Championship of Christ University — uniting talent, grit, and spirit across Karnataka.
              </p>

              {/* Location & Date */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="inline-flex items-center space-x-2 text-sm text-slate-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm">
                  <MapPin className="w-4 h-4 text-christ-navy shrink-0" />
                  <span className="font-medium">Kengeri Campus, Mysore Road</span>
                </div>
                <div className="inline-flex items-center space-x-2 text-sm text-slate-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm">
                  <Calendar className="w-4 h-4 text-christ-navy shrink-0" />
                  <span className="font-medium">July 22 – 23, 2026</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center space-x-2 px-7 py-3.5 text-sm font-bold rounded-xl bg-christ-navy text-white shadow-md hover:bg-christ-darkNavy transition-all transform hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <span>Register Institution</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center space-x-2 px-7 py-3.5 text-sm font-semibold rounded-xl text-christ-navy bg-white border border-slate-300 hover:border-christ-navy transition-all shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-christ-gold" />
                  <span>Crew Portal Login</span>
                </Link>
              </div>

              {/* Stats row */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200">
                {[
                  { value: '50+',   label: 'PU Institutions',  gold: false },
                  { value: '9',     label: 'Flagship Events',   gold: true  },
                  { value: '1000+', label: 'Participants',      gold: false },
                ].map(({ value, label, gold }) => (
                  <div key={label}>
                    <p className={`text-2xl font-black font-serif ${gold ? 'text-christ-gold' : 'text-christ-navy'}`}>{value}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          2. ABOUT
      ══════════════════════════════════════════════ */}
      <section id="about" className="py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="max-w-3xl mx-auto text-center mb-16">
            <Label>About ANVESHA</Label>
            <h2 className="text-4xl font-bold text-christ-navy font-serif mb-4">Uniting Grit, Grace, and Harmony</h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-2xl mx-auto">
              ANVESHA stands as Christ University's grandest annual Pre-University showcase. Bridging the competitive intensity of athletic leagues with the creative brilliance of cultural stages, it is a crucible of leadership, teamwork, and artistic synergy where Karnataka’s finest colleges converge to compete and connect.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {[
              {
                icon: <Trophy className="w-6 h-6 text-christ-gold" />,
                bg: 'bg-christ-navy',
                title: 'Legacy of Sportsmanship',
                body: 'From the high-octane battlegrounds of our football turf to the intense coordination of volleyball and tug of war, we celebrate the true spirit of athletic teamwork.',
              },
              {
                icon: <Sparkles className="w-6 h-6 text-christ-navy" />,
                bg: 'bg-christ-gold',
                title: 'Vibrant Cultural Expression',
                body: 'Under the spotlight of group dance stages, group music showcases, and intellectual debate duels, students express their creative voices and articulate their vision.',
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-christ-gold" />,
                bg: 'bg-christ-navy',
                title: 'Digital Innovation Desk',
                body: 'With transparent real-time scoreboard calculations, on-ground spot registrations, and digital certificate validation desks, we deliver a seamless experience.',
              },
            ].map(({ icon, bg, title, body }) => (
              <div key={title} className="bg-slate-50 border border-slate-200 rounded-2xl p-7 hover:shadow-md transition-all group">
                <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-5`}>{icon}</div>
                <h3 className="text-base font-bold text-christ-navy font-serif mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          3. EVENTS CATALOG
      ══════════════════════════════════════════════ */}
      <section id="events" className="py-24 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <Label>Competition Catalog</Label>
              <h2 className="text-4xl font-bold text-christ-navy font-serif">Sports &amp; Cultural Events</h2>
            </div>
            {/* Filter tabs */}
            <div className="flex space-x-1.5 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
              {(['SPORTS', 'CULTURALS', 'FUN_ACTIVITIES'] as const).map(tab => {
                const count = events.filter(e => e.category === tab).length;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
                      activeTab === tab
                        ? 'bg-christ-navy text-white shadow'
                        : 'text-slate-500 hover:text-christ-navy'
                    }`}
                  >
                    {tab === 'SPORTS' ? 'SPORTS' : tab === 'CULTURALS' ? 'CULTURALS' : 'FUN ACTIVITIES'} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayEvents.map(evt => (
              <div key={evt.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 group">

                {/* Image — clearly visible, no heavy overlay */}
                <div className="h-48 relative overflow-hidden bg-slate-100">
                  <img
                    src={getEventImage(evt.id)}
                    alt={evt.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Minimal gradient only at bottom for badge readability */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {evt.category !== 'FUN_ACTIVITIES' && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-christ-navy text-white shadow">
                        {evt.type}
                      </span>
                    )}
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-christ-gold text-christ-navy shadow">
                      {evt.category === 'FUN_ACTIVITIES' ? 'Free Entry' : `₹${evt.registrationFee}`}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col flex-1 space-y-3">
                  <h3 className="text-base font-bold text-slate-900 font-serif group-hover:text-christ-navy transition-colors">{evt.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed flex-1">{evt.description}</p>

                  <div className="space-y-1.5 pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Key Guidelines</p>
                    {evt.rules.slice(0, 3).map((rule, i) => (
                      <div key={i} className="flex items-start space-x-2 text-[11px] text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-christ-gold shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 pb-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-[11px] text-slate-400">
                    Team: <strong className="text-slate-700">{evt.minTeamSize}–{evt.maxTeamSize} Members</strong>
                  </span>
                  <Link to="/register" className="inline-flex items-center space-x-1 text-xs font-bold text-christ-navy hover:text-christ-gold transition-colors">
                    <span>Register</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          4. TIMELINE
      ══════════════════════════════════════════════ */}
      <section id="timeline" className="py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="max-w-2xl mx-auto text-center mb-16">
            <Label>Event Roadmap</Label>
            <h2 className="text-4xl font-bold text-christ-navy font-serif">Fest Timeline &amp; Milestones</h2>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Center line */}
            <div className="absolute top-0 bottom-0 left-4 md:left-1/2 w-0.5 bg-christ-gold/30 pointer-events-none" />

            <div className="space-y-10">
              {timelineSteps.map((step, idx) => (
                <div key={idx} className="relative flex flex-col md:flex-row items-start md:items-center">
                  {/* Dot */}
                  <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-christ-gold shadow z-10" />

                  <div className={`ml-12 md:ml-0 md:w-1/2 ${idx % 2 === 0 ? 'md:pr-14 md:text-right' : 'md:pl-14 md:ml-auto'}`}>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all">
                      <div className={`inline-flex items-center space-x-1.5 text-xs font-bold text-christ-gold mb-2 ${idx % 2 === 0 ? 'md:flex-row-reverse md:space-x-reverse' : ''}`}>
                        <Clock className="w-3 h-3" />
                        <span>{step.date}</span>
                      </div>
                      <h4 className="text-sm font-bold text-christ-navy font-serif mb-1">{step.title}</h4>
                      <p className="text-xs text-slate-500">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          5. RULES
      ══════════════════════════════════════════════ */}
      <section id="rules" className="py-24 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="max-w-2xl mx-auto text-center mb-14">
            <Label>Participation Policy</Label>
            <h2 className="text-4xl font-bold text-christ-navy font-serif">Eligibility &amp; Competition Rules</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {rules.map((r, i) => (
              <div key={i} className={`relative bg-white border rounded-2xl p-7 overflow-hidden hover:shadow-md transition-all ${r.accent === 'gold' ? 'border-christ-gold/30' : 'border-slate-200'}`}>
                {/* Left accent bar */}
                <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-2xl ${r.accent === 'gold' ? 'bg-christ-gold' : 'bg-christ-navy'}`} />
                {/* Rule number */}
                <span className={`absolute top-5 right-6 text-4xl font-black font-serif opacity-5 ${r.accent === 'gold' ? 'text-christ-gold' : 'text-christ-navy'}`}>{r.icon}</span>
                <div className="pl-3">
                  <h4 className="text-sm font-bold text-christ-navy font-serif uppercase tracking-wide mb-3">{r.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          6. CONTACT
      ══════════════════════════════════════════════ */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            {/* Left info */}
            <div className="space-y-8">
              <div>
                <Label>Get In Touch</Label>
                <h2 className="text-4xl font-bold text-christ-navy font-serif">Fest Secretariat &amp; Campus Location</h2>
              </div>

              <div className="space-y-4">
                {[
                  { icon: <MapPin className="w-5 h-5 text-christ-navy" />, label: 'Christ University Kengeri Campus', value: 'Kanmanike, Kumbalgodu, Mysore Road, Bangalore, Karnataka - 560074, India.' },
                  { icon: <Phone className="w-5 h-5 text-christ-navy" />, label: 'Helpline Numbers',                  value: '080-40129100 / 080-40129200 (Extn: 981)' },
                  { icon: <Mail className="w-5 h-5 text-christ-navy" />,  label: 'Official Inquiry Email',             value: 'anvesha@fest.christuniversity.in' },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start space-x-4 bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:shadow-sm transition-all">
                    <div className="w-10 h-10 rounded-xl bg-christ-navy/8 flex items-center justify-center shrink-0">{icon}</div>
                    <div>
                      <strong className="block text-sm text-slate-900 font-serif mb-0.5">{label}</strong>
                      <span className="text-sm text-slate-500">{value}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/register"
                className="inline-flex items-center space-x-2 px-7 py-3.5 bg-christ-gold text-christ-navy text-sm font-bold rounded-xl hover:bg-christ-lightGold transition-all hover:-translate-y-0.5 shadow-md"
              >
                <span>Register Your Institution</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Right map card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="w-full h-80 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-slate-200 relative overflow-hidden">
                {/* Grid decoration */}
                <div className="absolute inset-0 opacity-30"
                  style={{ backgroundImage: 'linear-gradient(rgba(10,36,99,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(10,36,99,0.15) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="relative z-10 text-center p-8">
                  <div className="w-14 h-14 rounded-full bg-christ-navy/10 border border-christ-navy/20 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-7 h-7 text-christ-navy" />
                  </div>
                  <h4 className="font-bold text-christ-navy font-serif text-base mb-1">Christ University Kengeri Campus</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-5">Kanmanike, Kumbalgodu, Mysore Road, Bangalore - 560074</p>
                  <a
                    href="https://maps.google.com/?q=Christ+University+Kengeri+Campus+Bangalore"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-christ-navy text-white text-xs font-bold rounded-xl hover:bg-christ-darkNavy transition-all"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Open in Google Maps</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
