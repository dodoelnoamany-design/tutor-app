
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const tabsOrder = ['dashboard', 'students', 'appointments', 'school', 'finance', 'sessions', 'settings'] as const;
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // منطق السحب
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const dx = touchEndX.current - touchStartX.current;
      if (Math.abs(dx) > 60) {
        const currentIdx = tabsOrder.indexOf(activeTab);
        if (dx < 0 && currentIdx < tabsOrder.length - 1) {
          setActiveTab(tabsOrder[currentIdx + 1]);
        } else if (dx > 0 && currentIdx > 0) {
          setActiveTab(tabsOrder[currentIdx - 1]);
        }
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

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
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </main>
            <BottomNav activeTab={activeTab as any} setActiveTab={setActiveTab as any} />
          </div>
        </AppProvider>
      </SchoolProvider>
    </SettingsProvider>
  );
};

export default App;
