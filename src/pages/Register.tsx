import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, UserCheck, Users, Trophy, CreditCard, CheckCircle2, 
  ArrowLeft, ArrowRight, Plus, Trash2, AlertCircle, ShieldCheck, Download,
  Upload, Loader2, FileSpreadsheet, FileText
} from 'lucide-react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { useEvents } from '../contexts/EventsContext';
import { apiFetch } from '../services/api';
import { PREDEFINED_INSTITUTIONS } from '../data/initialData';
import { MasterInstitution } from '../types';

interface FileUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({ label, value, onChange, required = false }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB limit.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const res = await apiFetch<{ success: boolean; url?: string; message?: string }>('/upload', {
            method: 'POST',
            body: JSON.stringify({
              base64,
              fileName: file.name
            })
          });

          if (res.success && res.url) {
            onChange(res.url);
          } else {
            setError(res.message || 'Failed to upload file.');
          }
        } catch (err: any) {
          setError(err.message || 'Network error during upload.');
        } finally {
          setIsUploading(false);
        }
      };
    } catch (err: any) {
      setError('Failed to read file.');
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    setError(null);
  };

  const isUploaded = value && value.startsWith('http');

  return (
    <div className="space-y-1.5 text-xs">
      <label className="block font-bold text-slate-800">{label}</label>
      
      {isUploaded ? (
        <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-emerald-100 bg-white flex items-center justify-center">
              {value.toLowerCase().endsWith('.pdf') ? (
                <FileText className="w-5 h-5 text-rose-500" />
              ) : (
                <img src={value} alt="Preview" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="overflow-hidden">
              <span className="font-bold text-emerald-800 truncate block">Document Uploaded Successfully</span>
              <a href={value} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-600 hover:underline truncate block">
                {value.substring(value.lastIndexOf('/') + 1)}
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="px-2.5 py-1 font-bold text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            Change File
          </button>
        </div>
      ) : (
        <div className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center space-y-2 transition-all ${
          error ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 hover:border-christ-navy bg-slate-50/50'
        }`}>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            id={`file-input-${label.replace(/\s+/g, '-')}`}
            className="hidden"
            disabled={isUploading}
          />
          {isUploading ? (
            <div className="flex flex-col items-center space-y-1.5">
              <Loader2 className="w-6 h-6 animate-spin text-christ-navy" />
              <span className="font-bold text-slate-600 text-[10px]">Uploading Document to Server...</span>
            </div>
          ) : (
            <label
              htmlFor={`file-input-${label.replace(/\s+/g, '-')}`}
              className="flex flex-col items-center cursor-pointer space-y-1 w-full text-center"
            >
              <Upload className="w-6 h-6 text-slate-400" />
              <span className="font-bold text-christ-navy hover:underline">Click to Upload Document or PDF</span>
              <span className="text-[10px] text-slate-400">PNG, JPG, JPEG or PDF up to 5MB</span>
            </label>
          )}
        </div>
      )}
      {error && <p className="text-[10px] text-rose-600 font-bold">{error}</p>}
    </div>
  );
};

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { events } = useEvents();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedRegId, setSubmittedRegId] = useState<string | null>(null);

  // Master Institutions State
  const [masterInstitutions, setMasterInstitutions] = useState<any[]>(PREDEFINED_INSTITUTIONS);
  const [selectedMasterId, setSelectedMasterId] = useState<string>('');

  // SIB Feebook Portal verification parameters
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [isPreFilledFromBank, setIsPreFilledFromBank] = useState<boolean>(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const pId = queryParams.get('paymentId');
    
    // Fetch master institutions first
    apiFetch<{ success: boolean; data: MasterInstitution[] }>('/registration/master-institutions')
      .then(res => {
        let loadedMasterList = PREDEFINED_INSTITUTIONS;
        if (res.success && res.data && res.data.length > 0) {
          setMasterInstitutions(res.data);
          loadedMasterList = res.data;
        }
        
        // If paymentId is present, retrieve details
        if (pId) {
          setPaymentId(pId);
          apiFetch<{ success: boolean; data: any; message?: string }>(`/registration/payment-details/${pId}`)
            .then(payRes => {
              if (payRes.success && payRes.data) {
                const bankPay = payRes.data;
                setIsPreFilledFromBank(true);
                
                // Pre-fill Institution details
                const matchingMaster: any = loadedMasterList.find(
                  m => m.name.toLowerCase() === bankPay.institutionName.toLowerCase()
                );
                
                setInstitution({
                  name: bankPay.institutionName,
                  address: bankPay.address || matchingMaster?.address || '',
                  district: matchingMaster?.place || matchingMaster?.district || 'Bengaluru Urban',
                  state: matchingMaster?.state || 'Karnataka',
                  pincode: String(matchingMaster?.pincode || ''),
                  principalName: bankPay.principalName || matchingMaster?.principalName || matchingMaster?.principal || '',
                  schoolContactNumber: String(matchingMaster?.schoolContactNumber || matchingMaster?.contact || matchingMaster?.phone || ''),
                  schoolEmail: bankPay.email || matchingMaster?.schoolEmail || matchingMaster?.email || ''
                });
                
                if (matchingMaster) {
                  setSelectedMasterId(matchingMaster.id || matchingMaster.name);
                } else {
                  setSelectedMasterId('OTHER');
                }

                setPoc({
                  name: matchingMaster ? matchingMaster.pocName || '' : '',
                  designation: matchingMaster ? 'Sports Director / Coordinator' : '',
                  phone: matchingMaster ? matchingMaster.pocNumber || '' : '',
                  email: matchingMaster ? matchingMaster.pocEmailId || '' : '',
                  govtIdProof: ''
                });

                setParticipants([
                  {
                    teamIndex: 0,
                    name: '',
                    gender: 'Male',
                    dob: '',
                    className: '',
                    section: '',
                    phone: '',
                    email: '',
                    govtIdProof: '',
                    emergencyContact: '',
                    medicalInfo: ''
                  }
                ]);

                // Find matching event from catalog
                let initialEventId = 'cultural_debate';
                if (bankPay.eventName) {
                  const matchingEvent = events.find((e: any) =>
                    e.name.toLowerCase().includes(bankPay.eventName.toLowerCase()) ||
                    e.id.toLowerCase() === bankPay.eventName.toLowerCase()
                  );
                  if (matchingEvent) {
                    initialEventId = matchingEvent.id;
                  }
                }

                setTeams([
                  { eventId: initialEventId, teamName: 'Team A', coachName: '' }
                ]);

                // Pre-fill Payment details
                setPayment({
                  transactionId: bankPay.transactionId,
                  amount: bankPay.amount,
                  paymentProofUrl: 'SIB Feebook portal verification record - proof not required.'
                });
              } else {
                setErrorMsg(payRes.message || 'The registration invite link is invalid or has already been used.');
              }
            })
            .catch(err => {
              setErrorMsg('Failed to load verified payment details from link.');
              console.error(err);
            });
        }
      })
      .catch(() => {
        // Fallback
        if (pId) {
          setPaymentId(pId);
          apiFetch<{ success: boolean; data: any; message?: string }>(`/registration/payment-details/${pId}`)
            .then(payRes => {
              if (payRes.success && payRes.data) {
                const bankPay = payRes.data;
                setIsPreFilledFromBank(true);
                const matchingMaster = masterInstitutions.find(m => m.name.toLowerCase() === bankPay.institutionName.toLowerCase());
                const mm: any = matchingMaster;
                setInstitution({
                  name: bankPay.institutionName,
                  address: bankPay.address || mm?.address || '',
                  district: mm?.place || mm?.district || 'Bengaluru Urban',
                  state: mm?.state || 'Karnataka',
                  pincode: String(mm?.pincode || ''),
                  principalName: bankPay.principalName || mm?.principalName || mm?.principal || '',
                  schoolContactNumber: String(bankPay.phone || mm?.schoolContactNumber || mm?.contact || mm?.phone || ''),
                  schoolEmail: bankPay.email || mm?.schoolEmail || mm?.email || ''
                });
                setSelectedMasterId(matchingMaster ? (matchingMaster.id || matchingMaster.name) : 'OTHER');
                
                setPoc({
                  name: matchingMaster ? matchingMaster.pocName || '' : '',
                  designation: 'Sports Director / Coordinator',
                  phone: matchingMaster ? matchingMaster.pocNumber || '' : '',
                  email: matchingMaster ? matchingMaster.pocEmailId || '' : '',
                  govtIdProof: ''
                });

                setParticipants([
                  {
                    teamIndex: 0,
                    name: '',
                    gender: 'Male',
                    dob: '',
                    className: '',
                    section: '',
                    phone: '',
                    email: '',
                    govtIdProof: '',
                    emergencyContact: '',
                    medicalInfo: ''
                  }
                ]);

                // Find matching event from catalog
                let initialEventId = 'cultural_debate';
                if (bankPay.eventName) {
                  const matchingEvent = events.find((e: any) =>
                    e.name.toLowerCase().includes(bankPay.eventName.toLowerCase()) ||
                    e.id.toLowerCase() === bankPay.eventName.toLowerCase()
                  );
                  if (matchingEvent) {
                    initialEventId = matchingEvent.id;
                  }
                }

                setTeams([
                  { eventId: initialEventId, teamName: 'Team A', coachName: '' }
                ]);

                setPayment({
                  transactionId: bankPay.transactionId,
                  amount: bankPay.amount,
                  paymentProofUrl: 'SIB Feebook portal verification record - proof not required.'
                });
              } else {
                setErrorMsg(payRes.message || 'The registration invite link is invalid or has already been used.');
              }
            })
            .catch(() => {
              setErrorMsg('Failed to load verified payment details.');
            });
        }
      });
  }, [events]);

  // Form State
  const [institution, setInstitution] = useState({
    name: '',
    principalName: '',
    address: '',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    pincode: '',
    schoolContactNumber: '',
    schoolEmail: ''
  });

  const handleMasterSelect = (masterId: string) => {
    setSelectedMasterId(masterId);
    if (masterId === 'OTHER') {
      setInstitution({
        name: '',
        address: '',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        pincode: '',
        principalName: '',
        schoolContactNumber: '',
        schoolEmail: ''
      });
      setIsPreFilledFromBank(false);
      setPaymentId(null);
      setPayment({
        transactionId: '',
        paymentProofUrl: '',
        amount: 0
      });
      return;
    }
    if (!masterId) {
      setInstitution({
        name: '',
        address: '',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        pincode: '',
        principalName: '',
        schoolContactNumber: '',
        schoolEmail: ''
      });
      setIsPreFilledFromBank(false);
      setPaymentId(null);
      setPayment({
        transactionId: '',
        paymentProofUrl: '',
        amount: 0
      });
      return;
    }
    const found = masterInstitutions.find(m => m.id === masterId || m.name === masterId);
    if (found) {
      const f: any = found;
      setInstitution({
        name: f.name,
        address: f.address || '',
        district: f.place || f.district || 'Bengaluru Urban',
        state: f.state || 'Karnataka',
        pincode: String(f.pincode || ''),
        principalName: f.principalName || '',
        schoolContactNumber: String(f.schoolContactNumber || ''),
        schoolEmail: f.email || f.schoolEmail || ''
      });

      setPoc({
        name: f.pocName || '',
        designation: 'Sports Director / Coordinator',
        phone: f.pocNumber || '',
        email: f.pocEmailId || '',
        govtIdProof: ''
      });

      setParticipants([
        {
          teamIndex: 0,
          name: '',
          gender: 'Male',
          dob: '',
          className: '',
          section: '',
          phone: '',
          email: '',
          govtIdProof: '',
          emergencyContact: '',
          medicalInfo: ''
        }
      ]);

      if (f.transactionId) {
        setIsPreFilledFromBank(true);
        setPaymentId(f.bankPaymentId || null);
        setPayment({
          transactionId: f.transactionId,
          amount: Number(f.amount || 0),
          paymentProofUrl: 'SIB Feebook portal verification record - proof not required.'
        });

        if (f.eventName) {
          const matchingEvent = events.find((e: any) =>
            e.name.toLowerCase().includes(f.eventName.toLowerCase()) ||
            e.id.toLowerCase() === f.eventName.toLowerCase()
          );
          if (matchingEvent) {
            setTeams([
              { eventId: matchingEvent.id, teamName: 'Team A', coachName: '' }
            ]);
          }
        }
      } else {
        setIsPreFilledFromBank(false);
        setPaymentId(null);
        setPayment({
          transactionId: '',
          paymentProofUrl: '',
          amount: 0
        });
      }
    }
  };

  const [poc, setPoc] = useState({
    name: '',
    designation: 'Sports Director / Coordinator',
    phone: '',
    email: '',
    govtIdProof: ''
  });

  const [teams, setTeams] = useState<Array<{ eventId: string; teamName: 'Team A' | 'Team B'; coachName: string }>>([
    { eventId: 'cultural_debate', teamName: 'Team A', coachName: '' }
  ]);

  const [participants, setParticipants] = useState<Array<{
    teamIndex: number;
    name: string;
    gender: 'Male' | 'Female' | 'Other';
    dob: string;
    className: string;
    section: string;
    phone: string;
    email: string;
    govtIdProof: string;
    emergencyContact: string;
    medicalInfo: string;
  }>>([
    {
      teamIndex: 0,
      name: '',
      gender: 'Male',
      dob: '',
      className: '',
      section: '',
      phone: '',
      email: '',
      govtIdProof: '',
      emergencyContact: '',
      medicalInfo: ''
    }
  ]);

  const [payment, setPayment] = useState({
    transactionId: '',
    paymentProofUrl: '',
    amount: 0
  });

  const [participantUploadModes, setParticipantUploadModes] = useState<{[key: number]: 'MANUAL' | 'CSV'}>({});

  // Helper: Calculate total fee based on selected events
  const calculateTotalFee = () => {
    return teams.reduce((acc, team) => {
      const evt = events.find(e => e.id === team.eventId);
      return acc + (evt ? evt.registrationFee : 1500);
    }, 0);
  };

  // Rule 1 check: Max 2 teams per institution per event
  const handleAddTeam = () => {
    const defaultEvt = 'sports_football';
    const existingTeamsCount = teams.filter(t => t.eventId === defaultEvt).length;
    
    if (existingTeamsCount >= 2) {
      alert('Rule 1 Enforcement: Max 2 teams allowed per event (Team A and Team B). Select a different event.');
    }
    
    setTeams([...teams, {
      eventId: 'cultural_dance',
      teamName: existingTeamsCount === 0 ? 'Team A' : 'Team B',
      coachName: ''
    }]);
  };

  const handleRemoveTeam = (index: number) => {
    if (teams.length <= 1) {
      alert('At least one team must be registered.');
      return;
    }
    const newTeams = teams.filter((_, i) => i !== index);
    setTeams(newTeams);

    // Remove participants belonging to deleted team and shift indexes of remaining
    const newParticipants = participants
      .filter(p => p.teamIndex !== index)
      .map(p => {
        if (p.teamIndex > index) {
          return { ...p, teamIndex: p.teamIndex - 1 };
        }
        return p;
      });
    setParticipants(newParticipants);
  };

  const handleAddParticipant = (teamIdx: number) => {
    setParticipants([
      ...participants,
      {
        teamIndex: teamIdx,
        name: '',
        gender: 'Male',
        dob: '',
        className: '',
        section: '',
        phone: '',
        email: '',
        govtIdProof: '',
        emergencyContact: '',
        medicalInfo: ''
      }
    ]);
  };

  const handleRemoveParticipant = (partIdx: number) => {
    setParticipants(participants.filter((_, i) => i !== partIdx));
  };

  const handleDownloadParticipantTemplate = (teamName: string, eventName: string) => {
    const headers = [
      'Name',
      'Gender',
      'Date of Birth (YYYY-MM-DD)',
      'Class',
      'ID Number',
      'Emergency Contact'
    ];
    const sampleRows = [
      ['Rohan Sharma', 'Male', '2008-04-12', '2nd Year PU', 'PU-ID-9982', 'Father: 9845012345'],
      ['Priya Nair', 'Female', '2008-08-20', '2nd Year PU', 'PU-ID-1002', 'Mother: 9845067890'],
      ['Kevin Mathew', 'Male', '2008-05-15', '2nd Year PU', 'PU-ID-8891', 'Father: 9845011111']
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const safeEventName = eventName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    link.setAttribute('download', `participants_${safeEventName}_${teamName.toLowerCase().replace(/\s+/g, '_')}_template.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const handleParticipantCSVUpload = (e: React.ChangeEvent<HTMLInputElement>, teamIdx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      const csvData = reader.result as string;
      const lines = parseCSV(csvData);
      if (lines.length < 2) {
        alert('CSV file must contain a header row and at least one participant row.');
        return;
      }

      const headers = lines[0];
      const mapping: { [key: string]: number } = {};
      
      headers.forEach((h, index) => {
        const normalized = h.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        if (normalized === 'name' || normalized === 'fullname' || normalized === 'studentname') {
          mapping['name'] = index;
        } else if (normalized === 'gender' || normalized === 'sex') {
          mapping['gender'] = index;
        } else if (normalized === 'dateofbirth' || normalized === 'dob' || normalized === 'birthdate') {
          mapping['dob'] = index;
        } else if (normalized === 'class' || normalized === 'classname' || normalized === 'course' || normalized === 'year') {
          mapping['className'] = index;
        } else if (normalized === 'idnumber' || normalized === 'id' || normalized === 'govtid' || normalized === 'studentid') {
          mapping['govtIdProof'] = index;
        } else if (normalized === 'emergencycontact' || normalized === 'emergency' || normalized === 'parentcontact') {
          mapping['emergencyContact'] = index;
        }
      });

      if (mapping['name'] === undefined || mapping['gender'] === undefined || mapping['dob'] === undefined || mapping['className'] === undefined || mapping['govtIdProof'] === undefined || mapping['emergencyContact'] === undefined) {
        alert('CSV is missing one or more required columns.\nRequired columns are: Name, Gender, Date of Birth, Class, ID Number, Emergency Contact.');
        return;
      }

      const newParsedParticipants = lines.slice(1).map((row) => {
        const getVal = (key: string) => {
          const colIdx = mapping[key];
          return colIdx !== undefined ? row[colIdx] || '' : '';
        };

        // Clean gender
        let rowGender: 'Male' | 'Female' | 'Other' = 'Male';
        const rawGender = getVal('gender').toLowerCase();
        if (rawGender.startsWith('f')) {
          rowGender = 'Female';
        } else if (rawGender.startsWith('m')) {
          rowGender = 'Male';
        } else if (rawGender.length > 0) {
          rowGender = 'Other';
        }

        // Try to parse/normalize date format (DD/MM/YYYY to YYYY-MM-DD) if needed
        let rawDob = getVal('dob');
        if (rawDob.includes('/')) {
          const parts = rawDob.split('/');
          if (parts.length === 3) {
            if (parts[2].length === 4) {
              rawDob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            } else if (parts[0].length === 4) {
              rawDob = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
          }
        }

        return {
          teamIndex: teamIdx,
          name: getVal('name'),
          gender: rowGender,
          dob: rawDob,
          className: getVal('className'),
          section: 'A',
          phone: '',
          email: '',
          govtIdProof: getVal('govtIdProof'),
          emergencyContact: getVal('emergencyContact'),
          medicalInfo: ''
        };
      });

      // Filter out participants of other teams and replace participants of active team
      const otherParts = participants.filter((p) => p.teamIndex !== teamIdx);
      setParticipants([...otherParts, ...newParsedParticipants]);
      
      // Switch back to MANUAL mode so they can view/verify the parsed list
      setParticipantUploadModes(prev => ({ ...prev, [teamIdx]: 'MANUAL' }));
      alert(`Successfully imported ${newParsedParticipants.length} participants for this team! Please verify the list below.`);
    };
  };

  // Validate Step 5 participant for Rule 2 & Duplicates
  const handleValidateParticipantRow = async (part: typeof participants[0]) => {
    if (!part.name || !part.govtIdProof) return;
    try {
      const res = await apiFetch<{ valid: boolean; error?: string }>('/registration/validate-participant', {
        method: 'POST',
        body: JSON.stringify({
          name: part.name,
          dob: part.dob,
          govtIdProof: part.govtIdProof,
          eventId: teams[part.teamIndex]?.eventId
        })
      });
      if (!res.valid) {
        alert(`Validation Error: ${res.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle step validations and go to next step (skips validation, deferred to submit)
  const handleNextStep = () => {
    setErrorMsg(null);
    setCurrentStep(currentStep + 1);
  };

  // Submit Registration (enforces all validations before final POST)
  const handleSubmitAll = async () => {
    setErrorMsg(null);

    // Validate Step 1 (Institution)
    if (!selectedMasterId) {
      setErrorMsg('Please select a PU Institution.');
      setCurrentStep(1);
      return;
    }
    if (!String(institution.name || '').trim()) {
      setErrorMsg('Please enter the Institution Name.');
      setCurrentStep(1);
      return;
    }
    if (!String(institution.principalName || '').trim()) {
      setErrorMsg('Please enter the Principal Name.');
      setCurrentStep(1);
      return;
    }
    if (!String(institution.address || '').trim()) {
      setErrorMsg('Please enter the Campus Address.');
      setCurrentStep(1);
      return;
    }
    if (!String(institution.district || '').trim()) {
      setErrorMsg('Please select a District.');
      setCurrentStep(1);
      return;
    }
    if (!String(institution.pincode || '').trim()) {
      setErrorMsg('Please enter the Pincode.');
      setCurrentStep(1);
      return;
    }
    if (!String(institution.schoolContactNumber || '').trim()) {
      setErrorMsg('Please enter the School Office Contact Number.');
      setCurrentStep(1);
      return;
    }
    if (!String(institution.schoolEmail || '').trim()) {
      setErrorMsg('Please enter the Official School Email.');
      setCurrentStep(1);
      return;
    }

    // Validate Step 2 (POC)
    if (!String(poc.name || '').trim()) {
      setErrorMsg('Please enter the POC Full Name.');
      setCurrentStep(2);
      return;
    }
    if (!String(poc.designation || '').trim()) {
      setErrorMsg('Please enter the POC Designation.');
      setCurrentStep(2);
      return;
    }
    if (!String(poc.phone || '').trim()) {
      setErrorMsg('Please enter the POC Mobile Phone Number.');
      setCurrentStep(2);
      return;
    }
    if (!String(poc.email || '').trim()) {
      setErrorMsg('Please enter the POC Email Address.');
      setCurrentStep(2);
      return;
    }
    if (!String(poc.govtIdProof || '').trim()) {
      setErrorMsg('Please provide the POC Institution ID Card Photo URL.');
      setCurrentStep(2);
      return;
    }

    // Validate Step 3 (Teams)
    if (teams.length === 0) {
      setErrorMsg('Please add at least one team to register.');
      setCurrentStep(3);
      return;
    }
    for (let i = 0; i < teams.length; i++) {
      if (!teams[i].eventId) {
        setErrorMsg(`Please select an event for Team ${i + 1}.`);
        setCurrentStep(3);
        return;
      }
      if (!teams[i].teamName) {
        setErrorMsg(`Please select a team identifier for Team ${i + 1}.`);
        setCurrentStep(3);
        return;
      }
      const sameEventTeams = teams.filter((t) => t.eventId === teams[i].eventId);
      if (sameEventTeams.length > 2) {
        const eventName = events.find(e => e.id === teams[i].eventId)?.name || teams[i].eventId;
        setErrorMsg(`Rule 1 violation: You cannot register more than 2 teams for event '${eventName}'.`);
        setCurrentStep(3);
        return;
      }
      const duplicateTeam = teams.find((t, index) => 
        index !== i && t.eventId === teams[i].eventId && t.teamName === teams[i].teamName
      );
      if (duplicateTeam) {
        const eventName = events.find(e => e.id === teams[i].eventId)?.name || teams[i].eventId;
        setErrorMsg(`Duplicate team configuration: You have registered multiple '${teams[i].teamName}' for '${eventName}'.`);
        setCurrentStep(3);
        return;
      }
    }

    // Validate Step 4 (Participants)
    for (let tIdx = 0; tIdx < teams.length; tIdx++) {
      const team = teams[tIdx];
      const teamEvt = events.find(e => e.id === team.eventId);
      const teamParts = participants.filter(p => p.teamIndex === tIdx);
      const minSize = teamEvt?.minTeamSize || 1;
      const maxSize = teamEvt?.maxTeamSize || 1;
      
      if (teamParts.length < minSize) {
        setErrorMsg(`Team registration for '${teamEvt?.name}' (${team.teamName}) requires at least ${minSize} participant(s). You have ${teamParts.length}.`);
        setCurrentStep(4);
        return;
      }
      if (teamParts.length > maxSize) {
        setErrorMsg(`Team registration for '${teamEvt?.name}' (${team.teamName}) cannot exceed ${maxSize} participant(s). You have ${teamParts.length}.`);
        setCurrentStep(4);
        return;
      }

      for (let pIdx = 0; pIdx < teamParts.length; pIdx++) {
        const p = teamParts[pIdx];
        if (!p.name.trim()) {
          setErrorMsg(`Please fill in the Name of Participant ${pIdx + 1} in '${teamEvt?.name}'.`);
          setCurrentStep(4);
          return;
        }
        if (!p.dob) {
          setErrorMsg(`Please fill in the Date of Birth of '${p.name || `Participant ${pIdx + 1}`}' in '${teamEvt?.name}'.`);
          setCurrentStep(4);
          return;
        }
        if (!p.className.trim()) {
          setErrorMsg(`Please enter the Class of '${p.name}' in '${teamEvt?.name}'.`);
          setCurrentStep(4);
          return;
        }

        if (!p.govtIdProof.trim()) {
          setErrorMsg(`Please enter the Government ID Proof of '${p.name}' in '${teamEvt?.name}'.`);
          setCurrentStep(4);
          return;
        }
        if (!p.emergencyContact.trim()) {
          setErrorMsg(`Please enter the Emergency Contact of '${p.name}' in '${teamEvt?.name}'.`);
          setCurrentStep(4);
          return;
        }
      }
    }

    const seenParticipants = new Set<string>();
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      if (!p.name.trim() || !p.dob) continue;
      const key = `${p.name.trim().toLowerCase()}_${p.dob}`;
      if (seenParticipants.has(key)) {
        setErrorMsg(`Duplicate student detected: '${p.name}' with Date of Birth '${p.dob}' is added multiple times. Under Rule 2, a participant can register for only ONE event.`);
        setCurrentStep(4);
        return;
      }
      seenParticipants.add(key);
    }

    // Validate Step 5 (Payment)
    if (!payment.transactionId.trim()) {
      setErrorMsg('Please enter the Bank Transaction or Ref ID.');
      setCurrentStep(5);
      return;
    }
    if (!payment.paymentProofUrl.trim()) {
      setErrorMsg('Please upload a Payment Proof photo.');
      setCurrentStep(5);
      return;
    }
    if (isPreFilledFromBank) {
      const totalFee = calculateTotalFee();
      if (totalFee > payment.amount) {
        setErrorMsg(`Rule Violation: The selected events fee (₹${totalFee}) exceeds your pre-paid SIB bank payment (₹${payment.amount}). Please adjust your teams/events list.`);
        setCurrentStep(5);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        institution,
        poc,
        teams,
        participants,
        payment: {
          ...payment,
          amount: isPreFilledFromBank ? payment.amount : calculateTotalFee()
        },
        paymentId: paymentId || undefined
      };

      const res = await apiFetch<{ success: boolean; registrationId: string; message?: string }>('/registration/submit', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        setSubmittedRegId(res.registrationId);
        setCurrentStep(6);
      } else {
        setErrorMsg(res.message || 'Registration failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit registration. Please verify form data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepCompleted = (stepNum: number): boolean => {
    if (stepNum === 1) {
      return !!(
        selectedMasterId &&
        String(institution.name || '').trim() &&
        String(institution.principalName || '').trim() &&
        String(institution.address || '').trim() &&
        String(institution.district || '').trim() &&
        String(institution.pincode || '').trim() &&
        String(institution.schoolContactNumber || '').trim() &&
        String(institution.schoolEmail || '').trim()
      );
    }
    if (stepNum === 2) {
      return !!(
        String(poc.name || '').trim() &&
        String(poc.designation || '').trim() &&
        String(poc.phone || '').trim() &&
        String(poc.email || '').trim() &&
        String(poc.govtIdProof || '').trim()
      );
    }
    if (stepNum === 3) {
      if (teams.length === 0) return false;
      for (let i = 0; i < teams.length; i++) {
        if (!teams[i].eventId || !teams[i].teamName) return false;
        const sameEventTeams = teams.filter((t) => t.eventId === teams[i].eventId);
        if (sameEventTeams.length > 2) return false;
        const duplicateTeam = teams.find((t, index) => 
          index !== i && t.eventId === teams[i].eventId && t.teamName === teams[i].teamName
        );
        if (duplicateTeam) return false;
      }
      return true;
    }
    if (stepNum === 4) {
      if (teams.length === 0) return false;
      for (let tIdx = 0; tIdx < teams.length; tIdx++) {
        const team = teams[tIdx];
        const teamEvt = events.find(e => e.id === team.eventId);
        const teamParts = participants.filter(p => p.teamIndex === tIdx);
        const minSize = teamEvt?.minTeamSize || 1;
        const maxSize = teamEvt?.maxTeamSize || 1;
        
        if (teamParts.length < minSize || teamParts.length > maxSize) return false;

        for (let pIdx = 0; pIdx < teamParts.length; pIdx++) {
          const p = teamParts[pIdx];
          if (
            !p.name.trim() ||
            !p.dob ||
            !p.className.trim() ||
            !p.govtIdProof.trim() ||
            !p.emergencyContact.trim()
          ) return false;
        }
      }
      const seenParticipants = new Set<string>();
      for (let i = 0; i < participants.length; i++) {
        const p = participants[i];
        if (!p.name.trim() || !p.dob) continue;
        const key = `${p.name.trim().toLowerCase()}_${p.dob}`;
        if (seenParticipants.has(key)) return false;
        seenParticipants.add(key);
      }
      return true;
    }
    if (stepNum === 5) {
      if (!payment.transactionId.trim() || !payment.paymentProofUrl.trim()) return false;
      if (isPreFilledFromBank) {
        const totalFee = calculateTotalFee();
        if (totalFee > payment.amount) return false;
      }
      return true;
    }
    if (stepNum === 6) {
      return !!submittedRegId;
    }
    return false;
  };

  const isStepFullyCompleted = (stepNum: number): boolean => {
    for (let i = 1; i <= stepNum; i++) {
      if (!isStepCompleted(i)) return false;
    }
    return true;
  };

  const steps = [
    { num: 1, label: 'Institution', icon: Building2 },
    { num: 2, label: 'POC', icon: UserCheck },
    { num: 3, label: 'Teams', icon: Trophy },
    { num: 4, label: 'Participants', icon: Users },
    { num: 5, label: 'Payment', icon: CreditCard },
    { num: 6, label: 'Review & Submit', icon: CheckCircle2 }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #eef2f7 100%)' }}>
      <Navbar />

      <main className="pt-28 pb-24 flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* ── Hero Header ── */}
          <div className="relative text-center mb-10 py-8 px-6 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-christ-navy to-christ-darkNavy" />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, #C5A059 0px, #C5A059 1px, transparent 1px, transparent 28px)' }}
            />
            <div className="relative z-10 space-y-3">
              <span className="inline-flex items-center space-x-2 text-[11px] font-bold text-christ-gold uppercase tracking-widest bg-christ-gold/10 border border-christ-gold/25 px-4 py-1.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Official Registration Form</span>
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-serif tracking-tight">
                PU Institution Registration Portal
              </h1>
              <p className="text-sm text-slate-400">
                ANVESHA 2026 &nbsp;•&nbsp; Inter PU Sports &amp; Cultural Fest &nbsp;•&nbsp; Christ University
              </p>
            </div>
          </div>

          {/* ── Stepper ── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-christ-card mb-8 overflow-x-auto">
            <div className="flex items-stretch min-w-[640px]">
              {steps.map((s, idx) => {
                const Icon = s.icon;
                const isCompleted = isStepFullyCompleted(s.num);
                const isCurrent = currentStep === s.num;
                return (
                  <React.Fragment key={s.num}>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(s.num)}
                      className={`flex-1 flex flex-col items-center py-4 px-3 gap-2 transition-all relative ${
                        isCurrent
                          ? 'bg-christ-navy text-white'
                          : isCompleted
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80'
                            : 'text-slate-400 hover:bg-slate-50'
                      } ${idx === 0 ? 'rounded-l-2xl' : ''} ${idx === steps.length - 1 ? 'rounded-r-2xl' : ''}`}
                    >
                      {/* Bottom active indicator */}
                      {isCurrent && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-christ-gold" />
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        isCurrent
                          ? 'bg-christ-gold border-christ-gold text-christ-navy'
                          : isCompleted
                            ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                            : 'bg-slate-100 border-slate-300 text-slate-500'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <span className={`text-[11px] font-bold font-serif whitespace-nowrap ${
                        isCurrent ? 'text-white' : isCompleted ? 'text-emerald-700' : 'text-slate-500'
                      }`}>{s.label}</span>
                    </button>
                    {idx < steps.length - 1 && (
                      <div className={`w-px self-stretch my-3 ${ isStepFullyCompleted(s.num) ? 'bg-emerald-200' : 'bg-slate-200' }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-xl flex items-start space-x-3 shadow-sm">
              <div className="w-5 h-5 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-3 h-3 text-rose-600" />
              </div>
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* ── Form Step Cards ── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-christ-card overflow-hidden">
            
            {/* STEP 1: Institution Details */}
            {currentStep === 1 && (
              <div>
                {/* Step header accent strip */}
                <div className="bg-gradient-to-r from-christ-navy to-[#003070] px-6 sm:px-8 py-5 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-christ-gold/20 border border-christ-gold/30 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-christ-gold" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-serif">Step 1: Institution Master Details</h3>
                    <p className="text-[11px] text-slate-400">Provide official college information as registered with Pre-University Board.</p>
                  </div>
                </div>
                <div className="space-y-6 p-6 sm:p-8">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-800 mb-1">Select PU Institution *</label>
                    <select
                      value={selectedMasterId}
                      onChange={(e) => handleMasterSelect(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none text-slate-800 font-medium bg-white"
                    >
                      <option value="">-- Select PU Institution --</option>
                      {masterInstitutions.map((m) => (
                        <option key={m.id || m.name} value={m.id || m.name}>
                          {m.name}{m.eventName || m.transactionId ? ` - ${m.eventName || 'General'} (₹${m.amount}) [TXN: ${m.transactionId}]` : ''}
                        </option>
                      ))}
                      <option value="OTHER" className="font-bold text-christ-navy">Other (Specify below)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-800 mb-1">Institution Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Type official PU College name..."
                      value={institution.name}
                      onChange={(e) => setInstitution({ ...institution, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Principal Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rev. Fr. Swebert D'Silva"
                      value={institution.principalName}
                      onChange={(e) => setInstitution({ ...institution, principalName: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-800 mb-1">Campus Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 36, Lalbagh Road, Shanthi Nagar"
                      value={institution.address}
                      onChange={(e) => setInstitution({ ...institution, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">District *</label>
                    <select
                      value={institution.district}
                      onChange={(e) => setInstitution({ ...institution, district: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none"
                    >
                      <option value="Bengaluru Urban">Bengaluru Urban</option>
                      <option value="Bengaluru Rural">Bengaluru Rural</option>
                      <option value="Mysuru">Mysuru</option>
                      <option value="Mangaluru / Dakshina Kannada">Mangaluru / Dakshina Kannada</option>
                      <option value="Tumakuru">Tumakuru</option>
                      <option value="Other District / State">Other District / State</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Pincode *</label>
                    <input
                      type="text"
                      required
                      placeholder="560027"
                      value={institution.pincode}
                      onChange={(e) => setInstitution({ ...institution, pincode: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">School Office Contact Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="080-22211429"
                      value={institution.schoolContactNumber}
                      onChange={(e) => setInstitution({ ...institution, schoolContactNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Official School Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="office@institution.edu.in"
                      value={institution.schoolEmail}
                      onChange={(e) => setInstitution({ ...institution, schoolEmail: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none bg-white"
                    />
                  </div>
                </div>
                </div>
              </div>
            )}

            {/* STEP 2: Point of Contact Details */}
            {currentStep === 2 && (
              <div>
                <div className="bg-gradient-to-r from-[#1a3a6e] to-[#003070] px-6 sm:px-8 py-5 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-christ-gold/20 border border-christ-gold/30 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5 text-christ-gold" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-serif">Step 2: Point of Contact (POC)</h3>
                    <p className="text-[11px] text-slate-400">Authorized staff member responsible for team coordination.</p>
                  </div>
                </div>
                <div className="space-y-6 p-6 sm:p-8">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">POC Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Prof. Mark D'Souza"
                      value={poc.name}
                      onChange={(e) => setPoc({ ...poc, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Designation *</label>
                    <input
                      type="text"
                      required
                      placeholder="Sports Director / Physical Director"
                      value={poc.designation}
                      onChange={(e) => setPoc({ ...poc, designation: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Mobile Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="9845012345"
                      value={poc.phone}
                      onChange={(e) => setPoc({ ...poc, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="poc@institution.edu.in"
                      value={poc.email}
                      onChange={(e) => setPoc({ ...poc, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FileUploadField
                      label="Institution ID Card Photo *"
                      value={poc.govtIdProof}
                      onChange={(url) => setPoc({ ...poc, govtIdProof: url })}
                      required
                    />
                  </div>
                </div>
                </div>
              </div>
            )}

            {/* STEP 3: Team Selection (Rule 1: Max 2 Teams per Event) */}
            {currentStep === 3 && (
              <div>
                <div className="bg-gradient-to-r from-[#0d2d5a] to-[#003070] px-6 sm:px-8 py-5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-christ-gold/20 border border-christ-gold/30 flex items-center justify-center shrink-0">
                      <Trophy className="w-5 h-5 text-christ-gold" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-serif">Step 3: Event & Team Configuration</h3>
                      <p className="text-[11px] text-slate-400">Select competitions. Max 2 teams per event (Team A / Team B).</p>
                    </div>
                  </div>
                  <button
                    onClick={handleAddTeam}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold bg-christ-gold text-christ-navy rounded-lg hover:bg-christ-lightGold shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Team</span>
                  </button>
                </div>
                <div className="p-6 sm:p-8 space-y-6">

                <div className="space-y-4">
                  {teams.map((t, idx) => (
                    <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative space-y-4 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-christ-navy font-serif">Team #{idx + 1} Configuration</span>
                        {teams.length > 1 && (
                          <button
                            onClick={() => handleRemoveTeam(idx)}
                            className="text-rose-600 hover:text-rose-800 flex items-center space-x-1 text-[11px] font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block font-bold text-slate-800 mb-1">Select Event *</label>
                          <select
                            value={t.eventId}
                            onChange={(e) => {
                              const newTeams = [...teams];
                              newTeams[idx].eventId = e.target.value;
                              setTeams(newTeams);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none"
                          >
                            {events.map((evt) => (
                              <option key={evt.id} value={evt.id}>
                                [{evt.category}] {evt.name} (₹{evt.registrationFee})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-800 mb-1">Team Identifier *</label>
                          <select
                            value={t.teamName}
                            onChange={(e) => {
                              const newTeams = [...teams];
                              newTeams[idx].teamName = e.target.value as any;
                              setTeams(newTeams);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none"
                          >
                            <option value="Team A">Team A</option>
                            <option value="Team B">Team B</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-800 mb-1">Coach / Instructor Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Mr. Anthony G"
                            value={t.coachName}
                            onChange={(e) => {
                              const newTeams = [...teams];
                              newTeams[idx].coachName = e.target.value;
                              setTeams(newTeams);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                </div>
              </div>
            )}

            {/* STEP 4: Participant Roster (Rule 2 & Duplicate Validation) */}
            {currentStep === 4 && (
              <div>
                <div className="bg-gradient-to-r from-[#002147] to-[#0d3d6e] px-6 sm:px-8 py-5 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-christ-gold/20 border border-christ-gold/30 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-christ-gold" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-serif">Step 4: Participant Roster & Validation</h3>
                    <p className="text-[11px] text-slate-400">Rule 2: One participant per event only. Uniqueness checked on Govt ID & Name.</p>
                  </div>
                </div>
                <div className="p-6 sm:p-8 space-y-6">

                {teams.map((t, teamIdx) => {
                  const teamEvt = events.find(e => e.id === t.eventId);
                  const teamParts = participants.filter(p => p.teamIndex === teamIdx);
                  const uploadMode = participantUploadModes[teamIdx] || 'MANUAL';

                  return (
                    <div key={teamIdx} className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-4">
                      {/* Team Header & Mode Toggles */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-3 gap-2">
                        <div>
                          <h4 className="font-bold text-christ-navy text-sm font-serif flex items-center space-x-2">
                            <span>{teamEvt?.name}</span>
                            <span className="px-2 py-0.5 bg-christ-navy/10 text-christ-navy rounded-full text-[10px] uppercase font-bold">{t.teamName}</span>
                          </h4>
                          <span className="text-[11px] text-slate-500 font-medium">
                            Min: {teamEvt?.minTeamSize} | Max: {teamEvt?.maxTeamSize} Members (Current: {teamParts.length})
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 shrink-0">
                          {/* Option 1: Single Manual */}
                          <button
                            type="button"
                            onClick={() => setParticipantUploadModes(prev => ({ ...prev, [teamIdx]: 'MANUAL' }))}
                            className={`px-3 py-1.5 font-bold rounded-lg text-[10px] transition-all border ${
                              uploadMode === 'MANUAL' 
                                ? 'bg-christ-navy text-white border-christ-navy shadow-sm' 
                                : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            Single (Manual)
                          </button>
                          
                          {/* Option 2: Bulk CSV */}
                          <button
                            type="button"
                            onClick={() => setParticipantUploadModes(prev => ({ ...prev, [teamIdx]: 'CSV' }))}
                            className={`px-3 py-1.5 font-bold rounded-lg text-[10px] transition-all border ${
                              uploadMode === 'CSV' 
                                ? 'bg-christ-navy text-white border-christ-navy shadow-sm' 
                                : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            Bulk (CSV Upload)
                          </button>
                          
                          {uploadMode === 'MANUAL' && (
                            <button
                              type="button"
                              onClick={() => handleAddParticipant(teamIdx)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold bg-christ-navy hover:bg-christ-darkNavy text-white rounded-lg transition-all shadow-sm ml-2"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Student</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Display Mode CSV */}
                      {uploadMode === 'CSV' && (
                        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 text-center space-y-3">
                            <FileSpreadsheet className="w-8 h-8 text-christ-navy" />
                            <div>
                              <strong className="text-slate-800 text-xs block">Upload Roster CSV for {teamEvt?.name}</strong>
                              <span className="text-[10px] text-slate-500 max-w-md block mt-0.5">
                                Ensure headers match exactly: Name, Gender, Date of Birth (YYYY-MM-DD), Class, ID Number, Emergency Contact.
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <input 
                                type="file" 
                                accept=".csv" 
                                id={`csv-participant-input-${teamIdx}`}
                                onChange={(e) => handleParticipantCSVUpload(e, teamIdx)} 
                                className="hidden" 
                              />
                              <label 
                                htmlFor={`csv-participant-input-${teamIdx}`}
                                className="px-4 py-1.5 bg-christ-navy hover:bg-christ-darkNavy text-white font-bold rounded-lg cursor-pointer transition-all shadow-sm flex items-center space-x-1 text-[11px]"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Choose CSV File</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => handleDownloadParticipantTemplate(t.teamName, teamEvt?.name || 'event')}
                                className="px-4 py-1.5 bg-white border border-slate-350 text-slate-700 hover:bg-slate-50 font-bold rounded-lg transition-all shadow-sm flex items-center space-x-1 text-[11px]"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download Template CSV</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Display Mode MANUAL (or after CSV is parsed) */}
                      {uploadMode === 'MANUAL' && (
                        <div className="space-y-3">
                          {teamParts.length === 0 ? (
                            <div className="text-center py-6 text-slate-500 italic bg-white border border-slate-200 rounded-lg">
                              No participants added. Click "Add Student" above or switch to "Bulk (CSV Upload)" to populate.
                            </div>
                          ) : (
                            participants.map((p, pIdx) => {
                              if (p.teamIndex !== teamIdx) return null;
                              return (
                                <div key={pIdx} className="p-3 bg-white border border-slate-200 rounded-lg space-y-3 text-xs shadow-sm">
                                  <div className="flex items-center justify-between border-b pb-1.5 border-slate-100">
                                    <span className="font-bold text-slate-700 font-serif">Student Info</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveParticipant(pIdx)}
                                      className="text-rose-650 hover:text-rose-750 text-[11px] font-bold"
                                    >
                                      Remove
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                    <div>
                                      <label className="block font-bold text-slate-800 mb-1">Full Name *</label>
                                      <input
                                        type="text"
                                        required
                                        placeholder="Kevin Mathew"
                                        value={p.name}
                                        onChange={(e) => {
                                          const newParts = [...participants];
                                          newParts[pIdx].name = e.target.value;
                                          setParticipants(newParts);
                                        }}
                                        onBlur={() => handleValidateParticipantRow(p)}
                                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-christ-navy focus:outline-none bg-white"
                                      />
                                    </div>

                                    <div>
                                      <label className="block font-bold text-slate-800 mb-1">Gender *</label>
                                      <select
                                        value={p.gender}
                                        onChange={(e) => {
                                          const newParts = [...participants];
                                          newParts[pIdx].gender = e.target.value as any;
                                          setParticipants(newParts);
                                        }}
                                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-christ-navy focus:outline-none bg-white"
                                      >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block font-bold text-slate-800 mb-1">Date of Birth *</label>
                                      <input
                                        type="date"
                                        required
                                        value={p.dob}
                                        onChange={(e) => {
                                          const newParts = [...participants];
                                          newParts[pIdx].dob = e.target.value;
                                          setParticipants(newParts);
                                        }}
                                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-christ-navy focus:outline-none bg-white"
                                      />
                                    </div>

                                    <div>
                                      <label className="block font-bold text-slate-800 mb-1">PU Class *</label>
                                      <select
                                        required
                                        value={p.className}
                                        onChange={(e) => {
                                          const newParts = [...participants];
                                          newParts[pIdx].className = e.target.value;
                                          setParticipants(newParts);
                                        }}
                                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-christ-navy focus:outline-none bg-white font-medium"
                                      >
                                        <option value="">Select Class...</option>
                                        <option value="1st PU">1st PU</option>
                                        <option value="2nd PU">2nd PU</option>
                                      </select>
                                    </div>

                                    <div className="sm:col-span-2">
                                      <label className="block font-bold text-slate-800 mb-1">Govt ID / PU Student ID Number *</label>
                                      <input
                                        type="text"
                                        required
                                        placeholder="PUC-ID-2024-8891"
                                        value={p.govtIdProof}
                                        onChange={(e) => {
                                          const newParts = [...participants];
                                          newParts[pIdx].govtIdProof = e.target.value;
                                          setParticipants(newParts);
                                        }}
                                        onBlur={() => handleValidateParticipantRow(p)}
                                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-christ-navy focus:outline-none bg-white"
                                      />
                                    </div>

                                    <div className="sm:col-span-2">
                                      <label className="block font-bold text-slate-800 mb-1">Emergency Contact Number *</label>
                                      <input
                                        type="text"
                                        required
                                        placeholder="Father: 9845011111"
                                        value={p.emergencyContact}
                                        onChange={(e) => {
                                          const newParts = [...participants];
                                          newParts[pIdx].emergencyContact = e.target.value;
                                          setParticipants(newParts);
                                        }}
                                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-christ-navy focus:outline-none bg-white"
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
                </div>
            )}

            {/* STEP 5: Payment Details */}
            {currentStep === 5 && (
              <div>
                <div className="bg-gradient-to-r from-[#002147] to-[#004080] px-6 sm:px-8 py-5 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-christ-gold/20 border border-christ-gold/30 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-christ-gold" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-serif">Step 5: Registration Fee & Payment Upload</h3>
                    <p className="text-[11px] text-slate-400">Transfer fee to Christ University account and upload your transaction proof.</p>
                  </div>
                </div>
                <div className="p-6 sm:p-8 space-y-6">

                <div className="p-4 bg-christ-navy/5 border border-christ-navy/15 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-christ-navy font-serif text-sm">Calculated Total Fee</span>
                    <p className="text-slate-600">Based on {teams.length} registered event team(s).</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-christ-navy font-serif">₹{calculateTotalFee()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Bank Transaction / Ref ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="TXN-CHRIST-882194"
                      value={payment.transactionId}
                      onChange={(e) => setPayment({ ...payment, transactionId: e.target.value })}
                      className={`w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none ${
                        isPreFilledFromBank ? 'bg-slate-100 cursor-not-allowed opacity-80 font-bold' : 'bg-white'
                      }`}
                    />
                  </div>

                  <div>
                    <FileUploadField
                      label="Upload Payment Proof Photo *"
                      value={payment.paymentProofUrl}
                      onChange={(url) => setPayment({ ...payment, paymentProofUrl: url })}
                      required
                    />
                  </div>
                </div>
                </div>
              </div>
            )}

            {/* STEP 6: Review & Final Submission / Summary */}
            {currentStep === 6 && (
              <div>
                {!submittedRegId && (
                  <div className="bg-gradient-to-r from-[#002147] to-[#003060] px-6 sm:px-8 py-5 flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-christ-gold/20 border border-christ-gold/30 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-christ-gold" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-serif">Step 6: Review & Submit</h3>
                      <p className="text-[11px] text-slate-400">Verify all information before submitting your final registration.</p>
                    </div>
                  </div>
                )}
                <div className="space-y-6 text-center py-6 px-6 sm:px-8">
                {submittedRegId ? (
                  <div className="space-y-4 max-w-xl mx-auto">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-christ-navy font-serif">Registration Submitted Successfully!</h2>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <p className="font-bold text-slate-700">Registration ID Reference:</p>
                      <span className="text-2xl font-black text-christ-gold font-serif block">{submittedRegId}</span>
                      <p className="text-slate-500">Institution: {institution.name}</p>
                      <p className="text-slate-500">Total Teams: {teams.length} | Participants: {participants.length}</p>
                    </div>
                    <p className="text-xs text-slate-600">
                      Your submission is sent to the <strong>Registration Verification Team</strong>. Upon approval on event day, participants will receive official chest numbers.
                    </p>
                    <div className="pt-4 flex justify-center">
                      <Link to="/" className="px-5 py-2.5 bg-christ-navy text-white text-xs font-bold rounded-lg hover:bg-christ-darkNavy">
                        Return to Homepage
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 text-left">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-lg font-bold text-christ-navy font-serif">Step 6: Review Registration Summary</h3>
                      <p className="text-xs text-slate-500">Confirm all entered details before finalizing.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <strong className="block text-christ-navy font-serif">Institution:</strong>
                        <p>{institution.name}</p>
                        <p className="text-slate-500">{institution.address}, {institution.district}</p>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <strong className="block text-christ-navy font-serif">Point of Contact:</strong>
                        <p>{poc.name} ({poc.designation})</p>
                        <p className="text-slate-500">Phone: {poc.phone} | Email: {poc.email}</p>
                        <p className="text-slate-500">
                          ID Card: <a href={poc.govtIdProof} target="_blank" rel="noopener noreferrer" className="text-christ-navy font-bold hover:underline">View ID Photo</a>
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 col-span-1 md:col-span-2">
                        <strong className="block text-christ-navy font-serif">Teams & Payment:</strong>
                        <p>{teams.length} Registered Team(s)</p>
                        <p className="font-bold text-christ-navy">Total Fee: ₹{calculateTotalFee()}</p>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 col-span-1 md:col-span-2">
                        <strong className="block text-christ-navy font-serif text-sm">Participant Roster Details:</strong>
                        <div className="space-y-4">
                          {teams.map((t, teamIdx) => {
                            const teamEvt = events.find(e => e.id === t.eventId);
                            const teamParts = participants.filter(p => p.teamIndex === teamIdx);
                            return (
                              <div key={teamIdx} className="border-t border-slate-200/60 pt-2 first:border-0 first:pt-0">
                                <span className="font-bold text-christ-navy block">
                                  {teamEvt?.name} ({t.teamName})
                                </span>
                                {teamParts.length === 0 ? (
                                  <p className="text-slate-400 italic text-[11px]">No students registered for this team.</p>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
                                    {teamParts.map((p, pIdx) => (
                                      <div key={pIdx} className="bg-white p-2.5 rounded-lg border border-slate-100 space-y-0.5">
                                        <div className="font-semibold text-slate-800">{p.name || 'Unnamed Participant'} ({p.gender})</div>
                                        <div className="text-[10px] text-slate-500">
                                          <div>DOB: {p.dob || 'Not specified'} | Class: {p.className || 'Not specified'}</div>
                                          <div>Govt ID: {p.govtIdProof || 'Not specified'}</div>
                                          <div>Emergency Contact: {p.emergencyContact || 'Not specified'}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                </div>
              </div>
            )}

            {/* Stepper Footer Buttons */}
            {(currentStep < 6 || (currentStep === 6 && !submittedRegId)) && (
              <div className="px-6 sm:px-8 py-5 mt-0 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between rounded-b-2xl">
                <button
                  type="button"
                  disabled={currentStep === 1}
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className={`inline-flex items-center space-x-2 px-5 py-2.5 text-sm font-semibold rounded-xl border transition-all ${
                    currentStep === 1
                      ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400 bg-white'
                      : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 shadow-sm'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {/* Step indicator pill */}
                <span className="text-[11px] font-bold text-slate-500 hidden sm:block">
                  Step {currentStep} of 6
                </span>

                {currentStep === 6 ? (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmitAll}
                    className="inline-flex items-center space-x-2 px-7 py-3 text-sm font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Official Registration</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center space-x-2 px-6 py-2.5 text-sm font-bold rounded-xl transition-all shadow-md"
                    style={{ background: 'linear-gradient(135deg, #002147 0%, #003070 100%)', color: '#fff' }}
                  >
                    <span>Continue to Next Step</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};
