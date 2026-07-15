import React, { useState } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Header } from '../../components/common/Header';
import { 
  Upload, Trash2, Plus, Download, FileSpreadsheet, 
  CheckCircle2, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Info 
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface StudentRow {
  name: string;
  gender: string;
  dob: string;
  className: string;
  studentRegisterNumber: string;
  emergencyContact: string;
  eventName: string;
  team: string;
}

interface InstitutionImportForm {
  id: string;
  name: string;
  pocName: string;
  pocNumber: string;
  pocEmail: string;
  fileName: string;
  participants: StudentRow[];
  showPreview: boolean;
}

export const BulkImportDashboard: React.FC = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState<InstitutionImportForm[]>([
    {
      id: `form-${Date.now()}-0`,
      name: '',
      pocName: '',
      pocNumber: '',
      pocEmail: '',
      fileName: '',
      participants: [],
      showPreview: false
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDownloadTemplate = () => {
    const headers = [
      'Name',
      'Gender',
      'Date of Birth',
      'PU Class',
      'Student Register Number',
      'Emergency Contact Number',
      'Event Name',
      'Team'
    ];
    const sampleRows = [
      ['Rohan Sen', 'Male', '2008-04-15', '1st PU', 'NIL', '9845012345', 'Football (Boys)', 'A'],
      ['Sneha Kapoor', 'Female', '2007-09-22', '2nd PU', 'REG-882910', '9876543210', 'Group Dance', 'A'],
      ['Aditya Rao', 'Male', '2008-11-02', '1st PU', 'NIL', '9741022931', 'Debate', 'B']
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'anvesha_bulk_registration_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddInstitution = () => {
    setForms(prev => [
      ...prev,
      {
        id: `form-${Date.now()}-${prev.length}`,
        name: '',
        pocName: '',
        pocNumber: '',
        pocEmail: '',
        fileName: '',
        participants: [],
        showPreview: false
      }
    ]);
  };

  const handleRemoveInstitution = (id: string) => {
    if (forms.length === 1) {
      alert('At least one institution record is required.');
      return;
    }
    setForms(prev => prev.filter(f => f.id !== id));
  };

  const handleInputChange = (id: string, field: keyof InstitutionImportForm, value: string) => {
    setForms(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, [field]: value };
      }
      return f;
    }));
  };

  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentVal = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentVal += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentVal.trim());
        currentVal = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(currentVal.trim());
        lines.push(row);
        row = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    if (currentVal || row.length > 0) {
      row.push(currentVal.trim());
      lines.push(row);
    }
    return lines.filter(l => l.length > 0 && l.some(val => val !== ''));
  };

  const mapHeaders = (headers: string[]) => {
    const mapping: { [key: string]: number } = {};
    headers.forEach((h, index) => {
      const normalized = h.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (normalized === 'name' || normalized === 'studentname' || normalized === 'participantname') {
        mapping['name'] = index;
      } else if (normalized === 'gender' || normalized === 'sex') {
        mapping['gender'] = index;
      } else if (normalized === 'dateofbirth' || normalized === 'dob' || normalized === 'birthdate') {
        mapping['dob'] = index;
      } else if (normalized === 'puclass' || normalized === 'class' || normalized === 'puyear' || normalized === 'year') {
        mapping['className'] = index;
      } else if (normalized === 'studentregisternumber' || normalized === 'registernumber' || normalized === 'regno' || normalized === 'registerno' || normalized === 'studentregno') {
        mapping['studentRegisterNumber'] = index;
      } else if (normalized === 'emergencycontactnumber' || normalized === 'emergencycontact' || normalized === 'contact' || normalized === 'parentcontact') {
        mapping['emergencyContact'] = index;
      } else if (normalized === 'eventname' || normalized === 'event') {
        mapping['eventName'] = index;
      } else if (normalized === 'team' || normalized === 'teamname') {
        mapping['team'] = index;
      }
    });
    return mapping;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, formId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      const csvData = reader.result as string;
      const lines = parseCSV(csvData);
      if (lines.length < 2) {
        alert('CSV file must contain a header row and at least one student row.');
        return;
      }

      const headers = lines[0];
      const mapping = mapHeaders(headers);

      // Check required fields
      if (
        mapping['name'] === undefined ||
        mapping['gender'] === undefined ||
        mapping['eventName'] === undefined
      ) {
        alert('CSV is missing critical columns. Make sure it contains columns for: Name, Gender, and Event Name.');
        return;
      }

      const parsedStudents: StudentRow[] = lines.slice(1).map(row => {
        const getVal = (key: string, defaultValue = '') => {
          const colIdx = mapping[key];
          return colIdx !== undefined ? row[colIdx] || defaultValue : defaultValue;
        };

        return {
          name: getVal('name'),
          gender: getVal('gender', 'Male'),
          dob: getVal('dob', '2008-01-01'),
          className: getVal('className', '1st PU'),
          studentRegisterNumber: getVal('studentRegisterNumber', 'NIL'),
          emergencyContact: getVal('emergencyContact', 'NIL'),
          eventName: getVal('eventName'),
          team: getVal('team', 'A')
        };
      });

      setForms(prev => prev.map(f => {
        if (f.id === formId) {
          return {
            ...f,
            fileName: file.name,
            participants: parsedStudents
          };
        }
        return f;
      }));
    };
  };

  const togglePreview = (id: string) => {
    setForms(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, showPreview: !f.showPreview };
      }
      return f;
    }));
  };

  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Form validations
    for (let i = 0; i < forms.length; i++) {
      const f = forms[i];
      if (!f.name.trim()) {
        setErrorMsg(`Institution #${i + 1}: Institution Name is required.`);
        return;
      }
      if (!f.pocName.trim()) {
        setErrorMsg(`Institution #${i + 1} (${f.name || 'Unnamed'}): POC Name is required.`);
        return;
      }
      if (!f.pocNumber.trim()) {
        setErrorMsg(`Institution #${i + 1} (${f.name || 'Unnamed'}): POC Contact Number is required.`);
        return;
      }
      if (!f.pocEmail.trim() || !f.pocEmail.includes('@')) {
        setErrorMsg(`Institution #${i + 1} (${f.name || 'Unnamed'}): A valid POC Email is required.`);
        return;
      }
      if (f.participants.length === 0) {
        setErrorMsg(`Institution #${i + 1} (${f.name || 'Unnamed'}): Please upload a student roster CSV list.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        institutions: forms.map(f => ({
          name: f.name,
          pocName: f.pocName,
          pocNumber: f.pocNumber,
          pocEmail: f.pocEmail,
          participants: f.participants
        }))
      };

      const res = await apiFetch<{ success: boolean; message: string }>('/admin/bulk-register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        setSuccessMsg(res.message);
        // Reset repeater forms
        setForms([
          {
            id: `form-${Date.now()}-0`,
            name: '',
            pocName: '',
            pocNumber: '',
            pocEmail: '',
            fileName: '',
            participants: [],
            showPreview: false
          }
        ]);
      } else {
        setErrorMsg(res.message || 'Bulk import failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Database error during bulk registration submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalParsedStudents = forms.reduce((acc, f) => acc + f.participants.length, 0);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentRole="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Bulk Institution Import" />

        <main className="flex-grow p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header Description */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1 max-w-2xl">
              <h2 className="text-xl font-bold text-christ-navy font-serif">Bulk Registrar &amp; Roster Parser</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Add one or more institutions using the repeater control below. Upload a formatted Excel/CSV list of student participants for each. Submitted rosters will bypass standard desk verification and will be automatically registered, verified, and assigned chest numbers.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-christ-gold hover:bg-[#b89148] text-christ-navy font-bold rounded-xl text-xs transition-all shadow-md shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV Template</span>
            </button>
          </div>

          <form onSubmit={handleSubmitAll} className="space-y-6">
            {/* Repeater Forms List */}
            <div className="space-y-6">
              {forms.map((form, index) => (
                <div 
                  key={form.id} 
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-christ-gold/50 transition-all"
                >
                  {/* Card Title Bar */}
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-christ-navy uppercase tracking-wider">
                      Institution #{index + 1} Roster Details
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInstitution(form.id)}
                      className="inline-flex items-center space-x-1 text-xs text-rose-500 hover:text-rose-700 font-bold transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Remove Form</span>
                    </button>
                  </div>

                  {/* Form Inputs Grid */}
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Institution Name</label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          placeholder="e.g. Christ Junior College"
                          onChange={e => handleInputChange(form.id, 'name', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-christ-gold/20 focus:border-christ-gold focus:outline-none transition-all placeholder:text-slate-400"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">POC Coordinator Name</label>
                        <input
                          type="text"
                          required
                          value={form.pocName}
                          placeholder="e.g. Prof. Mark D'Souza"
                          onChange={e => handleInputChange(form.id, 'pocName', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-christ-gold/20 focus:border-christ-gold focus:outline-none transition-all placeholder:text-slate-400"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">POC Contact Number</label>
                        <input
                          type="tel"
                          required
                          value={form.pocNumber}
                          placeholder="e.g. 9845012345"
                          onChange={e => handleInputChange(form.id, 'pocNumber', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-christ-gold/20 focus:border-christ-gold focus:outline-none transition-all placeholder:text-slate-400"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">POC Email ID</label>
                        <input
                          type="email"
                          required
                          value={form.pocEmail}
                          placeholder="e.g. mark@sjpuc.edu.in"
                          onChange={e => handleInputChange(form.id, 'pocEmail', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-christ-gold/20 focus:border-christ-gold focus:outline-none transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* File Upload zone & status */}
                    <div className="border border-dashed border-slate-200 hover:border-christ-gold bg-slate-50/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative transition-colors">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={e => handleFileUpload(e, form.id)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="font-bold text-xs text-christ-navy hover:underline">
                        {form.fileName ? form.fileName : 'Click to Upload Student Roster CSV'}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">Accepts only standard CSV templates</span>
                    </div>

                    {/* Parsed list preview */}
                    {form.participants.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Successfully parsed {form.participants.length} students</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => togglePreview(form.id)}
                            className="inline-flex items-center space-x-1 text-xs font-bold text-christ-navy hover:text-christ-gold transition-colors"
                          >
                            <span>{form.showPreview ? 'Hide Roster View' : 'Show Roster View'}</span>
                            {form.showPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>

                        {form.showPreview && (
                          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs max-h-60 overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold">
                                  <th className="p-2">Name</th>
                                  <th className="p-2">Gender</th>
                                  <th className="p-2">DOB</th>
                                  <th className="p-2">Class</th>
                                  <th className="p-2">Reg No.</th>
                                  <th className="p-2">Emergency No</th>
                                  <th className="p-2">Event</th>
                                  <th className="p-2">Team</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {form.participants.map((p, pIdx) => (
                                  <tr key={pIdx} className="hover:bg-slate-50/50">
                                    <td className="p-2 font-semibold text-slate-800">{p.name}</td>
                                    <td className="p-2 text-slate-500">{p.gender}</td>
                                    <td className="p-2 text-slate-500 font-mono text-[11px]">{p.dob}</td>
                                    <td className="p-2 text-slate-500">{p.className}</td>
                                    <td className="p-2 font-mono text-[10px] text-slate-500">{p.studentRegisterNumber}</td>
                                    <td className="p-2 text-slate-500 font-mono text-[11px]">{p.emergencyContact}</td>
                                    <td className="p-2 font-bold text-christ-navy">{p.eventName}</td>
                                    <td className="p-2 text-slate-600 text-center font-bold">{p.team}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Repeater Controls & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <button
                type="button"
                onClick={handleAddInstitution}
                className="inline-flex items-center justify-center space-x-1.5 px-5 py-3 border-2 border-dashed border-christ-navy/30 hover:border-christ-navy hover:bg-slate-100/50 text-christ-navy text-xs font-bold rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Institution Form</span>
              </button>

              <div className="flex items-center space-x-3 bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                <Info className="w-4 h-4 text-christ-navy shrink-0" />
                <span>Aggregated Total: {forms.length} Colleges, {totalParsedStudents} Students</span>
              </div>
            </div>

            {/* Status alerts */}
            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-semibold flex items-start space-x-2">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-semibold flex items-start space-x-2">
                <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submission Actions */}
            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-7 py-3.5 bg-christ-navy text-white hover:bg-christ-darkNavy disabled:bg-slate-400 disabled:cursor-not-allowed rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Bulk Submissions...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-christ-gold" />
                    <span>Submit &amp; Register All</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};
