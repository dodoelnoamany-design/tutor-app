
import React, { useState, useEffect } from 'react';
import { AppProvider } from './store';
import { SettingsProvider } from './themeStore';
import { SchoolProvider } from './schoolStore';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import SessionList from './components/SessionList';
import AppointmentsSchedule from './components/AppointmentsSchedule';
import SchoolSchedule from './components/SchoolSchedule';
import FinanceReport from './components/FinanceReport';
import Settings from './components/Settings';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import { Filesystem } from '@capacitor/filesystem';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'sessions' | 'appointments' | 'school' | 'finance' | 'settings'>('dashboard');

  // Request file system permissions on app start
  useEffect(() => {
    const requestFilePermissions = async () => {
      try {
        const permissions = await Filesystem.requestPermissions();
        if (permissions.publicStorage !== 'granted') {
          console.log('File permissions not granted - backup feature may not work properly');
        }
      } catch (error) {
        console.log('Error requesting file permissions:', error);
      }
    };

    // Load custom colors on app start
    const loadCustomColors = () => {
      const savedColors = localStorage.getItem('tutor_custom_colors');
      if (savedColors) {
        const colors = JSON.parse(savedColors);
        const root = document.documentElement;
        root.style.setProperty('--color-primary', colors.primary);
        root.style.setProperty('--color-secondary', colors.secondary);
        root.style.setProperty('--color-accent', colors.accent);
        root.style.setProperty('--color-background', colors.background);
        root.style.setProperty('--color-text', colors.text);
        console.log('Loaded custom colors on app start:', colors);
      }
    };

    requestFilePermissions();
    loadCustomColors();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={setActiveTab} />;
      case 'students': return <StudentList />;
      case 'sessions': return <SessionList />;
      case 'appointments': return <AppointmentsSchedule />;
      case 'school': return <SchoolSchedule />;
      case 'finance': return <FinanceReport />;
      case 'settings': return <Settings />;
      default: return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <SettingsProvider>
      <SchoolProvider>
        <AppProvider>
          <div className="min-h-screen pb-24 bg-[var(--color-background)] dark:bg-[var(--color-background)] light:bg-white">
            <Header />
            <main className="max-w-md mx-auto px-4 pt-4">
              {renderContent()}
            </main>
            <BottomNav activeTab={activeTab as any} setActiveTab={setActiveTab as any} />
          </div>
        </AppProvider>
      </SchoolProvider>
    </SettingsProvider>
  );
};

export default App;
