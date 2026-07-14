import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Header } from '../../components/common/Header';
import { Award, Download, Printer, Search, CheckCircle2, Shield } from 'lucide-react';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export const CertificateDashboard: React.FC = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; certificates: any[] }>('/certificates');
      if (res.success) {
        setCertificates(res.certificates);
        if (res.certificates.length > 0) setSelectedCert(res.certificates[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const filtered = certificates.filter(c => {
    const matchesSearch = c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.institutionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.certificateCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || c.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
      <Sidebar currentRole={user?.role || 'certificate_team'} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden pt-16 lg:pt-0">
        <Header title="Official Certificate Generation Desk" subtitle="Preview, print, and export verified Participation and Merit certificates." />

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Roster Panel */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search participant or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none"
                  />
                </div>

                <div className="flex space-x-1.5 overflow-x-auto text-[11px] font-bold">
                  {(['ALL', 'PARTICIPATION', 'WINNER', 'RUNNER_UP'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setFilterType(t)}
                      className={`px-3 py-1 rounded-lg border transition-all ${
                        filterType === t ? 'bg-christ-navy text-white border-christ-navy' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-christ-navy font-serif">Verified Certificate List ({filtered.length})</span>
                  <button onClick={handlePrint} className="text-xs font-bold text-christ-gold flex items-center space-x-1 hover:underline">
                    <Download className="w-3.5 h-3.5" />
                    <span>Bulk PDF ZIP</span>
                  </button>
                </div>

                {loading ? (
                  <div className="p-6 text-center text-xs text-slate-500">Loading certificates...</div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                    {filtered.map((cert) => (
                      <div
                        key={cert.id}
                        onClick={() => setSelectedCert(cert)}
                        className={`p-3.5 cursor-pointer transition-all ${
                          selectedCert?.id === cert.id ? 'bg-christ-navy/10 border-l-4 border-l-christ-navy' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 text-xs font-bold">{cert.participantName}</strong>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                            cert.type === 'WINNER' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {cert.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{cert.institutionName}</p>
                        <span className="text-[10px] font-mono text-christ-gold font-bold">{cert.certificateCode}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Live Certificate Preview */}
            <div className="lg:col-span-7">
              {selectedCert ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-christ-card space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live PDF Preview</span>
                    <button
                      onClick={handlePrint}
                      className="px-4 py-2 bg-christ-navy text-white text-xs font-bold rounded-lg hover:bg-christ-darkNavy inline-flex items-center space-x-2 shadow-sm"
                    >
                      <Printer className="w-4 h-4 text-christ-gold" />
                      <span>Print / Download PDF</span>
                    </button>
                  </div>

                  {/* High Quality Printable Certificate Frame */}
                  <div className="printable-certificate border-8 border-double border-christ-navy p-8 rounded-xl bg-gradient-to-br from-amber-50/30 via-white to-amber-50/20 text-center space-y-6 relative overflow-hidden shadow-inner">
                    
                    {/* Corner Gold Flourishes */}
                    <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-christ-gold" />
                    <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-christ-gold" />
                    <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-christ-gold" />
                    <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-christ-gold" />

                    {/* Header */}
                    <div className="space-y-1">
                      <div className="w-12 h-12 rounded-full bg-christ-navy text-christ-gold flex items-center justify-center font-serif font-bold text-xl mx-auto shadow-md">
                        CU
                      </div>
                      <h2 className="text-2xl font-extrabold text-christ-navy font-serif tracking-wide pt-2">CHRIST UNIVERSITY</h2>
                      <p className="text-xs font-bold text-christ-gold tracking-widest uppercase">Hosur Road, Bengaluru, Karnataka</p>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xl font-serif font-bold italic text-slate-800">
                        CERTIFICATE OF {selectedCert.type === 'WINNER' ? 'EXCELLENCE' : 'PARTICIPATION'}
                      </h3>
                      <p className="text-[11px] text-slate-500">ANVESHA 2026 • Inter PU Sports & Cultural Fest</p>
                    </div>

                    {/* Body */}
                    <div className="space-y-3 py-2 text-xs text-slate-700 leading-relaxed max-w-lg mx-auto">
                      <p>This is proudly presented to</p>
                      <h4 className="text-2xl font-black text-christ-navy font-serif border-b-2 border-christ-gold inline-block px-6 py-1">
                        {selectedCert.participantName}
                      </h4>
                      <p>
                        of <strong className="text-slate-900">{selectedCert.institutionName}</strong> for outstanding performance in{' '}
                        <strong className="text-christ-navy">{selectedCert.eventName}</strong>.
                      </p>
                    </div>

                    {/* Footer Signatures & QR Code */}
                    <div className="pt-8 grid grid-cols-3 gap-4 items-end text-[10px] text-slate-600 border-t border-slate-200/80">
                      <div>
                        <div className="w-24 h-8 border-b border-slate-400 mx-auto mb-1 flex items-center justify-center italic font-serif text-slate-500">Fr. Biju K C</div>
                        <p className="font-bold text-slate-900">Rev. Fr. Principal</p>
                        <span>Christ Junior College</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-christ-gold/20 border-2 border-christ-gold text-christ-navy flex items-center justify-center font-serif text-[10px] font-bold shadow-inner mb-1">
                          GOLD SEAL
                        </div>
                        <span className="font-mono text-[9px] font-bold text-christ-navy">{selectedCert.certificateCode}</span>
                      </div>

                      <div>
                        <div className="w-24 h-8 border-b border-slate-400 mx-auto mb-1 flex items-center justify-center italic font-serif text-slate-500">Dr. Joseph K</div>
                        <p className="font-bold text-slate-900">Chief Convenor</p>
                        <span>ANVESHA 2026</span>
                      </div>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                  Select a participant from the list to preview certificate.
                </div>
              )}
            </div>

          </div>

        </main>
      </div>
    </div>
  );
};
