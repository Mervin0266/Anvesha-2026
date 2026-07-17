import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Header } from '../../components/common/Header';
import { UserCheck, Search, CheckCircle2, XCircle, Clock, Eye, FileText, AlertCircle, Shield, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export const VerificationDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');
  const [remarks, setRemarks] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Participant Name Editing States
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Verification Checklist States
  const [checkPayment, setCheckPayment] = useState(false);
  const [checkNames, setCheckNames] = useState(false);
  const [checkGovtId, setCheckGovtId] = useState(false);
  const [checkEndorsement, setCheckEndorsement] = useState(false);

  // Reset checkboxes on record selection change
  useEffect(() => {
    setCheckPayment(false);
    setCheckNames(false);
    setCheckGovtId(false);
    setCheckEndorsement(false);
    setRemarks('');
    setEditingParticipantId(null);
  }, [selectedRecord]);

  const canApprove = checkPayment && checkNames && checkGovtId && checkEndorsement;

  const handleSaveParticipantName = async (partId: string) => {
    if (!editingName.trim()) {
      alert('Name cannot be empty.');
      return;
    }
    setIsSavingName(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>('/verification/participant/update-name', {
        method: 'POST',
        body: JSON.stringify({
          participantId: partId,
          newName: editingName.trim()
        })
      });
      if (res.success) {
        // Update local state directly so we don't have to re-fetch the entire pending list
        setData(prev => prev.map(item => {
          if (item.institution.id === selectedRecord.institution.id) {
            return {
              ...item,
              participants: item.participants.map((p: any) => p.id === partId ? { ...p, name: editingName.trim() } : p)
            };
          }
          return item;
        }));
        
        // Also update selectedRecord state
        setSelectedRecord((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            participants: prev.participants.map((p: any) => p.id === partId ? { ...p, name: editingName.trim() } : p)
          };
        });

        setEditingParticipantId(null);
      } else {
        alert(res.message || 'Failed to update name.');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating name.');
    } finally {
      setIsSavingName(false);
    }
  };

  const fetchPendingData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; data: any[] }>('/verification/pending');
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingData();
  }, []);

  const handleApprove = async (instId: string) => {
    try {
      const res = await apiFetch<{ success: boolean; message: string }>('/verification/approve', {
        method: 'POST',
        body: JSON.stringify({
          institutionId: instId,
          remarks: remarks || 'Verified physical documents and payment receipt.',
          verifierName: user?.name
        })
      });
      if (res.success) {
        setActionSuccess(res.message);
        setSelectedRecord(null);
        fetchPendingData();
      }
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    }
  };

  const handleReject = async (instId: string) => {
    if (!remarks) {
      alert('Please specify rejection reason remarks.');
      return;
    }
    try {
      const res = await apiFetch<{ success: boolean; message: string }>('/verification/reject', {
        method: 'POST',
        body: JSON.stringify({
          institutionId: instId,
          remarks,
          verifierName: user?.name
        })
      });
      if (res.success) {
        setActionSuccess(res.message);
        setSelectedRecord(null);
        fetchPendingData();
      }
    } catch (err: any) {
      alert(`Rejection error: ${err.message}`);
    }
  };

  const filteredData = data.filter(item => {
    const matchesSearch = 
      item.institution.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.institution.registrationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.poc && item.poc.phone.includes(searchQuery));
    const matchesStatus = statusFilter === 'ALL' || item.verificationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
      <Sidebar currentRole={user?.role || 'registration_team'} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden pt-16 lg:pt-0">
        <Header title="Registration & On-Site Verification Desk" subtitle="Verify institution registrations, student ID proofs, and auto-assign chest numbers." />

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          
          {actionSuccess && (
            <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs font-medium rounded-r-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{actionSuccess}</span>
              </div>
              <button onClick={() => setActionSuccess(null)} className="text-emerald-700 font-bold">Dismiss</button>
            </div>
          )}

          {/* Controls & Search */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Institution, Reg ID, Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-600">Status:</span>
              {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    statusFilter === s ? 'bg-christ-navy text-white border-christ-navy' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Verification Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-christ-navy font-serif text-sm">Registrations Roster ({filteredData.length})</h3>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-500 font-medium">Real-time sync enabled</span>
                <button
                  onClick={fetchPendingData}
                  disabled={loading}
                  className="p-1.5 hover:bg-slate-100 active:bg-slate-200 rounded-lg text-slate-500 hover:text-christ-navy transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 border border-slate-200 bg-white hover:shadow-sm"
                  title="Force Refresh Sync"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span className="text-[10px] font-bold px-0.5">Refresh</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading verification records...</div>
            ) : filteredData.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No matching registrations found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-serif border-b border-slate-200">
                      <th className="p-3.5 font-bold">Reg ID</th>
                      <th className="p-3.5 font-bold">Institution</th>
                      <th className="p-3.5 font-bold">District</th>
                      <th className="p-3.5 font-bold">Teams</th>
                      <th className="p-3.5 font-bold">Participants</th>
                      <th className="p-3.5 font-bold">Payment</th>
                      <th className="p-3.5 font-bold">Status</th>
                      <th className="p-3.5 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredData.map((item) => (
                      <tr key={item.institution.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-christ-navy">{item.institution.registrationId}</td>
                        <td className="p-3.5">
                          <strong className="text-slate-900 block">{item.institution.name}</strong>
                          <span className="text-[10px] text-slate-400">POC: {item.poc?.name || 'N/A'}</span>
                        </td>
                        <td className="p-3.5 text-slate-600">{item.institution.district}</td>
                        <td className="p-3.5">{item.teams.length} Teams</td>
                        <td className="p-3.5 font-bold text-slate-800">{item.participants.length} Students</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.payment?.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            ₹{item.payment?.amount || 0} ({item.payment?.status})
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center space-x-1 ${
                            item.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            item.verificationStatus === 'REJECTED' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                            'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {item.verificationStatus === 'VERIFIED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            <span>{item.verificationStatus}</span>
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedRecord(item)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-christ-navy text-white rounded-lg text-xs font-semibold hover:bg-christ-darkNavy"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Verify</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Verification Inspection Modal */}
          {selectedRecord && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-slate-200 animate-fadeIn">
                
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-christ-gold uppercase tracking-wider bg-christ-navy/10 px-2.5 py-0.5 rounded-full">
                      Inspection Card
                    </span>
                    <h3 className="text-xl font-bold text-christ-navy font-serif mt-1">
                      {selectedRecord.institution.name} ({selectedRecord.institution.registrationId})
                    </h3>
                  </div>
                  <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                </div>

                {/* Inspection Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column: Payment Details & Checklist */}
                  <div className="space-y-6">
                    {/* Payment details card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                      <h4 className="font-bold text-xs text-christ-navy uppercase tracking-wider font-serif border-b border-slate-200 pb-1.5 flex items-center justify-between">
                        <span>Payment Verification</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          selectedRecord.payment?.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {selectedRecord.payment?.status || 'PENDING'}
                        </span>
                      </h4>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-2 font-medium">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-tight">Amount Paid:</p>
                          <strong className="text-sm text-christ-navy">₹{selectedRecord.payment?.amount || 0}</strong>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-tight">Receipt Number:</p>
                          <strong className="text-slate-800">{selectedRecord.payment?.receiptNumber || 'N/A'}</strong>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] text-slate-500 uppercase tracking-tight">Transaction Ref ID:</p>
                          <strong className="font-mono text-slate-800">{selectedRecord.payment?.transactionId || 'N/A'}</strong>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] text-slate-500 uppercase tracking-tight">Transaction Date:</p>
                          <strong className="text-slate-800">{selectedRecord.payment?.date ? new Date(selectedRecord.payment.date).toLocaleString() : 'N/A'}</strong>
                        </div>
                      </div>

                      {selectedRecord.payment?.paymentProofUrl && (
                        <div className="pt-2 border-t border-slate-200">
                          <p className="text-[10px] text-slate-500 uppercase tracking-tight mb-1">Receipt Screenshot Proof:</p>
                          <a 
                            href={selectedRecord.payment.paymentProofUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-block border border-slate-300 rounded-lg overflow-hidden max-w-full hover:border-christ-navy transition-all bg-white"
                          >
                            <img 
                              src={selectedRecord.payment.paymentProofUrl} 
                              alt="Payment Receipt" 
                              className="w-full h-auto max-h-36 object-contain"
                            />
                            <span className="block text-[10px] bg-slate-100 text-center py-1.5 text-slate-600 hover:text-slate-900 font-semibold border-t border-slate-200">
                              Click to view full size ↗
                            </span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Representative / POC ID Card Proof */}
                    {selectedRecord.poc && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                        <h4 className="font-bold text-xs text-christ-navy uppercase tracking-wider font-serif border-b border-slate-200 pb-1.5 flex items-center justify-between">
                          <span>Representative ID Card Proof</span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-christ-navy/10 text-christ-navy uppercase">
                            {selectedRecord.poc.designation || 'POC'}
                          </span>
                        </h4>
                        <div className="space-y-1 font-medium text-slate-800">
                          <p><strong>Name:</strong> {selectedRecord.poc.name}</p>
                          <p><strong>Contact:</strong> {selectedRecord.poc.phone} | {selectedRecord.poc.email}</p>
                        </div>
                        {selectedRecord.poc.govtIdProof && (
                          <div className="pt-2 border-t border-slate-200">
                            <p className="text-[10px] text-slate-500 uppercase tracking-tight mb-1">Representative ID Card:</p>
                            <a 
                              href={selectedRecord.poc.govtIdProof} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="inline-block border border-slate-300 rounded-lg overflow-hidden max-w-full hover:border-christ-navy transition-all bg-white"
                            >
                              <img 
                                src={selectedRecord.poc.govtIdProof} 
                                alt="POC ID Proof" 
                                className="w-full h-auto max-h-32 object-contain"
                              />
                              <span className="block text-[10px] bg-slate-100 text-center py-1 text-slate-600 hover:text-slate-900 font-semibold border-t border-slate-200">
                                View full ID Proof ↗
                              </span>
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Verification Checklist */}
                    <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50 text-xs">
                      <h4 className="font-bold text-xs text-christ-navy uppercase tracking-wider font-serif border-b border-slate-200 pb-1.5">
                        Document Check-list
                      </h4>
                      <div className="space-y-3">
                        <label className="flex items-start space-x-2.5 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={checkPayment}
                            onChange={(e) => setCheckPayment(e.target.checked)}
                            className="mt-0.5 rounded text-christ-navy focus:ring-christ-navy w-4 h-4 shrink-0"
                          />
                          <span className="text-slate-700">I have verified the transaction ID and receipt screenshot against bank records.</span>
                        </label>
                        <label className="flex items-start space-x-2.5 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={checkNames}
                            onChange={(e) => setCheckNames(e.target.checked)}
                            className="mt-0.5 rounded text-christ-navy focus:ring-christ-navy w-4 h-4 shrink-0"
                          />
                          <span className="text-slate-700">I have cross-checked participant names and Date of Birth credentials.</span>
                        </label>
                        <label className="flex items-start space-x-2.5 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={checkGovtId}
                            onChange={(e) => setCheckGovtId(e.target.checked)}
                            className="mt-0.5 rounded text-christ-navy focus:ring-christ-navy w-4 h-4 shrink-0"
                          />
                          <span className="text-slate-700">I have verified the uploaded Government ID proof numbers.</span>
                        </label>
                        <label className="flex items-start space-x-2.5 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={checkEndorsement}
                            onChange={(e) => setCheckEndorsement(e.target.checked)}
                            className="mt-0.5 rounded text-christ-navy focus:ring-christ-navy w-4 h-4 shrink-0"
                          />
                          <span className="text-slate-700">I have verified the Principal endorsement/college permission details.</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Participant ID proofs list */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider font-serif">
                      Participants &amp; Assigned Chest Numbers ({selectedRecord.participants.length})
                    </h4>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl max-h-[420px] overflow-y-auto text-xs bg-slate-50">
                      {selectedRecord.participants.map((p: any) => (
                        <div key={p.id} className="p-3 flex items-center justify-between hover:bg-slate-100/50 transition-colors">
                          <div className="min-w-0 flex-1 mr-2">
                            {editingParticipantId === p.id ? (
                              <div className="flex items-center space-x-2 mt-1">
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  className="px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-christ-navy focus:outline-none bg-white font-semibold text-slate-800"
                                />
                                <button
                                  type="button"
                                  disabled={isSavingName}
                                  onClick={() => handleSaveParticipantName(p.id)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-all"
                                >
                                  {isSavingName ? '...' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingParticipantId(null)}
                                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-semibold transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center space-x-2">
                                  <strong className="text-slate-900 block truncate">{p.name}</strong>
                                  {selectedRecord.verificationStatus === 'PENDING' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingParticipantId(p.id);
                                        setEditingName(p.name);
                                      }}
                                      className="text-christ-navy hover:text-christ-gold transition-colors p-0.5 text-[10px] font-bold flex items-center space-x-0.5"
                                      title="Edit participant name"
                                    >
                                      <span>✏️</span>
                                    </button>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5">{p.className} · ID: {p.govtIdProof}</p>
                                {p.govtIdProof && (p.govtIdProof.startsWith('http') || p.govtIdProof.includes('/api/')) && (
                                  <a 
                                    href={p.govtIdProof} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="inline-flex items-center text-[10px] text-christ-navy hover:underline font-bold mt-1"
                                  >
                                    View ID Proof Card ↗
                                  </a>
                                )}
                              </>
                            )}
                          </div>
                          <span className="font-mono font-bold px-2 py-0.5 bg-christ-navy text-christ-gold rounded text-[10px] shrink-0">
                            {p.chestNumber || 'Pending Auto-Assign'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Remarks & Approval Actions */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-800">Verification Remarks / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Approved all student ID cards and bank receipt."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none"
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 text-[11px] text-slate-500">
                    <div>
                      {!canApprove && (
                        <span className="text-rose-600 font-semibold flex items-center space-x-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Must check all checklist items before approving.</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-end space-x-3">
                      <button
                        onClick={() => handleReject(selectedRecord.institution.id)}
                        className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
                      >
                        Reject Registration
                      </button>
                      <button
                        onClick={() => handleApprove(selectedRecord.institution.id)}
                        disabled={!canApprove}
                        className={`px-5 py-2 text-xs font-bold rounded-lg shadow-sm transition-all ${
                          canApprove 
                            ? 'text-christ-navy bg-christ-gold hover:bg-christ-lightGold hover:-translate-y-0.5 cursor-pointer shadow-christ-gold/20' 
                            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        }`}
                      >
                        Approve & Auto-Assign Chest Numbers
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
