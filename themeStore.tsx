import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeType = 'dark' | 'light';

interface CustomColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

interface SettingsContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  scheduleZoom: number;
  setScheduleZoom: (zoom: number) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  systemNotificationsEnabled: boolean;
  setSystemNotificationsEnabled: (enabled: boolean) => void;
  notificationOffsetMinutes: number;
  setNotificationOffsetMinutes: (minutes: number) => void;
  autoBackupDays: number;
  setAutoBackupDays: (days: number) => void;
  autoBackupPath: string;
  setAutoBackupPath: (path: string) => void;
  customColors: CustomColors;
  setCustomColors: (colors: Partial<CustomColors>) => void;
  resetCustomColors: () => void;
  teacherProfile: {
    name: string;
    email: string;
    phone: string;
    bio: string;
    specialization: string;
    avatar?: string;
  };
  setTeacherProfile: (profile: Partial<SettingsContextType['teacherProfile']>) => void;
  exportData: () => string;
  importData: (jsonData: string) => boolean;
  resetToDefaults: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_COLORS: CustomColors = {
  primary: '#3b82f6',
  secondary: '#1e40af',
  accent: '#f59e0b',
  background: '#020617',
  text: '#f8fafc',
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('tutor_theme');
    return (saved as ThemeType) || 'dark';
  });

  const [scheduleZoom, setScheduleZoomState] = useState<number>(() => {
    const saved = localStorage.getItem('tutor_schedule_zoom');
    return saved ? parseFloat(saved) : 1;
  });

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('tutor_sound_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('tutor_notifications_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [systemNotificationsEnabled, setSystemNotificationsEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('tutor_system_notifications_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [notificationOffsetMinutes, setNotificationOffsetMinutesState] = useState<number>(() => {
    const saved = localStorage.getItem('tutor_notification_offset_minutes');
    return saved ? parseInt(saved, 10) : 10;
  });

  const [autoBackupDays, setAutoBackupDaysState] = useState<number>(() => {
    const saved = localStorage.getItem('tutor_auto_backup_days');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [autoBackupPath, setAutoBackupPathState] = useState<string>(() => {
    const saved = localStorage.getItem('tutor_auto_backup_path');
    return saved || 'Downloads/TutorMaster-Backups';
  });

  const [customColors, setCustomColorsState] = useState<CustomColors>(() => {
    const saved = localStorage.getItem('tutor_custom_colors');
    return saved ? JSON.parse(saved) : DEFAULT_COLORS;
  });

  const [teacherProfile, setTeacherProfileState] = useState<SettingsContextType['teacherProfile']>(() => {
    const saved = localStorage.getItem('tutor_teacher_profile');
    return saved ? JSON.parse(saved) : {
      name: '',
      email: '',
      phone: '',
      bio: '',
      specialization: '',
      avatar: ''
    };
  });

  // Apply theme to document
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('light', 'dark');
    html.classList.add(theme);
    localStorage.setItem('tutor_theme', theme);
  }, [theme]);

  // Save zoom level
  useEffect(() => {
    localStorage.setItem('tutor_schedule_zoom', scheduleZoom.toString());
  }, [scheduleZoom]);

  // Save sound preference
  useEffect(() => {
    localStorage.setItem('tutor_sound_enabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  // Save notifications preference
  useEffect(() => {
    localStorage.setItem('tutor_notifications_enabled', JSON.stringify(notificationsEnabled));
  }, [notificationsEnabled]);

  // Save system notifications preference
  useEffect(() => {
    localStorage.setItem('tutor_system_notifications_enabled', JSON.stringify(systemNotificationsEnabled));
  }, [systemNotificationsEnabled]);

  // Save notification offset
  useEffect(() => {
    localStorage.setItem('tutor_notification_offset_minutes', notificationOffsetMinutes.toString());
  }, [notificationOffsetMinutes]);

  // Save auto backup days
  useEffect(() => {
    localStorage.setItem('tutor_auto_backup_days', autoBackupDays.toString());
  }, [autoBackupDays]);

  // Save auto backup path
  useEffect(() => {
    localStorage.setItem('tutor_auto_backup_path', autoBackupPath);
  }, [autoBackupPath]);

  // Apply custom colors
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', customColors.primary);
    root.style.setProperty('--color-secondary', customColors.secondary);
    root.style.setProperty('--color-accent', customColors.accent);
    localStorage.setItem('tutor_custom_colors', JSON.stringify(customColors));
  }, [customColors]);

  // Save teacher profile
  useEffect(() => {
    localStorage.setItem('tutor_teacher_profile', JSON.stringify(teacherProfile));
  }, [teacherProfile]);

  const exportData = (): string => {
    const students = localStorage.getItem('tutor_students_v3') || '[]';
    const sessions = localStorage.getItem('tutor_sessions_v3') || '[]';
    const schoolSessions = localStorage.getItem('tutor_school_sessions') || '[]';
    const theme = localStorage.getItem('tutor_theme') || 'dark';
    const zoom = localStorage.getItem('tutor_schedule_zoom') || '1';
    const soundEnabled = localStorage.getItem('tutor_sound_enabled') || 'true';
    const notificationsEnabled = localStorage.getItem('tutor_notifications_enabled') || 'true';
    const systemNotificationsEnabled = localStorage.getItem('tutor_system_notifications_enabled') || 'true';
    const notificationOffsetMinutes = localStorage.getItem('tutor_notification_offset_minutes') || '10';
    const autoBackupDays = localStorage.getItem('tutor_auto_backup_days') || '0';
    const autoBackupPath = localStorage.getItem('tutor_auto_backup_path') || 'Downloads/TutorMaster-Backups';
    const customColors = localStorage.getItem('tutor_custom_colors') || JSON.stringify(DEFAULT_COLORS);
    const teacherProfile = localStorage.getItem('tutor_teacher_profile') || JSON.stringify({
      name: '',
      email: '',
      phone: '',
      bio: '',
      specialization: ''
    });

    const backup = {
      version: '1.0',
      date: new Date().toISOString(),
      theme,
      zoom,
      soundEnabled,
      notificationsEnabled,
      systemNotificationsEnabled,
      notificationOffsetMinutes,
      autoBackupDays,
      autoBackupPath,
      customColors: JSON.parse(customColors),
      teacherProfile: JSON.parse(teacherProfile),
      students: JSON.parse(students),
      sessions: JSON.parse(sessions),
      schoolSessions: JSON.parse(schoolSessions)
    };

    return JSON.stringify(backup, null, 2);
  };

  const importData = (jsonData: string): boolean => {
    try {
      const backup = JSON.parse(jsonData);
      
      if (!backup.version || !backup.students || !backup.sessions) {
        console.error('Invalid backup format');
        return false;
      }

      localStorage.setItem('tutor_students_v3', JSON.stringify(backup.students));
      localStorage.setItem('tutor_sessions_v3', JSON.stringify(backup.sessions));
      if (backup.schoolSessions) localStorage.setItem('tutor_school_sessions', JSON.stringify(backup.schoolSessions));
      if (backup.theme) localStorage.setItem('tutor_theme', backup.theme);
      if (backup.zoom) localStorage.setItem('tutor_schedule_zoom', backup.zoom);
      if (backup.soundEnabled !== undefined) localStorage.setItem('tutor_sound_enabled', backup.soundEnabled);
      if (backup.notificationsEnabled !== undefined) localStorage.setItem('tutor_notifications_enabled', backup.notificationsEnabled);
      if (backup.systemNotificationsEnabled !== undefined) localStorage.setItem('tutor_system_notifications_enabled', backup.systemNotificationsEnabled);
      if (backup.notificationOffsetMinutes !== undefined) localStorage.setItem('tutor_notification_offset_minutes', backup.notificationOffsetMinutes.toString());
      if (backup.autoBackupDays !== undefined) localStorage.setItem('tutor_auto_backup_days', backup.autoBackupDays.toString());
      if (backup.autoBackupPath !== undefined) localStorage.setItem('tutor_auto_backup_path', backup.autoBackupPath);
      if (backup.customColors) localStorage.setItem('tutor_custom_colors', JSON.stringify(backup.customColors));
      if (backup.teacherProfile) localStorage.setItem('tutor_teacher_profile', JSON.stringify(backup.teacherProfile));

      window.location.reload();
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  };

  const resetToDefaults = () => {
    if (confirm('هل أنت متأكد أنك تريد حذف جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه')) {
      localStorage.removeItem('tutor_students_v3');
      localStorage.removeItem('tutor_sessions_v3');
      localStorage.removeItem('tutor_school_sessions');
      localStorage.removeItem('tutor_theme');
      localStorage.removeItem('tutor_schedule_zoom');
      localStorage.removeItem('tutor_sound_enabled');
      localStorage.removeItem('tutor_notifications_enabled');
      localStorage.removeItem('tutor_system_notifications_enabled');
      localStorage.removeItem('tutor_notification_offset_minutes');
      localStorage.removeItem('tutor_auto_backup_days');
      localStorage.removeItem('tutor_auto_backup_path');
      localStorage.removeItem('tutor_custom_colors');
      localStorage.removeItem('tutor_teacher_profile');
      localStorage.removeItem('app_initialized');
      window.location.reload();
    }
  };

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };

  const setScheduleZoom = (zoom: number) => {
    const clampedZoom = Math.max(0.1, Math.min(2, zoom));
    setScheduleZoomState(clampedZoom);
  };

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
  };

  const setNotificationsEnabled = (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
  };

  const setSystemNotificationsEnabled = (enabled: boolean) => {
    setSystemNotificationsEnabledState(enabled);
  };

  const setNotificationOffsetMinutes = (minutes: number) => {
    setNotificationOffsetMinutesState(Math.max(1, Math.min(60, minutes)));
  };

  const setAutoBackupDays = (days: number) => {
    setAutoBackupDaysState(Math.max(0, Math.min(365, days)));
  };

  const setAutoBackupPath = (path: string) => {
    setAutoBackupPathState(path);
  };

  const setCustomColors = (colors: Partial<CustomColors>) => {
    setCustomColorsState(prev => ({ ...prev, ...colors }));
  };

  const resetCustomColors = () => {
    setCustomColorsState(DEFAULT_COLORS);
  };

  const setTeacherProfile = (profile: Partial<SettingsContextType['teacherProfile']>) => {
    setTeacherProfileState(prev => ({ ...prev, ...profile }));
  };

  return (
    <SettingsContext.Provider value={{
      theme,
      setTheme,
      scheduleZoom,
      setScheduleZoom,
      soundEnabled,
      setSoundEnabled,
      notificationsEnabled,
      setNotificationsEnabled,
      systemNotificationsEnabled,
      setSystemNotificationsEnabled,
      notificationOffsetMinutes,
      setNotificationOffsetMinutes,
      autoBackupDays,
      setAutoBackupDays,
      autoBackupPath,
      setAutoBackupPath,
      customColors,
      setCustomColors,
      resetCustomColors,
      teacherProfile,
      setTeacherProfile,
      exportData,
      importData,
      resetToDefaults
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
