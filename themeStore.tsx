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
  customColors: CustomColors;
  setCustomColors: (colors: Partial<CustomColors>) => void;
  resetCustomColors: () => void;
  autoBackupDays: number;
  setAutoBackupDays: (days: number) => void;
  scheduleZoom: number;
  setScheduleZoom: (z: number) => void;
  teacherProfile: any;
  setTeacherProfile: (p: any) => void;
  exportData: () => Promise<void>;
  importData: (jsonData: string) => Promise<boolean>;
  resetToDefaults: () => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (v: boolean) => void;
  notificationMinutes: number;
  setNotificationMinutes: (m: number) => void;
  // أضف أي متغيرات أخرى تحتاجها هنا
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// ألوان افتراضية ذكية
const THEME_CONFIG = {
  dark: { bg: '#020617', text: '#f8fafc' },
  light: { bg: '#f8fafc', text: '#020617' }
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => 
    (localStorage.getItem('tutor_theme') as ThemeType) || 'dark'
  );

  const [customColors, setCustomColorsState] = useState<CustomColors>(() => {
    const saved = localStorage.getItem('tutor_custom_colors');
    return saved ? JSON.parse(saved) : {
      primary: '#3b82f6',
      secondary: '#1e40af',
      accent: '#f59e0b',
      background: THEME_CONFIG.dark.bg,
      text: THEME_CONFIG.dark.text,
    };
  });

  const [autoBackupDays, setAutoBackupDays] = useState(Number(localStorage.getItem('tutor_auto_backup_days') || 0));
  const [teacherProfile, setTeacherProfileState] = useState(JSON.parse(localStorage.getItem('tutor_teacher_profile') || '{}'));
  const [scheduleZoom, setScheduleZoomState] = useState<number>(() => Number(localStorage.getItem('tutor_schedule_zoom') || '1'));
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => localStorage.getItem('tutor_notifications_enabled') !== 'false');
  const [notificationMinutes, setNotificationMinutes] = useState<number>(() => Number(localStorage.getItem('tutor_notification_offset_minutes') || '30'));

  // التأثير السحري لتطبيق الألوان
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('light', 'dark');
    html.classList.add(theme);
    
    // تحديث الخلفية والنص بناءً على الثيم المختار
    const bgColor = customColors.background === THEME_CONFIG.dark.bg || customColors.background === THEME_CONFIG.light.bg 
                    ? THEME_CONFIG[theme].bg 
                    : customColors.background;

    const textColor = customColors.text === THEME_CONFIG.dark.text || customColors.text === THEME_CONFIG.light.text 
                      ? THEME_CONFIG[theme].text 
                      : customColors.text;

    html.style.setProperty('--color-primary', customColors.primary);
    html.style.setProperty('--color-secondary', customColors.secondary || customColors.primary);
    html.style.setProperty('--color-background', bgColor);
    html.style.setProperty('--color-text', textColor);
    html.style.setProperty('--color-accent', customColors.accent);

    localStorage.setItem('tutor_theme', theme);
    localStorage.setItem('tutor_custom_colors', JSON.stringify({...customColors, background: bgColor, text: textColor}));
  }, [theme, customColors]);

  useEffect(() => {
    localStorage.setItem('tutor_schedule_zoom', String(scheduleZoom));
  }, [scheduleZoom]);

  const setTheme = (newTheme: ThemeType) => setThemeState(newTheme);

  const setScheduleZoom = (z: number) => setScheduleZoomState(z);

  const setCustomColors = (colors: Partial<CustomColors>) => 
    setCustomColorsState(prev => ({ ...prev, ...colors }));

  const resetCustomColors = () => setCustomColorsState({
    primary: '#3b82f6',
    secondary: '#1e40af',
    accent: '#f59e0b',
    background: THEME_CONFIG[theme].bg,
    text: THEME_CONFIG[theme].text,
  });

  // دالة التصدير
  const exportData = async () => {
    try {
      const allData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) allData[key] = localStorage.getItem(key) || '';
      }

      const backupPayload = {
        appName: 'TutorMaster_Pro',
        version: '3.5',
        backupDate: new Date().toLocaleString('ar-EG'),
        timestamp: Date.now(),
        payload: allData
      };

      const fileName = `TutorMaster_Backup_${new Date().toISOString().split('T')[0]}.json`;
      const jsonStr = JSON.stringify(backupPayload, null, 2);

      const deviceInfo = await Device.getInfo();
      if (deviceInfo.platform === 'web') {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fileName; a.click();
        URL.revokeObjectURL(url);
      } else {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: jsonStr,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });

        await Share.share({
          title: 'نسخة احتياطية كاملة - TutorMaster',
          text: `نسخة احتياطية بتاريخ ${backupPayload.backupDate}`,
          url: result.uri,
          dialogTitle: 'ارسل النسخة لنفسك (واتساب أو إيميل)'
        });
      }
      console.log('Backup Exported Successfully ✅');
    } catch (error) {
      console.error('Backup Error:', error);
      alert('حدث خطأ أثناء تصدير البيانات');
    }
  };

  const importData = async (jsonData: string): Promise<boolean> => {
    try {
      const backup = JSON.parse(jsonData);

      if (backup.appName !== 'TutorMaster_Pro' || !backup.payload) {
        alert('عذراً، هذا الملف غير متوافق مع نظام TutorMaster ❌');
        return false;
      }

      const confirmImport = window.confirm(
        `تنبيه: أنت على وشك استعادة نسخة بتاريخ ${backup.backupDate}.
سيتم حذف جميع البيانات الحالية واستبدالها بالنسخة. هل أنت متأكد؟`
      );

      if (confirmImport) {
        localStorage.clear();
        Object.entries(backup.payload).forEach(([key, value]) => {
          localStorage.setItem(key, value as string);
        });

        alert('تمت استعادة كافة البيانات (الطلاب، الحصص، الإعدادات) بنجاح ✅');
        window.location.reload();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Import Error:', error);
      alert('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية ❌');
      return false;
    }
  };

  useEffect(() => {
    localStorage.setItem('tutor_notifications_enabled', notificationsEnabled ? 'true' : 'false');
  }, [notificationsEnabled]);

  useEffect(() => {
    localStorage.setItem('tutor_notification_offset_minutes', String(notificationMinutes));
  }, [notificationMinutes]);

  // Persist teacher profile to localStorage so it survives app reloads
  useEffect(() => {
    try {
      localStorage.setItem('tutor_teacher_profile', JSON.stringify(teacherProfile || {}));
    } catch (e) {
      console.error('Failed to save teacher profile to localStorage', e);
    }
  }, [teacherProfile]);

  return (
    <SettingsContext.Provider value={{
      theme, setTheme, customColors, setCustomColors, resetCustomColors,
      autoBackupDays, setAutoBackupDays, teacherProfile,
      scheduleZoom, setScheduleZoom,
      setTeacherProfile: (p) => setTeacherProfileState({...teacherProfile, ...p}),
      exportData, importData, resetToDefaults: () => { localStorage.clear(); window.location.reload(); },
      notificationsEnabled, setNotificationsEnabled: (v: boolean) => setNotificationsEnabled(v),
      notificationMinutes, setNotificationMinutes: (m: number) => setNotificationMinutes(m)
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