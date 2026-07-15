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
import { EventCategory } from '../../types';

interface EventCoordinatorDashboardProps {
  category: EventCategory;
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
  const [totalMatches, setTotalMatches] = useState<number>(0);
  const [matchDetails, setMatchDetails] = useState<{ teamPlayed: string; winner: string; score: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Chest lookup state
  const [searchChest, setSearchChest] = useState('');
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Event results state for match details
  const [eventResults, setEventResults] = useState<any | null>(null);
  const [newMatchRound, setNewMatchRound] = useState('');
  const [newMatchTeam1, setNewMatchTeam1] = useState('');
  const [newMatchTeam2, setNewMatchTeam2] = useState('');
  const [newMatchScore1, setNewMatchScore1] = useState('');
  const [newMatchScore2, setNewMatchScore2] = useState('');
  const [newMatchWinner, setNewMatchWinner] = useState('');
  const [isAddingMatch, setIsAddingMatch] = useState(false);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [matchAddError, setMatchAddError] = useState<string | null>(null);
  const [matchAddSuccess, setMatchAddSuccess] = useState<string | null>(null);

  // Edit match state variables
  const [editingMatchIndex, setEditingMatchIndex] = useState<number | null>(null);
  const [editMatchRound, setEditMatchRound] = useState('');
  const [editMatchTeam1, setEditMatchTeam1] = useState('');
  const [editMatchTeam2, setEditMatchTeam2] = useState('');
  const [editMatchScore1, setEditMatchScore1] = useState('');
  const [editMatchScore2, setEditMatchScore2] = useState('');
  const [editMatchWinner, setEditMatchWinner] = useState('');
  const [isUpdatingMatch, setIsUpdatingMatch] = useState(false);

  // CSV bulk upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const fetchEventResults = async () => {
    if (!selectedEventId) return;
    try {
      const res = await apiFetch<{ success: boolean; result: any }>(`/events/${selectedEventId}`);
      if (res.success && res.result) {
        setEventResults(res.result);
      } else {
        setEventResults(null);
      }
    } catch (err) {
      console.error(err);
      setEventResults(null);
    }
  };

  useEffect(() => {
    if (categoryEvents.length > 0 && !selectedEventId) {
      setSelectedEventId(categoryEvents[0].id);
    }
  }, [categoryEvents, selectedEventId]);

  useEffect(() => {
    fetchEventResults();
  }, [selectedEventId]);

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
          totalMatches,
          matchDetails,
          user
        })
      });

      if (res.success) {
        setActionSuccess(res.message || 'Results submitted successfully!');
        setWinnerChest('');
        setRunnerUpChest('');
        setSecondRunnerUpChest('');
        setTotalMatches(0);
        setMatchDetails([]);
        fetchEventResults();
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
    const headers = [
      'Event ID', 'Winner Chest Number', 'Runner Up Chest Number', 'Second Runner Up Chest Number',
      'Total Matches',
      'Match 1 Teams Played (e.g. Team A vs Team B)', 'Match 1 Winner', 'Match 1 Score (e.g. 2-1)',
      'Match 2 Teams Played', 'Match 2 Winner', 'Match 2 Score',
      'Match 3 Teams Played', 'Match 3 Winner', 'Match 3 Score'
    ];
    const sampleRows = [
      [categoryEvents[0]?.id || 'sports_football_boys', 'FB-101', 'FB-102', 'FB-103', '2', 'Team A vs Team B', 'Team A', '3-1', 'Team C vs Team D', 'Team C', '1-0'],
      [categoryEvents[1]?.id || 'sports_volleyball_boys', 'VB-201', 'VB-202', '', '1', 'Team X vs Team Y', 'Team X', '2-0', '', '', '']
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
      
      const rows = lines.slice(1).filter(r => r.length > 0 && r[0]).map(row => {
        const totalMatches = parseInt(row[4] || '0', 10);
        const matchDetails: any[] = [];
        for (let mIdx = 0; mIdx < 3; mIdx++) {
          const baseCol = 5 + mIdx * 3;
          if (row[baseCol] || row[baseCol + 1] || row[baseCol + 2]) {
            matchDetails.push({
              teamPlayed: row[baseCol] || '',
              winner: row[baseCol + 1] || '',
              score: row[baseCol + 2] || ''
            });
          }
        }

        return {
          eventId: row[0],
          winnerChest: row[1],
          runnerUpChest: row[2],
          secondRunnerUpChest: row[3],
          totalMatches,
          matchDetails
        };
      });

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
              totalMatches: row.totalMatches,
              matchDetails: row.matchDetails,
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
        fetchEventResults();
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

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    if (!newMatchRound.trim() || !newMatchTeam1.trim() || !newMatchTeam2.trim() || !newMatchScore1.trim() || !newMatchScore2.trim() || !newMatchWinner.trim()) {
      setMatchAddError('All fields are required.');
      return;
    }

    setIsAddingMatch(true);
    setMatchAddError(null);
    setMatchAddSuccess(null);

    try {
      const res = await apiFetch<{ success: boolean; message?: string }>(`/events/${selectedEventId}/match`, {
        method: 'POST',
        body: JSON.stringify({
          round: newMatchRound.trim(),
          team1: newMatchTeam1.trim(),
          team2: newMatchTeam2.trim(),
          score1: newMatchScore1.trim(),
          score2: newMatchScore2.trim(),
          winner: newMatchWinner.trim(),
          user
        })
      });

      if (res.success) {
        setMatchAddSuccess(res.message || 'Match details added successfully!');
        setNewMatchRound('');
        setNewMatchTeam1('');
        setNewMatchTeam2('');
        setNewMatchScore1('');
        setNewMatchScore2('');
        setNewMatchWinner('');
        setShowMatchForm(false);
        fetchEventResults();
      } else {
        setMatchAddError(res.message || 'Failed to add match details.');
      }
    } catch (err: any) {
      setMatchAddError(err.message || 'Error occurred while saving match details.');
    } finally {
      setIsAddingMatch(false);
    }
  };

  const handleDeleteMatch = async (index: number) => {
    if (!window.confirm('Are you sure you want to delete this match log?')) return;
    try {
      const res = await apiFetch<{ success: boolean; message?: string }>(`/events/${selectedEventId}/match/${index}`, {
        method: 'DELETE',
        body: JSON.stringify({ user })
      });
      if (res.success) {
        fetchEventResults();
      } else {
        alert(res.message || 'Failed to delete match.');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting match.');
    }
  };

  const handleSaveEditMatch = async (index: number) => {
    if (!editMatchRound.trim() || !editMatchTeam1.trim() || !editMatchTeam2.trim() || !editMatchScore1.trim() || !editMatchScore2.trim() || !editMatchWinner.trim()) {
      alert('All fields are required.');
      return;
    }
    setIsUpdatingMatch(true);
    try {
      const res = await apiFetch<{ success: boolean; message?: string }>(`/events/${selectedEventId}/match/${index}`, {
        method: 'PUT',
        body: JSON.stringify({
          round: editMatchRound.trim(),
          team1: editMatchTeam1.trim(),
          team2: editMatchTeam2.trim(),
          score1: editMatchScore1.trim(),
          score2: editMatchScore2.trim(),
          winner: editMatchWinner.trim(),
          user
        })
      });
      if (res.success) {
        setEditingMatchIndex(null);
        fetchEventResults();
      } else {
        alert(res.message || 'Failed to update match.');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating match.');
    } finally {
      setIsUpdatingMatch(false);
    }
  };

  const startEditMatch = (match: any, index: number) => {
    setEditingMatchIndex(index);
    setEditMatchRound(match.round || '');
    setEditMatchTeam1(match.team1 || match.teamPlayed || '');
    setEditMatchTeam2(match.team2 || '');
    setEditMatchScore1(match.score1 !== undefined ? String(match.score1) : '');
    setEditMatchScore2(match.score2 !== undefined ? String(match.score2) : '');
    setEditMatchWinner(match.winner || '');
  };

  const handleFinalizeMatches = async () => {
    if (!window.confirm('Are you sure you want to finalize the match scores? This will LOCK the match logs for this event and cannot be edited without Admin approval.')) return;
    try {
      const res = await apiFetch<{ success: boolean; message?: string }>(`/events/${selectedEventId}/finalize-matches`, {
        method: 'POST',
        body: JSON.stringify({ user })
      });
      if (res.success) {
        alert(res.message || 'Match details finalized and locked successfully!');
        fetchEventResults();
      } else {
        alert(res.message || 'Failed to finalize match details.');
      }
    } catch (err: any) {
      alert(err.message || 'Error finalizing matches.');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
      <Sidebar currentRole={user?.role === 'admin' ? 'admin' : (category === 'SPORTS' ? 'faculty_football' : 'faculty_dance')} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden pt-16 lg:pt-0">
        <Header 
          title={`${category === 'SPORTS' ? 'Sports' : (category === 'CULTURALS' ? 'Culturals' : 'Fun Activities')} Coordinator Panel`}
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

                  {/* Total Matches & Match details input (Sports category only) */}
                  {category === 'SPORTS' && (
                    <div className="border-t border-slate-100 pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block font-bold text-slate-700">Total Matches Played</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={totalMatches}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value || '0', 10));
                            setTotalMatches(val);
                            setMatchDetails(prev => {
                              const next = [...prev];
                              if (val > next.length) {
                                for (let i = next.length; i < val; i++) {
                                  next.push({ teamPlayed: '', winner: '', score: '' });
                                }
                              } else if (val < next.length) {
                                return next.slice(0, val);
                              }
                              return next;
                            });
                          }}
                          className="w-20 px-3 py-1 border border-slate-200 rounded-lg text-center font-bold text-xs bg-slate-50"
                        />
                      </div>

                      {matchDetails.map((match, mIdx) => (
                        <div key={mIdx} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                          <span className="font-bold text-christ-navy text-[10px] uppercase tracking-wider block">Match {mIdx + 1} Details</span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Teams Played</label>
                              <input
                                type="text"
                                placeholder="e.g. A vs B"
                                value={match.teamPlayed}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMatchDetails(prev => prev.map((m, idx) => idx === mIdx ? { ...m, teamPlayed: val } : m));
                                }}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Winner Name/Chest</label>
                              <input
                                type="text"
                                placeholder="e.g. Team A"
                                value={match.winner}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMatchDetails(prev => prev.map((m, idx) => idx === mIdx ? { ...m, winner: val } : m));
                                }}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Final Score</label>
                              <input
                                type="text"
                                placeholder="e.g. 2-1"
                                value={match.score}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMatchDetails(prev => prev.map((m, idx) => idx === mIdx ? { ...m, score: val } : m));
                                }}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                            {category === 'SPORTS' && <th className="p-2">Matches</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parsedRows.map((r, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 font-mono text-[10px]">{r.eventId}</td>
                              <td className="p-2 font-bold">{r.winnerChest}</td>
                              <td className="p-2">{r.runnerUpChest || '-'}</td>
                              <td className="p-2">{r.secondRunnerUpChest || '-'}</td>
                              {category === 'SPORTS' && <td className="p-2 font-bold">{r.totalMatches || 0}</td>}
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

          {/* Match Details Section */}
          {category === 'SPORTS' && selectedEventId && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
              <div className="bg-gradient-to-r from-christ-navy to-[#003070] px-6 py-4 flex items-center justify-between text-white">
                <div className="flex items-center space-x-3">
                  <Trophy className="w-5 h-5 text-christ-gold" />
                  <div>
                    <h3 className="font-bold text-sm font-serif">Logged Match Details & Live Scores</h3>
                    <p className="text-[10px] text-slate-300">Detailed list of matches played, winner, and scores for the selected event.</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {eventResults && !eventResults.isLocked && eventResults.matchDetails && eventResults.matchDetails.length > 0 && (
                    <button
                      type="button"
                      onClick={handleFinalizeMatches}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1"
                    >
                      Submit Final Scores
                    </button>
                  )}
                  {eventResults?.isLocked && (
                    <span className="px-2.5 py-1.5 bg-rose-500/25 text-rose-100 border border-rose-500/30 rounded-lg font-bold text-[10px]">
                      Locked &amp; Submitted
                    </span>
                  )}
                  {!eventResults?.isLocked && (
                    <button
                      type="button"
                      onClick={() => setShowMatchForm(!showMatchForm)}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1"
                    >
                      {showMatchForm ? 'Hide Form' : '+ Add Match Log'}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-4 text-xs">                {showMatchForm && (
                  <form onSubmit={handleAddMatch} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <span className="font-bold text-slate-700 text-xs block">Log New Match Details</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Match Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Quarter Finals"
                          value={newMatchRound}
                          onChange={(e) => setNewMatchRound(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-christ-navy"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Team 1 Chest Number *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. FB-101"
                          value={newMatchTeam1}
                          onChange={(e) => setNewMatchTeam1(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-christ-navy"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Team 2 Chest Number *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. FB-102"
                          value={newMatchTeam2}
                          onChange={(e) => setNewMatchTeam2(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-christ-navy"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Team 1 Score *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 3"
                          value={newMatchScore1}
                          onChange={(e) => setNewMatchScore1(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-christ-navy"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Team 2 Score *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 1"
                          value={newMatchScore2}
                          onChange={(e) => setNewMatchScore2(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-christ-navy"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Winner Chest Number *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. FB-101 (or Draw)"
                          value={newMatchWinner}
                          onChange={(e) => setNewMatchWinner(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-christ-navy"
                        />
                      </div>
                    </div>

                    {matchAddError && (
                      <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-[10px] font-semibold flex items-center space-x-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{matchAddError}</span>
                      </div>
                    )}

                    {matchAddSuccess && (
                      <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-[10px] font-semibold flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{matchAddSuccess}</span>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowMatchForm(false)}
                        className="px-3 py-1.5 bg-slate-250 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isAddingMatch}
                        className="px-4 py-1.5 bg-christ-navy text-white hover:bg-christ-darkNavy font-bold rounded-lg transition-all flex items-center space-x-1"
                      >
                        {isAddingMatch ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>Save Match</span>}
                      </button>
                    </div>
                  </form>
                )}

                {eventResults && eventResults.matchDetails && eventResults.matchDetails.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                          <th className="p-3">Match Name</th>
                          <th className="p-3">Team 1 Chest</th>
                          <th className="p-3">Team 2 Chest</th>
                          <th className="p-3 text-center">Score</th>
                          <th className="p-3 text-right">Winner Chest</th>
                          {!eventResults?.isLocked && <th className="p-3 text-center">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {eventResults.matchDetails.map((match: any, idx: number) => {
                          const isT1Winner = match.winner === match.team1;
                          const isT2Winner = match.winner === match.team2;

                          if (editingMatchIndex === idx) {
                            return (
                              <tr key={idx} className="bg-slate-50/70">
                                <td className="p-3">
                                  <input
                                    type="text"
                                    value={editMatchRound}
                                    onChange={(e) => setEditMatchRound(e.target.value)}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs"
                                  />
                                </td>
                                <td className="p-3">
                                  <input
                                    type="text"
                                    value={editMatchTeam1}
                                    onChange={(e) => setEditMatchTeam1(e.target.value)}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs"
                                  />
                                </td>
                                <td className="p-3">
                                  <input
                                    type="text"
                                    value={editMatchTeam2}
                                    onChange={(e) => setEditMatchTeam2(e.target.value)}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs"
                                  />
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center space-x-1">
                                    <input
                                      type="text"
                                      value={editMatchScore1}
                                      onChange={(e) => setEditMatchScore1(e.target.value)}
                                      className="w-8 px-1 py-1 border border-slate-200 rounded text-xs text-center font-bold"
                                    />
                                    <span>-</span>
                                    <input
                                      type="text"
                                      value={editMatchScore2}
                                      onChange={(e) => setEditMatchScore2(e.target.value)}
                                      className="w-8 px-1 py-1 border border-slate-200 rounded text-xs text-center font-bold"
                                    />
                                  </div>
                                </td>
                                <td className="p-3 text-right">
                                  <input
                                    type="text"
                                    value={editMatchWinner}
                                    onChange={(e) => setEditMatchWinner(e.target.value)}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs text-right"
                                  />
                                </td>
                                <td className="p-3 text-center space-x-1 whitespace-nowrap">
                                  <button
                                    type="button"
                                    disabled={isUpdatingMatch}
                                    onClick={() => handleSaveEditMatch(idx)}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px]"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingMatchIndex(null)}
                                    className="px-2 py-1 bg-slate-350 hover:bg-slate-400 text-slate-700 font-bold rounded text-[10px]"
                                  >
                                    X
                                  </button>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="p-3 font-bold text-slate-800">{match.round || `Match ${idx + 1}`}</td>
                              <td className={`p-3 font-semibold ${isT1Winner ? 'text-emerald-700 font-black' : ''}`}>{match.team1 || match.teamPlayed || '-'}</td>
                              <td className={`p-3 font-semibold ${isT2Winner ? 'text-emerald-700 font-black' : ''}`}>{match.team2 || '-'}</td>
                              <td className="p-3 text-center font-mono font-bold text-slate-855">
                                {match.score1 !== undefined && match.score2 !== undefined ? `${match.score1} - ${match.score2}` : (match.score || '-')}
                              </td>
                              <td className="p-3 text-right">
                                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-850 border border-emerald-200 rounded-full font-bold">
                                  {match.winner || '-'}
                                </span>
                              </td>
                              {!eventResults?.isLocked && (
                                <td className="p-3 text-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => startEditMatch(match, idx)}
                                    className="text-christ-navy hover:text-christ-darkNavy font-bold hover:underline"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMatch(idx)}
                                    className="text-rose-600 hover:text-rose-800 font-bold hover:underline"
                                  >
                                    Delete
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 italic">
                    No match details logged for this event yet. Click "+ Add Match Log" above to enter a match detail.
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
