import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, Flame, ShieldCheck, Calendar, Users, Award, ChevronDown, 
  ChevronUp, ArrowRight, MapPin, Phone, Mail, CheckCircle2, AlertCircle, Sparkles 
} from 'lucide-react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { useEvents } from '../contexts/EventsContext';
import { EventCategory } from '../types';

const getEventImage = (id: string): string => {
  const normalized = id.toLowerCase();
  if (normalized.includes('football_boys')) return '/images/events/football_boys.jpg';
  if (normalized.includes('football_girls')) return '/images/events/football_girls.jpg';
  if (normalized.includes('volleyball_boys')) return '/images/events/volleyball_boys.jpg';
  if (normalized.includes('volleyball_girls')) return '/images/events/volleyball_girls.jpg';
  if (normalized.includes('basketball_boys')) return '/images/events/basketball_boys.jpg';
  if (normalized.includes('basketball_girls')) return '/images/events/basketball_girls.jpg';
  if (normalized.includes('tug_of_war_boys') || normalized.includes('tugofwar_boys')) return '/images/events/tug_of_war_boys.jpg';
  if (normalized.includes('tug_of_war_girls') || normalized.includes('tugofwar_girls')) return '/images/events/tug_of_war_girls.jpg';
  if (normalized.includes('dance')) return '/images/events/dance.jpg';
  if (normalized.includes('music')) return '/images/events/music.jpg';
  if (normalized.includes('debate')) return '/images/events/debate.jpg';
  if (normalized.includes('open_mic') || normalized.includes('openmic')) return '/images/events/open_mic.jpg';
  if (normalized.includes('treasure_hunt')) return '/images/events/treasure_hunt.jpg';
  return '/images/events/default.jpg';
};

const FestGallery: React.FC = () => {
  const galleryImages = [
    { src: '/images/gallery/fest-sports1.png', title: 'Football Arena', desc: 'Fierce competition' },
    { src: '/images/gallery/fest-sports2.png', title: 'Basketball Courts', desc: 'Team coordination' },
    { src: '/images/gallery/fest-cultural1.png', title: 'Dance Stage', desc: 'Stunning choreography' },
    { src: '/images/gallery/fest-cultural2.png', title: 'Musical Performance', desc: 'Vocal excellence' },
    { src: '/images/gallery/fest-championship.png', title: 'Overall Victory', desc: 'Trophy ceremony' }
  ];

  return (
    <section id="gallery" className="py-20 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
          <span className="text-xs font-bold text-christ-gold uppercase tracking-wider bg-christ-navy/5 px-3 py-1 rounded-full border border-christ-navy/10">Highlights</span>
          <h2 className="text-3xl font-bold text-christ-navy font-serif">Glimpses of ANVESHA</h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            Relive the action, emotions, and crowning moments of the PU Fest.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((img, idx) => (
            <div key={idx} className="group relative h-64 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-slate-200 border border-slate-200/60">
              <img 
                src={img.src} 
                alt={img.title} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent opacity-85 group-hover:opacity-95 transition-opacity flex flex-col justify-end p-5 text-white">
                <h4 className="font-bold text-sm font-serif text-white">{img.title}</h4>
                <p className="text-[10px] text-slate-300">{img.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const Home: React.FC = () => {
  const { events } = useEvents();
  const [activeTab, setActiveTab] = useState<EventCategory>('SPORTS');

  const heroImages = [
    '/images/images/54803382962_a491a06135_o.jpg',
    '/images/images/54804478864_83a7ab18a8_o.jpg',
    '/images/images/54804479024_964acda267_o.jpg',
    '/images/images/54804479254_3b773ea6b7_o.jpg',
    '/images/images/54804486843_fcd3f03b8f_o.jpg',
    '/images/images/54804568260_62c289f9eb_o.jpg'
  ];

  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % heroImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);
  
  // Group sports to avoid duplicate cards for Boys and Girls on the Home page
  const displayEvents = React.useMemo(() => {
    const filtered = events.filter(e => e.category === activeTab);
    if (activeTab === 'CULTURAL') return filtered;
    
    const groupedMap = new Map<string, typeof events[0]>();
    filtered.forEach(e => {
      const baseName = e.name.replace(/\s*\((Boys|Girls)\)/i, '').trim();
      if (!groupedMap.has(baseName)) {
        groupedMap.set(baseName, {
          ...e,
          name: `${baseName} (Boys & Girls)`
        });
      }
    });
    return Array.from(groupedMap.values());
  }, [events, activeTab]);

  const timelineSteps = [
    { date: 'June 01, 2026', title: 'Online Registration Opens', desc: 'PU Colleges initiate registration on the official ANVESHA portal.' },
    { date: 'June 25, 2026', title: 'Registration & Document Deadline', desc: 'All participant records and ID proofs must be finalized.' },
    { date: 'June 28, 2026', title: 'Payment Verification', desc: 'Bank transaction receipts and college fee proofs verified.' },
    { date: 'July 04, 2026', title: 'Event Day & On-Site Verification', desc: 'Physical check-in, chest number allocation, and live matches.' },
    { date: 'July 05, 2026', title: 'Results Declaration & Award Ceremony', desc: 'Official score locking, trophy presentation, and certificate distribution.' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* 1. Navbar */}
      <Navbar />

      {/* 2. Hero Section — Full-bleed Cinematic */}
      <section className="relative min-h-[90vh] flex flex-col justify-end overflow-hidden isolate">

        {/* ── Slideshow Background ── */}
        <div className="absolute inset-0 -z-20">
          {heroImages.map((src, index) => (
            <div
              key={src}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1400ms] ease-in-out ${
                index === bgIndex ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ backgroundImage: `url('${src}')` }}
            />
          ))}
        </div>

        {/* ── Dark cinematic overlay ── */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              'linear-gradient(to top, rgba(10,18,40,0.96) 0%, rgba(10,18,40,0.72) 50%, rgba(10,18,40,0.30) 100%)',
          }}
        />

        {/* ── Slide dots ── */}
        <div className="absolute top-8 right-8 flex space-x-2 z-10">
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setBgIndex(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === bgIndex ? 'bg-christ-gold w-6' : 'bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>

        {/* ── Main content ── */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-20 pt-40">
          <div className="max-w-4xl">

            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-christ-gold/20 border border-christ-gold/40 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold text-christ-gold uppercase tracking-widest mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Christ University Presents</span>
            </div>

            {/* Headline */}
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold text-white leading-[1.0] tracking-tight font-serif mb-6 drop-shadow-xl">
              ANVESHA{' '}
              <span className="text-christ-gold italic">2026</span>
            </h1>

            {/* Sub-headline */}
            <p className="text-lg sm:text-xl text-white/80 font-medium leading-relaxed max-w-2xl mb-4">
              The premier Annual Inter Pre-University Sports &amp; Cultural Championship of Christ University — uniting talent, grit, and spirit across Karnataka.
            </p>

            {/* Location + Date pill */}
            <div className="flex flex-wrap gap-3 mb-10">
              <span className="inline-flex items-center space-x-1.5 text-sm text-white/70 bg-white/10 border border-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full">
                <MapPin className="w-3.5 h-3.5 text-christ-gold shrink-0" />
                <span>Kengeri Campus, Mysore Road, Bangalore</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 text-sm text-white/70 bg-white/10 border border-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full">
                <Calendar className="w-3.5 h-3.5 text-christ-gold shrink-0" />
                <span>July 04 – 05, 2026</span>
              </span>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center space-x-2 px-8 py-4 text-sm font-bold rounded-xl bg-christ-gold text-christ-navy shadow-lg hover:bg-christ-lightGold transition-all transform hover:-translate-y-0.5 hover:shadow-xl"
              >
                <span>Register Institution</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center space-x-2 px-7 py-4 text-sm font-semibold rounded-xl text-white bg-white/10 border border-white/25 backdrop-blur-sm hover:bg-white/20 transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-christ-gold" />
                <span>Crew Portal Login</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Stats strip at bottom ── */}
        <div className="relative z-10 border-t border-white/10 bg-black/30 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 divide-x divide-white/10 py-5">
              {[
                { value: '50+', label: 'PU Institutions' },
                { value: '9', label: 'Flagship Events', gold: true },
                { value: '1000+', label: 'Participants' },
              ].map(({ value, label, gold }) => (
                <div key={label} className="flex flex-col items-center px-4 text-center">
                  <span className={`text-3xl font-black font-serif ${gold ? 'text-christ-gold' : 'text-white'}`}>
                    {value}
                  </span>
                  <span className="text-xs text-white/55 font-medium mt-0.5">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. About Section */}
      <section id="about" className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-bold text-christ-gold uppercase tracking-wider bg-christ-navy/5 px-3 py-1 rounded-full border border-christ-navy/10">About ANVESHA</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-christ-navy font-serif">Cultivating Excellence & Sportsmanship</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              ANVESHA is Christ University’s flagship Inter PU Festival designed to foster healthy competition, talent discovery, and cultural harmony among Pre-University students.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-christ-navy text-christ-gold flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-christ-navy font-serif">State-of-the-Art Arenas</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Matches are hosted in FIFA-standard football turfs, synthetic basketball courts, and professional indoor auditoriums with official certified judges.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-christ-gold text-christ-navy flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-christ-navy font-serif">Transparent Real-Time Scoring</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Live result entry and locked scorecards guarantee zero tampering, ensuring absolute integrity for every competing college.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-christ-navy text-christ-gold flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-christ-navy font-serif">Digital Certificate Desk</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Instant digital certificate validation for all verified participants, winners, and overall championship trophies.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Events Section */}
      <section id="events" className="py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold text-christ-gold uppercase tracking-wider bg-christ-navy/5 px-3 py-1 rounded-full border border-christ-navy/10">Competition Catalog</span>
              <h2 className="text-3xl font-bold text-christ-navy font-serif mt-2">Sports & Cultural Events</h2>
            </div>

            {/* Filter Tabs */}
            <div className="mt-4 md:mt-0 flex space-x-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setActiveTab('SPORTS')}
                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'SPORTS'
                    ? 'bg-christ-navy text-white shadow-md'
                    : 'text-slate-600 hover:text-christ-navy'
                }`}
              >
                SPORTS (4)
              </button>
              <button
                onClick={() => setActiveTab('CULTURAL')}
                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'CULTURAL'
                    ? 'bg-christ-navy text-white shadow-md'
                    : 'text-slate-600 hover:text-christ-navy'
                }`}
              >
                CULTURAL (5)
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayEvents.map((evt) => (
              <div key={evt.id} className="bg-white rounded-xl border border-slate-200 flex flex-col justify-between hover:shadow-christ-card transition-all group overflow-hidden">
                <div>
                  {/* Image Header */}
                  <div className="h-48 w-full overflow-hidden relative bg-slate-100">
                    <img 
                      src={getEventImage(evt.id)} 
                      alt={evt.name} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Badge overlays on top of the image corner */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-christ-navy text-white shadow-sm">
                        {evt.type} EVENT
                      </span>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-christ-gold text-christ-navy shadow-sm">
                        ₹{evt.registrationFee}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 font-serif group-hover:text-christ-navy transition-colors">
                      {evt.name}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed min-h-[40px]">
                      {evt.description}
                    </p>

                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                      <p className="font-bold text-slate-900">Key Guidelines:</p>
                      <ul className="space-y-1">
                        {evt.rules.map((rule, idx) => (
                          <li key={idx} className="flex items-start space-x-1.5 text-[11px] text-slate-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-christ-gold shrink-0 mt-0.5" />
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 flex items-center justify-between border-t border-slate-100 mt-4">
                  <span className="text-[11px] font-medium text-slate-500">
                    Team Size: <strong className="text-slate-800">{evt.minTeamSize}-{evt.maxTeamSize} Members</strong>
                  </span>
                  <Link
                    to="/register"
                    className="inline-flex items-center space-x-1 text-xs font-bold text-christ-navy hover:text-christ-gold transition-colors"
                  >
                    <span>Register</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. Timeline Section */}
      <section id="timeline" className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
            <span className="text-xs font-bold text-christ-gold uppercase tracking-wider bg-christ-navy/5 px-3 py-1 rounded-full border border-christ-navy/10">Event Roadmap</span>
            <h2 className="text-3xl font-bold text-christ-navy font-serif">Fest Timeline & Milestones</h2>
          </div>

          <div className="relative space-y-12 max-w-4xl mx-auto">
            {/* Perfectly centered/aligned background line */}
            <div className="absolute top-0 bottom-0 left-4 md:left-1/2 w-0.5 bg-christ-gold/40 -translate-x-1/2 pointer-events-none" />

            {timelineSteps.map((step, idx) => (
              <div key={idx} className="relative flex flex-col md:flex-row items-start md:items-center">
                {/* Node dot aligned to center line */}
                <div className="w-5 h-5 rounded-full bg-christ-navy border-4 border-christ-gold absolute left-4 md:left-1/2 -translate-x-1/2 shadow-md z-10" />
                
                <div className={`ml-10 md:ml-0 md:w-1/2 ${idx % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:ml-auto'}`}>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-1 shadow-sm hover:shadow-md transition-shadow">
                    <span className="text-xs font-bold text-christ-gold font-serif">{step.date}</span>
                    <h4 className="text-base font-bold text-christ-navy font-serif">{step.title}</h4>
                    <p className="text-xs text-slate-600">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>



      {/* 6. Rules Section */}
      <section id="rules" className="py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
            <span className="text-xs font-bold text-christ-gold uppercase tracking-wider bg-christ-navy/5 px-3 py-1 rounded-full border border-christ-navy/10">Participation Policy</span>
            <h2 className="text-3xl font-bold text-christ-navy font-serif">Strict Business & Eligibility Rules</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            <div className="bg-white p-6 rounded-xl border-l-4 border-l-christ-navy border-slate-200 shadow-sm space-y-2">
              <h4 className="text-sm font-bold text-christ-navy font-serif uppercase tracking-wide">Rule 1: Maximum 2 Teams Per Event</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                A PU Institution can enter at most <strong>TWO teams (Team A and Team B)</strong> per event. Registration of a third team (Team C) is strictly blocked by the system backend.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border-l-4 border-l-christ-gold border-slate-200 shadow-sm space-y-2">
              <h4 className="text-sm font-bold text-christ-navy font-serif uppercase tracking-wide">Rule 2: One Participant = One Event Only</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                A student can participate in <strong>ONLY ONE EVENT</strong>. Combining Sports + Cultural or two Sports events is invalid. Cross-validation runs on Name, DOB, and Govt ID.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border-l-4 border-l-christ-navy border-slate-200 shadow-sm space-y-2">
              <h4 className="text-sm font-bold text-christ-navy font-serif uppercase tracking-wide">Rule 3: Duplicate Prevention</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                System enforces uniqueness on <strong>Name, DOB, Govt ID proof, Email, and Phone number</strong> to eliminate duplicate participant submissions.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border-l-4 border-l-christ-gold border-slate-200 shadow-sm space-y-2">
              <h4 className="text-sm font-bold text-christ-navy font-serif uppercase tracking-wide">Rule 4: Event Day Verification & Chest Numbers</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Only participants verified by the Registration Team receive official <strong>Chest Numbers</strong> and automatically populate Hospitality, Scoreboards, and Certificates.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* 8. Contact Section */}
      <section id="contact" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Info */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold text-christ-gold uppercase tracking-wider bg-christ-navy/5 px-3 py-1 rounded-full border border-christ-navy/10">Get In Touch</span>
              <h2 className="text-3xl font-bold text-christ-navy font-serif">Fest Secretariat & Campus Location</h2>
              
              <div className="space-y-4 text-xs text-slate-700">
                <div className="flex items-start space-x-3 p-4 bg-white rounded-xl border border-slate-200">
                  <MapPin className="w-5 h-5 text-christ-navy shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900 font-serif mb-1">Christ University Kengeri Campus</strong>
                    <span>Kanmanike, Kumbalgodu, Mysore Road, Bangalore, Karnataka - 560074, India.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-white rounded-xl border border-slate-200">
                  <Phone className="w-5 h-5 text-christ-navy shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900 font-serif mb-1">Helpline Numbers</strong>
                    <span>080-40129100 / 080-40129200 (Extn: 981)</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-white rounded-xl border border-slate-200">
                  <Mail className="w-5 h-5 text-christ-navy shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900 font-serif mb-1">Official Inquiry Email</strong>
                    <span>anvesha@christuniversity.in</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Preview Card */}
            <div className="lg:col-span-7 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="w-full h-80 rounded-xl bg-slate-200 relative overflow-hidden flex items-center justify-center border border-slate-300">
                <div className="text-center p-6 bg-white/90 backdrop-blur-md rounded-xl shadow-md max-w-md">
                  <MapPin className="w-8 h-8 text-christ-navy mx-auto mb-2" />
                  <h4 className="font-bold text-christ-navy font-serif text-sm">Christ University Kengeri Campus Map</h4>
                  <p className="text-xs text-slate-500 mt-1">Kanmanike, Kumbalgodu, Mysore Road, Bangalore - 560074</p>
                  <a
                    href="https://maps.google.com/?q=Christ+University+Kengeri+Campus+Bangalore"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-3 px-4 py-1.5 bg-christ-navy text-white text-xs font-bold rounded-lg hover:bg-christ-darkNavy"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 9. Footer */}
      <Footer />

    </div>
  );
};
