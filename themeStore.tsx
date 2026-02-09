import React, { createContext, useContext, useState, useEffect } from 'react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Device } from '@capacitor/device';

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
  exportData: () => Promise<void>;
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
    return saved || 'TutorMaster/Backups';
  });

  const [customColors, setCustomColorsState] = useState<CustomColors>(() => {
    const saved = localStorage.getItem('tutor_custom_colors');
    return saved ? JSON.parse(saved) : DEFAULT_COLORS;
  });

  const [teacherProfile, setTeacherProfileState] = useState<SettingsContextType['teacherProfile']>(() => {
    const saved = localStorage.getItem('tutor_teacher_profile');
    return saved ? JSON.parse(saved) : { name: '', email: '', phone: '', bio: '', specialization: '', avatar: '' };
  });

  // تطبيق المظهر (Dark/Light) والألوان المخصصة
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('light', 'dark');
    html.classList.add(theme);
    localStorage.setItem('tutor_theme', theme);

    // تطبيق ألوان CSS Variables لتعمل مع التصميم
    html.style.setProperty('--primary', customColors.primary);
    html.style.setProperty('--secondary', customColors.secondary);
    html.style.setProperty('--accent', customColors.accent);
    html.style.setProperty('--background', customColors.background);
    html.style.setProperty('--text', customColors.text);
    html.style.setProperty('--color-primary', customColors.primary); // دعم الأسماء القديمة
    
    localStorage.setItem('tutor_custom_colors', JSON.stringify(customColors));
  }, [theme, customColors]);

  // حفظ الإعدادات البسيطة عند تغييرها
  useEffect(() => localStorage.setItem('tutor_schedule_zoom', scheduleZoom.toString()), [scheduleZoom]);
  useEffect(() => localStorage.setItem('tutor_sound_enabled', JSON.stringify(soundEnabled)), [soundEnabled]);
  useEffect(() => localStorage.setItem('tutor_notifications_enabled', JSON.stringify(notificationsEnabled)), [notificationsEnabled]);
  useEffect(() => localStorage.setItem('tutor_system_notifications_enabled', JSON.stringify(systemNotificationsEnabled)), [systemNotificationsEnabled]);
  useEffect(() => localStorage.setItem('tutor_teacher_profile', JSON.stringify(teacherProfile)), [teacherProfile]);

  // --- دالة النسخ الاحتياطي الكبرى ---
  const exportData = async () => {
    // جمع كل البيانات من المتصفح
    const allData: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) allData[key] = localStorage.getItem(key) || '';
    }

    const backup = {
      version: '3.0',
      timestamp: new Date().getTime(),
      dateString: new Date().toLocaleString('ar-EG'),
      data: allData
    };

    const fileName = `TutorMaster_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    const jsonStr = JSON.stringify(backup, null, 2);
    const deviceInfo = await Device.getInfo();

    if (deviceInfo.platform === 'web') {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      try {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: jsonStr,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
        await Share.share({
          title: 'نسخة TutorMaster الاحتياطية',
          url: result.uri,
          dialogTitle: 'حفظ النسخة في مكان آمن'
        });
      } catch (e) {
        alert('فشل حفظ الملف، تأكد من منح صلاحية الوصول للملفات');
      }
    }
  };

  // --- دالة الاستعادة الكبرى ---
  const importData = (jsonData: string): boolean => {
    try {
      const backup = JSON.parse(jsonData);
      // إذا كانت النسخة شاملة (v3)
      if (backup.data) {
        localStorage.clear(); // نمسح الحالي لضمان نظافة البيانات
        Object.entries(backup.data).forEach(([key, value]) => {
          localStorage.setItem(key, value as string);
        });
      } else {
        // دعم النسخ القديمة جداً
        if (backup.students) localStorage.setItem('tutor_students_v3', JSON.stringify(backup.students));
        if (backup.sessions) localStorage.setItem('tutor_sessions_v3', JSON.stringify(backup.sessions));
        if (backup.schoolSessions) localStorage.setItem('tutor_school_sessions', JSON.stringify(backup.schoolSessions));
      }
      
      alert('تمت استعادة كل البيانات بنجاح! سيتم الآن إعادة تحميل التطبيق.');
      window.location.reload();
      return true;
    } catch (e) {
      alert('خطأ: الملف الذي اخترته غير صحيح أو تالف.');
      return false;
    }
  };

  const resetToDefaults = () => {
    if (window.confirm('🚨 تحذير: سيتم حذف كل الطلاب والحصص والحسابات. هل أنت متأكد؟')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // دوال التعديل (Setters)
  const setTheme = (newTheme: ThemeType) => setThemeState(newTheme);
  const setScheduleZoom = (zoom: number) => setScheduleZoomState(Math.max(0.1, Math.min(2, zoom)));
  const setSoundEnabled = (enabled: boolean) => setSoundEnabledState(enabled);
  const setNotificationsEnabled = (enabled: boolean) => setNotificationsEnabledState(enabled);
  const setSystemNotificationsEnabled = (enabled: boolean) => setSystemNotificationsEnabledState(enabled);
  const setNotificationOffsetMinutes = (m: number) => setNotificationOffsetMinutesState(m);
  const setAutoBackupDays = (d: number) => setAutoBackupDaysState(d);
  const setAutoBackupPath = (p: string) => setAutoBackupPathState(p);
  const setCustomColors = (colors: Partial<CustomColors>) => setCustomColorsState(prev => ({ ...prev, ...colors }));
  const resetCustomColors = () => setCustomColorsState(DEFAULT_COLORS);
  const setTeacherProfile = (p: Partial<SettingsContextType['teacherProfile']>) => setTeacherProfileState(prev => ({ ...prev, ...p }));

  return (
    <SettingsContext.Provider value={{
      theme, setTheme, scheduleZoom, setScheduleZoom, soundEnabled, setSoundEnabled,
      notificationsEnabled, setNotificationsEnabled, systemNotificationsEnabled, setSystemNotificationsEnabled,
      notificationOffsetMinutes, setNotificationOffsetMinutes, autoBackupDays, setAutoBackupDays,
      autoBackupPath, setAutoBackupPath, customColors, setCustomColors, resetCustomColors,
      teacherProfile, setTeacherProfile, exportData, importData, resetToDefaults
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