import fs from 'fs';
import path from 'path';
import { 
  Institution, MasterInstitution, ContactPerson, Participant, Team, Payment, 
  VerificationRecord, HospitalityRecord, Fixture, EventResult, 
  EditRequest, CertificateRecord, AuditLog, User, EventState, BankPayment 
} from '../../../src/types';
import { 
  PREDEFINED_INSTITUTIONS,
  INITIAL_INSTITUTIONS, INITIAL_CONTACTS, INITIAL_PARTICIPANTS, 
  INITIAL_TEAMS, INITIAL_PAYMENTS, INITIAL_VERIFICATIONS, 
  INITIAL_HOSPITALITY, INITIAL_FIXTURES, INITIAL_RESULTS, 
  INITIAL_AUDIT_LOGS, INITIAL_USERS, INITIAL_BANK_PAYMENTS 
} from '../../../src/data/initialData';

export interface AppStore {
  users: User[];
  masterInstitutions: MasterInstitution[];
  institutions: Institution[];
  contacts: ContactPerson[];
  participants: Participant[];
  teams: Team[];
  payments: Payment[];
  verifications: VerificationRecord[];
  hospitality: HospitalityRecord[];
  fixtures: Fixture[];
  results: EventResult[];
  editRequests: EditRequest[];
  certificates: CertificateRecord[];
  auditLogs: AuditLog[];
  eventStates: EventState[];
  bankPayments: BankPayment[];
}

const DATA_DIR = path.resolve(process.cwd(), 'server/data');
const STORE_FILE = path.resolve(DATA_DIR, 'store.json');

class StoreManager {
  private store: AppStore;

  constructor() {
    this.store = this.loadStore();
  }

  private loadStore(): AppStore {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.masterInstitutions) {
          parsed.masterInstitutions = PREDEFINED_INSTITUTIONS;
        }
        if (!parsed.eventStates) {
          parsed.eventStates = [];
        }
        if (!parsed.bankPayments) {
          parsed.bankPayments = INITIAL_BANK_PAYMENTS;
        }
        return parsed;
      }
    } catch (err) {
      console.warn('Failed to load local store file, initializing default dataset.', err);
    }

    const defaultStore: AppStore = {
      users: INITIAL_USERS,
      masterInstitutions: PREDEFINED_INSTITUTIONS,
      institutions: INITIAL_INSTITUTIONS,
      contacts: INITIAL_CONTACTS,
      participants: INITIAL_PARTICIPANTS,
      teams: INITIAL_TEAMS,
      payments: INITIAL_PAYMENTS,
      verifications: INITIAL_VERIFICATIONS,
      hospitality: INITIAL_HOSPITALITY,
      fixtures: INITIAL_FIXTURES,
      results: INITIAL_RESULTS,
      editRequests: [],
      certificates: [],
      auditLogs: INITIAL_AUDIT_LOGS,
      eventStates: [],
      bankPayments: INITIAL_BANK_PAYMENTS,
    };

    this.saveStore(defaultStore);
    return defaultStore;
  }

  public saveStore(customStore?: AppStore) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const dataToSave = customStore || this.store;
      fs.writeFileSync(STORE_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write local store file:', err);
    }
  }

  public getStore(): AppStore {
    return this.store;
  }

  public addAuditLog(user: string, role: string, action: string, details: string) {
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      user,
      role,
      action,
      details,
    };
    this.store.auditLogs.unshift(log);
    this.saveStore();
    return log;
  }
}

export const dbStore = new StoreManager();
