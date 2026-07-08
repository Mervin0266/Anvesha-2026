import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, Flame, ShieldCheck, Calendar, Users, Award, ChevronDown, 
  ChevronUp, ArrowRight, MapPin, Phone, Mail, CheckCircle2, AlertCircle, Sparkles 
} from 'lucide-react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { useEvents } from '../contexts/EventsContext';
import { EventCategory } from '../types';

export const Home: React.FC = () => {
  const { events } = useEvents();
  const [activeTab, setActiveTab] = useState<EventCategory>('SPORTS');
  const filteredEvents = events.filter(e => e.category === activeTab);

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

      {/* 2. Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-white via-slate-50 to-christ-lightBg relative overflow-hidden border-b border-slate-200/80">
        
        {/* Subtle background decorative shapes */}
        <div className="absolute top-10 right-0 w-96 h-96 bg-christ-gold/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-40 left-0 w-80 h-80 bg-christ-navy/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center space-x-2 bg-christ-navy/5 border border-christ-navy/15 px-3.5 py-1.5 rounded-full text-xs font-semibold text-christ-navy shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-christ-gold" />
                <span>CHRIST UNIVERSITY PRESENTS</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-christ-navy tracking-tight leading-[1.1] font-serif">
                ANVESHA <span className="text-christ-gold italic font-serif">2026</span>
              </h1>

              <p className="text-lg text-slate-700 font-medium leading-relaxed max-w-2xl">
                The premier Annual Inter Pre-University Sports & Cultural Championship of Christ University. Uniting talent, grit, and spirit across Karnataka & neighboring regions.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center space-x-2 px-7 py-3.5 text-sm font-bold rounded-xl bg-christ-gold text-christ-navy shadow-christ-gold hover:bg-christ-lightGold transition-all transform hover:-translate-y-0.5"
                >
                  <span>Register Institution</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 text-sm font-semibold rounded-xl text-christ-navy bg-white border border-slate-300 hover:border-christ-navy hover:bg-slate-50 transition-all shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-christ-navy" />
                  <span>Crew Portal Login</span>
                </Link>
              </div>

              {/* Quick Key Highlights */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/80">
                <div>
                  <p className="text-2xl font-black text-christ-navy font-serif">50+</p>
                  <p className="text-xs text-slate-500 font-medium">PU Institutions</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-christ-gold font-serif">9</p>
                  <p className="text-xs text-slate-500 font-medium">Flagship Events</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-christ-navy font-serif">1000+</p>
                  <p className="text-xs text-slate-500 font-medium">Participants</p>
                </div>
              </div>

            </div>

            {/* Right Illustration / Poster Card */}
            <div className="lg:col-span-5">
              <div className="bg-white p-4 rounded-2xl shadow-christ-card border border-slate-200/80 relative">
                <div className="bg-christ-navy rounded-xl p-8 text-white relative overflow-hidden">
                  <div className="absolute -right-6 -bottom-6 opacity-10 font-serif text-9xl font-bold">CU</div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="bg-christ-gold text-christ-navy text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Official Fest Banner</span>
                    <span className="text-xs text-slate-300">July 04 - 05, 2026</span>
                  </div>
                  <h3 className="text-2xl font-bold font-serif mb-2 text-white">ANVESHA 2026</h3>
                  <p className="text-xs text-christ-gold mb-6 font-medium">Christ University Main Campus, Bengaluru</p>

                  <div className="space-y-3 pt-4 border-t border-white/10 text-xs">
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-4 h-4 text-christ-gold" />
                      <span>4 Major Sports Tournaments</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Flame className="w-4 h-4 text-christ-gold" />
                      <span>5 Cultural Stage Competitions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-christ-gold" />
                      <span>Verified Digital Chest Number System</span>
                    </div>
                  </div>
                </div>
              </div>
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
            {filteredEvents.map((evt) => (
              <div key={evt.id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-christ-card transition-all group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-christ-gold/20 text-christ-navy border border-christ-gold/30">
                      {evt.type} EVENT
                    </span>
                    <span className="text-xs font-extrabold text-christ-navy font-serif">
                      ₹{evt.registrationFee} / Team
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 font-serif group-hover:text-christ-navy transition-colors">
                    {evt.name}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
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

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
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
                    <strong className="block text-slate-900 font-serif mb-1">Christ University Main Campus</strong>
                    <span>Hosur Road, Bhavani Nagar, S.G. Palya, Bengaluru, Karnataka 560029</span>
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
                  <h4 className="font-bold text-christ-navy font-serif text-sm">Christ University Main Campus Map</h4>
                  <p className="text-xs text-slate-500 mt-1">Hosur Road, Near Dairy Circle, Bengaluru</p>
                  <a
                    href="https://maps.google.com/?q=Christ+University+Hosur+Road+Bengaluru"
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
