import React, { useState } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Header } from '../../components/common/Header';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../contexts/EventsContext';
import { apiFetch } from '../../services/api';
import { 
  Building2, User, Phone, Mail, MapPin, Plus, Trash2, 
  Upload, CheckCircle, AlertCircle, FileText, Download 
} from 'lucide-react';

interface ParticipantRow {
  name: string;
  gender: string;
  dob: string;
  className: string;
  studentRegisterNumber: string;
  emergencyContact: string;
  eventId: string;
  teamName: string;
}

export const SpotRegistrationDashboard: React.FC = () => {
  const { user } = useAuth();
  const { events } = useEvents();

  // Institution & POC States
  const [instName, setInstName] = useState('');
  const [instAddress, setInstAddress] = useState('');
  const [pocName, setPocName] = useState('');
  const [pocNumber, setPocNumber] = useState('');
  const [pocEmail, setPocEmail] = useState('');

  // Roster States
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Single Student Row Form Inputs
  const [studentName, setStudentName] = useState('');
  const [studentGender, setStudentGender] = useState('Male');
  const [studentDob, setStudentDob] = useState('');
  const [studentClass, setStudentClass] = useState('1st PU');
  const [studentRegNum, setStudentRegNum] = useState('NIL');
  const [studentContact, setStudentContact] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedTeamName, setSelectedTeamName] = useState('Team A');

  // Request States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ registrationId: string; name: string } | null>(null);

  // Set default event selection once events are loaded
  React.useEffect(() => {
    if (events && events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  // Add a single student manually
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      alert('Student Name is required.');
      return;
    }
    if (!studentDob) {
      alert('Date of Birth is required.');
      return;
    }
    if (!studentContact.trim()) {
      alert('Emergency Contact Number is required.');
      return;
    }
    if (!selectedEventId) {
      alert('Please select an Event.');
      return;
    }

    const newRow: ParticipantRow = {
      name: studentName.trim(),
      gender: studentGender,
      dob: studentDob,
      className: studentClass,
      studentRegisterNumber: studentRegNum.trim() || 'NIL',
      emergencyContact: studentContact.trim(),
      eventId: selectedEventId,
      teamName: selectedTeamName
    };

    setParticipants([...participants, newRow]);
    
    // Clear inputs
    setStudentName('');
    setStudentDob('');
    setStudentRegNum('NIL');
    setStudentContact('');
  };

  // Remove participant from local list
  const handleRemoveStudent = (idx: number) => {
    setParticipants(participants.filter((_, i) => i !== idx));
  };

  // Parse CSV file for spot roster imports
  const handleCSVParse = (text: string) => {
    try {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length <= 1) return;

      const parsedStudents: ParticipantRow[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length < 8) continue;

        const [sName, sGender, sDob, sClass, sReg, sEmerg, sEventName, sTeam] = cols;
        if (!sName) continue;

        // Resolve eventName fuzzy match against catalog events
        const eventMatch = events.find(e => 
          e.name.toLowerCase().includes(sEventName.toLowerCase()) || 
          sEventName.toLowerCase().includes(e.name.toLowerCase()) ||
          e.id.toLowerCase() === sEventName.toLowerCase()
        );

        if (!eventMatch) {
          throw new Error(`CSV Line ${i + 1}: Could not find event matching '${sEventName}' in catalog.`);
        }

        parsedStudents.push({
          name: sName,
          gender: sGender || 'Male',
          dob: sDob || '2008-01-01',
          className: sClass || '1st PU',
          studentRegisterNumber: sReg || 'NIL',
          emergencyContact: sEmerg || '0000000000',
          eventId: eventMatch.id,
          teamName: sTeam || 'Team A'
        });
      }

      setParticipants([...participants, ...parsedStudents]);
      alert(`Parsed and added ${parsedStudents.length} students from roster file.`);
    } catch (err: any) {
      alert(`Error parsing roster file: ${err.message}`);
    }
  };

  // Dropzone drag/drop listeners
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          handleCSVParse(evt.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          handleCSVParse(evt.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  // Submit complete Spot Registration to Backend API
  const handleSubmitSpotRegistration = async () => {
    setErrorMsg(null);

    if (!instName.trim()) {
      setErrorMsg('Institution Name is required.');
      return;
    }
    if (!instAddress.trim()) {
      setErrorMsg('Institution Address is required.');
      return;
    }
    if (participants.length === 0) {
      setErrorMsg('Please enroll at least one student in the roster table.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: instName.trim(),
        address: instAddress.trim(),
        pocName: pocName.trim() || 'Principal',
        pocNumber: pocNumber.trim() || '080-22222222',
        pocEmail: pocEmail.trim() || 'poc@institution.edu',
        participants
      };

      const res = await apiFetch<{ success: boolean; message?: string; data?: any }>('/registration/spot', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success && res.data) {
        setSuccessData(res.data);
        // Reset states
        setInstName('');
        setInstAddress('');
        setPocName('');
        setPocNumber('');
        setPocEmail('');
        setParticipants([]);
      } else {
        setErrorMsg(res.message || 'Spot registration failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error submitting spot registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper: Get registration fee for the student rows
  const calculateTotalSpotFee = () => {
    return participants.reduce((sum, p) => {
      const e = events.find(evt => evt.id === p.eventId);
      return sum + (e ? Number(e.registrationFee) : 0);
    }, 0);
  };

  // CSV template generator
  const downloadSpotCSVTemplate = () => {
    const headers = 'studentName,gender,dob,className,studentRegisterNumber,emergencyContact,eventName,teamName\n';
    const row1 = 'Jane Doe,Female,2008-05-12,1st PU,REG-991,9876543210,Football (Boys),Team A\n';
    const row2 = 'John Smith,Male,2007-11-20,2nd PU,NIL,9123456789,Volleyball (Boys),Team B\n';
    const blob = new Blob([headers + row1 + row2], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'Anvesha_Spot_Roster_Template.csv');
    a.click();
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
      <Sidebar currentRole={user?.role || 'registration_team'} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pt-16 lg:pt-0">
        <Header 
          title="On-Site Spot Registration" 
          subtitle="Directly register institutions, configure teams, and verify student rosters on-ground." 
        />

        <main className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">

          {/* Alert messages */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center space-x-3 text-rose-800 animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <p className="text-xs font-bold">{errorMsg}</p>
            </div>
          )}

          {/* Success Dialog */}
          {successData && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 space-y-4 shadow-sm animate-fade-in">
              <div className="flex items-center space-x-3 text-emerald-800">
                <CheckCircle className="w-7 h-7 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-base font-serif">On-Site Spot Registration Completed!</h4>
                  <p className="text-xs text-slate-500">Institution & Roster are immediately marked as VERIFIED.</p>
                </div>
              </div>
              <div className="bg-white border border-emerald-100 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Assigned Registration ID</p>
                  <p className="text-lg font-black font-mono text-emerald-700">{successData.registrationId}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Registered College</p>
                  <p className="text-sm font-extrabold text-slate-800">{successData.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setSuccessData(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all"
              >
                Register Another College
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Column 1: Institution & POC Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <Building2 className="w-5 h-5 text-christ-navy" />
                  <h3 className="font-bold text-sm text-slate-800 font-serif">Institution details</h3>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Name of the Institution</label>
                    <input 
                      type="text"
                      placeholder="e.g. St. Joseph Pre-University"
                      value={instName}
                      onChange={(e) => setInstName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-christ-navy bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Address</label>
                    <textarea 
                      rows={3}
                      placeholder="Enter full physical address..."
                      value={instAddress}
                      onChange={(e) => setInstAddress(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-christ-navy bg-slate-50"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 border-b border-slate-100 pt-3 pb-2">
                  <User className="w-5 h-5 text-christ-navy" />
                  <h3 className="font-bold text-sm text-slate-800 font-serif">Point of Contact (POC)</h3>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">POC Name</label>
                    <input 
                      type="text"
                      placeholder="Coordinator or Principal Name"
                      value={pocName}
                      onChange={(e) => setPocName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-christ-navy bg-slate-50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">POC Phone</label>
                      <input 
                        type="text"
                        placeholder="9876543210"
                        value={pocNumber}
                        onChange={(e) => setPocNumber(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-christ-navy bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">POC Email</label>
                      <input 
                        type="email"
                        placeholder="poc@college.edu"
                        value={pocEmail}
                        onChange={(e) => setPocEmail(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-christ-navy bg-slate-50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Aggregated totals */}
              <div className="bg-gradient-to-br from-christ-navy to-[#052550] rounded-2xl p-5 text-white shadow-sm space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-christ-gold font-serif">Enrollment Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-300 block">Total Students</span>
                    <strong className="text-xl font-black">{participants.length}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-300 block">Spot Fee Total</span>
                    <strong className="text-xl font-black text-christ-gold">₹{calculateTotalSpotFee()}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitSpotRegistration}
                  className="w-full py-3 bg-christ-gold hover:bg-[#d09e20] text-christ-navy font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
                >
                  {isSubmitting ? (
                    <span>Submitting Spot Registration...</span>
                  ) : (
                    <>
                      <span>Complete Spot Registration</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Column 2: Roster List & Roster Enrollment */}
            <div className="lg:col-span-2 space-y-6">

              {/* Roster Add Row Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Plus className="w-5 h-5 text-christ-navy" />
                    <h3 className="font-bold text-sm text-slate-800 font-serif">Add Student to Roster</h3>
                  </div>
                  
                  <button 
                    onClick={downloadSpotCSVTemplate}
                    className="inline-flex items-center space-x-1 text-[10px] font-bold text-christ-navy hover:text-christ-gold transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Template</span>
                  </button>
                </div>

                <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Student Name</label>
                    <input 
                      type="text"
                      placeholder="Full Name"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-christ-navy bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gender</label>
                    <select
                      value={studentGender}
                      onChange={(e) => setStudentGender(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none bg-slate-50 font-medium"
                    >
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date of Birth</label>
                    <input 
                      type="date"
                      value={studentDob}
                      onChange={(e) => setStudentDob(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-christ-navy bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">PU Class</label>
                    <select
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none bg-slate-50 font-medium"
                    >
                      <option>1st PU</option>
                      <option>2nd PU</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Register Number</label>
                    <input 
                      type="text"
                      placeholder="NIL by default"
                      value={studentRegNum}
                      onChange={(e) => setStudentRegNum(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-christ-navy bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Emergency Contact</label>
                    <input 
                      type="text"
                      placeholder="Guardian Phone"
                      value={studentContact}
                      onChange={(e) => setStudentContact(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-christ-navy bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Event</label>
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none bg-slate-50 font-semibold text-christ-navy"
                    >
                      {events.map(evt => (
                        <option key={evt.id} value={evt.id}>{evt.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Team ID</label>
                    <select
                      value={selectedTeamName}
                      onChange={(e) => setSelectedTeamName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none bg-slate-50 font-medium"
                    >
                      <option>Team A</option>
                      <option>Team B</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-christ-navy hover:bg-[#002d60] text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Student Row</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Roster File Uploader Drag and Drop */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                  <Upload className="w-5 h-5 text-christ-navy" />
                  <h3 className="font-bold text-sm text-slate-800 font-serif">Quick CSV Roster Import</h3>
                </div>

                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    dragActive ? 'border-christ-gold bg-christ-gold/5' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
                  }`}
                >
                  <input
                    type="file"
                    id="csv-file-input"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="csv-file-input" className="cursor-pointer block space-y-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-700">Drag &amp; drop roster CSV file here</p>
                      <p className="text-[10px] text-slate-400 mt-1">or click to browse from local computer</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Enrolled Roster Table View */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Current Enrolled Roster</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                    {participants.length} entries
                  </span>
                </div>

                {participants.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 space-y-2">
                    <FileText className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-medium">No students added to the roster yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/80 border-b border-slate-150 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                          <th className="p-3">Student Details</th>
                          <th className="p-3">Event &amp; Division</th>
                          <th className="p-3">Register #</th>
                          <th className="p-3">Emergency Contact</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {participants.map((p, idx) => {
                          const eventMeta = events.find(e => e.id === p.eventId);
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-3">
                                <p className="font-bold text-slate-800">{p.name}</p>
                                <p className="text-[10px] text-slate-400">{p.gender} · DOB: {p.dob} · {p.className}</p>
                              </td>
                              <td className="p-3">
                                <span className="font-bold text-christ-navy block">{eventMeta?.name || p.eventId}</span>
                                <span className="inline-block text-[10px] font-bold bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 uppercase tracking-wide mt-0.5">
                                  {p.teamName}
                                </span>
                              </td>
                              <td className="p-3 font-mono font-bold text-slate-600">{p.studentRegisterNumber}</td>
                              <td className="p-3 font-mono text-slate-500">{p.emergencyContact}</td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStudent(idx)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all"
                                  title="Delete student from roster"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

          </div>

        </main>
      </div>
    </div>
  );
};
