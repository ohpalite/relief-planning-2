export interface Teacher {
  id: string;
  name: string;
  department: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TimetableSlot {
  id: string;
  teacherId: string;
  dayOfWeek: number; // 1 = Monday, 5 = Friday
  periodNumber: number; // 1..8
  subject: string;
  venue: string;
  isFreePeriod: boolean;
}

export interface Absence {
  id: string;
  teacherId: string;
  date: string; // YYYY-MM-DD
  teacher?: Teacher;
}

export interface ReliefAssignment {
  id: string;
  absentTeacherId: string;
  coveringTeacherId: string;
  date: string;
  periodNumber: number;
  subject: string;
  venue: string;
  createdAt?: Date;
  absentTeacher?: Teacher;
  coveringTeacher?: Teacher;
}

export interface SystemSettings {
  id: string;
  maxConsecutivePeriods: number;
  maxTotalPeriodsPerDay: number;
}

export interface UncoveredClass {
  absentTeacherId: string;
  absentTeacherName: string;
  absentTeacherDept: string;
  periodNumber: number;
  subject: string;
  venue: string;
  dayOfWeek: number;
  date: string;
  isCovered: boolean;
  assignedCoveringTeacherId?: string;
  assignedCoveringTeacherName?: string;
  reliefAssignmentId?: string;
}

export interface TeacherEvaluation {
  teacher: Teacher;
  isAvailable: boolean;
  exclusionReasons: string[];
  scheduledRegularPeriodsCount: number;
  reliefAssignmentsCount: number;
  totalPeriodsToday: number;
  maxTotalPeriods: number;
  maxConsecutive: number;
  currentConsecutive: number;
  consecutiveIfAssigned: number;
  isNearLimitWarning: boolean; // Soft warning if exact 1 period away from daily limit
}

export interface DashboardStats {
  totalTeachers: number;
  totalAbsentToday: number;
  classesNeedingCover: number;
  classesCovered: number;
  date: string;
}
