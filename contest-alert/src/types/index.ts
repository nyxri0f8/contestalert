// TypeScript types for the Contest Alert platform

// ============================================================
// DATABASE TYPES
// ============================================================

export type UserRole = 'student' | 'admin';

export type EventStatus = 'draft' | 'active' | 'archived' | 'cancelled';

export type EventCategory =
  | 'technical'
  | 'non_technical'
  | 'hackathon'
  | 'workshop'
  | 'symposium'
  | 'placement'
  | 'internship'
  | 'sports'
  | 'cultural';

export type Department =
  | 'ECE'
  | 'CSE'
  | 'AIDS'
  | 'AIML'
  | 'CCE'
  | 'Biotechnology'
  | 'Mechanical'
  | 'CSBS'
  | 'VLSI';

export type WinnerPosition = 'winner' | 'runner_up' | 'special_mention';

export type NotificationType =
  | 'registration_success'
  | 'ticket_generated'
  | 'event_updated'
  | 'event_cancelled'
  | 'deadline_approaching'
  | 'winner_declared'
  | 'general';

// ============================================================
// TABLE INTERFACES
// ============================================================

export interface Profile {
  id: string;
  register_number: string | null;
  name: string;
  department: Department | null;
  year: number | null;
  section: string | null;
  phone: string | null;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  onboarding_completed: boolean;
  achievement_points: number;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  category: EventCategory;
  department: Department | null;
  cover_image: string | null;
  description: string | null;
  rules: string | null;
  eligibility: string | null;
  venue: string | null;
  event_date: string;
  deadline: string;
  capacity: number;
  fee: number;
  contact_person: string | null;
  contact_email: string | null;
  status: EventStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  user_id: string;
  event_id: string;
  ticket_id: string;
  team_name: string | null;
  phone: string | null;
  registered_at: string;
}

export interface Attendance {
  id: string;
  registration_id: string;
  checked_in_at: string;
  checked_in_by: string | null;
}

export interface Winner {
  id: string;
  event_id: string;
  user_id: string;
  position: WinnerPosition;
  declared_at: string;
  declared_by: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  related_event_id: string | null;
  created_at: string;
}

export interface EventView {
  id: string;
  event_id: string;
  user_id: string | null;
  viewed_at: string;
}

// ============================================================
// EXTENDED / JOINED TYPES
// ============================================================

export interface EventWithRegistrations extends Event {
  registrations: Registration[];
  registration_count: number;
  is_registered?: boolean;
}

export interface RegistrationWithDetails extends Registration {
  profile: Profile;
  event: Event;
  attendance: Attendance | null;
}

export interface DepartmentLeaderboard {
  department: Department;
  total_points: number;
  total_registrations: number;
  total_attendance: number;
  total_wins: number;
  attendance_rate: number;
  rank: number;
}

export interface EventAnalytics {
  views: number;
  registrations: number;
  conversion_rate: number;
  department_breakdown: {
    department: Department;
    views: number;
    registrations: number;
  }[];
}

// ============================================================
// UI TYPES
// ============================================================

export type DeadlineStatus = 'safe' | 'warn' | 'urgent' | 'critical';

export interface DashboardStats {
  total_events: number;
  active_events: number;
  total_students: number;
  total_registrations: number;
  upcoming_deadlines: number;
  attendance_rate: number;
}

export interface StudentDashboardStats {
  active_events: number;
  registered_events: number;
  upcoming_deadlines: number;
  completed_events: number;
  achievement_points: number;
}

export type AchievementBadge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
  earned: boolean;
};

export type DepartmentBadge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  department: Department;
};

// ============================================================
// CONSTANTS
// ============================================================

export const DEPARTMENTS: { value: Department; label: string; full: string }[] = [
  { value: 'ECE', label: 'ECE', full: 'Electronics and Communication Engineering' },
  { value: 'CSE', label: 'CSE', full: 'Computer Science and Engineering' },
  { value: 'AIDS', label: 'AIDS', full: 'Artificial Intelligence and Data Science' },
  { value: 'AIML', label: 'AIML', full: 'Artificial Intelligence and Machine Learning' },
  { value: 'CCE', label: 'CCE', full: 'Computer and Communication Engineering' },
  { value: 'Biotechnology', label: 'BT', full: 'Biotechnology' },
  { value: 'Mechanical', label: 'ME', full: 'Mechanical Engineering' },
  { value: 'CSBS', label: 'CSBS', full: 'Computer Science and Business Systems' },
  { value: 'VLSI', label: 'VLSI', full: 'VLSI Design' },
];

export const EVENT_CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: 'technical', label: 'Technical' },
  { value: 'non_technical', label: 'Non-Technical' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'symposium', label: 'Symposium' },
  { value: 'placement', label: 'Placement' },
  { value: 'internship', label: 'Internship' },
  { value: 'sports', label: 'Sports' },
  { value: 'cultural', label: 'Cultural' },
];

export const SCORING = {
  registration: 10,
  attendance: 20,
  winner: 50,
  runner_up: 30,
  special_mention: 0,
} as const;

export const STUDENT_BADGES: Omit<AchievementBadge, 'earned'>[] = [
  { id: 'explorer', name: 'Event Explorer', description: '5 registrations', icon: 'medal-bronze', threshold: 5 },
  { id: 'enthusiast', name: 'Event Enthusiast', description: '15 registrations', icon: 'medal-silver', threshold: 15 },
  { id: 'champion', name: 'Event Champion', description: '30 registrations', icon: 'medal-gold', threshold: 30 },
  { id: 'legend', name: 'Campus Legend', description: '50+ registrations', icon: 'trophy', threshold: 50 },
];
