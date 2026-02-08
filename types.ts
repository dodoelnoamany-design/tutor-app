
export enum SessionStatus {
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
  RESCHEDULED = 'rescheduled',
  PENDING = 'pending'
}

export interface DayTime {
  day: number; // 0-6 (Sunday-Saturday)
  time: string; // HH:mm
}

export interface Student {
  id: string;
  name: string;
  phone?: string;
  level?: string;
  parentName?: string;
  parentPhone?: string;
  monthlyPrice: number;
  sessionsPerWeek: number;
  sessionPrice: number;
  fixedSchedule: DayTime[];
  paidAmount: number; // إجمالي ما دفعه هذا الشهر
  createdAt: number;
}

export interface Session {
  id: string;
  studentId: string;
  dateTime: string; // ISO string
  duration: number; // in minutes
  price: number;
  status: SessionStatus;
  originalSessionId?: string;
  note?: string;
}
export interface SchoolSession {
  id: string;
  name: string;
  level: string;
  grade: string; // الصف الدراسي
  boyGirl: 'boys' | 'girls' | 'mixed'; // أولاد/بنات/مختلط
  day: number; // 0-6 (Sunday-Saturday)
  time: string; // HH:mm
  duration: number; // in minutes
  endTime?: string; // HH:mm - وقت النهاية
  subject?: string;
  notes?: string;
  teacher?: string;
  createdAt: number;
}

export interface AppNotification {
  id: string;
  sessionId: string;
  title: string;
  message: string;
  scheduledTime: string; // ISO string
  sent: boolean;
}