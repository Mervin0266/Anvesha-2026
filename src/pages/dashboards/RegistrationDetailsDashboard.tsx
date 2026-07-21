import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Header } from '../../components/common/Header';
import { 
  FileSpreadsheet, Search, Download, UserCheck, 
  Users, CheckCircle2, AlertCircle, Filter, Trophy
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface RegistrationDetail {
  participantId: string;
  participantName: string;
  gender: string;
  dob: string;
  className: string;
  chestNumber: string | null;
  verificationStatus: string;
  emergencyContact: string;
  rosterStatus: string;
  teamName: string | null;
  institutionName: string;
  pocName: string;
  pocMobile: string;
  pocEmail: string;
  eventId: string;
  eventName: string;
  eventCategory: string;
}

export const RegistrationDetailsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<RegistrationDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering & View Modes
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'SPORTS' | 'CULTURALS' | 'FUN_ACTIVITIES'>('ALL');
  const [viewMode, setViewMode] = useState<'TEAMS' | 'FLAT'>('TEAMS');

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ success: boolean; registrations: RegistrationDetail[] }>('/admin/registrations');
      if (res.success) {
        setRegistrations(res.registrations);
      } else {
        setError('Failed to fetch registration records.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while loading data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (registrations.length === 0) {
      alert('No registration data available to export.');
      return;
    }

    // Group registrations by eventName
    const grouped: Record<string, RegistrationDetail[]> = {};
    
    registrations.forEach(reg => {
      const eName = reg.eventName || 'General';
      if (!grouped[eName]) {
        grouped[eName] = [];
      }
      grouped[eName].push(reg);
    });

    const escapeXml = (str: any) => {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const sanitizeTabName = (name: string) => {
      return name.replace(/[:\\/?*\[\]]/g, '').substring(0, 30);
    };

    let worksheetsXml = '';

    // Create a tab for each event
    Object.keys(grouped).forEach(evtName => {
      const safeTabName = sanitizeTabName(evtName);
      const rows = grouped[evtName];

      let rowsXml = `
        <Row ss:AutoFitHeight="0" ss:Height="24">
          <Cell ss:StyleID="Header"><Data ss:Type="String">Participant Name</Data></Cell>
          <Cell ss:StyleID="Header"><Data ss:Type="String">Gender</Data></Cell>
          <Cell ss:StyleID="Header"><Data ss:Type="String">Date of Birth</Data></Cell>
          <Cell ss:StyleID="Header"><Data ss:Type="String">PU Class</Data></Cell>
          <Cell ss:StyleID="Header"><Data ss:Type="String">Institution Name</Data></Cell>
          <Cell ss:StyleID="Header"><Data ss:Type="String">Team</Data></Cell>
          <Cell ss:StyleID="Header"><Data ss:Type="String">POC Name</Data></Cell>
          <Cell ss:StyleID="Header"><Data ss:Type="String">POC Contact</Data></Cell>
          <Cell ss:StyleID="Header"><Data ss:Type="String">POC Email</Data></Cell>
          <Cell ss:StyleID="Header"><Data ss:Type="String">Chest Number</Data></Cell>
          <Cell ss:StyleID="Header"><Data ss:Type="String">Verification Status</Data></Cell>
        </Row>
      `;

      rows.forEach(r => {
        rowsXml += `
          <Row ss:AutoFitHeight="0">
            <Cell><Data ss:Type="String">${escapeXml(r.participantName)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(r.gender)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(r.dob)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(r.className)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(r.institutionName)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(r.teamName || 'N/A')}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(r.pocName)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(r.pocMobile)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(r.pocEmail)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(r.chestNumber || 'Pending')}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(r.verificationStatus)}</Data></Cell>
          </Row>
        `;
      });

      worksheetsXml += `
        <Worksheet ss:Name="${escapeXml(safeTabName)}">
          <Table ss:ExpandedColumnCount="11" ss:ExpandedRowCount="${rows.length + 5}" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="18">
            <Column ss:Width="160"/>
            <Column ss:Width="70"/>
            <Column ss:Width="90"/>
            <Column ss:Width="100"/>
            <Column ss:Width="200"/>
            <Column ss:Width="70"/>
            <Column ss:Width="140"/>
            <Column ss:Width="110"/>
            <Column ss:Width="160"/>
            <Column ss:Width="100"/>
            <Column ss:Width="120"/>
            ${rowsXml}
          </Table>
        </Worksheet>
      `;
    });

    const workbookXml = `<?xml version="1.0" encoding="UTF-8"?>
      <?mso-application progid="Excel.Sheet"?>
      <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:html="http://www.w3.org/TR/REC-html40">
        <Styles>
          <Style ss:ID="Header">
            <Font ss:Bold="1" ss:Color="#FFFFFF"/>
            <Interior ss:Color="#0A2463" ss:Pattern="Solid"/>
            <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
          </Style>
        </Styles>
        ${worksheetsXml}
      </Workbook>`;

    const blob = new Blob([workbookXml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Anvesha_2026_Master_Registrations_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = 
      searchTerm === '' ||
      reg.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.institutionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reg.chestNumber && reg.chestNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (reg.teamName && reg.teamName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'ALL' || 
      reg.verificationStatus === statusFilter;

    const matchesCategory = 
      categoryFilter === 'ALL' ||
      reg.eventCategory === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Group participants by Team (Institution + Event + TeamName)
  interface TeamGroup {
    groupKey: string;
    institutionName: string;
    eventName: string;
    eventCategory: string;
    teamName: string;
    pocName: string;
    pocMobile: string;
    pocEmail: string;
    verificationStatus: string;
    chestNumber: string | null;
    participants: RegistrationDetail[];
  }

  const groupedTeams = React.useMemo(() => {
    const map = new Map<string, TeamGroup>();
    filteredRegistrations.forEach(reg => {
      const key = `${reg.institutionName}___${reg.eventName}___${reg.teamName || 'Team A'}`;
      if (!map.has(key)) {
        map.set(key, {
          groupKey: key,
          institutionName: reg.institutionName,
          eventName: reg.eventName,
          eventCategory: reg.eventCategory,
          teamName: reg.teamName || 'Team A',
          pocName: reg.pocName,
          pocMobile: reg.pocMobile,
          pocEmail: reg.pocEmail,
          verificationStatus: reg.verificationStatus,
          chestNumber: reg.chestNumber,
          participants: []
        });
      }
      map.get(key)!.participants.push(reg);
    });
    return Array.from(map.values());
  }, [filteredRegistrations]);

  const totalRegistered = registrations.length;
  const verifiedCount = registrations.filter(r => r.verificationStatus === 'VERIFIED').length;
  const uniqueColleges = new Set(registrations.map(r => r.institutionName)).size;
  const totalEvents = new Set(registrations.map(r => r.eventId)).size;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentRole="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Registration Details Ledgers" />

        <main className="flex-grow p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-christ-navy/10 flex items-center justify-center text-christ-navy shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Registered</p>
                <p className="text-xl font-bold text-christ-navy mt-0.5">{totalRegistered}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Verified Desk Check-Ins</p>
                <p className="text-xl font-bold text-emerald-700 mt-0.5">{verifiedCount}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-christ-gold/15 flex items-center justify-center text-christ-gold shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Unique Institutions</p>
                <p className="text-xl font-bold text-christ-navy mt-0.5">{uniqueColleges}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Active Events</p>
                <p className="text-xl font-bold text-christ-navy mt-0.5">{totalEvents}</p>
              </div>
            </div>
          </div>

          {/* Table Control Panel */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-christ-navy font-serif">Participant Registrations Ledger</h2>
                <p className="text-xs text-slate-500">Query student rosters grouped by institution & team, or export multi-tab Excel workbooks.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewMode('TEAMS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'TEAMS' ? 'bg-white text-christ-navy shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <span>👥 Grouped by Team ({groupedTeams.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('FLAT')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'FLAT' ? 'bg-white text-christ-navy shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <span>📋 All Participants ({filteredRegistrations.length})</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm shrink-0"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export Excel</span>
                </button>
              </div>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search name, institution, event, team or chest number..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs focus:ring-1 focus:ring-christ-gold focus:border-christ-gold focus:outline-none placeholder:text-slate-400"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:outline-none focus:ring-1 focus:ring-christ-gold"
                >
                  <option value="ALL">All Verification Statuses</option>
                  <option value="VERIFIED">Verified Only</option>
                  <option value="PENDING">Pending Verification</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:outline-none focus:ring-1 focus:ring-christ-gold"
                >
                  <option value="ALL">All Event Categories</option>
                  <option value="SPORTS">Sports only</option>
                  <option value="CULTURALS">Culturals only</option>
                  <option value="FUN_ACTIVITIES">Fun Activities only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Roster View Container */}
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs font-bold text-slate-400 flex flex-col items-center justify-center space-y-2">
              <div className="w-6 h-6 border-2 border-christ-navy border-t-christ-gold rounded-full animate-spin"></div>
              <span>Loading registration details...</span>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs font-bold text-rose-500 flex items-center justify-center space-x-2">
              <AlertCircle className="w-4.5 h-4.5" />
              <span>{error}</span>
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs font-bold text-slate-400">
              No matching registration details found.
            </div>
          ) : viewMode === 'TEAMS' ? (
            /* GROUPED BY TEAMS VIEW */
            <div className="space-y-6">
              {groupedTeams.map((group) => (
                <div key={group.groupKey} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Team Card Header */}
                  <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-extrabold text-sm text-slate-900 font-serif">{group.institutionName}</span>
                        <span className="text-slate-300">·</span>
                        <span className="font-bold text-xs text-christ-navy bg-christ-navy/10 px-2.5 py-0.5 rounded-md border border-christ-navy/15">
                          🏆 {group.eventName}
                        </span>
                        <span className="font-bold text-xs text-christ-gold bg-christ-navy px-2.5 py-0.5 rounded-md font-mono">
                          {group.teamName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        <strong>POC:</strong> {group.pocName} ({group.pocMobile} · {group.pocEmail}) · <strong>Roster:</strong> {group.participants.length} Member(s)
                      </p>
                    </div>

                    <div className="flex items-center space-x-4 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Chest Number</p>
                        <span className="font-mono font-bold text-xs text-christ-navy">{group.chestNumber || 'Unassigned'}</span>
                      </div>

                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        group.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${group.verificationStatus === 'VERIFIED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span>{group.verificationStatus}</span>
                      </span>
                    </div>
                  </div>

                  {/* Team Participants Table */}
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-3.5 w-12 text-center">#</th>
                          <th className="p-3.5">Participant Name</th>
                          <th className="p-3.5">Gender / DOB</th>
                          <th className="p-3.5">PU Class</th>
                          <th className="p-3.5">Emergency Contact</th>
                          <th className="p-3.5">Chest Number</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.participants.map((p, pIdx) => (
                          <tr key={p.participantId || pIdx} className="hover:bg-slate-50/50">
                            <td className="p-3.5 text-center font-bold text-slate-400 text-[11px]">{pIdx + 1}</td>
                            <td className="p-3.5 font-bold text-slate-800">{p.participantName}</td>
                            <td className="p-3.5 text-slate-600 font-mono text-[11px]">{p.gender} · {p.dob}</td>
                            <td className="p-3.5 text-slate-700 font-semibold">{p.className}</td>
                            <td className="p-3.5 text-slate-600 font-mono text-[11px]">{p.emergencyContact || 'N/A'}</td>
                            <td className="p-3.5 font-mono font-bold text-christ-gold">{p.chestNumber || group.chestNumber || 'Pending'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* FLAT ROSTER VIEW */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Participant Name</th>
                      <th className="p-4">Institution Name</th>
                      <th className="p-4">Event (Category)</th>
                      <th className="p-4">POC Coordinator</th>
                      <th className="p-4">PU Class</th>
                      <th className="p-4">Chest Number</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRegistrations.map((reg, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <div>
                            <p className="font-bold text-slate-800">{reg.participantName}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{reg.gender} · {reg.dob}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-slate-700">{reg.institutionName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Team: {reg.teamName || 'N/A'}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-christ-navy">{reg.eventName}</p>
                          <span className="inline-block text-[9px] uppercase font-bold text-slate-400 tracking-wide mt-0.5">{reg.eventCategory}</span>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-slate-700">{reg.pocName}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{reg.pocMobile}</p>
                        </td>
                        <td className="p-4 font-semibold text-slate-600">
                          {reg.className}
                        </td>
                        <td className="p-4 font-mono font-bold text-christ-gold">
                          {reg.chestNumber || 'Pending'}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            reg.verificationStatus === 'VERIFIED'
                              ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                              : 'bg-amber-50 border border-amber-100 text-amber-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${reg.verificationStatus === 'VERIFIED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <span>{reg.verificationStatus}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
