import { User, Institution, MasterInstitution, ContactPerson, Participant, Team, Payment, VerificationRecord, HospitalityRecord, Fixture, EventResult, CertificateRecord, AuditLog, BankPayment } from '../types';

export const PREDEFINED_INSTITUTIONS: MasterInstitution[] = [
  // { id: 'inst_m1', name: 'Dummy PU College A', place: 'City Center', address: '123 Main Road, City Center, District, State', pincode: '560001' },
  // { id: 'inst_m2', name: 'Dummy Pre-University College B', place: 'Suburbs', address: '456 Ring Road, Suburbs, District, State', pincode: '560002' },
  // { id: 'inst_m3', name: 'Dummy High School & PU College C', place: 'North Campus', address: '789 University Way, North Campus, District, State', pincode: '560003' }
];

export const INITIAL_USERS: User[] = [
  { id: 'usr_admin', username: 'admin@anvesha.in', name: 'Dr. Joseph K (Chief Admin)', role: 'admin', email: 'admin@anvesha.in' },
  { id: 'usr_verify', username: 'registration@anvesha.in', name: 'Prof. Mary Thomas (Registration)', role: 'registration_team', email: 'registration@anvesha.in' },
  { id: 'usr_hospitality', username: 'hospitality@anvesha.in', name: 'Bro. Anthony S (Hospitality Desk)', role: 'hospitality_team', email: 'hospitality@anvesha.in' },
  { id: 'usr_football', username: 'football@anvesha.in', name: 'Coach Rajesh Kumar (Football Boys)', role: 'faculty_football', eventId: 'sports_football_boys', email: 'football@anvesha.in' },
  { id: 'usr_football_girls', username: 'football_girls@anvesha.in', name: 'Coach Sarah Gomes (Football Girls)', role: 'faculty_football', eventId: 'sports_football_girls', email: 'football_girls@anvesha.in' },
  { id: 'usr_volleyball', username: 'vball@anvesha.in', name: 'Coach Priya Nair (Volleyball Boys)', role: 'faculty_volleyball', eventId: 'sports_volleyball_boys', email: 'vball@anvesha.in' },
  { id: 'usr_volleyball_girls', username: 'vball_girls@anvesha.in', name: 'Coach Anjali Sen (Volleyball Girls)', role: 'faculty_volleyball', eventId: 'sports_volleyball_girls', email: 'vball_girls@anvesha.in' },
  { id: 'usr_basketball', username: 'bball@anvesha.in', name: 'Coach David D (Basketball Boys)', role: 'faculty_basketball', eventId: 'sports_basketball_boys', email: 'bball@anvesha.in' },
  { id: 'usr_basketball_girls', username: 'bball_girls@anvesha.in', name: 'Coach Rita Abraham (Basketball Girls)', role: 'faculty_basketball', eventId: 'sports_basketball_girls', email: 'bball_girls@anvesha.in' },
  { id: 'usr_dance', username: 'dance@anvesha.in', name: 'Prof. Ananya Roy (Group Dance)', role: 'faculty_dance', eventId: 'cultural_dance', email: 'dance@anvesha.in' },
  { id: 'usr_music', username: 'music@anvesha.in', name: 'Prof. Samuel V (Group Music)', role: 'faculty_music', eventId: 'cultural_music', email: 'music@anvesha.in' },
  { id: 'usr_debate', username: 'debate@anvesha.in', name: 'Prof. Anita Sharma (Debate)', role: 'faculty_debate', eventId: 'cultural_debate', email: 'debate@anvesha.in' },
  { id: 'usr_openmic', username: 'openmic@anvesha.in', name: 'Prof. Vikram Roy (Open Mic)', role: 'faculty_open_mic', eventId: 'cultural_open_mic', email: 'openmic@anvesha.in' },
  { id: 'usr_treasure', username: 'treasure@anvesha.in', name: 'Prof. Rajesh K (Treasure Hunt)', role: 'faculty_treasure_hunt', eventId: 'cultural_treasure_hunt', email: 'treasure@anvesha.in' },
  { id: 'usr_tugofwar_boys', username: 'tugofwar@anvesha.in', name: 'Coach Balaji S (Tug of War Boys)', role: 'faculty_tug_of_war', eventId: 'sports_tug_of_war_boys', email: 'tugofwar@anvesha.in' },
  { id: 'usr_tugofwar_girls', username: 'tugofwar_girls@anvesha.in', name: 'Coach Shanthi R (Tug of War Girls)', role: 'faculty_tug_of_war', eventId: 'sports_tug_of_war_girls', email: 'tugofwar_girls@anvesha.in' },
  { id: 'usr_certs', username: 'certificate@anvesha.in', name: 'Sister Grace M (Certificate Desk)', role: 'certificate_team', email: 'certificate@anvesha.in' },
  { id: 'usr_officials', username: 'official@anvesha.in', name: 'Registrar Office (View Only)', role: 'officials', email: 'official@anvesha.in' }
];

export const INITIAL_INSTITUTIONS: Institution[] = [
  {
    id: 'inst_1',
    registrationId: 'ANV-2026-1001',
    name: 'St. Joseph\'s Pre-University College',
    principalName: 'Rev. Fr. Swebert D\'Silva',
    address: '36, Lalbagh Road',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    pincode: '560027',
    schoolContactNumber: '080-22211429',
    schoolEmail: 'contact@sjpuc.edu.in',
    createdAt: '2026-06-15T10:30:00Z'
  },
  {
    id: 'inst_2',
    registrationId: 'ANV-2026-1002',
    name: 'Mount Carmel PU College',
    principalName: 'Dr. Sr. Albina',
    address: '58, Palace Road, Vasanth Nagar',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    pincode: '560052',
    schoolContactNumber: '080-22261759',
    schoolEmail: 'info@mountcarmelpu.edu.in',
    createdAt: '2026-06-16T11:15:00Z'
  },
  {
    id: 'inst_3',
    registrationId: 'ANV-2026-1003',
    name: 'Christ Junior College',
    principalName: 'Fr. Biju K C',
    address: 'Hosur Road, Bhavani Nagar',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    pincode: '560029',
    schoolContactNumber: '080-40129200',
    schoolEmail: 'office@cjc.christuniversity.in',
    createdAt: '2026-06-17T09:00:00Z'
  },
  {
    id: 'inst_4',
    registrationId: 'ANV-2026-1004',
    name: 'Deeksha PU College (Kengeri)',
    principalName: 'Dr. Ramesh Babu',
    address: 'Mysore Road, Kengeri',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    pincode: '560060',
    schoolContactNumber: '080-28484800',
    schoolEmail: 'kengeri@deekshalearning.com',
    createdAt: '2026-06-18T14:20:00Z'
  }
];

export const INITIAL_CONTACTS: ContactPerson[] = [
  {
    id: 'poc_1',
    institutionId: 'inst_1',
    type: 'POC',
    name: 'Prof. Mark D\'Souza',
    designation: 'Sports Coordinator',
    phone: '9845012345',
    email: 'mark.dsouza@sjpuc.edu.in',
    govtIdProof: 'AADHAAR-9876-5432-1098'
  },
  {
    id: 'mentor_1',
    institutionId: 'inst_1',
    type: 'MENTOR',
    name: 'Dr. Sunita Rao',
    designation: 'Cultural Advisor',
    phone: '9845098765',
    email: 'sunita.rao@sjpuc.edu.in',
    govtIdProof: 'PAN-ABCDE1234F'
  },
  {
    id: 'poc_2',
    institutionId: 'inst_2',
    type: 'POC',
    name: 'Sister Mary Rose',
    designation: 'Student Welfare Officer',
    phone: '9741023456',
    email: 'm.rose@mountcarmelpu.edu.in',
    govtIdProof: 'AADHAAR-8765-4321-0987'
  }
];

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'team_fb_sjpuc_a',
    registrationId: 'ANV-2026-1001',
    institutionId: 'inst_1',
    eventId: 'sports_football_boys',
    teamName: 'Team A',
    captainId: 'part_1',
    coachName: 'Mr. Anthony G',
    mentorName: 'Dr. Sunita Rao',
    participantIds: ['part_1', 'part_2', 'part_3'],
    status: 'VERIFIED'
  },
  {
    id: 'team_fb_mcpu_a',
    registrationId: 'ANV-2026-1002',
    institutionId: 'inst_2',
    eventId: 'sports_football_boys',
    teamName: 'Team A',
    captainId: 'part_4',
    coachName: 'Mr. Vikram Seth',
    mentorName: 'Sister Mary Rose',
    participantIds: ['part_4', 'part_5'],
    status: 'VERIFIED'
  },
  {
    id: 'team_dance_cjc_a',
    registrationId: 'ANV-2026-1003',
    institutionId: 'inst_3',
    eventId: 'cultural_dance',
    teamName: 'Team A',
    captainId: 'part_6',
    coachName: 'Ms. Priya Menon',
    mentorName: 'Fr. Biju K C',
    participantIds: ['part_6', 'part_7'],
    status: 'VERIFIED'
  },
  {
    id: 'team_fb_deeksha_a',
    registrationId: 'ANV-2026-1004',
    institutionId: 'inst_4',
    eventId: 'sports_football_boys',
    teamName: 'Team A',
    captainId: 'part_8',
    coachName: 'Mr. Prakash R',
    mentorName: 'Dr. Ramesh Babu',
    participantIds: ['part_8'],
    status: 'PENDING'
  }
];

export const INITIAL_PARTICIPANTS: Participant[] = [
  {
    id: 'part_1',
    registrationId: 'ANV-2026-1001',
    institutionId: 'inst_1',
    teamId: 'team_fb_sjpuc_a',
    eventId: 'sports_football_boys',
    name: 'Kevin Mathew',
    gender: 'Male',
    dob: '2008-04-12',
    className: '2nd PU',
    section: 'PCMB-A',
    phone: '9900112233',
    email: 'kevin.m@sjpuc.edu.in',
    govtIdProof: 'PUC-ID-2024-8891',
    emergencyContact: 'Father: 9845011111',
    medicalInfo: 'None',
    chestNumber: 'FB-101',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'part_2',
    registrationId: 'ANV-2026-1001',
    institutionId: 'inst_1',
    teamId: 'team_fb_sjpuc_a',
    eventId: 'sports_football_boys',
    name: 'Rohan Sharma',
    gender: 'Male',
    dob: '2008-08-25',
    className: '2nd PU',
    section: 'CEBA-B',
    phone: '9900112244',
    govtIdProof: 'PUC-ID-2024-8892',
    emergencyContact: 'Mother: 9845022222',
    chestNumber: 'FB-102',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'part_3',
    registrationId: 'ANV-2026-1001',
    institutionId: 'inst_1',
    teamId: 'team_fb_sjpuc_a',
    eventId: 'sports_football_boys',
    name: 'Daniel Cruz',
    gender: 'Male',
    dob: '2008-11-03',
    className: '1st PU',
    section: 'PCMC-C',
    govtIdProof: 'PUC-ID-2025-1021',
    emergencyContact: 'Father: 9845033333',
    chestNumber: 'FB-103',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'part_4',
    registrationId: 'ANV-2026-1002',
    institutionId: 'inst_2',
    teamId: 'team_fb_mcpu_a',
    eventId: 'sports_football_boys',
    name: 'Aishwarya R',
    gender: 'Female',
    dob: '2008-02-18',
    className: '2nd PU',
    section: 'SEBA-A',
    phone: '9880011223',
    govtIdProof: 'MCPU-2024-4410',
    emergencyContact: 'Mother: 9880099999',
    chestNumber: 'FB-201',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'part_5',
    registrationId: 'ANV-2026-1002',
    institutionId: 'inst_2',
    teamId: 'team_fb_mcpu_a',
    eventId: 'sports_football_boys',
    name: 'Divya N',
    gender: 'Female',
    dob: '2008-07-09',
    className: '2nd PU',
    section: 'PCMB-B',
    govtIdProof: 'MCPU-2024-4412',
    emergencyContact: 'Father: 9880088888',
    chestNumber: 'FB-202',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'part_6',
    registrationId: 'ANV-2026-1003',
    institutionId: 'inst_3',
    teamId: 'team_dance_cjc_a',
    eventId: 'cultural_dance',
    name: 'Sneha Fernandez',
    gender: 'Female',
    dob: '2008-01-30',
    className: '2nd PU',
    section: 'HEPS-A',
    phone: '9739012345',
    govtIdProof: 'CJC-2024-0019',
    emergencyContact: 'Mother: 9739099999',
    chestNumber: 'DN-301',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'part_7',
    registrationId: 'ANV-2026-1003',
    institutionId: 'inst_3',
    teamId: 'team_dance_cjc_a',
    eventId: 'cultural_dance',
    name: 'Tanya Roy',
    gender: 'Female',
    dob: '2008-09-14',
    className: '1st PU',
    section: 'PCMC-A',
    govtIdProof: 'CJC-2025-0552',
    emergencyContact: 'Father: 9739088888',
    chestNumber: 'DN-302',
    verificationStatus: 'VERIFIED'
  },
  {
    id: 'part_8',
    registrationId: 'ANV-2026-1004',
    institutionId: 'inst_4',
    teamId: 'team_fb_deeksha_a',
    eventId: 'sports_football_boys',
    name: 'Karthik Gowda',
    gender: 'Male',
    dob: '2008-06-21',
    className: '2nd PU',
    section: 'PCMB-1',
    phone: '9916012345',
    govtIdProof: 'DKSH-2024-771',
    emergencyContact: 'Father: 9916099999',
    verificationStatus: 'PENDING'
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay_1',
    registrationId: 'ANV-2026-1001',
    institutionId: 'inst_1',
    amount: 4000,
    transactionId: 'TXN-CHRIST-882194',
    receiptNumber: 'RCP-2026-001',
    paymentProofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop',
    status: 'SUCCESS',
    date: '2026-06-15T10:45:00Z'
  },
  {
    id: 'pay_2',
    registrationId: 'ANV-2026-1002',
    institutionId: 'inst_2',
    amount: 2500,
    transactionId: 'TXN-CHRIST-991043',
    receiptNumber: 'RCP-2026-002',
    paymentProofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop',
    status: 'SUCCESS',
    date: '2026-06-16T11:30:00Z'
  },
  {
    id: 'pay_3',
    registrationId: 'ANV-2026-1003',
    institutionId: 'inst_3',
    amount: 2200,
    transactionId: 'TXN-CHRIST-100293',
    receiptNumber: 'RCP-2026-003',
    paymentProofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop',
    status: 'SUCCESS',
    date: '2026-06-17T09:15:00Z'
  },
  {
    id: 'pay_4',
    registrationId: 'ANV-2026-1004',
    institutionId: 'inst_4',
    amount: 2500,
    transactionId: 'TXN-CHRIST-402911',
    receiptNumber: 'RCP-2026-004',
    paymentProofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop',
    status: 'PENDING',
    date: '2026-06-18T14:30:00Z'
  }
];

export const INITIAL_VERIFICATIONS: VerificationRecord[] = [
  {
    id: 'ver_1',
    registrationId: 'ANV-2026-1001',
    institutionId: 'inst_1',
    verifiedBy: 'usr_verify',
    verifiedAt: '2026-06-19T09:00:00Z',
    status: 'VERIFIED',
    remarks: 'All documents, payment receipts, and principal endorsement verified.'
  },
  {
    id: 'ver_2',
    registrationId: 'ANV-2026-1002',
    institutionId: 'inst_2',
    verifiedBy: 'usr_verify',
    verifiedAt: '2026-06-19T09:30:00Z',
    status: 'VERIFIED',
    remarks: 'Verified.'
  },
  {
    id: 'ver_3',
    registrationId: 'ANV-2026-1003',
    institutionId: 'inst_3',
    verifiedBy: 'usr_verify',
    verifiedAt: '2026-06-19T10:00:00Z',
    status: 'VERIFIED',
    remarks: 'Verified.'
  }
];

export const INITIAL_HOSPITALITY: HospitalityRecord[] = [
  {
    id: 'hosp_1',
    institutionId: 'inst_1',
    arrivalStatus: 'CHECKED_IN',
    arrivalTime: '2026-07-04T07:45:00Z',
    accommodationHall: 'St. Kuriakose Elias Hall (Block II)',
    foodPreference: 'Veg',
    specialRequirements: 'Needs 2 extra lockers for sports gear.',
    updatedAt: '2026-07-04T07:45:00Z'
  },
  {
    id: 'hosp_2',
    institutionId: 'inst_2',
    arrivalStatus: 'CHECKED_IN',
    arrivalTime: '2026-07-04T08:15:00Z',
    accommodationHall: 'Chavara Auditorium Holding Room 3',
    foodPreference: 'Veg',
    updatedAt: '2026-07-04T08:15:00Z'
  },
  {
    id: 'hosp_3',
    institutionId: 'inst_3',
    arrivalStatus: 'NOT_ARRIVED',
    foodPreference: 'Non-Veg',
    updatedAt: '2026-07-04T08:00:00Z'
  }
];

export const INITIAL_FIXTURES: Fixture[] = [
  {
    id: 'fix_fb_1',
    eventId: 'sports_football_boys',
    round: 'Quarter Finals - Match 1',
    teamAId: 'team_fb_sjpuc_a',
    teamBId: 'team_fb_mcpu_a',
    teamAName: 'St. Joseph\'s PU (Team A)',
    teamBName: 'Mount Carmel PU (Team A)',
    scheduledTime: '10:00 AM',
    venue: 'Christ Football Stadium Ground A',
    scoreA: 3,
    scoreB: 1,
    winnerTeamId: 'team_fb_sjpuc_a',
    status: 'COMPLETED',
    remarks: 'High energy match. St. Josephs won 3-1.'
  },
  {
    id: 'fix_fb_2',
    eventId: 'sports_football_boys',
    round: 'Finals',
    teamAId: 'team_fb_sjpuc_a',
    teamBId: 'team_fb_cjc_a',
    teamAName: 'St. Joseph\'s PU (Team A)',
    teamBName: 'Christ Junior College (Team A)',
    scheduledTime: '03:30 PM',
    venue: 'Christ Main Football Arena',
    status: 'LIVE',
    scoreA: 1,
    scoreB: 1,
    remarks: 'Second half in progress.'
  }
];

export const INITIAL_RESULTS: EventResult[] = [
  {
    id: 'res_dance_1',
    eventId: 'cultural_dance',
    winnerTeamId: 'team_dance_cjc_a',
    winnerTeamName: 'Team A',
    winnerInstitutionName: 'Christ Junior College',
    runnerUpTeamId: 'team_dance_sjpuc_a',
    runnerUpTeamName: 'Team A',
    runnerUpInstitutionName: 'St. Joseph\'s Pre-University College',
    submittedBy: 'usr_dance',
    submittedAt: '2026-07-04T14:00:00Z',
    isLocked: true
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_1',
    timestamp: '2026-07-04T07:45:00Z',
    user: 'Bro. Anthony S',
    role: 'hospitality_team',
    action: 'CHECK_IN_INSTITUTION',
    details: 'Checked in St. Joseph\'s Pre-University College (15 members).'
  },
  {
    id: 'log_2',
    timestamp: '2026-07-04T09:00:00Z',
    user: 'Prof. Mary Thomas',
    role: 'registration_team',
    action: 'VERIFY_REGISTRATION',
    details: 'Approved registration ANV-2026-1001 and generated chest numbers FB-101 to FB-103.'
  },
  {
    id: 'log_3',
    timestamp: '2026-07-04T14:00:00Z',
    user: 'Prof. Ananya Roy',
    role: 'faculty_dance',
    action: 'SUBMIT_EVENT_RESULT',
    details: 'Submitted final results for Group Dance and locked the score sheet.'
  }
];

export const INITIAL_BANK_PAYMENTS: BankPayment[] = [
  {
    id: 'BP-SIB-9921',
    transactionId: 'TXN-SIB-883901',
    institutionName: 'Bishop Cotton Boys\' School',
    email: 'principal@bcbs.edu.in',
    amount: 5000,
    date: '2026-07-06T10:00:00Z',
    status: 'PENDING',
    invitationSent: false
  },
  {
    id: 'BP-SIB-9922',
    transactionId: 'TXN-SIB-992817',
    institutionName: 'CMR National PU College',
    email: 'info@cmrpuc.edu.in',
    amount: 3500,
    date: '2026-07-06T11:30:00Z',
    status: 'PENDING',
    invitationSent: false
  },
  {
    id: 'BP-SIB-9923',
    transactionId: 'TXN-SIB-102938',
    institutionName: 'Christ Junior College',
    email: 'office@cjc.christuniversity.in',
    amount: 6000,
    date: '2026-07-07T09:15:00Z',
    status: 'USED',
    registrationId: 'ANV-2026-1003',
    invitationSent: true,
    invitationSentAt: '2026-07-07T09:20:00Z'
  }
];
