
import React from 'react';

interface BottomNavProps {
  activeTab: 'dashboard' | 'students' | 'sessions' | 'appointments' | 'finance' | 'school' | 'settings';
  setActiveTab: (tab: any) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'الرئيسية', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'students', label: 'الطلاب', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
    { id: 'appointments', label: 'المواعيد', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'school', label: 'جدول المدرسة', icon: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z' },
    { id: 'finance', label: 'الحسابات', icon: 'M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 12c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z' },
    { id: 'sessions', label: 'الحصص', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { id: 'settings', label: 'الإعدادات', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M12 15a3 3 0 100-6 3 3 0 000 6z' }
  ];

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 z-[100] px-2 sm:px-4 pointer-events-none flex justify-center">
      <nav className="nav-glass max-w-lg w-full min-w-[320px] h-[76px] sm:h-[76px] rounded-[2.5rem] flex items-center px-2 border border-white/10 pointer-events-auto overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative inline-flex flex-col items-center justify-center p-2 sm:p-3 transition-all duration-300 flex-shrink-0 min-w-[56px] max-w-[110px] ${isActive ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
              aria-label={tab.label}
            >
              {isActive && (
                <div className="absolute -top-1 w-1.5 h-1.5 bg-blue-500 rounded-full active-dot"></div>
              )}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300 ${isActive ? 'scale-125 -translate-y-0.5' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={isActive ? "2.5" : "2"}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
              </svg>
              <span className={`text-xs sm:text-[11px] font-black mt-1 transition-all block truncate max-w-[72px] whitespace-nowrap ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
