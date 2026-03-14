export enum UserRole {
  ADMIN = 'ADMIN',
  CFD_HEAD = 'CFD_HEAD',
  COORDINATOR = 'COORDINATOR',
  CORRECTOR = 'CORRECTOR',
  SUPERVISOR = 'SUPERVISOR',
  JURY_PRESIDENT = 'JURY_PRESIDENT',
  JURY_MEMBER = 'JURY_MEMBER',
  ANONYMITY_COMMISSION = 'ANONYMITY_COMMISSION',
}

export enum CandidateStatus {
  REGISTERED = 'REGISTERED',
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  ELIMINATED = 'ELIMINATED',
  ADMITTED = 'ADMITTED',
  WAITLIST = 'WAITLIST',
  REJECTED = 'REJECTED',
}

export enum SubjectStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
}

/** Matches backend UserProfileSerializer */
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone: string;
  department: string;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
}

/** Matches backend UserSerializer */
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
  profile: UserProfile;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Candidate {
  id: string;
  applicationNumber: string;
  fullName: string;
  nationalId: string;
  email: string;
  phone: string;
  status: CandidateStatus;
  examSession: string;
  anonymousCode?: string;
  seatNumber?: string;
}

export interface ExamSubject {
  id: string;
  name: string;
  coefficient: number;
  maxScore: number;
  passThreshold: number;
  discrepancyThreshold: number;
  finalGradeRule: 'AVERAGE' | 'MEDIAN' | 'THIRD_CORRECTOR';
  status: SubjectStatus;
  date?: string;
  startTime?: string;
  duration?: string;
  rooms?: string[];
}
