export type UserRole = 
  | 'admin'
  | 'registration_team'
  | 'hospitality_team'
  | 'faculty_football'
  | 'faculty_volleyball'
  | 'faculty_basketball'
  | 'faculty_tug_of_war'
  | 'faculty_dance'
  | 'faculty_music'
  | 'faculty_debate'
  | 'faculty_open_mic'
  | 'faculty_treasure_hunt'
  | 'certificate_team'
  | 'officials';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email: string;
  eventId?: string;
}

export type EventCategory = 'SPORTS' | 'CULTURALS' | 'FUN_ACTIVITIES';
export type EventType = 'TEAM' | 'INDIVIDUAL';

export interface FestEvent {
  id: string;
  name: string;
  category: EventCategory;
  type: EventType;
  minTeamSize: number;
  maxTeamSize: number;
  registrationFee: number;
  description: string;
  rules: string[];
  eligibility: string;
}

export interface MasterInstitution {
  id: string;
  name: string;
  place: string;
  address: string;
  pincode: string;
}

export interface Institution {
  id: string;
  registrationId: string;
  name: string;
  principalName: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  schoolContactNumber: string;
  schoolEmail: string;
  createdAt: string;
}

export interface ContactPerson {
  id: string;
  institutionId: string;
  type: 'POC' | 'MENTOR';
  name: string;
  designation: string;
  phone: string;
  email: string;
  govtIdProof: string;
}

export interface Participant {
  id: string;
  registrationId: string;
  institutionId: string;
  teamId: string;
  eventId: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  className: string;
  section: string;
  phone?: string;
  email?: string;
  govtIdProof: string;
  emergencyContact: string;
  medicalInfo?: string;
  chestNumber?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  studentRegisterNumber?: string;
  // Event-day additions
  jerseyNumber?: string;
  rosterStatus?: 'ACTIVE' | 'SUBSTITUTE' | 'BENCH';
  checkInStatus?: 'PENDING' | 'CHECKED_IN' | 'NO_SHOW';
}

export interface Team {
  id: string;
  registrationId: string;
  institutionId: string;
  eventId: string;
  teamName: 'Team A' | 'Team B' | string;
  captainId?: string;
  coachName?: string;
  mentorName?: string;
  participantIds: string[];
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  chestNumber?: string;
}

export interface Payment {
  id: string;
  registrationId: string;
  institutionId: string;
  amount: number;
  transactionId: string;
  receiptNumber: string;
  paymentProofUrl: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  date: string;
}

export interface BankPayment {
  id: string;
  transactionId: string;
  institutionName: string;
  email: string;
  phone?: string;
  amount: number;
  date: string;
  status: 'PENDING' | 'USED';
  registrationId?: string;
  invitationSent: boolean;
  invitationSentAt?: string;
  principalName?: string;
  eventName?: string;
  address?: string;
}

export interface VerificationRecord {
  id: string;
  registrationId: string;
  institutionId: string;
  verifiedBy: string;
  verifiedAt: string;
  status: 'VERIFIED' | 'REJECTED' | 'PENDING';
  remarks?: string;
}

export interface HospitalityRecord {
  id: string;
  institutionId: string;
  arrivalStatus: 'NOT_ARRIVED' | 'CHECKED_IN' | 'DEPARTED';
  arrivalTime?: string;
  accommodationHall?: string;
  foodPreference: 'Veg' | 'Non-Veg' | 'Jain';
  specialRequirements?: string;
  updatedAt: string;
}

export interface GoalEvent {
  scorerName: string;
  assistName?: string;
  time: string;
  ownGoal?: boolean;
  penalty?: boolean;
}

export interface CardEvent {
  playerName: string;
  type: 'YELLOW' | 'RED';
  time: string;
}

export interface Fixture {
  id: string;
  eventId: string;
  round: string;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  scheduledTime: string;
  venue: string;
  scoreA?: number;
  scoreB?: number;
  judgeScores?: Record<string, number>;
  winnerTeamId?: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  remarks?: string;
  
  // Dynamic Scoreboard extensions for individual events
  sportsStats?: {
    football?: {
      goalsA: GoalEvent[];
      goalsB: GoalEvent[];
      cardsA: CardEvent[];
      cardsB: CardEvent[];
      foulsA: number;
      foulsB: number;
      shootoutA?: number;
      shootoutB?: number;
    };
    volleyball?: {
      setsA: number[];
      setsB: number[];
      timeoutsA: number;
      timeoutsB: number;
      rotationA: string[];
      rotationB: string[];
    };
    basketball?: {
      quartersA: number[];
      quartersB: number[];
      timeoutsA: number;
      timeoutsB: number;
      foulsA: number;
      foulsB: number;
    };
    tugOfWar?: {
      pullWinners: string[]; // Pull-by-pull winner team ID
    };
  };
  culturalJudges?: Record<string, Record<string, number>>; // e.g. { "judge1": { "creativity": 8, "synchronization": 9 } }
  debateStats?: {
    topic: string;
    propSpeakers: { name: string; score: number; speakingTimeSeconds: number }[];
    oppSpeakers: { name: string; score: number; speakingTimeSeconds: number }[];
  };
  treasureHuntStats?: {
    startTime: string;
    endTime?: string;
    checkpointsVisited: string[];
    penaltiesMinutes: number;
    bonusPoints: number;
  };
}

export interface EventResult {
  id: string;
  eventId: string;
  winnerTeamId: string;
  winnerTeamName: string;
  winnerInstitutionName: string;
  runnerUpTeamId?: string;
  runnerUpTeamName?: string;
  runnerUpInstitutionName?: string;
  secondRunnerUpTeamId?: string;
  secondRunnerUpTeamName?: string;
  secondRunnerUpInstitutionName?: string;
  submittedBy: string;
  submittedAt: string;
  isLocked: boolean;
}

export interface EditRequest {
  id: string;
  eventId: string;
  facultyName: string;
  facultyId: string;
  reason: string;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminRemarks?: string;
}

export interface CertificateRecord {
  id: string;
  participantId: string;
  participantName: string;
  institutionName: string;
  eventName: string;
  type: 'PARTICIPATION' | 'WINNER' | 'RUNNER_UP' | 'SECOND_RUNNER_UP';
  chestNumber: string;
  issueDate: string;
  certificateCode: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
}

export interface EventState {
  eventId: string;
  venue: string;
  status: 'SCHEDULED' | 'LIVE' | 'PAUSED' | 'DELAYED' | 'COMPLETED' | 'CANCELLED';
  delayMinutes: number;
  delayReason?: string;
  attendanceChecked: boolean;
  officials: string[];
}
