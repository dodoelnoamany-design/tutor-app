
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Student, Session, SessionStatus, DayTime } from './types';
import { LocalNotifications } from '@capacitor/local-notifications';

interface AppContextType {
  students: Student[];
  sessions: Session[];
  notifications: any[];
  addNotification: (notification: any) => void;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  updateFixedSchedule: (studentId: string, day: number, newTime: string) => void;
  addSession: (session: Omit<Session, 'id'>) => void;
  updateSessionStatus: (sessionId: string, status: SessionStatus, newDate?: string) => void;
  recordPayment: (studentId: string, amount: number) => void;
  getStudentById: (id: string) => Student | undefined;
  getDailySessions: (dateStr: string) => Session[];
  getDailyIncome: (date: string) => number;
  getExpectedMonthlyIncome: () => number;
  generateSessionsForDateRange: (daysAhead: number, studentList?: Student[]) => void;
  getStats: () => {
    totalIncome: number;
    cancelledCount: number;
    pendingPostponed: number;
    todaySessions: Session[];
    overduePostponedSessions: Session[];
  };
  getFinancialReport: () => {
    studentReports: { 
      student: Student; 
      debt: number; 
      paid: number; 
      status: 'paid' | 'unpaid' | 'partial';
      completedSessionsCount: number;
      expectedMonthly: number;
    }[];
    totalExpected: number;
    totalCollected: number;
    monthlyExpected: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifiedSessions, setNotifiedSessions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const savedStudents = localStorage.getItem('tutor_students_v3');
    const savedSessions = localStorage.getItem('tutor_sessions_v3');
    if (savedStudents) setStudents(JSON.parse(savedStudents));
    if (savedSessions) setSessions(JSON.parse(savedSessions));
  }, []);

  useEffect(() => {
    localStorage.setItem('tutor_students_v3', JSON.stringify(students));
    localStorage.setItem('tutor_sessions_v3', JSON.stringify(sessions));
  }, [students, sessions]);

  // Function to send system notifications
  const sendSystemNotification = async (title: string, body: string) => {
    try {
      // Check if system notifications are enabled in settings
      const systemNotificationsEnabled = localStorage.getItem('tutor_system_notifications_enabled') !== 'false';
      
      if (!systemNotificationsEnabled) return;

      // Request permissions if needed
      const permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== 'granted') {
        const permResult = await LocalNotifications.requestPermissions();
        if (permResult.display !== 'granted') return;
      }

      // Send notification
      await LocalNotifications.schedule({
        notifications: [{
          title,
          body,
          id: Math.floor(Math.random() * 1000000),
          schedule: { at: new Date() },
          sound: 'default',
          smallIcon: 'ic_stat_icon_config_sample',
          iconColor: '#3b82f6',
        }]
      });
    } catch (error) {
      console.log('System notification failed:', error);
      // Fallback to browser notification if available
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icon-192.png' });
      }
    }
  };

  // Request notification permissions on app start
  useEffect(() => {
    const requestNotificationPermissions = async () => {
      try {
        // Check and request browser notifications
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
        }

        // Check and request Capacitor local notifications
        const permStatus = await LocalNotifications.checkPermissions();
        if (permStatus.display === 'prompt') {
          await LocalNotifications.requestPermissions();
        }
      } catch (error) {
        console.log('Permission request failed:', error);
      }
    };

    requestNotificationPermissions();
  }, []);

  // Notification system - check for sessions before start
  useEffect(() => {
    const checkNotifications = () => {
      const notificationOffset = parseInt(localStorage.getItem('tutor_notification_offset_minutes') || '10', 10);
      const now = new Date();
      const offsetLater = new Date(now.getTime() + notificationOffset * 60000);

      sessions.forEach(session => {
        if (session.status === 'pending' && !notifiedSessions.has(session.id)) {
          const sessionDate = new Date(session.dateTime);
          
          if (sessionDate >= now && sessionDate <= offsetLater) {
            const student = students.find(s => s.id === session.studentId);
            if (student) {
              const notification = {
                id: session.id,
                sessionId: session.id,
                title: `درس ${student.name} بدأ قريباً`,
                message: `الحصة تبدأ خلال ${Math.floor((sessionDate.getTime() - now.getTime()) / 60000)} دقيقة`,
                timestamp: now.getTime()
              };
              
              setNotifications(prev => [notification, ...prev]);
              setNotifiedSessions(prev => new Set([...prev, session.id]));

              // Send system notification
              sendSystemNotification(notification.title, notification.message);

              // Try to play sound if enabled
              try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
              } catch (e) {
                // Sound context not available
              }
            }
          }
        }
      });
    };

    const interval = setInterval(checkNotifications, 60000); // Check every minute
    checkNotifications(); // Check immediately

    return () => clearInterval(interval);
  }, [sessions, students, notifiedSessions]);

  const generateSessionsForDateRange = useCallback((daysAhead: number, studentList?: Student[]) => {
    const currentStudents = studentList || students;
    if (currentStudents.length === 0) return;

    setSessions(prevSessions => {
      const newSessions: Session[] = [...prevSessions];
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      currentStudents.forEach(student => {
        student.fixedSchedule.forEach(schedule => {
          for (let i = 0; i <= daysAhead; i++) {
            const date = new Date(now);
            date.setDate(now.getDate() + i);
            
            if (date.getDay() === schedule.day) {
              const [hours, minutes] = schedule.time.split(':');
              date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
              
              const dateStr = date.toISOString();
              
              const exists = newSessions.some(s => 
                s.studentId === student.id && 
                new Date(s.dateTime).getTime() === date.getTime()
              );
              
              if (!exists) {
                newSessions.push({
                  id: Math.random().toString(36).substr(2, 9),
                  studentId: student.id,
                  dateTime: dateStr,
                  duration: 60,
                  price: student.sessionPrice,
                  status: SessionStatus.PENDING
                });
              }
            }
          }
        });
      });
      return newSessions.sort((a, b) => a.dateTime.localeCompare(b.dateTime));
    });
  }, [students]);

  const updateFixedSchedule = (studentId: string, day: number, newTime: string) => {
    // Update student fixed schedule time
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      return { ...s, fixedSchedule: s.fixedSchedule.map(fd => fd.day === day ? { ...fd, time: newTime } : fd) };
    }));

    // Update existing future sessions for this student on this day instead of creating new ones
    setSessions(prev => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      return prev.map(session => {
        const sessionDate = new Date(session.dateTime);
        sessionDate.setHours(0, 0, 0, 0);
        const isFuture = sessionDate >= now;
        const isSameDay = sessionDate.getDay() === day;
        const isSameStudent = session.studentId === studentId;

        if (isFuture && isSameDay && isSameStudent) {
          // Update the existing session with new time
          const [hours, minutes] = newTime.split(':');
          const updatedDate = new Date(session.dateTime);
          updatedDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          return {
            ...session,
            dateTime: updatedDate.toISOString()
          };
        }

        return session;
      }).sort((a, b) => a.dateTime.localeCompare(b.dateTime));
    });
  };

  const addStudent = (data: Omit<Student, 'id' | 'createdAt'>) => {
    const newStudent: Student = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
    };
    setStudents(prev => {
      const updatedStudents = [...prev, newStudent];
      // Generate sessions for all students including the new one
      generateSessionsForDateRange(30, updatedStudents);
      return updatedStudents;
    });
  };

  // Generate initial sessions only on first load
  useEffect(() => {
    if (students.length > 0 && sessions.length === 0) {
      generateSessionsForDateRange(30, students);
    }
  }, []); // Empty dependency array - only run once on mount

  const recordPayment = (studentId: string, amount: number) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, paidAmount: s.paidAmount + amount } : s));
  };

  const updateStudent = (student: Student) => {
    setStudents(prev => prev.map(s => s.id === student.id ? student : s));
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    setSessions(prev => prev.filter(sess => sess.studentId !== id));
  };

  const addSession = (data: Omit<Session, 'id'>) => {
    const newSession: Session = { ...data, id: Math.random().toString(36).substr(2, 9) };
    setSessions(prev => [...prev, newSession].sort((a, b) => a.dateTime.localeCompare(b.dateTime)));
  };

  const updateSessionStatus = (sessionId: string, status: SessionStatus, newDate?: string) => {
    setSessions(prev => {
      const updated = prev.map(s => s.id === sessionId ? { ...s, status } : s);
      if (status === SessionStatus.POSTPONED && newDate) {
        const original = prev.find(s => s.id === sessionId);
        if (original) {
          const rescheduled: Session = {
            id: Math.random().toString(36).substr(2, 9),
            studentId: original.studentId,
            dateTime: newDate,
            duration: original.duration,
            price: original.price,
            status: SessionStatus.RESCHEDULED,
            originalSessionId: original.id,
            note: `تعويض لحصة ${new Date(original.dateTime).toLocaleDateString('ar-EG')}`
          };
          return [...updated, rescheduled].sort((a, b) => a.dateTime.localeCompare(b.dateTime));
        }
      }
      return updated;
    });
  };

  const getStudentById = (id: string) => students.find(s => s.id === id);

  const getDailySessions = (dateStr: string) => {
    return sessions.filter(s => s.dateTime.startsWith(dateStr));
  };

  const getDailyIncome = (date: string) => {
    return sessions
      .filter(s => s.dateTime.startsWith(date) && (s.status === SessionStatus.COMPLETED || s.status === SessionStatus.RESCHEDULED))
      .reduce((sum, s) => sum + s.price, 0);
  };

  const getExpectedMonthlyIncome = () => {
    return students.reduce((sum, s) => sum + s.monthlyPrice, 0);
  };

  const getStats = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const todaySessions = getDailySessions(today);
    const totalIncome = sessions
      .filter(s => (s.status === SessionStatus.COMPLETED || s.status === SessionStatus.RESCHEDULED))
      .reduce((sum, s) => sum + s.price, 0);
    const cancelledCount = sessions.filter(s => s.status === SessionStatus.CANCELLED).length;
    const pendingPostponed = sessions.filter(s => s.status === SessionStatus.POSTPONED).length;
    
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(now.getDate() - 3);
    const overduePostponedSessions = sessions.filter(s => s.status === SessionStatus.POSTPONED && new Date(s.dateTime) < threeDaysAgo);

    return { totalIncome, cancelledCount, pendingPostponed, todaySessions, overduePostponedSessions };
  };

  const getFinancialReport = () => {
    const studentReports = students.map(student => {
      const studentSessions = sessions.filter(s => s.studentId === student.id);
      const completedCount = studentSessions.filter(s => s.status === SessionStatus.COMPLETED || s.status === SessionStatus.RESCHEDULED).length;
      const totalDebt = completedCount * student.sessionPrice;
      const status: 'paid' | 'unpaid' | 'partial' = student.paidAmount >= totalDebt ? 'paid' : (student.paidAmount > 0 ? 'partial' : 'unpaid');
      
      return {
        student,
        debt: totalDebt,
        paid: student.paidAmount,
        status,
        completedSessionsCount: completedCount,
        expectedMonthly: student.monthlyPrice
      };
    });

    const totalCollected = students.reduce((sum, s) => sum + s.paidAmount, 0);
    const totalExpected = studentReports.reduce((sum, r) => sum + r.debt, 0);
    const monthlyExpected = students.reduce((sum, s) => sum + s.monthlyPrice, 0);

    return { studentReports, totalExpected, totalCollected, monthlyExpected };
  };

  const addNotification = (notification: any) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <AppContext.Provider value={{ 
      students, sessions, notifications, addNotification, removeNotification, clearNotifications,
      addStudent, updateStudent, deleteStudent, 
      updateFixedSchedule,
      addSession, updateSessionStatus, recordPayment, getStudentById, getDailySessions, getDailyIncome, getExpectedMonthlyIncome, generateSessionsForDateRange, getStats, getFinancialReport 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
