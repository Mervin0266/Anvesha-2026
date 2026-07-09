import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, Flame, ShieldCheck, Calendar, Users, Award,
  ArrowRight, MapPin, Phone, Mail, CheckCircle2, Sparkles,
  Music, Swords, Target, Clock
} from 'lucide-react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { useEvents } from '../contexts/EventsContext';
import { EventCategory } from '../types';

/* ─── helpers ──────────────────────────────────────────────────────────── */
const getEventImage = (id: string): string => {
  const n = id.toLowerCase();
  if (n.includes('football_boys'))   return '/images/events/football_boys.jpg';
  if (n.includes('football_girls'))  return '/images/events/football_girls.jpg';
  if (n.includes('volleyball_boys')) return '/images/events/volleyball_boys.jpg';
  if (n.includes('volleyball_girls'))return '/images/events/volleyball_girls.jpg';
  if (n.includes('basketball_boys')) return '/images/events/basketball_boys.jpg';
  if (n.includes('basketball_girls'))return '/images/events/basketball_girls.jpg';
  if (n.includes('tug_of_war_boys') || n.includes('tugofwar_boys'))   return '/images/events/tug_of_war_boys.jpg';
  if (n.includes('tug_of_war_girls') || n.includes('tugofwar_girls')) return '/images/events/tug_of_war_girls.jpg';
  if (n.includes('dance'))       return '/images/events/dance.jpg';
  if (n.includes('music'))       return '/images/events/music.jpg';
  if (n.includes('debate'))      return '/images/events/debate.jpg';
  if (n.includes('open_mic') || n.includes('openmic')) return '/images/events/open_mic.jpg';
  if (n.includes('treasure_hunt'))   return '/images/events/treasure_hunt.jpg';
  return '/images/events/default.jpg';
};

const HERO_IMAGES = [
  '/images/images/54803382962_a491a06135_o.jpg',
  '/images/images/54804478864_83a7ab18a8_o.jpg',
  '/images/images/54804479024_964acda267_o.jpg',
  '/images/images/54804479254_3b773ea6b7_o.jpg',
  '/images/images/54804486843_fcd3f03b8f_o.jpg',
  '/images/images/54804568260_62c289f9eb_o.jpg',
];

/* ─── Component ─────────────────────────────────────────────────────────── */
export const Home: React.FC = () => {
  const { events } = useEvents();
  const [activeTab, setActiveTab] = useState<EventCategory>('SPORTS');
  const [bgIndex, setBgIndex]     = useState(0);

  useEffect(() => {
    const t = setInterval(() => setBgIndex(p => (p + 1) % HERO_IMAGES.length), 4500);
    return () => clearInterval(t);
  }, []);

  /* Merge Boys/Girls sports into one card on the catalog */
  const displayEvents = React.useMemo(() => {
    const filtered = events.filter(e => e.category === activeTab);
    if (activeTab === 'CULTURAL') return filtered;
    const map = new Map<string, typeof filtered[0]>();
    filtered.forEach(e => {
      const base = e.name.replace(/\s*\((Boys|Girls)\)/i, '').trim();
      if (!map.has(base)) map.set(base, { ...e, name: `${base} (Boys & Girls)` });
    });
    return Array.from(map.values());
  }, [events, activeTab]);

  const timelineSteps = [
    { date: 'June 01, 2026', title: 'Online Registration Opens',           desc: 'PU Colleges initiate registration on the official ANVESHA portal.' },
    { date: 'June 25, 2026', title: 'Registration & Document Deadline',     desc: 'All participant records and ID proofs must be finalized.' },
    { date: 'June 28, 2026', title: 'Payment Verification',                 desc: 'Bank transaction receipts and college fee proofs verified.' },
    { date: 'July 04, 2026', title: 'Event Day & On-Site Verification',     desc: 'Physical check-in, chest number allocation, and live matches.' },
    { date: 'July 05, 2026', title: 'Results Declaration & Award Ceremony', desc: 'Official score locking, trophy presentation, and certificate distribution.' },
  ];

  const rules = [
    { accent: 'navy', title: 'Rule 1: Maximum 2 Teams Per Event',             body: 'A PU Institution can enter at most TWO teams (Team A and Team B) per event. Registration of a third team is strictly blocked by the system backend.' },
    { accent: 'gold', title: 'Rule 2: One Participant = One Event Only',       body: 'A student can participate in ONLY ONE EVENT. Combining Sports + Cultural or two Sports events is invalid. Cross-validation runs on Name, DOB, and Govt ID.' },
    { accent: 'navy', title: 'Rule 3: Duplicate Prevention',                   body: 'System enforces uniqueness on Name, DOB, Govt ID proof, Email, and Phone number to eliminate duplicate participant submissions.' },
    { accent: 'gold', title: 'Rule 4: Event Day Verification & Chest Numbers', body: 'Only participants verified by the Registration Team receive official Chest Numbers and automatically populate Hospitality, Scoreboards, and Certificates.' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col font-sans">
      <Navbar />

      {/* ══════════════════════ 1. HERO ══════════════════════ */}
      <section className="relative min-h-[95vh] flex flex-col justify-end overflow-hidden isolate">

        {/* Slideshow */}
        <div className="absolute inset-0 -z-20">
          {HERO_IMAGES.map((src, i) => (
            <div
              key={src}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1600ms] ease-in-out ${i === bgIndex ? 'opacity-100' : 'opacity-0'}`}
              style={{ backgroundImage: `url('${src}')` }}
            />
          ))}
        </div>

        {/* Cinematic gradient overlay */}
        <div className="absolute inset-0 -z-10" style={{
          backgroundImage: 'linear-gradient(to top, rgba(10,14,26,0.98) 0%, rgba(10,14,26,0.75) 45%, rgba(10,14,26,0.25) 100%)'
        }} />

        {/* Slide dots — top right */}
        <div className="absolute top-28 right-6 sm:right-10 flex flex-col space-y-2 z-10">
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setBgIndex(i)}
              className={`rounded-full transition-all duration-300 ${i === bgIndex ? 'w-2 h-6 bg-amber-400' : 'w-2 h-2 bg-white/30 hover:bg-white/60'}`}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-0 pt-40">
          <div className="max-w-3xl">

            {/* Eyebrow badge */}
            <div className="inline-flex items-center space-x-2 bg-amber-400/15 border border-amber-400/30 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold text-amber-400 uppercase tracking-widest mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Christ University Presents</span>
            </div>

            <h1 className="text-7xl sm:text-8xl lg:text-[6rem] font-extrabold text-white leading-none tracking-tight font-serif mb-6">
              ANVESHA <span className="text-amber-400 italic">2026</span>
            </h1>

            <p className="text-xl text-white/70 font-medium leading-relaxed max-w-2xl mb-8">
              The premier Annual Inter Pre-University Sports &amp; Cultural Championship — uniting talent, grit &amp; spirit across Karnataka.
            </p>

            {/* Location / Date pills */}
            <div className="flex flex-wrap gap-3 mb-10">
              {[
                { icon: <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />, text: 'Kengeri Campus, Mysore Road, Bangalore' },
                { icon: <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />, text: 'July 04 – 05, 2026' },
              ].map(({ icon, text }) => (
                <span key={text} className="inline-flex items-center space-x-2 text-sm text-white/65 bg-white/8 border border-white/12 backdrop-blur-sm px-4 py-2 rounded-full">
                  {icon}<span>{text}</span>
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/register" className="inline-flex items-center justify-center space-x-2 px-8 py-4 text-sm font-bold rounded-xl bg-amber-400 text-[#0a0e1a] shadow-lg hover:bg-amber-300 transition-all transform hover:-translate-y-0.5 hover:shadow-amber-400/30 hover:shadow-xl">
                <span>Register Institution</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center space-x-2 px-7 py-4 text-sm font-semibold rounded-xl text-white bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/18 transition-all">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Crew Portal Login</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative z-10 mt-16 border-t border-white/8 bg-black/40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 divide-x divide-white/8 py-6">
              {[{ v: '50+', l: 'PU Institutions' }, { v: '9', l: 'Flagship Events', gold: true }, { v: '1000+', l: 'Participants' }].map(({ v, l, gold }) => (
                <div key={l} className="flex flex-col items-center text-center px-4">
                  <span className={`text-3xl font-black font-serif ${gold ? 'text-amber-400' : 'text-white'}`}>{v}</span>
                  <span className="text-xs text-white/45 font-medium mt-1">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ 2. ABOUT ══════════════════════ */}
      <section id="about" className="py-24 bg-[#0d1120]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="max-w-2xl mx-auto text-center mb-16">
            <span className="inline-block text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 border border-amber-400/20 px-4 py-1.5 rounded-full mb-5">About ANVESHA</span>
            <h2 className="text-4xl font-bold text-white font-serif mb-4">Cultivating Excellence &amp; Sportsmanship</h2>
            <p className="text-slate-400 text-sm leading-relaxed">ANVESHA is Christ University's flagship Inter PU Festival designed to foster healthy competition, talent discovery, and cultural harmony among Pre-University students.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Trophy className="w-6 h-6" />, iconBg: 'bg-amber-400/15', iconColor: 'text-amber-400', title: 'State-of-the-Art Arenas', body: 'FIFA-standard football turfs, synthetic basketball courts, and professional indoor auditoriums with official certified judges.' },
              { icon: <ShieldCheck className="w-6 h-6" />, iconBg: 'bg-blue-400/15', iconColor: 'text-blue-400', title: 'Transparent Real-Time Scoring', body: 'Live result entry and locked scorecards guarantee zero tampering, ensuring absolute integrity for every competing college.' },
              { icon: <Award className="w-6 h-6" />, iconBg: 'bg-emerald-400/15', iconColor: 'text-emerald-400', title: 'Digital Certificate Desk', body: 'Instant digital certificate validation for all verified participants, winners, and overall championship trophies.' },
            ].map(({ icon, iconBg, iconColor, title, body }) => (
              <div key={title} className="group relative bg-white/4 border border-white/8 rounded-2xl p-7 hover:bg-white/7 hover:border-white/14 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className={`w-12 h-12 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center mb-5`}>{icon}</div>
                <h3 className="text-base font-bold text-white font-serif mb-2">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ 3. EVENTS CATALOG ══════════════════════ */}
      <section id="events" className="py-24 bg-[#0a0e1a] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="inline-block text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 border border-amber-400/20 px-4 py-1.5 rounded-full mb-4">Competition Catalog</span>
              <h2 className="text-4xl font-bold text-white font-serif">Sports &amp; Cultural Events</h2>
            </div>
            <div className="flex space-x-1 bg-white/5 border border-white/10 p-1.5 rounded-xl">
              {(['SPORTS', 'CULTURAL'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-amber-400 text-[#0a0e1a] shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  {tab === 'SPORTS' ? 'SPORTS (4)' : 'CULTURAL (5)'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayEvents.map(evt => (
              <div key={evt.id} className="group relative bg-white/4 border border-white/8 rounded-2xl overflow-hidden hover:border-amber-400/30 transition-all duration-300 flex flex-col">

                {/* Image */}
                <div className="h-52 w-full overflow-hidden relative bg-slate-800">
                  <img
                    src={getEventImage(evt.id)}
                    alt={evt.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a]/90 via-[#0a0e1a]/30 to-transparent" />
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#0a0e1a]/80 text-amber-400 border border-amber-400/30 backdrop-blur-sm">
                      {evt.type} EVENT
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-400/90 text-[#0a0e1a]">
                      ₹{evt.registrationFee}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1 space-y-4">
                  <h3 className="text-lg font-bold text-white font-serif group-hover:text-amber-400 transition-colors">{evt.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed flex-1">{evt.description}</p>

                  <div className="space-y-1.5 pt-3 border-t border-white/6">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Key Guidelines</p>
                    {evt.rules.slice(0, 3).map((rule, i) => (
                      <div key={i} className="flex items-start space-x-2 text-[11px] text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400/70 shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Team: <strong className="text-slate-300">{evt.minTeamSize}–{evt.maxTeamSize} Members</strong></span>
                  <Link to="/register" className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">
                    <span>Register</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ 4. TIMELINE ══════════════════════ */}
      <section id="timeline" className="py-24 bg-[#0d1120] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="max-w-2xl mx-auto text-center mb-16">
            <span className="inline-block text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 border border-amber-400/20 px-4 py-1.5 rounded-full mb-5">Event Roadmap</span>
            <h2 className="text-4xl font-bold text-white font-serif">Fest Timeline &amp; Milestones</h2>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Center line */}
            <div className="absolute top-0 bottom-0 left-4 md:left-1/2 w-px bg-gradient-to-b from-transparent via-amber-400/40 to-transparent pointer-events-none" />

            <div className="space-y-10">
              {timelineSteps.map((step, idx) => (
                <div key={idx} className="relative flex flex-col md:flex-row items-start md:items-center">
                  {/* Dot */}
                  <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#0d1120] border-2 border-amber-400 shadow-lg shadow-amber-400/20 z-10" />
                  <div className={`ml-12 md:ml-0 md:w-1/2 ${idx % 2 === 0 ? 'md:pr-14 md:text-right' : 'md:pl-14 md:ml-auto'}`}>
                    <div className="bg-white/4 border border-white/8 hover:border-amber-400/20 rounded-2xl p-5 transition-all duration-300 group">
                      <div className={`inline-flex items-center space-x-1.5 text-xs font-bold text-amber-400 mb-2 ${idx % 2 === 0 ? 'md:flex-row-reverse md:space-x-reverse' : ''}`}>
                        <Clock className="w-3 h-3" /><span>{step.date}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white font-serif mb-1">{step.title}</h4>
                      <p className="text-xs text-slate-400">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ 5. RULES ══════════════════════ */}
      <section id="rules" className="py-24 bg-[#0a0e1a] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="inline-block text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 border border-amber-400/20 px-4 py-1.5 rounded-full mb-5">Participation Policy</span>
            <h2 className="text-4xl font-bold text-white font-serif">Eligibility &amp; Competition Rules</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
            {rules.map((r, i) => (
              <div key={i} className={`relative bg-white/4 border rounded-2xl p-7 overflow-hidden group hover:bg-white/6 transition-all duration-300 ${r.accent === 'gold' ? 'border-amber-400/15 hover:border-amber-400/30' : 'border-white/8 hover:border-blue-400/20'}`}>
                <div className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl ${r.accent === 'gold' ? 'bg-amber-400' : 'bg-blue-500'}`} />
                <h4 className="text-sm font-bold text-white font-serif uppercase tracking-wide mb-3 pl-2">{r.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed pl-2" dangerouslySetInnerHTML={{ __html: r.body.replace(/(TWO teams \(Team A and Team B\)|ONLY ONE EVENT|Name, DOB, Govt ID proof, Email, and Phone number|Chest Numbers)/g, '<strong class="text-white">$1</strong>') }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ 6. CONTACT ══════════════════════ */}
      <section id="contact" className="py-24 bg-[#0d1120] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            {/* Left Info */}
            <div className="space-y-8">
              <div>
                <span className="inline-block text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 border border-amber-400/20 px-4 py-1.5 rounded-full mb-5">Get In Touch</span>
                <h2 className="text-4xl font-bold text-white font-serif">Fest Secretariat &amp; Campus Location</h2>
              </div>

              <div className="space-y-4">
                {[
                  { icon: <MapPin className="w-5 h-5 text-amber-400 shrink-0" />, label: 'Christ University Kengeri Campus', value: 'Kanmanike, Kumbalgodu, Mysore Road, Bangalore, Karnataka - 560074, India.' },
                  { icon: <Phone className="w-5 h-5 text-amber-400 shrink-0" />, label: 'Helpline Numbers', value: '080-40129100 / 080-40129200 (Extn: 981)' },
                  { icon: <Mail className="w-5 h-5 text-amber-400 shrink-0" />, label: 'Official Inquiry Email', value: 'anvesha@christuniversity.in' },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start space-x-4 bg-white/4 border border-white/8 rounded-2xl p-5 hover:border-amber-400/20 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0">{icon}</div>
                    <div>
                      <strong className="block text-sm text-white font-serif mb-0.5">{label}</strong>
                      <span className="text-xs text-slate-400">{value}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/register"
                className="inline-flex items-center space-x-2 px-7 py-3.5 bg-amber-400 text-[#0a0e1a] text-sm font-bold rounded-xl hover:bg-amber-300 transition-all hover:-translate-y-0.5 shadow-lg"
              >
                <span>Register Your Institution</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Right Map Card */}
            <div className="bg-white/4 border border-white/8 rounded-2xl p-4 hover:border-amber-400/20 transition-all">
              <div className="w-full h-80 rounded-xl bg-gradient-to-br from-[#0a0e1a] to-[#131929] flex items-center justify-center border border-white/6 relative overflow-hidden">
                {/* Decorative grid */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(250,204,21,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(250,204,21,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="text-center p-8 relative z-10">
                  <div className="w-14 h-14 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-7 h-7 text-amber-400" />
                  </div>
                  <h4 className="font-bold text-white font-serif text-base mb-1">Christ University Kengeri Campus</h4>
                  <p className="text-xs text-slate-400 mt-1 mb-5">Kanmanike, Kumbalgodu, Mysore Road, Bangalore - 560074</p>
                  <a
                    href="https://maps.google.com/?q=Christ+University+Kengeri+Campus+Bangalore"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-amber-400 text-[#0a0e1a] text-xs font-bold rounded-xl hover:bg-amber-300 transition-all"
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
