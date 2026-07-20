import React, { useState } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Header } from '../../components/common/Header';
import { 
  Upload, Trash2, Plus, Download, FileSpreadsheet, 
  CheckCircle2, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Info 
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { EVENTS_CATALOG } from '../../data/eventsCatalog';

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
  eventId: string;
}

const convertToCSVUrl = (urlStr: string): string => {
  const trimmed = urlStr.trim();
  
  // 1. Try to extract ID from standard Google Sheets URL
  // Format: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...
  let sheetId = '';
  const sheetsMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (sheetsMatch) {
    sheetId = sheetsMatch[1];
  }
  
  // 2. Try to extract ID from Google Drive share link
  // Format: https://drive.google.com/file/d/FILE_ID/view...
  if (!sheetId) {
    const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (driveMatch) {
      sheetId = driveMatch[1];
    }
  }

  // 3. Try to extract ID from Google Drive short link / open query
  // Format: https://drive.google.com/open?id=FILE_ID
  if (!sheetId) {
    const openMatch = trimmed.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (openMatch && (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com'))) {
      sheetId = openMatch[1];
    }
  }

  if (sheetId) {
    // Extract GID (tab ID) if present in hash or query parameters
    let gid = '';
    const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
    if (gidMatch) {
      gid = gidMatch[1];
    }
    
    // We export as CSV using Google Sheets exporter
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid ? `&gid=${gid}` : ''}`;
  }
  
  // Try to adjust Dropbox links for direct download
  if (trimmed.includes('dropbox.com')) {
    return trimmed.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '').replace('&dl=0', '');
  }
  
  return trimmed;
};

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
      showPreview: false,
      eventId: 'sports_football'
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [masterImportStatus, setMasterImportStatus] = useState<string | null>(null);

  const downloadMasterTemplate = () => {
    const headers = [
      'Name of Institution',
      'Institution Address',
      'Point of Contact (POC) Name',
      'POC Designation',
      'POC Mobile Number',
      'POC Email',
      'Event',
      'Upload Participant Details (Excel File)'
    ];
    const sampleRows = [
      [
        'Bishop Cotton Boys School',
        'Lalbagh Road Bengaluru',
        'Prof. Mark D Souza',
        'Sports Coordinator',
        '9845012345',
        'mark@bcbs.edu.in',
        'Football (Boys)',
        'https://docs.google.com/spreadsheets/d/1Xy2z3.../edit?usp=sharing'
      ],
      [
        'CMR National PU College',
        'CMR Layout Bengaluru',
        'Prof. Priya Nair',
        'Cultural Lead',
        '9876543210',
        'priya@cmrpuc.edu.in',
        'Group Dance',
        'https://docs.google.com/spreadsheets/d/2Ab3c4.../edit?usp=sharing'
      ]
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'anvesha_master_registration_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMasterFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMasterImportStatus("Reading master sheet...");
    try {
      const lines = await parseFileToLines(file);
      if (lines.length < 2) {
        alert('Master CSV file must contain a header row and at least one institution row.');
        setMasterImportStatus(null);
        return;
      }

      const headers = lines[0];
      
      const mapping: { [key: string]: number } = {};
      headers.forEach((h, index) => {
        const normalized = h.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        if (normalized === 'nameofinstitution' || normalized === 'institutionname' || normalized === 'institution') {
          mapping['instName'] = index;
        } else if (normalized === 'institutionaddress' || normalized === 'address') {
          mapping['instAddress'] = index;
        } else if (normalized === 'pointofcontactpocname' || normalized === 'pocname' || normalized === 'contactname') {
          mapping['pocName'] = index;
        } else if (normalized === 'pocdesignation' || normalized === 'designation') {
          mapping['pocDesignation'] = index;
        } else if (normalized === 'pocmobilenumber' || normalized === 'pocphone' || normalized === 'pocmobile' || normalized === 'contactphone' || normalized === 'mobilenumber') {
          mapping['pocNumber'] = index;
        } else if (normalized === 'pocemail' || normalized === 'pocemailid' || normalized === 'contactemail') {
          mapping['pocEmail'] = index;
        } else if (normalized === 'event' || normalized === 'eventname') {
          mapping['eventName'] = index;
        } else if (normalized === 'uploadparticipantdetailsexcelfile' || normalized === 'participantdetails' || normalized === 'excelurl' || normalized === 'googlesheeturl' || normalized === 'googlesheetlink' || normalized === 'url' || normalized === 'link' || normalized === 'excellink') {
          mapping['rosterUrl'] = index;
        }
      });

      if (mapping['instName'] === undefined || mapping['pocName'] === undefined || mapping['pocNumber'] === undefined || mapping['pocEmail'] === undefined || mapping['rosterUrl'] === undefined) {
        alert('Master CSV is missing required columns. Ensure it has columns for: Name of Institution, Point of Contact (POC) Name, POC Mobile Number, POC Email, and Upload Participant Details (Excel File).');
        setMasterImportStatus(null);
        return;
      }

      const parsedInstitutions: InstitutionImportForm[] = [];
      const fetchPromises: Promise<void>[] = [];

      setMasterImportStatus("Processing rows...");
      
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        if (row.length === 0 || !row[mapping['instName']]) continue;

        const getVal = (key: string, defaultValue = '') => {
          const colIdx = mapping[key];
          return colIdx !== undefined ? row[colIdx] || defaultValue : defaultValue;
        };

        const instNameVal = getVal('instName');
        const pocNameVal = getVal('pocName');
        const pocNumberVal = getVal('pocNumber');
        const pocEmailVal = getVal('pocEmail');
        const eventNameVal = getVal('eventName', 'General');
        const rosterUrlVal = getVal('rosterUrl');

        const eventObj = EVENTS_CATALOG.find(evt => evt.name.toLowerCase().includes(eventNameVal.toLowerCase()) || evt.id.toLowerCase() === eventNameVal.toLowerCase());
        const resolvedEventId = eventObj?.id || 'sports_football';

        const newFormId = `form-master-${Date.now()}-${i}`;
        const newForm: InstitutionImportForm = {
          id: newFormId,
          name: instNameVal,
          pocName: pocNameVal,
          pocNumber: pocNumberVal,
          pocEmail: pocEmailVal,
          fileName: rosterUrlVal.substring(0, 50) + (rosterUrlVal.length > 50 ? '...' : ''),
          participants: [],
          showPreview: false,
          eventId: resolvedEventId
        };

        parsedInstitutions.push(newForm);

        if (rosterUrlVal) {
          const targetUrl = convertToCSVUrl(rosterUrlVal);
          
          const fetchPromise = (async () => {
            try {
              let res = await fetch(targetUrl);
              // Fallback for Google Drive binary file links returning 400 Bad Request
              if (!res.ok && rosterUrlVal.includes('drive.google.com')) {
                const idMatch = rosterUrlVal.match(/[?&]id=([a-zA-Z0-9-_]+)/) || rosterUrlVal.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
                if (idMatch && idMatch[1]) {
                  const fallbackUrl = `https://docs.google.com/uc?export=download&id=${idMatch[1]}`;
                  const fallbackRes = await fetch(fallbackUrl);
                  if (fallbackRes.ok) {
                    res = fallbackRes;
                  }
                }
              }

              if (!res.ok) {
                if (res.status === 401 || res.status === 403 || res.status === 404) {
                  throw new Error("Spreadsheet is private or restricted.");
                }
                throw new Error(`HTTP ${res.status}`);
              }
              const csvText = await res.text();
              
              // If the response is HTML, Google redirected to ServiceLogin (due to private spreadsheet)
              if (csvText.trim().startsWith('<!DOCTYPE html') || csvText.includes('ServiceLogin') || csvText.includes('google-signin')) {
                throw new Error("Private/Restricted sheet.");
              }

              const subLines = parseCSV(csvText);
              
              if (subLines.length >= 2) {
                const subHeaders = subLines[0];
                const subMapping = mapHeaders(subHeaders);
                
                if (subMapping['name'] !== undefined) {
                  const subParticipants = subLines.slice(1).map(subRow => {
                    const getSubVal = (key: string, defaultValue = '') => {
                      const colIdx = subMapping[key];
                      return colIdx !== undefined ? subRow[colIdx] || defaultValue : defaultValue;
                    };
                    
                    return {
                      name: getSubVal('name'),
                      gender: getSubVal('gender', 'Male'),
                      dob: getSubVal('dob', '2008-01-01'),
                      className: getSubVal('className', '1st PU'),
                      studentRegisterNumber: getSubVal('studentRegisterNumber', 'NIL'),
                      emergencyContact: getSubVal('emergencyContact', 'NIL'),
                      eventName: eventNameVal,
                      team: 'A'
                    };
                  });

                  newForm.participants = subParticipants;
                }
              }
            } catch (err: any) {
              console.warn(`Could not parse nested roster from ${rosterUrlVal}:`, err.message || err);
              const errMsg = err.message || '';
              if (errMsg.includes('Private') || errMsg.includes('Failed to fetch') || errMsg.includes('redirect')) {
                newForm.fileName = `⚠️ Private Sheet. Set access to "Anyone with the link can view", or upload CSV manually.`;
              } else {
                newForm.fileName = `⚠️ Roster Link Warning (${errMsg || 'HTTP Error'}). Make sure file is shared publicly.`;
              }
            }
          })();
          
          fetchPromises.push(fetchPromise);
        }
      }

      setMasterImportStatus("Fetching roster lists from sheets...");
      await Promise.all(fetchPromises);
      
      setForms(parsedInstitutions);
      setMasterImportStatus(null);
      alert(`Master sheet processed successfully! Populated ${parsedInstitutions.length} institutions.`);
    } catch (err: any) {
      alert(`Error parsing master file: ${err.message}`);
      setMasterImportStatus(null);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'Name',
      'Gender',
      'Date of Birth',
      'PU Class',
      'Student Register Number',
      'Emergency Contact Number'
    ];
    const sampleRows = [
      ['Rohan Sen', 'Male', '2008-04-15', '1st PU', 'NIL', '9845012345'],
      ['Sneha Kapoor', 'Female', '2007-09-22', '2nd PU', 'REG-882910', '9876543210'],
      ['Aditya Rao', 'Male', '2008-11-02', '1st PU', 'NIL', '9741022931']
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
        showPreview: false,
        eventId: 'sports_football'
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

  const parseFileToLines = (file: File): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
      const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      const reader = new FileReader();

      if (isXlsx) {
        reader.readAsArrayBuffer(file);
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const sheetData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
            
            const lines = sheetData.map(row => 
              (Array.isArray(row) ? row : []).map(val => val !== null && val !== undefined ? String(val).trim() : '')
            );
            resolve(lines);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read Excel file.'));
      } else {
        reader.readAsText(file);
        reader.onload = () => {
          try {
            resolve(parseCSV(reader.result as string));
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read CSV file.'));
      }
    });
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, formId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const lines = await parseFileToLines(file);
      if (lines.length < 2) {
        alert('CSV file must contain a header row and at least one student row.');
        return;
      }

      const headers = lines[0];
      const mapping = mapHeaders(headers);

      // Check required fields
      if (
        mapping['name'] === undefined ||
        mapping['gender'] === undefined
      ) {
        alert('CSV is missing critical columns. Make sure it contains columns for: Name and Gender.');
        return;
      }

      // Find the selected event from form state
      const targetForm = forms.find(f => f.id === formId);
      const selectedEventId = targetForm?.eventId || 'sports_football';
      const eventObj = EVENTS_CATALOG.find(evt => evt.id === selectedEventId);
      const eventNameVal = eventObj?.name || 'General';

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
          eventName: eventNameVal,
          team: 'A'
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
    } catch (err: any) {
      alert(`Error parsing file: ${err.message}`);
    }
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
            showPreview: false,
            eventId: 'sports_football'
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
                Add one or more institutions using the repeater control below. Upload a formatted Excel/CSV list of student participants for each. Submitted rosters will be registered and placed in PENDING status for Registration Desk verification, document validation, and chest number assignment.
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

          {/* Option: Import from Master Spreadsheet */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-christ-navy font-serif">Option: Import from Master Spreadsheet</h3>
                <p className="text-[11px] text-slate-500">
                  Upload a single master CSV file containing institution details and the shareable spreadsheet link to each participant roster.
                </p>
              </div>
              <button
                type="button"
                onClick={downloadMasterTemplate}
                className="inline-flex items-center space-x-1 text-[10px] font-bold text-christ-navy hover:text-christ-gold transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Master Template</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative border-2 border-dashed border-slate-200 hover:border-christ-navy bg-slate-50 hover:bg-slate-100/50 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer w-full sm:w-80 transition-colors">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleMasterFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={!!masterImportStatus}
                />
                <FileSpreadsheet className="w-6 h-6 text-slate-400 mb-1.5" />
                <span className="font-bold text-[11px] text-christ-navy hover:underline">
                  {masterImportStatus ? 'Processing...' : 'Upload Master CSV File'}
                </span>
              </div>
              {masterImportStatus && (
                <div className="flex items-center space-x-2.5 text-xs font-bold text-christ-navy">
                  <RefreshCw className="w-4 h-4 animate-spin text-christ-gold" />
                  <span>{masterImportStatus}</span>
                </div>
              )}
            </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Target Event</label>
                        <select
                          value={form.eventId || 'sports_football'}
                          onChange={e => handleInputChange(form.id, 'eventId', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-christ-gold/20 focus:border-christ-gold focus:outline-none transition-all"
                        >
                          {EVENTS_CATALOG.map(evt => (
                            <option key={evt.id} value={evt.id}>{evt.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* File Upload zone & status */}
                    <div className="border border-dashed border-slate-200 hover:border-christ-gold bg-slate-50/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative transition-colors">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
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
