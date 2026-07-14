import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Header } from '../../components/common/Header';
import { 
  Trophy, Search, CheckCircle2, AlertCircle, Upload, Download, 
  Users, Building2, User, RefreshCw, FileText, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../contexts/EventsContext';

interface EventCoordinatorDashboardProps {
  category: 'SPORTS' | 'CULTURAL';
}

export const EventCoordinatorDashboard: React.FC<EventCoordinatorDashboardProps> = ({ category }) => {
  const { user } = useAuth();
  const { events, isLoading: eventsLoading } = useEvents();
  
  // Filter events by category
  const categoryEvents = events.filter(e => e.category === category);
  
  // Active selected event state
  const [selectedEventId, setSelectedEventId] = useState('');
  
  // Winner/Runner Form States
  const [winnerChest, setWinnerChest] = useState('');
  const [runnerUpChest, setRunnerUpChest] = useState('');
  const [secondRunnerUpChest, setSecondRunnerUpChest] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Chest lookup state
  const [searchChest, setSearchChest] = useState('');
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // CSV bulk upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  useEffect(() => {
    if (categoryEvents.length > 0 && !selectedEventId) {
      setSelectedEventId(categoryEvents[0].id);
    }
  }, [categoryEvents, selectedEventId]);

  // Handle individual result submission
  const handleSubmitResults = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionSuccess(null);
    setActionError(null);

    if (!selectedEventId) {
      setActionError('Please select an event.');
      return;
    }
    if (!winnerChest.trim()) {
      setActionError('Winner Chest Number is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch<{ success: boolean; message?: string }>('/events/results/chest', {
        method: 'POST',
        body: JSON.stringify({
          eventId: selectedEventId,
          winnerChest: winnerChest.trim(),
          runnerUpChest: runnerUpChest.trim() || undefined,
          secondRunnerUpChest: secondRunnerUpChest.trim() || undefined,
          user
        })
      });

      if (res.success) {
        setActionSuccess(res.message || 'Results submitted successfully!');
        setWinnerChest('');
        setRunnerUpChest('');
        setSecondRunnerUpChest('');
      } else {
        setActionError(res.message || 'Failed to submit results.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error occurred while saving results.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Look up team by chest number
  const handleChestLookup = async () => {
    setLookupError(null);
    setLookupResult(null);
    if (!searchChest.trim()) return;

    setLookupLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; data: any }>('/events/team-by-chest/' + encodeURIComponent(searchChest.trim()));
      if (res.success && res.data) {
        setLookupResult(res.data);
      } else {
        setLookupError('No team found for chest number: ' + searchChest);
      }
    } catch (err: any) {
      setLookupError(err.message || 'No team found for chest number: ' + searchChest);
    } finally {
      setLookupLoading(false);
    }
  };

  // Download Bulk template CSV
  const handleDownloadTemplate = () => {
    const headers = ['Event ID', 'Winner Chest Number', 'Runner Up Chest Number', 'Second Runner Up Chest Number'];
    const sampleRows = [
      [categoryEvents[0]?.id || 'sports_football_boys', 'FB-101', 'FB-102', 'FB-103'],
      [categoryEvents[1]?.id || 'sports_volleyball_boys', 'VB-201', 'VB-202', '']
    ];

    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${category.toLowerCase()}_results_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV helper
  const handleCSVUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setBulkError(null);
    setBulkSuccess(null);

    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split('\n').map(line => line.split(',').map(cell => cell.replace(/^"(.*)"$/, '$1').trim()));
      if (lines.length < 2) {
        setBulkError('CSV file is empty or missing content.');
        return;
      }
      
      const rows = lines.slice(1).filter(r => r.length > 0 && r[0]).map(row => ({
        eventId: row[0],
        winnerChest: row[1],
        runnerUpChest: row[2],
        secondRunnerUpChest: row[3]
      }));

      setParsedRows(rows);
    };
  };

  // Submit bulk upload results
  const handleSubmitBulk = async () => {
    if (parsedRows.length === 0) {
      setBulkError('No valid rows to import.');
      return;
    }
    setBulkSuccess(null);
    setBulkError(null);
    setIsSubmitting(true);

    try {
      let successCount = 0;
      let errors: string[] = [];

      for (const row of parsedRows) {
        try {
          const res = await apiFetch<{ success: boolean; message?: string }>('/events/results/chest', {
            method: 'POST',
            body: JSON.stringify({
              eventId: row.eventId,
              winnerChest: row.winnerChest,
              runnerUpChest: row.runnerUpChest || undefined,
              secondRunnerUpChest: row.secondRunnerUpChest || undefined,
              user
            })
          });
          if (res.success) {
            successCount++;
          }
        } catch (e: any) {
          errors.push(`Row for event ${row.eventId}: ${e.message}`);
        }
      }

      if (successCount > 0) {
        setBulkSuccess(`Successfully processed results for ${successCount} events.`);
      }
      if (errors.length > 0) {
        setBulkError(`Errors occurred on some rows:\n` + errors.join('\n'));
      }
      
      setCsvFile(null);
      setParsedRows([]);
    } catch (err: any) {
      setBulkError(err.message || 'An error occurred during bulk upload.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
      <Sidebar currentRole={category === 'SPORTS' ? 'faculty_football' : 'faculty_dance'} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden pt-16 lg:pt-0">
        <Header 
          title={`${category === 'SPORTS' ? 'Sports' : 'Culturals'} Coordinator Panel`}
          subtitle="Fetch team profiles by chest number and submit event results." 
        />

        <main className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">

          {/* Row 1: Chest number lookup & Verification */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-christ-navy to-[#003070] px-6 py-4 flex items-center space-x-3 text-white">
              <Users className="w-5 h-5 text-christ-gold" />
              <div>
                <h3 className="font-bold text-sm font-serif">Fetch Team details by Chest Number</h3>
                <p className="text-[10px] text-slate-300">Enter the allocated team chest number to review details.</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Enter Chest Number (e.g. FB-101)"
                    value={searchChest}
                    onChange={(e) => setSearchChest(e.target.value)}
                    className="pl-9 pr-4 py-3 text-xs w-full border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-christ-navy focus:bg-white bg-slate-50 font-semibold"
                    onKeyDown={(e) => e.key === 'Enter' && handleChestLookup()}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleChestLookup}
                  disabled={lookupLoading}
                  className="px-6 py-3 bg-christ-navy text-white hover:bg-christ-darkNavy rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center space-x-1.5 shadow-md"
                >
                  {lookupLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Search Team</span>}
                </button>
              </div>

              {lookupError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{lookupError}</span>
                </div>
              )}

              {lookupResult && (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Institution</span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">{lookupResult.institutionName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Event &amp; Category</span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">{lookupResult.eventName} ({lookupResult.category})</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Chest ID / Team Identifier</span>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="px-2 py-0.5 bg-christ-gold/20 text-christ-navy border border-christ-gold/30 rounded-full font-black text-xs">
                          {lookupResult.chestNumber}
                        </span>
                        <span className="text-slate-500 font-bold">({lookupResult.teamName})</span>
                      </div>
                    </div>
                  </div>

                  {/* Roster list */}
                  <div className="border-t border-slate-200/80 pt-4">
                    <span className="text-slate-800 font-bold text-xs font-serif block mb-3">Verified Participant Roster</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {lookupResult.participants.map((p: any, idx: number) => (
                        <div key={p.id} className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold">Member #{idx + 1}</span>
                            <p className="font-bold text-slate-800 text-xs mt-0.5">{p.name}</p>
                            <p className="text-[10px] text-slate-500">{p.className} · {p.gender}</p>
                          </div>
                          <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                            {p.verificationStatus}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabular Layout for Result entry */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Panel A: Individual Submission */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-christ-navy to-[#003070] px-6 py-4 flex items-center space-x-3 text-white">
                <Trophy className="w-5 h-5 text-christ-gold" />
                <div>
                  <h3 className="font-bold text-sm font-serif">Enter Event Winners</h3>
                  <p className="text-[10px] text-slate-300">Submit official winner/runner list for an event by chest numbers.</p>
                </div>
              </div>

              <form onSubmit={handleSubmitResults} className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Select Event *</label>
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-christ-navy bg-slate-50 font-medium"
                    >
                      {categoryEvents.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">1st Place (Winner Chest Number) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FB-101"
                      value={winnerChest}
                      onChange={(e) => setWinnerChest(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-christ-navy bg-slate-50 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">2nd Place (Runner Up Chest Number)</label>
                    <input
                      type="text"
                      placeholder="e.g. FB-102"
                      value={runnerUpChest}
                      onChange={(e) => setRunnerUpChest(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-christ-navy bg-slate-50 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">3rd Place (Second Runner Up Chest Number)</label>
                    <input
                      type="text"
                      placeholder="e.g. FB-103"
                      value={secondRunnerUpChest}
                      onChange={(e) => setSecondRunnerUpChest(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-christ-navy bg-slate-50 font-semibold"
                    />
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  {actionError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{actionError}</span>
                    </div>
                  )}

                  {actionSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{actionSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-christ-navy text-white hover:bg-christ-darkNavy rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Submit Official Results</span>}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>

            {/* Panel B: Bulk Excel / CSV Upload */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-christ-navy to-[#003070] px-6 py-4 flex items-center justify-between text-white">
                <div className="flex items-center space-x-3">
                  <Upload className="w-5 h-5 text-christ-gold" />
                  <div>
                    <h3 className="font-bold text-sm font-serif">Bulk Upload via Excel/CSV</h3>
                    <p className="text-[10px] text-slate-300">Upload results for multiple events at once.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Template</span>
                </button>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-200 hover:border-christ-navy bg-slate-50/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer relative">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUploadChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <FileText className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="font-bold text-xs text-christ-navy hover:underline">
                      {csvFile ? csvFile.name : 'Click to Upload Results CSV'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">Accepts only standard format CSV</span>
                  </div>

                  {parsedRows.length > 0 && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs max-h-48 overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold">
                            <th className="p-2">Event ID</th>
                            <th className="p-2">1st</th>
                            <th className="p-2">2nd</th>
                            <th className="p-2">3rd</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parsedRows.map((r, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 font-mono text-[10px]">{r.eventId}</td>
                              <td className="p-2 font-bold">{r.winnerChest}</td>
                              <td className="p-2">{r.runnerUpChest || '-'}</td>
                              <td className="p-2">{r.secondRunnerUpChest || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {bulkError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold whitespace-pre-line">
                      <AlertCircle className="w-4 h-4 shrink-0 inline mr-1" />
                      <span>{bulkError}</span>
                    </div>
                  )}

                  {bulkSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{bulkSuccess}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSubmitBulk}
                    disabled={isSubmitting || parsedRows.length === 0}
                    className="w-full py-3 bg-christ-navy text-white hover:bg-christ-darkNavy rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Upload &amp; Save Bulk Results</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
};
