import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../store';
import { useSettings } from '../themeStore';

const Header: React.FC = () => {
  const { notifications, removeNotification } = useApp();
  const { notificationsEnabled, teacherProfile } = useSettings();
  const [showNotifications, setShowNotifications] = useState(false);
  const [bellPosition, setBellPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const bellRef = useRef<HTMLDivElement>(null);

  // Load bell position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('bell_position');
    if (savedPosition) {
      setBellPosition(JSON.parse(savedPosition));
    }
  }, []);

  // Save bell position to localStorage
  const saveBellPosition = (position: { x: number; y: number }) => {
    localStorage.setItem('bell_position', JSON.stringify(position));
  };

  // Handle drag start
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - bellPosition.x, y: clientY - bellPosition.y });
  };

  // Handle drag move
  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;
    
    // Constrain to viewport
    const constrainedX = Math.max(0, Math.min(window.innerWidth - 48, newX));
    const constrainedY = Math.max(0, Math.min(window.innerHeight - 48, newY));
    
    setBellPosition({ x: constrainedX, y: constrainedY });
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    saveBellPosition(bellPosition);
  };

  // Add global event listeners for drag
  useEffect(() => {
    const handleGlobalMove = (e: TouchEvent | MouseEvent) => {
      if (isDragging) {
        handleDragMove(e as any);
      }
    };

    const handleGlobalEnd = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMove);
      document.addEventListener('touchmove', handleGlobalMove, { passive: false });
      document.addEventListener('mouseup', handleGlobalEnd);
      document.addEventListener('touchend', handleGlobalEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMove);
      document.removeEventListener('touchmove', handleGlobalMove);
      document.removeEventListener('mouseup', handleGlobalEnd);
      document.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [isDragging, dragStart, bellPosition]);

  return (
    <header className="sticky top-0 z-[60] px-4 py-4 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {teacherProfile && (teacherProfile.name || teacherProfile.image) ? (
            <>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl blur-md opacity-40 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative w-12 h-12 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center rotate-[-4deg] group-hover:rotate-0 transition-transform shadow-2xl">
                  {teacherProfile.image ? (
                    <img 
                      src={teacherProfile.image} 
                      alt={teacherProfile.name}
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    <span className="text-blue-500 font-black text-lg drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">
                      {teacherProfile.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-black text-white leading-tight tracking-tight">
                  أهلاً بك {teacherProfile.name}
                </h1>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">الوضع الذكي نشط</p>
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl blur-md opacity-40 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative w-12 h-12 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center rotate-[-4deg] group-hover:rotate-0 transition-transform shadow-2xl">
                  <span className="text-blue-500 font-black text-lg drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">T.M</span>
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-black text-white leading-tight tracking-tight">مدير الدروس</h1>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">الوضع الذكي نشط</p>
                </span>
              </div>
            </>
          )}
        </div>
        
        {/* Draggable Notification Bell */}
        <div 
          ref={bellRef}
          className="fixed z-[100] cursor-move select-none"
          style={{ 
            left: bellPosition.x, 
            top: bellPosition.y,
            touchAction: 'none'
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`w-12 h-12 rounded-2xl glass-3d flex items-center justify-center text-slate-400 hover:text-white transition-all hover:border-blue-500/30 relative hover:scale-105 transform duration-200 ${isDragging ? 'scale-110' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {notificationsEnabled && notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute -right-2 top-14 w-72 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 glass-3d">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-sm font-bold">
                  لا توجد إشعارات جديدة
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-4 border-b border-white/5 hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-black text-white text-sm">{notif.title}</p>
                          <p className="text-[11px] text-slate-400 mt-1">{notif.message}</p>
                          <p className="text-[9px] text-slate-500 mt-2">
                            {new Date(notif.timestamp).toLocaleTimeString('ar-EG')}
                          </p>
                        </div>
                        <button
                          onClick={() => removeNotification(notif.id)}
                          className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;