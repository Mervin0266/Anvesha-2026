import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Header } from '../../components/common/Header';
import { Shield, Users, Building2, Trophy, DollarSign, Lock, Unlock, CheckCircle2, XCircle, UserPlus, Activity, Clock, Upload, Trash2, Loader2, Plus, FileSpreadsheet, Download, RefreshCw, Edit, Save, X } from 'lucide-react';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { INITIAL_USERS } from '../../data/initialData';
import * as XLSX from 'xlsx';
import { EVENTS_CATALOG } from '../../data/eventsCatalog';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'USERS' | 'LOGS' | 'BANK_PAYMENTS' | 'INSTITUTION_MASTER'>('REQUESTS');

  // Master Institutions State
  const [masterList, setMasterList] = useState<any[]>([]);
  const [masterCsvFile, setMasterCsvFile] = useState<File | null>(null);
  const [parsedMasterRows, setParsedMasterRows] = useState<any[]>([]);
  const [masterSearchTerm, setMasterSearchTerm] = useState('');

  // Single Add Master Record State
  const [newMasterName, setNewMasterName] = useState('');
  const [newMasterPocName, setNewMasterPocName] = useState('');
  const [newMasterPocNumber, setNewMasterPocNumber] = useState('');
  const [newMasterPocEmailId, setNewMasterPocEmailId] = useState('');
  const [isAddingMaster, setIsAddingMaster] = useState(false);

  // Single Edit Master Record State
  const [editingMasterId, setEditingMasterId] = useState<string | null>(null);
  const [editMasterName, setEditMasterName] = useState('');
  const [editMasterPocName, setEditMasterPocName] = useState('');
  const [editMasterPocNumber, setEditMasterPocNumber] = useState('');
  const [editMasterPocEmailId, setEditMasterPocEmailId] = useState('');

  // New User Form
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('registration_team');
  const [newEmail, setNewEmail] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // SIB Bank Payments State
  const [bankPayments, setBankPayments] = useState<any[]>([]);
  const [importTxnId, setImportTxnId] = useState('');
  const [importInstName, setImportInstName] = useState('');
  const [importEmail, setImportEmail] = useState('');
  const [importPhone, setImportPhone] = useState('');
  const [importAmount, setImportAmount] = useState('');
  const [importDate, setImportDate] = useState('');
  const [importPrincipalName, setImportPrincipalName] = useState('');
  const [importEventName, setImportEventName] = useState('');
  const [importAddress, setImportAddress] = useState('');

  // Bulk Upload states
  const [uploadMode, setUploadMode] = useState<'MANUAL' | 'CSV'>('MANUAL');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [selectedLedgerIds, setSelectedLedgerIds] = useState<string[]>([]);
  const [bulkInviteLoading, setBulkInviteLoading] = useState(false);

  const [bankSearchTerm, setBankSearchTerm] = useState('');
  const [inviteModal, setInviteModal] = useState<{ open: boolean; recipient: string; link: string; txnId: string; instName: string } | null>(null);

  // Inline editing states for bank payment record
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editTxnId, setEditTxnId] = useState('');
  const [editInstName, setEditInstName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editPrincipalName, setEditPrincipalName] = useState('');
  const [editEventName, setEditEventName] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const handleDownloadTemplate = () => {
    const headers = [
      'Transaction ID',
      'Institute Name',
      'Principal Name',
      'Email',
      'Contact Number',
      'Amount',
      'Event Name',
      'Address'
    ];
    const sampleRows = [
      ['TXN-SIB-883901', "Bishop Cotton Boys' School", 'Rev. Fr. Swebert', 'principal@bcbs.edu.in', '080-22211429', '5000', 'Football (Boys)', '15, Residency Rd, Ashok Nagar, Bengaluru'],
      ['TXN-SIB-992817', 'CMR National PU College', 'Dr. Anand Kumar', 'info@cmrpuc.edu.in', '080-25443210', '3500', 'Basketball (Girls)', '75/2, Doddagubbi Main Rd, Kothanur, Bengaluru'],
      ['TXN-SIB-229104', 'Christ Junior College', 'Fr. Sebastian A', 'office@cjc.christuniversity.in', '080-40129200', '6000', 'Debate (Oxford Style)', 'Hosur Rd, Bhavani Nagar, S.G. Palya, Bengaluru']
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sib_payment_template.csv');
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
      if (normalized === 'transactionid' || normalized === 'txnid' || normalized === 'transactionrefid' || normalized === 'refid') {
        mapping['transactionId'] = index;
      } else if (normalized === 'institutename' || normalized === 'institutionname' || normalized === 'college' || normalized === 'school') {
        mapping['institutionName'] = index;
      } else if (normalized === 'principalname' || normalized === 'principlename' || normalized === 'principal' || normalized === 'principle') {
        mapping['principalName'] = index;
      } else if (normalized === 'institutionemail' || normalized === 'email' || normalized === 'officeemail' || normalized === 'schoolemail') {
        mapping['email'] = index;
      } else if (normalized === 'phone' || normalized === 'contact' || normalized === 'contactnumber' || normalized === 'phonenumber' || normalized === 'mobile' || normalized === 'mobilenumber' || normalized === 'officecontact' || normalized === 'schoolphone') {
        mapping['phone'] = index;
      } else if (normalized === 'amount' || normalized === 'amountpaid' || normalized === 'fee') {
        mapping['amount'] = index;
      } else if (normalized === 'eventname' || normalized === 'event' || normalized === 'selectedevent') {
        mapping['eventName'] = index;
      } else if (normalized === 'address' || normalized === 'campusaddress') {
        mapping['address'] = index;
      }
    });
    return mapping;
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    try {
      const lines = await parseFileToLines(file);
      if (lines.length < 2) {
        alert('CSV file must contain a header row and at least one data row.');
        return;
      }

      const headers = lines[0];
      const mapping = mapHeaders(headers);

      if (mapping['transactionId'] === undefined || mapping['institutionName'] === undefined || mapping['email'] === undefined || mapping['amount'] === undefined) {
        alert('CSV is missing one or more required columns.\nRequired columns are: Transaction ID, Institute Name, Email, Amount.\nOptional columns: Principal Name, Contact Number, Event Name, Address.');
        return;
      }

      const rows = lines.slice(1).map((row, idx) => {
        const getVal = (key: string) => {
          const colIdx = mapping[key];
          return colIdx !== undefined ? row[colIdx] || '' : '';
        };

        return {
          id: `row-${idx}-${Date.now()}`,
          transactionId: getVal('transactionId'),
          institutionName: getVal('institutionName'),
          principalName: getVal('principalName'),
          email: getVal('email'),
          phone: getVal('phone'),
          amount: getVal('amount'),
          eventName: getVal('eventName'),
          address: getVal('address')
        };
      });

      setParsedRows(rows);
    } catch (err: any) {
      alert(`Error parsing file: ${err.message}`);
    }
  };

  const handlePreviewRowChange = (id: string, field: string, value: any) => {
    setParsedRows(prev => prev.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const handleRemovePreviewRow = (id: string) => {
    setParsedRows(prev => prev.filter(row => row.id !== id));
  };

  const handleAddPreviewRow = () => {
    setParsedRows(prev => [
      ...prev,
      {
        id: `row-added-${Date.now()}`,
        transactionId: '',
        institutionName: '',
        principalName: '',
        email: '',
        phone: '',
        amount: '0',
        eventName: '',
        address: ''
      }
    ]);
  };

  const handleImportBulkPayments = async () => {
    if (parsedRows.length === 0) {
      alert('No records to import.');
      return;
    }

    // Validation
    const seenTxns = new Set<string>();
    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      const txn = row.transactionId.trim();

      if (!txn) {
        alert(`Validation error on Row ${i + 1}: Transaction ID is required.`);
        return;
      }

      // Check duplicate inside the upload sheet
      if (seenTxns.has(txn.toLowerCase())) {
        alert(`Validation error: Duplicate Transaction ID "${txn}" found multiple times in your import table.`);
        return;
      }
      seenTxns.add(txn.toLowerCase());

      // Check duplicate inside database ledger
      if (bankPayments.some(p => p.transactionId.toLowerCase() === txn.toLowerCase())) {
        alert(`Validation error: Transaction ID "${txn}" (Row ${i + 1}) already exists in the SIB Feebook Payment Ledger.`);
        return;
      }

      if (!row.institutionName.trim()) {
        alert(`Validation error on Row ${i + 1}: Institution Name is required.`);
        return;
      }
      if (!row.email.trim() || !row.email.includes('@')) {
        alert(`Validation error on Row ${i + 1}: A valid Email is required.`);
        return;
      }
      if (isNaN(Number(row.amount)) || Number(row.amount) <= 0) {
        alert(`Validation error on Row ${i + 1}: Amount must be a valid number greater than 0.`);
        return;
      }
    }

    try {
      const res = await apiFetch<{ success: boolean; addedCount: number; skippedCount: number; skippedTxns: string[] }>('/admin/bank-payments/bulk', {
        method: 'POST',
        body: JSON.stringify({ payments: parsedRows })
      });

      if (res.success) {
        let msg = `Successfully imported ${res.addedCount} Feebook transaction records.`;
        if (res.skippedCount > 0) {
          msg += ` ${res.skippedCount} transactions were skipped (already exist in database).`;
        }
        setActionMsg(msg);
        setParsedRows([]);
        setCsvFile(null);
        fetchBankPayments();
        fetchAdminOverview();
      }
    } catch (err: any) {
      alert(`Bulk import error: ${err.message}`);
    }
  };

  const handleBulkSendInvite = async () => {
    if (selectedLedgerIds.length === 0) return;
    setBulkInviteLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; invitedCount: number }>('/admin/bank-payments/invite-bulk', {
        method: 'POST',
        body: JSON.stringify({ paymentIds: selectedLedgerIds })
      });
      if (res.success) {
        setActionMsg(`Bulk invitations successfully sent to ${res.invitedCount} institutions.`);
        setSelectedLedgerIds([]);
        fetchBankPayments();
      }
    } catch (err: any) {
      alert(`Bulk invite error: ${err.message}`);
    } finally {
      setBulkInviteLoading(false);
    }
  };

  const toggleLedgerCheckbox = (id: string) => {
    setSelectedLedgerIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAllLedgerCheckboxes = () => {
    const pendingIds = bankPayments.filter(p => p.status === 'PENDING').map(p => p.id);
    if (selectedLedgerIds.length === pendingIds.length) {
      setSelectedLedgerIds([]);
    } else {
      setSelectedLedgerIds(pendingIds);
    }
  };

  const fetchAdminOverview = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; stats: any; editRequests: any[]; users: any[]; auditLogs: any[] }>('/admin/overview');
      if (res.success) {
        setOverview(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBankPayments = async () => {
    try {
      const res = await apiFetch<{ success: boolean; bankPayments: any[] }>('/admin/bank-payments');
      if (res.success) {
        setBankPayments(res.bankPayments);
      }
    } catch (err) {
      console.error('Failed to fetch bank payments:', err);
    }
  };

  const fetchMasterList = async () => {
    try {
      const res = await apiFetch<{ success: boolean; institutions: any[] }>('/admin/institution-master');
      if (res.success) {
        setMasterList(res.institutions);
      }
    } catch (err) {
      console.error('Failed to fetch master list:', err);
    }
  };

  const handleDownloadMasterTemplate = () => {
    const headers = [
      'Institution Name',
      'POC Name',
      'POC Number',
      'POC Email'
    ];
    const sampleRows = [
      ["St. Joseph's Pre-University College", "Prof. Mark D'Souza", '9845012345', 'mark.dsouza@sjpuc.edu.in'],
      ['Mount Carmel PU College', 'Sister Mary Rose', '9741023456', 'm.rose@mountcarmelpu.edu.in'],
      ['Christ Junior College', 'Fr. Biju K C', '080-40129200', 'office@cjc.christuniversity.in']
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'master_institution_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMasterCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMasterCsvFile(file);

    try {
      const lines = await parseFileToLines(file);
      if (lines.length < 2) {
        alert('CSV file must contain a header row and at least one data row.');
        return;
      }

      const headers = lines[0];
      const mapping: { [key: string]: number } = {};
      headers.forEach((h, index) => {
        const normalized = h.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        if (normalized === 'institutionname' || normalized === 'institutename' || normalized === 'college' || normalized === 'school') {
          mapping['institutionName'] = index;
        } else if (normalized === 'pocname' || normalized === 'contactname' || normalized === 'pointofcontact') {
          mapping['pocName'] = index;
        } else if (normalized === 'pocnumber' || normalized === 'pocphone' || normalized === 'phone' || normalized === 'contactnumber' || normalized === 'pocmobile') {
          mapping['pocNumber'] = index;
        } else if (normalized === 'pocemail' || normalized === 'pocemailid' || normalized === 'email' || normalized === 'emailid') {
          mapping['pocEmailId'] = index;
        }
      });

      if (mapping['institutionName'] === undefined) {
        alert('CSV is missing the required "Institution Name" column.');
        return;
      }

      const rows = lines.slice(1).map((row, idx) => {
        const getVal = (key: string) => {
          const colIdx = mapping[key];
          return colIdx !== undefined ? row[colIdx] || '' : '';
        };

        return {
          id: `master-row-${idx}-${Date.now()}`,
          institutionName: getVal('institutionName'),
          pocName: getVal('pocName'),
          pocNumber: getVal('pocNumber'),
          pocEmailId: getVal('pocEmailId')
        };
      });

      setParsedMasterRows(rows);
    } catch (err: any) {
      alert(`Error parsing master file: ${err.message}`);
    }
  };

  const handleImportBulkMaster = async () => {
    if (parsedMasterRows.length === 0) {
      alert('No records to import.');
      return;
    }

    for (let i = 0; i < parsedMasterRows.length; i++) {
      const row = parsedMasterRows[i];
      if (!row.institutionName.trim()) {
        alert(`Validation error on Row ${i + 1}: Institution Name is required.`);
        return;
      }
    }

    try {
      const res = await apiFetch<{ success: boolean; addedCount: number; updatedCount: number }>('/admin/institution-master/bulk', {
        method: 'POST',
        body: JSON.stringify({ institutions: parsedMasterRows })
      });

      if (res.success) {
        setActionMsg(`Successfully imported master list: ${res.addedCount} records added, ${res.updatedCount} records updated.`);
        setParsedMasterRows([]);
        setMasterCsvFile(null);
        fetchMasterList();
      }
    } catch (err: any) {
      alert(`Bulk import error: ${err.message}`);
    }
  };

  const handleDeleteMasterRecord = async (id: string, name: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the master record for '${name}'? This cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const res = await apiFetch<{ success: boolean; message: string }>(`/admin/institution-master/${id}`, {
        method: 'DELETE'
      });
      if (res.success) {
        setActionMsg(`Deleted master record for '${name}' successfully.`);
        fetchMasterList();
      }
    } catch (err: any) {
      alert(`Deletion error: ${err.message}`);
    }
  };

  const handleCreateMasterRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMasterName.trim()) {
      alert('Institution Name is required.');
      return;
    }

    try {
      const res = await apiFetch<{ success: boolean; message: string; institution: any }>('/admin/institution-master', {
        method: 'POST',
        body: JSON.stringify({
          institutionName: newMasterName,
          pocName: newMasterPocName,
          pocNumber: newMasterPocNumber,
          pocEmailId: newMasterPocEmailId
        })
      });
      if (res.success) {
        setActionMsg(`Successfully added master institution: ${newMasterName}`);
        setNewMasterName('');
        setNewMasterPocName('');
        setNewMasterPocNumber('');
        setNewMasterPocEmailId('');
        setIsAddingMaster(false);
        fetchMasterList();
      }
    } catch (err: any) {
      alert(`Add error: ${err.message}`);
    }
  };

  const handleUpdateMasterRecord = async (id: string) => {
    if (!editMasterName.trim()) {
      alert('Institution Name is required.');
      return;
    }

    try {
      const res = await apiFetch<{ success: boolean; message: string; institution: any }>(`/admin/institution-master/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          institutionName: editMasterName,
          pocName: editMasterPocName,
          pocNumber: editMasterPocNumber,
          pocEmailId: editMasterPocEmailId
        })
      });
      if (res.success) {
        setActionMsg(`Successfully updated master record: ${editMasterName}`);
        setEditingMasterId(null);
        fetchMasterList();
      }
    } catch (err: any) {
      alert(`Update error: ${err.message}`);
    }
  };

  const startEditingMaster = (record: any) => {
    setEditingMasterId(record.id);
    setEditMasterName(record.institutionName);
    setEditMasterPocName(record.pocName || '');
    setEditMasterPocNumber(record.pocNumber || '');
    setEditMasterPocEmailId(record.pocEmailId || '');
  };

  const handleImportBankPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importTxnId || !importInstName || !importEmail || !importAmount || !importPhone) {
      alert('Please fill in all required fields (including School Office Contact Number).');
      return;
    }
    if (bankPayments.some(p => p.transactionId.toLowerCase() === importTxnId.trim().toLowerCase())) {
      alert(`Validation error: Transaction ID "${importTxnId.trim()}" already exists in the SIB Feebook Payment Ledger.`);
      return;
    }

    try {
      const res = await apiFetch<{ success: boolean; bankPayment: any }>('/admin/bank-payments', {
        method: 'POST',
        body: JSON.stringify({
          transactionId: importTxnId,
          institutionName: importInstName,
          email: importEmail,
          phone: importPhone || undefined,
          amount: Number(importAmount),
          date: importDate || new Date().toISOString(),
          principalName: importPrincipalName || undefined,
          eventName: importEventName || undefined,
          address: importAddress || undefined
        })
      });
      if (res.success) {
        setActionMsg(`Successfully imported SIB transaction: ${importTxnId}`);
        setImportTxnId('');
        setImportInstName('');
        setImportEmail('');
        setImportPhone('');
        setImportAmount('');
        setImportDate('');
        setImportPrincipalName('');
        setImportEventName('');
        setImportAddress('');
        fetchBankPayments();
        fetchAdminOverview();
      }
    } catch (err: any) {
      alert(`Import error: ${err.message}`);
    }
  };

  const handleSendInvite = async (paymentId: string, email: string) => {
    try {
      const res = await apiFetch<{ success: boolean; message: string; registrationLink: string; payment: any }>('/admin/bank-payments/invite', {
        method: 'POST',
        body: JSON.stringify({ paymentId, email })
      });
      if (res.success) {
        setActionMsg(`Invitation sent successfully to ${email}`);
        setInviteModal({
          open: true,
          recipient: email,
          link: `${window.location.origin}${res.registrationLink}`,
          txnId: res.payment.transactionId,
          instName: res.payment.institutionName
        });
        fetchBankPayments();
      }
    } catch (err: any) {
      alert(`Failed to send invitation: ${err.message}`);
    }
  };

  const handleStartEdit = (p: any) => {
    setEditingPaymentId(p.id);
    setEditTxnId(p.transactionId);
    setEditInstName(p.institutionName);
    setEditEmail(p.email);
    setEditPhone(p.phone || '');
    setEditAmount(String(p.amount));
    setEditPrincipalName(p.principalName || '');
    setEditEventName(p.eventName || '');
    setEditAddress(p.address || '');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editTxnId || !editInstName || !editEmail || !editAmount) {
      alert('Transaction ID, Institution Name, Email, and Amount are required.');
      return;
    }

    try {
      const res = await apiFetch<{ success: boolean; bankPayment: any }>('/admin/bank-payments/update', {
        method: 'POST',
        body: JSON.stringify({
          id,
          transactionId: editTxnId,
          institutionName: editInstName,
          email: editEmail,
          phone: editPhone || undefined,
          amount: Number(editAmount),
          principalName: editPrincipalName || undefined,
          eventName: editEventName || undefined,
          address: editAddress || undefined
        })
      });

      if (res.success) {
        setActionMsg(`Successfully updated transaction record: ${editTxnId}`);
        setEditingPaymentId(null);
        fetchBankPayments();
        fetchAdminOverview();
      }
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchAdminOverview();
    fetchBankPayments();
    fetchMasterList();
  }, []);

  const handleEditRequestAction = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await apiFetch<{ success: boolean; message: string }>('/admin/edit-request', {
        method: 'POST',
        body: JSON.stringify({
          requestId,
          status,
          adminRemarks: status === 'APPROVED' ? 'Approved score sheet unlock.' : 'Rejected unlock.',
          adminName: user?.name
        })
      });
      if (res.success) {
        setActionMsg(res.message);
        fetchAdminOverview();
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newName || !newEmail) return;

    try {
      const res = await apiFetch<{ success: boolean; user: any }>('/admin/create-user', {
        method: 'POST',
        body: JSON.stringify({
          username: newUsername,
          name: newName,
          role: newRole,
          email: newEmail
        })
      });
      if (res.success) {
        setActionMsg(`Crew account '${newUsername}' created successfully!`);
        setNewUsername('');
        setNewName('');
        setNewEmail('');
        fetchAdminOverview();
      }
    } catch (err: any) {
      alert(`User creation error: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the crew account for '${userName}'? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const res = await apiFetch<{ success: boolean; message: string }>(`/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        setActionMsg(`Crew account '${userName}' deleted successfully.`);
        fetchAdminOverview();
      }
    } catch (err: any) {
      alert(`User deletion error: ${err.message}`);
    }
  };

  const handleDeleteBankPayment = async (paymentId: string, txnId: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the payment transaction record '${txnId}'? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const res = await apiFetch<{ success: boolean; message: string }>(`/admin/bank-payments/${paymentId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        setActionMsg(`Transaction record '${txnId}' deleted successfully.`);
        fetchBankPayments();
      }
    } catch (err: any) {
      alert(`Transaction deletion error: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
      <Sidebar currentRole="admin" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden pt-16 lg:pt-0">
        <Header title="Chief Administrator Control Center" subtitle="Full system governance, result unlock approvals, user roles, and audit trail." />

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          
          {actionMsg && (
            <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs font-medium rounded-r-xl flex justify-between items-center">
              <span>{actionMsg}</span>
              <button onClick={() => setActionMsg(null)} className="font-bold">Dismiss</button>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-christ-navy text-christ-gold flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 font-serif">{overview?.stats.totalInstitutions || 0}</span>
                <p className="text-xs text-slate-500 font-medium">Total Registered Institutions</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-christ-gold text-christ-navy flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 font-serif">{overview?.stats.verifiedParticipants || 0}</span>
                <p className="text-xs text-slate-500 font-medium">Verified Participants ({overview?.stats.totalParticipants || 0} total)</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 font-serif">₹{overview?.stats.totalRevenue || 0}</span>
                <p className="text-xs text-slate-500 font-medium">Total Event Revenue Collected</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Unlock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 font-serif">{overview?.stats.pendingEditRequestsCount || 0}</span>
                <p className="text-xs text-slate-500 font-medium">Pending Result Edit Requests</p>
              </div>
            </div>
          </div>

          {/* Admin Tabs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveTab('REQUESTS')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'REQUESTS' ? 'bg-christ-navy text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Result Edit Requests ({overview?.editRequests.filter((e: any) => e.status === 'PENDING').length || 0})
                </button>

                <button
                  onClick={() => setActiveTab('LOGS')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'LOGS' ? 'bg-christ-navy text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  System Audit Logs
                </button>
                <button
                  onClick={() => setActiveTab('BANK_PAYMENTS')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'BANK_PAYMENTS' ? 'bg-christ-navy text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  SIB Bank Payments ({bankPayments.filter(p => p.status === 'PENDING').length})
                </button>
                <button
                  onClick={() => setActiveTab('INSTITUTION_MASTER')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'INSTITUTION_MASTER' ? 'bg-christ-navy text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Institution Master List ({masterList.length})
                </button>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await Promise.all([fetchAdminOverview(), fetchBankPayments(), fetchMasterList()]);
                    setActionMsg("Dashboard data and ledger records synced successfully.");
                  } catch (err) {
                    console.error("Refresh failed:", err);
                  }
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-all shadow-sm font-bold text-xs shrink-0 self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5 text-christ-navy" />
                <span>Sync & Refresh</span>
              </button>
            </div>

            {/* TAB 1: Edit Requests Approval */}
            {activeTab === 'REQUESTS' && (
              <div className="p-5 space-y-4">
                {overview?.editRequests.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No result unlock requests submitted.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {overview?.editRequests.map((req: any) => (
                      <div key={req.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-christ-navy font-serif uppercase">{req.eventId}</span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              req.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                              req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                          <p className="font-bold text-slate-900">Requested by {req.facultyName}</p>
                          <p className="text-slate-600 italic">"{req.reason}"</p>
                          <span className="text-[10px] text-slate-400">{req.requestedAt}</span>
                        </div>

                        {req.status === 'PENDING' && (
                          <div className="flex space-x-2 shrink-0">
                            <button
                              onClick={() => handleEditRequestAction(req.id, 'REJECTED')}
                              className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg hover:bg-rose-100"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleEditRequestAction(req.id, 'APPROVED')}
                              className="px-4 py-1.5 bg-christ-gold text-christ-navy text-xs font-bold rounded-lg hover:bg-christ-lightGold shadow-christ-gold"
                            >
                              Approve & Unlock Sheet
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}



            {/* TAB 3: Audit Logs Timeline */}
            {activeTab === 'LOGS' && (
              <div className="p-5">
                <div className="divide-y divide-slate-100 text-xs">
                  {overview?.auditLogs.map((log: any) => (
                    <div key={log.id} className="py-3 flex items-start space-x-3">
                      <Activity className="w-4 h-4 text-christ-navy shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 font-bold">{log.user} ({log.role})</strong>
                          <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                        </div>
                        <p className="text-slate-600 mt-0.5">{log.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: SIB Bank Payments */}
            {activeTab === 'BANK_PAYMENTS' && (
              <div className="p-6 space-y-6 text-xs text-slate-800">
                {/* 1. Bulk CSV Importer Card */}
                <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-4 shadow-sm">
                  <div className="flex items-center space-x-2 border-b border-slate-200/85 pb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-christ-navy text-christ-gold flex items-center justify-center font-bold">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-christ-navy font-serif text-sm">Bulk Import Bank Payments (CSV Upload)</h4>
                      <p className="text-slate-500 text-[10px]">Upload a CSV spreadsheet file to import payment records in bulk.</p>
                    </div>
                  </div>

                  {/* CSV Upload Dropzone */}
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 bg-slate-50 hover:bg-slate-100/50 transition-all flex flex-col items-center justify-center space-y-2.5">
                    <FileSpreadsheet className="w-8 h-8 text-christ-navy" />
                    <div className="text-center">
                      <span className="font-bold text-slate-800 text-[11px] block">Drag and drop or select CSV Feebook roster file</span>
                      <span className="text-slate-400 text-[9px] block">Required headers: Transaction ID, Institute Name, Email, Amount. Optional: Principal Name, Event Name, Address.</span>
                      <span className="text-slate-400 text-[9px] block mt-0.5 max-w-lg leading-normal text-center">
                        Valid Event Names: Football (Boys), Football (Girls), Volleyball (Boys), Volleyball (Girls), Basketball (Boys), Basketball (Girls), Tug of War, Group Dance (Western / Folk), Group Music (Eastern / Western), Debate (Oxford Style), Open Mic (Stand-up / Poetry), Treasure Hunt.
                      </span>
                    </div>
                    <input 
                      type="file" 
                      accept=".csv,.xlsx,.xls" 
                      onChange={handleCSVUpload} 
                      id="csv-file-input" 
                      className="hidden" 
                    />
                    <div className="flex items-center space-x-2">
                      <label 
                        htmlFor="csv-file-input" 
                        className="px-4 py-1.5 bg-christ-navy hover:bg-christ-darkNavy text-white font-bold rounded-lg cursor-pointer transition-all shadow-sm flex items-center space-x-1 text-[11px]"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{csvFile ? csvFile.name : 'Choose CSV File'}</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="px-4 py-1.5 bg-white border border-slate-350 text-slate-700 hover:bg-slate-50 font-bold rounded-lg transition-all shadow-sm flex items-center space-x-1 text-[11px]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Template</span>
                      </button>
                    </div>
                  </div>

                  {/* Interactive Preview Table */}
                  {parsedRows.length > 0 && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between border-t pt-3 border-slate-100">
                        <div>
                          <h5 className="font-bold text-christ-navy text-xs font-serif">Parsed Payment Records Preview ({parsedRows.length} rows)</h5>
                          <p className="text-slate-500 text-[10px]">Inspect and correct any cells directly before bulk import. All changes will be saved.</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={handleAddPreviewRow}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md flex items-center space-x-1 text-[10px]"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Row</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setParsedRows([]);
                              setCsvFile(null);
                            }}
                            className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold rounded-md text-[10px]"
                          >
                            Clear Preview
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm max-h-[300px]">
                        <table className="min-w-full divide-y divide-slate-200 table-fixed">
                          <thead className="bg-slate-50 text-[10px] font-bold text-slate-700 uppercase sticky top-0 z-10 shadow-sm">
                            <tr>
                              <th className="px-3 py-2 text-left w-24">Transaction ID *</th>
                              <th className="px-3 py-2 text-left w-36">Institute Name *</th>
                              <th className="px-3 py-2 text-left w-24">Principal Name</th>
                              <th className="px-3 py-2 text-left w-28">Email *</th>
                              <th className="px-3 py-2 text-left w-24">Contact Number</th>
                              <th className="px-3 py-2 text-left w-16">Amount *</th>
                              <th className="px-3 py-2 text-left w-24">Event Name</th>
                              <th className="px-3 py-2 text-left w-32">Address</th>
                              <th className="px-3 py-2 text-center w-12">Delete</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-800 text-[10px]">
                            {parsedRows.map((row) => (
                              <tr key={row.id} className="hover:bg-slate-50/50">
                                <td className="p-1">
                                  <input 
                                    type="text" 
                                    value={row.transactionId} 
                                    onChange={(e) => handlePreviewRowChange(row.id, 'transactionId', e.target.value)} 
                                    className="w-full p-1.5 border border-slate-200 focus:ring-1 focus:ring-christ-navy rounded text-[10px]" 
                                  />
                                </td>
                                <td className="p-1">
                                  <input 
                                    type="text" 
                                    value={row.institutionName} 
                                    onChange={(e) => handlePreviewRowChange(row.id, 'institutionName', e.target.value)} 
                                    className="w-full p-1.5 border border-slate-200 focus:ring-1 focus:ring-christ-navy rounded text-[10px]" 
                                  />
                                </td>
                                <td className="p-1">
                                  <input 
                                    type="text" 
                                    value={row.principalName} 
                                    onChange={(e) => handlePreviewRowChange(row.id, 'principalName', e.target.value)} 
                                    className="w-full p-1.5 border border-slate-200 focus:ring-1 focus:ring-christ-navy rounded text-[10px]" 
                                  />
                                </td>
                                <td className="p-1">
                                  <input 
                                    type="email" 
                                    value={row.email} 
                                    onChange={(e) => handlePreviewRowChange(row.id, 'email', e.target.value)} 
                                    className="w-full p-1.5 border border-slate-200 focus:ring-1 focus:ring-christ-navy rounded text-[10px]" 
                                  />
                                </td>
                                <td className="p-1">
                                  <input 
                                    type="text" 
                                    value={row.phone} 
                                    onChange={(e) => handlePreviewRowChange(row.id, 'phone', e.target.value)} 
                                    className="w-full p-1.5 border border-slate-200 focus:ring-1 focus:ring-christ-navy rounded text-[10px]" 
                                    placeholder="e.g. 080-12345"
                                  />
                                </td>
                                <td className="p-1">
                                  <input 
                                    type="number" 
                                    value={row.amount} 
                                    onChange={(e) => handlePreviewRowChange(row.id, 'amount', e.target.value)} 
                                    className="w-full p-1.5 border border-slate-200 focus:ring-1 focus:ring-christ-navy rounded text-[10px] font-bold" 
                                  />
                                </td>
                                <td className="p-1">
                                  <select 
                                    value={row.eventName} 
                                    onChange={(e) => handlePreviewRowChange(row.id, 'eventName', e.target.value)} 
                                    className="w-full p-1.5 border border-slate-200 focus:ring-1 focus:ring-christ-navy rounded text-[10px] bg-white font-medium"
                                  >
                                    <option value="">Select Event...</option>
                                    {EVENTS_CATALOG.map(evt => (
                                      <option key={evt.id} value={evt.name}>{evt.name}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="p-1">
                                  <input 
                                    type="text" 
                                    value={row.address} 
                                    onChange={(e) => handlePreviewRowChange(row.id, 'address', e.target.value)} 
                                    className="w-full p-1.5 border border-slate-200 focus:ring-1 focus:ring-christ-navy rounded text-[10px]" 
                                  />
                                </td>
                                <td className="p-1 text-center">
                                  <button 
                                    type="button"
                                    onClick={() => handleRemovePreviewRow(row.id)} 
                                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={handleImportBulkPayments}
                          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md transition-all text-xs"
                        >
                          Import SIB Transactions ({parsedRows.length} Records)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Manual Entry Form Card */}
                <form onSubmit={handleImportBankPayment} className="p-5 bg-white rounded-xl border border-slate-200 space-y-4 shadow-sm">
                  <div className="flex items-center space-x-2 border-b border-slate-200/85 pb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-christ-navy text-christ-gold flex items-center justify-center font-bold">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-christ-navy font-serif text-sm">Or: Add Single Payment Record Manually</h4>
                      <p className="text-slate-500 text-[10px]">Enter verified transaction manually to issue an invitation.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-[11px]">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Transaction Ref ID *</label>
                      <input 
                        type="text" 
                        required 
                        value={importTxnId} 
                        onChange={(e) => setImportTxnId(e.target.value)} 
                        className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-christ-navy bg-white" 
                        placeholder="e.g. TXN-SIB-123456" 
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Institution Full Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={importInstName} 
                        onChange={(e) => setImportInstName(e.target.value)} 
                        className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-christ-navy bg-white" 
                        placeholder="e.g. Bishop Cotton Boys' School" 
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Office Email Address *</label>
                      <input 
                        type="email" 
                        required 
                        value={importEmail} 
                        onChange={(e) => setImportEmail(e.target.value)} 
                        className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-christ-navy bg-white" 
                        placeholder="office@college.edu.in" 
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Amount Paid (₹) *</label>
                      <input 
                        type="number" 
                        required 
                        value={importAmount} 
                        onChange={(e) => setImportAmount(e.target.value)} 
                        className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-christ-navy bg-white" 
                        placeholder="e.g. 5000" 
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Principal Name</label>
                      <input 
                        type="text" 
                        value={importPrincipalName} 
                        onChange={(e) => setImportPrincipalName(e.target.value)} 
                        className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-christ-navy bg-white" 
                        placeholder="e.g. Rev. Fr. Swebert" 
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">School Office Contact *</label>
                      <input 
                        type="tel" 
                        required
                        value={importPhone} 
                        onChange={(e) => setImportPhone(e.target.value)} 
                        className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-christ-navy bg-white" 
                        placeholder="e.g. 080-22211429" 
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Event Name</label>
                      <select 
                        value={importEventName} 
                        onChange={(e) => setImportEventName(e.target.value)} 
                        className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-christ-navy bg-white text-[11px] font-medium"
                      >
                        <option value="">Select Event...</option>
                        {EVENTS_CATALOG.map(evt => (
                          <option key={evt.id} value={evt.name}>{evt.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Institution Address</label>
                      <input 
                        type="text" 
                        value={importAddress} 
                        onChange={(e) => setImportAddress(e.target.value)} 
                        className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-christ-navy bg-white" 
                        placeholder="e.g. 15, Residency Rd, Ashok Nagar" 
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[11px] text-slate-500 italic">Pre-fills SIB details to secure payment validation before manual roster configuration.</p>
                    <button type="submit" className="px-5 py-2 bg-christ-navy text-white font-bold rounded-lg hover:bg-christ-darkNavy transition-all shadow-md">
                      Import SIB Transaction
                    </button>
                  </div>
                </form>

                {/* Bulk Actions Bar */}
                {selectedLedgerIds.length > 0 && (
                  <div className="p-3 bg-christ-navy/10 rounded-xl border border-christ-navy/20 flex items-center justify-between mb-4 text-christ-navy font-bold text-xs">
                    <span>{selectedLedgerIds.length} SIB payment record(s) selected</span>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setSelectedLedgerIds([])}
                        className="px-3 py-1.5 bg-white text-slate-750 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-bold"
                      >
                        Deselect All
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkSendInvite}
                        disabled={bulkInviteLoading}
                        className="px-4 py-1.5 bg-christ-navy text-white rounded-lg hover:bg-christ-darkNavy transition-all shadow font-bold flex items-center space-x-1.5"
                      >
                        {bulkInviteLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Sending Invites...</span>
                          </>
                        ) : (
                          <span>Bulk Send Invites</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Search / Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-christ-navy text-sm font-serif">SIB Feebook Payment Ledger</h4>
                    <p className="text-slate-500 text-[11px]">Database of validated payment transactions. Search by institution, email or transaction ID.</p>
                  </div>
                  <input
                    type="text"
                    placeholder="Search ledger..."
                    value={bankSearchTerm}
                    onChange={(e) => setBankSearchTerm(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-christ-navy w-full sm:w-64 bg-white text-[11px]"
                  />
                </div>

                {/* Bank Payments List */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left w-10">
                          <input 
                            type="checkbox" 
                            checked={selectedLedgerIds.length === bankPayments.filter(p => p.status === 'PENDING').length && bankPayments.filter(p => p.status === 'PENDING').length > 0} 
                            onChange={toggleAllLedgerCheckboxes}
                            className="rounded text-christ-navy focus:ring-christ-navy w-3.5 h-3.5 border-slate-300"
                          />
                        </th>
                        <th className="px-4 py-3 text-left">Ref ID</th>
                        <th className="px-4 py-3 text-left">Transaction ID</th>
                        <th className="px-4 py-3 text-left">Institution</th>
                        <th className="px-4 py-3 text-left">Email</th>
                        <th className="px-4 py-3 text-left">Contact Number</th>
                        <th className="px-4 py-3 text-left">Amount</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Invitation Status</th>
                        <th className="px-4 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 text-[11px]">
                      {bankPayments
                        .filter(p => {
                          const term = bankSearchTerm.toLowerCase();
                          return (
                            p.institutionName.toLowerCase().includes(term) ||
                            p.email.toLowerCase().includes(term) ||
                            (p.phone && p.phone.toLowerCase().includes(term)) ||
                            p.transactionId.toLowerCase().includes(term) ||
                            p.id.toLowerCase().includes(term)
                          );
                        })
                        .map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3.5">
                              {p.status === 'PENDING' ? (
                                <input 
                                  type="checkbox" 
                                  checked={selectedLedgerIds.includes(p.id)} 
                                  onChange={() => toggleLedgerCheckbox(p.id)}
                                  className="rounded text-christ-navy focus:ring-christ-navy w-3.5 h-3.5 border-slate-300"
                                />
                              ) : (
                                <input type="checkbox" disabled className="rounded text-slate-300 opacity-40 w-3.5 h-3.5" />
                              )}
                            </td>
                            <td className="px-4 py-3.5 font-semibold text-slate-500">{p.id}</td>
                            
                            {editingPaymentId === p.id ? (
                              <>
                                <td className="px-2 py-2">
                                  <input 
                                    type="text" 
                                    value={editTxnId} 
                                    onChange={(e) => setEditTxnId(e.target.value)} 
                                    className="w-full p-1.5 border border-slate-200 focus:ring-1 focus:ring-christ-navy rounded text-[10px] font-mono font-bold bg-white" 
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <input 
                                    type="text" 
                                    value={editInstName} 
                                    onChange={(e) => setEditInstName(e.target.value)} 
                                    className="w-full p-1.5 border border-slate-200 focus:ring-1 focus:ring-christ-navy rounded text-[10px] font-semibold bg-white" 
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <input 
                                    type="email" 
                                    value={editEmail} 
                                    onChange={(e) => setEditEmail(e.target.value)} 
                                    className="w-full p-1.5 border border-slate-200 focus:ring-1 focus:ring-christ-navy rounded text-[10px] bg-white" 
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <input 
                                    type="text" 
                                    value={editPhone} 
                                    onChange={(e) => setEditPhone(e.target.value)} 
                                    className="w-full p-1.5 border border-slate-200 focus:ring-1 focus:ring-christ-navy rounded text-[10px] bg-white" 
                                    placeholder="Contact..."
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <input 
                                    type="number" 
                                    value={editAmount} 
                                    onChange={(e) => setEditAmount(e.target.value)} 
                                    className="w-full p-1.5 border border-slate-200 focus:ring-1 focus:ring-christ-navy rounded text-[10px] font-bold bg-white" 
                                  />
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-3.5 font-bold font-mono text-slate-700">{p.transactionId}</td>
                                <td className="px-4 py-3.5 font-semibold">{p.institutionName}</td>
                                <td className="px-4 py-3.5">{p.email}</td>
                                <td className="px-4 py-3.5 font-medium">{p.phone || <span className="text-slate-400 italic">None</span>}</td>
                                <td className="px-4 py-3.5 font-bold text-slate-900">₹{p.amount}</td>
                              </>
                            )}

                            <td className="px-4 py-3.5">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                p.status === 'PENDING' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                                'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}>
                                {p.status === 'PENDING' ? 'PENDING' : `USED (${p.registrationId})`}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-slate-500">
                              {p.invitationSent ? (
                                <div className="flex flex-col">
                                  <span className="text-emerald-700 font-bold">Sent</span>
                                  <span className="text-[9px] text-slate-400">{new Date(p.invitationSentAt!).toLocaleString()}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Not Sent</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {editingPaymentId === p.id ? (
                                <div className="flex items-center justify-center space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(p.id)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] shadow-sm transition-all"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingPaymentId(null)}
                                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded text-[10px] transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : p.status === 'PENDING' ? (
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(p)}
                                    className="px-2.5 py-1.5 bg-christ-gold hover:bg-christ-lightGold text-christ-navy font-bold rounded-lg transition-all shadow-sm text-[10px]"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSendInvite(p.id, p.email)}
                                    className="px-3 py-1.5 bg-christ-navy hover:bg-christ-darkNavy text-white font-bold rounded-lg transition-all shadow-sm text-[10px]"
                                  >
                                    {p.invitationSent ? 'Resend Invite' : 'Send Invite'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBankPayment(p.id, p.transactionId)}
                                    className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-all"
                                    title="Delete Transaction"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-medium">Registered</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      {bankPayments.length === 0 && (
                        <tr>
                          <td colSpan={9} className="text-center py-8 text-slate-500 italic">No bank payment records found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: Institution Master List Management */}
            {activeTab === 'INSTITUTION_MASTER' && (
              <div className="p-6 space-y-6 text-xs text-slate-800">
                {/* Bulk CSV Importer */}
                <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-4 shadow-sm">
                  <div className="flex items-center space-x-2 border-b border-slate-200/85 pb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-christ-navy text-christ-gold flex items-center justify-center font-bold">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-christ-navy font-serif text-sm">Bulk Import Master Institutions (CSV Upload)</h4>
                      <p className="text-slate-500 text-[10px]">Upload a CSV file containing predefined PU Institution names and default POC details.</p>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 bg-slate-50 hover:bg-slate-100/50 transition-all flex flex-col items-center justify-center space-y-2.5">
                    <FileSpreadsheet className="w-8 h-8 text-christ-navy" />
                    <div className="text-center">
                      <span className="font-bold text-slate-800 text-[11px] block">Drag and drop or select CSV Master file</span>
                      <span className="text-slate-400 text-[9px] block">Required header: Institution Name. Optional: POC Name, POC Number, POC Email.</span>
                    </div>
                    <input 
                      type="file" 
                      accept=".csv,.xlsx,.xls" 
                      onChange={handleMasterCSVUpload} 
                      id="master-csv-file-input" 
                      className="hidden" 
                    />
                    <div className="flex items-center space-x-2">
                      <label 
                        htmlFor="master-csv-file-input" 
                        className="px-4 py-1.5 bg-christ-navy hover:bg-christ-darkNavy text-white font-bold rounded-lg cursor-pointer transition-all shadow-sm flex items-center space-x-1 text-[11px]"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{masterCsvFile ? masterCsvFile.name : 'Choose CSV File'}</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleDownloadMasterTemplate}
                        className="px-4 py-1.5 bg-white border border-slate-350 text-slate-700 hover:bg-slate-50 font-bold rounded-lg transition-all shadow-sm flex items-center space-x-1 text-[11px]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Template CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Interactive Preview Table */}
                  {parsedMasterRows.length > 0 && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between border-t pt-3 border-slate-100">
                        <div>
                          <h5 className="font-bold text-christ-navy text-xs font-serif">Parsed Records Preview ({parsedMasterRows.length} rows)</h5>
                          <p className="text-slate-500 text-[10px]">Inspect and correct any cells directly before importing. Unique institution names will update existing entries.</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setParsedMasterRows(prev => [
                                ...prev,
                                {
                                  id: `master-row-added-${Date.now()}`,
                                  institutionName: '',
                                  pocName: '',
                                  pocNumber: '',
                                  pocEmailId: ''
                                }
                              ]);
                            }}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md flex items-center space-x-1 text-[10px]"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Row</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setParsedMasterRows([]);
                              setMasterCsvFile(null);
                            }}
                            className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold rounded-md text-[10px]"
                          >
                            Clear Preview
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm max-h-[300px]">
                        <table className="min-w-full divide-y divide-slate-200 table-fixed">
                          <thead className="bg-slate-50 text-[10px] font-bold text-slate-700 uppercase sticky top-0 z-10 shadow-sm">
                            <tr>
                              <th className="px-3 py-2 text-left w-48">Institution Name *</th>
                              <th className="px-3 py-2 text-left w-36">POC Name</th>
                              <th className="px-3 py-2 text-left w-32">POC Number</th>
                              <th className="px-3 py-2 text-left w-44">POC Email</th>
                              <th className="px-3 py-2 text-center w-16">Delete</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-800 text-[10px]">
                            {parsedMasterRows.map((row) => (
                              <tr key={row.id} className="hover:bg-slate-50/50">
                                <td className="p-1">
                                  <input 
                                    type="text" 
                                    value={row.institutionName} 
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setParsedMasterRows(prev => prev.map(r => r.id === row.id ? { ...r, institutionName: val } : r));
                                    }} 
                                    className="w-full p-1.5 border border-slate-200 focus:ring-1 focus:ring-christ-navy rounded text-[10px] font-semibold" 
                                  />
                                </td>
                                <td className="p-1">
                                  <input 
                                    type="text" 
                                    value={row.pocName} 
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setParsedMasterRows(prev => prev.map(r => r.id === row.id ? { ...r, pocName: val } : r));
                                    }} 
                                    className="w-full p-1.5 border border-slate-200 focus:ring-1 focus:ring-christ-navy rounded text-[10px]" 
                                  />
                                </td>
                                <td className="p-1">
                                  <input 
                                    type="text" 
                                    value={row.pocNumber} 
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setParsedMasterRows(prev => prev.map(r => r.id === row.id ? { ...r, pocNumber: val } : r));
                                    }} 
                                    className="w-full p-1.5 border border-slate-200 focus:ring-1 focus:ring-christ-navy rounded text-[10px]" 
                                  />
                                </td>
                                <td className="p-1">
                                  <input 
                                    type="email" 
                                    value={row.pocEmailId} 
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setParsedMasterRows(prev => prev.map(r => r.id === row.id ? { ...r, pocEmailId: val } : r));
                                    }} 
                                    className="w-full p-1.5 border border-slate-200 focus:ring-1 focus:ring-christ-navy rounded text-[10px]" 
                                  />
                                </td>
                                <td className="p-1 text-center">
                                  <button 
                                    type="button"
                                    onClick={() => setParsedMasterRows(prev => prev.filter(r => r.id !== row.id))} 
                                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={handleImportBulkMaster}
                          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md transition-all text-xs"
                        >
                          Import Master Records ({parsedMasterRows.length} rows)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick actions for single record add */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div>
                    <h5 className="font-bold text-christ-navy text-xs font-serif">Quick Actions</h5>
                    <p className="text-slate-500 text-[10px]">Add individual institution records directly without uploading a CSV template.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingMaster(!isAddingMaster)}
                    className="px-4 py-1.5 bg-christ-navy hover:bg-christ-darkNavy text-white font-bold rounded-lg transition-all shadow-sm flex items-center space-x-1 text-[11px]"
                  >
                    {isAddingMaster ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{isAddingMaster ? 'Cancel' : 'Add Single Institution'}</span>
                  </button>
                </div>

                {isAddingMaster && (
                  <form onSubmit={handleCreateMasterRecord} className="p-5 bg-white rounded-xl border border-slate-200 space-y-4 shadow-sm text-xs">
                    <div className="flex items-center space-x-2 border-b border-slate-200/85 pb-2">
                      <Plus className="w-4 h-4 text-christ-navy" />
                      <h4 className="font-bold text-christ-navy font-serif text-sm">Add Individual Master Institution</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">Institution Name *</label>
                        <input
                          type="text"
                          required
                          value={newMasterName}
                          onChange={(e) => setNewMasterName(e.target.value)}
                          placeholder="e.g. St. Joseph's College"
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-christ-navy text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">POC Name</label>
                        <input
                          type="text"
                          value={newMasterPocName}
                          onChange={(e) => setNewMasterPocName(e.target.value)}
                          placeholder="e.g. Prof. John Doe"
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-christ-navy text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">POC Contact Number</label>
                        <input
                          type="text"
                          value={newMasterPocNumber}
                          onChange={(e) => setNewMasterPocNumber(e.target.value)}
                          placeholder="e.g. 9876543210"
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-christ-navy text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">POC Email ID</label>
                        <input
                          type="email"
                          value={newMasterPocEmailId}
                          onChange={(e) => setNewMasterPocEmailId(e.target.value)}
                          placeholder="e.g. poc@college.edu"
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-christ-navy text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingMaster(false);
                          setNewMasterName('');
                          setNewMasterPocName('');
                          setNewMasterPocNumber('');
                          setNewMasterPocEmailId('');
                        }}
                        className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm text-xs"
                      >
                        Save Record
                      </button>
                    </div>
                  </form>
                )}

                {/* Ledger / Table display */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-bold text-christ-navy text-sm font-serif">Master Institutions Directory</h4>
                      <p className="text-slate-500 text-[11px]">List of all colleges registered in the master list database for registration auto-fill.</p>
                    </div>
                    <input
                      type="text"
                      placeholder="Search master list..."
                      value={masterSearchTerm}
                      onChange={(e) => setMasterSearchTerm(e.target.value)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-christ-navy w-full sm:w-64 bg-white text-[11px]"
                    />
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase">
                        <tr>
                          <th className="px-4 py-3 text-left">Institution Name</th>
                          <th className="px-4 py-3 text-left">POC Name</th>
                          <th className="px-4 py-3 text-left">POC Contact Number</th>
                          <th className="px-4 py-3 text-left">POC Email ID</th>
                          <th className="px-4 py-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800 text-[11px]">
                        {masterList
                          .filter(m => {
                            const term = masterSearchTerm.toLowerCase();
                            return (
                              m.institutionName.toLowerCase().includes(term) ||
                              m.pocName.toLowerCase().includes(term) ||
                              m.pocNumber.toLowerCase().includes(term) ||
                              m.pocEmailId.toLowerCase().includes(term)
                            );
                          })
                          .map((m) => {
                            const isEditing = editingMasterId === m.id;
                            if (isEditing) {
                              return (
                                <tr key={m.id} className="bg-slate-50/80">
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={editMasterName}
                                      onChange={(e) => setEditMasterName(e.target.value)}
                                      className="w-full p-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-christ-navy font-bold text-slate-850 text-[11px] bg-white"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={editMasterPocName}
                                      onChange={(e) => setEditMasterPocName(e.target.value)}
                                      className="w-full p-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-christ-navy text-[11px] bg-white"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={editMasterPocNumber}
                                      onChange={(e) => setEditMasterPocNumber(e.target.value)}
                                      className="w-full p-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-christ-navy text-[11px] bg-white"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="email"
                                      value={editMasterPocEmailId}
                                      onChange={(e) => setEditMasterPocEmailId(e.target.value)}
                                      className="w-full p-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-christ-navy text-[11px] bg-white"
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <div className="flex items-center justify-center space-x-2">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateMasterRecord(m.id)}
                                        className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-all"
                                        title="Save Changes"
                                      >
                                        <Save className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingMasterId(null)}
                                        className="p-1.5 text-slate-500 hover:text-slate-750 hover:bg-slate-105 rounded-lg transition-all"
                                        title="Cancel"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }

                            return (
                              <tr key={m.id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3.5 font-bold text-slate-800">{m.institutionName}</td>
                                <td className="px-4 py-3.5 font-medium">{m.pocName || <span className="text-slate-400 italic text-[10px]">NIL</span>}</td>
                                <td className="px-4 py-3.5">{m.pocNumber || <span className="text-slate-400 italic text-[10px]">NIL</span>}</td>
                                <td className="px-4 py-3.5">{m.pocEmailId || <span className="text-slate-400 italic text-[10px]">NIL</span>}</td>
                                <td className="px-4 py-3.5 text-center">
                                  <div className="flex items-center justify-center space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => startEditingMaster(m)}
                                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all"
                                      title="Edit Record"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMasterRecord(m.id, m.institutionName)}
                                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-all"
                                      title="Delete Master Record"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        {masterList.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-slate-500 italic">No master records found. Please upload a CSV sheet or add one above.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>

        </main>
      </div>

      {/* Invitation Success Copy Modal */}
      {inviteModal && inviteModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center space-x-2 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-sm font-bold font-serif text-christ-navy">Registration Invite Sent!</h3>
              </div>
              <button 
                onClick={() => setInviteModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            
            <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg space-y-1">
              <p className="text-slate-600 font-medium">An invitation email was sent to:</p>
              <strong className="text-emerald-800 text-[13px]">{inviteModal.recipient}</strong>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800">Copy Registration URL:</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  readOnly 
                  value={inviteModal.link} 
                  className="flex-1 p-2 border rounded-lg bg-slate-50 font-mono text-[10px]" 
                  onClick={(e) => (e.target as any).select()}
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(inviteModal.link);
                    alert('Link copied to clipboard!');
                  }}
                  className="px-3.5 py-2 bg-christ-gold hover:bg-christ-lightGold text-christ-navy font-bold rounded-lg shadow-sm"
                >
                  Copy Link
                </button>
              </div>
            </div>

            <div className="space-y-1.5 border border-slate-200 rounded-xl p-3 bg-slate-50">
              <label className="block font-bold text-slate-800">Preview Invitation Email:</label>
              <div className="max-h-40 overflow-y-auto p-3 bg-white border border-slate-200 rounded-lg text-slate-600 space-y-2 font-mono text-[10px] leading-relaxed">
                <p><strong>To:</strong> {inviteModal.recipient}</p>
                <p><strong>Subject:</strong> Official Registration Invitation - ANVESHA 2026</p>
                <div className="border-t pt-2 mt-2 space-y-2 whitespace-pre-line text-slate-500">
                  {`Dear Event Coordinator,

We have verified your SIB Feebook Portal payment for ANVESHA 2026 (Transaction ID: ${inviteModal.txnId}) for ${inviteModal.instName}.

Please complete the official team registration form using the link:
${inviteModal.link}

Regards,
Registration Desk, ANVESHA 2026
Christ University`}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setInviteModal(null)}
                className="px-5 py-2 bg-christ-navy hover:bg-christ-darkNavy text-white font-bold rounded-lg shadow"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
