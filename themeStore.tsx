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
  teacherProfile: any;
  setTeacherProfile: (p: any) => void;
  exportData: () => Promise<void>;
  importData: (jsonData: string) => boolean;
  resetToDefaults: () => void;
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

    html.style.setProperty('--primary', customColors.primary);
    html.style.setProperty('--background', bgColor);
    html.style.setProperty('--text', textColor);
    html.style.setProperty('--accent', customColors.accent);

    localStorage.setItem('tutor_theme', theme);
    localStorage.setItem('tutor_custom_colors', JSON.stringify({...customColors, background: bgColor, text: textColor}));
  }, [theme, customColors]);

  const setTheme = (newTheme: ThemeType) => setThemeState(newTheme);

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
    const allData: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) allData[key] = localStorage.getItem(key) || '';
    }
    const backup = { version: '3.0', timestamp: Date.now(), data: allData };
    const jsonStr = JSON.stringify(backup, null, 2);
    const fileName = `TutorMaster_Backup.json`;

    const deviceInfo = await Device.getInfo();
    if (deviceInfo.platform === 'web') {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.click();
    } else {
      const result = await Filesystem.writeFile({
        path: fileName, data: jsonStr, directory: Directory.Documents, encoding: Encoding.UTF8
      });
      await Share.share({ title: 'نسخة احتياطية', url: result.uri });
    }
  };

  const importData = (jsonData: string) => {
    try {
      const backup = JSON.parse(jsonData);
      if (backup.data) {
        Object.entries(backup.data).forEach(([k, v]) => localStorage.setItem(k, v as string));
        window.location.reload();
        return true;
      }
      return false;
    } catch { return false; }
  };

  return (
    <SettingsContext.Provider value={{
      theme, setTheme, customColors, setCustomColors, resetCustomColors,
      autoBackupDays, setAutoBackupDays, teacherProfile, 
      setTeacherProfile: (p) => setTeacherProfileState({...teacherProfile, ...p}),
      exportData, importData, resetToDefaults: () => { localStorage.clear(); window.location.reload(); }
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