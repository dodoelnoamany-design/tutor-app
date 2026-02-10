
import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../store';
import { SessionStatus, Session } from '../types';

type FilterType = 'today' | 'tomorrow' | 'week' | 'month' | 'custom';

const SessionList: React.FC = () => {
  const { sessions, updateSessionStatus, getStudentById, getDailySessions } = useApp();
  const formatLocalDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(() => formatLocalDate(new Date()));
  const [viewMode, setViewMode] = useState<'daily' | 'postponed'>('daily');
  const [filterType, setFilterType] = useState<FilterType>('today');
  const [showReschedule, setShowReschedule] = useState<string | null>(null);
  const [newReschedDate, setNewReschedDate] = useState('');
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Use device-local date boundary: "today" starts at 00:00 local time
  const _today = new Date();
  _today.setHours(0, 0, 0, 0);
  const todayStr = formatLocalDate(_today);
  const tomorrowStr = formatLocalDate(new Date(_today.getTime() + 86400000));

  // منطق تصفية الحصص بناءً على الفلتر المختار
  const filteredSessions = useMemo(() => {
    if (viewMode === 'postponed') {
      return sessions.filter(s => s.status === SessionStatus.POSTPONED);
    }

    if (filterType === 'today') return getDailySessions(todayStr);
    if (filterType === 'tomorrow') return getDailySessions(tomorrowStr);
    if (filterType === 'custom') return getDailySessions(selectedDate);

    const now = new Date();
    if (filterType === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return sessions.filter(s => {
        const d = new Date(s.dateTime);
        return d >= startOfWeek && d <= endOfWeek;
      });
    }

    if (filterType === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      return sessions.filter(s => {
        const d = new Date(s.dateTime);
        return d >= startOfMonth && d <= endOfMonth;
      });
    }

    return [];
  }, [sessions, filterType, selectedDate, viewMode, todayStr, tomorrowStr, getDailySessions]);

  const handleReschedule = () => {
    if (showReschedule && newReschedDate) {
      updateSessionStatus(showReschedule, SessionStatus.POSTPONED, newReschedDate);
      setShowReschedule(null);
      setNewReschedDate('');
    }
  };

  const isActionable = (status: SessionStatus) => {
    return status === SessionStatus.PENDING || 
           status === SessionStatus.POSTPONED || 
           status === SessionStatus.RESCHEDULED;
  };

  const filters: { id: FilterType, label: string }[] = [
    { id: 'today', label: 'اليوم' },
    { id: 'tomorrow', label: 'غداً' },
    { id: 'week', label: 'هذا الأسبوع' },
    { id: 'month', label: 'هذا الشهر' },
  ];

  const headerText = (() => {
    try {
      if (filterType === 'today') return `عرض حصص يوم ${weekdayAndDateLabel(todayStr)}`;
      if (filterType === 'tomorrow') return `عرض حصص يوم ${weekdayAndDateLabel(tomorrowStr)}`;
      if (filterType === 'custom') return `عرض حصص يوم ${weekdayAndDateLabel(selectedDate)}`;

      const now = new Date();
      if (filterType === 'week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        const s = startOfWeek.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
        const e = endOfWeek.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
        return `عرض حصص هذا الأسبوع الموافق ${s} إلى ${e}`;
      }

      if (filterType === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const pretty = startOfMonth.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
        return `عرض حصص الشهر الحالي الموافق ${pretty}`;
      }

      return '';
    } catch (e) {
      return '';
    }
  })();

  return (
    <div className="space-y-6 page-transition pb-24">
      {/* Header & Smart Filters */}
      <div className="px-2 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white">سجل المواعيد</h2>
          <button 
            onClick={() => setViewMode(viewMode === 'daily' ? 'postponed' : 'daily')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              viewMode === 'postponed' 
                ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-900/20' 
                : 'bg-slate-900 text-slate-400 border-white/5 hover:border-white/20'
            }`}
          >
            {viewMode === 'postponed' ? 'العودة للمجدول' : 'الحصص المؤجلة ⏳'}
          </button>
        </div>

        {viewMode === 'daily' && (
          <div className="space-y-4">
            {/* Quick Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {filters.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-[11px] font-black transition-all border ${
                    filterType === f.id 
                      ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/20' 
                      : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <div className="relative flex-shrink-0">
                <input 
                  type="date" 
                  ref={dateInputRef}
                  className="absolute opacity-0 pointer-events-none" 
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setFilterType('custom');
                  }}
                />
                <button 
                  onClick={() => dateInputRef.current?.showPicker()}
                  className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 border transition-all ${
                    filterType === 'custom'
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg'
                      : 'bg-slate-900 border-white/5 text-slate-500'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="text-[11px] font-black">{filterType === 'custom' ? selectedDate : 'تاريخ مخصص'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 px-2">
               <span className="h-px bg-slate-800 flex-1"></span>
               <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">
                 {headerText}
               </p>
               <span className="h-px bg-slate-800 flex-1"></span>
            </div>
          </div>
        )}
      </div>

      {/* Sessions Display */}
      <div className="space-y-4 px-2">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-20 glass-3d rounded-[2.5rem] border-dashed border-slate-800">
            <div className="w-16 h-16 bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
               <svg className="h-8 w-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-slate-500 font-bold">لا توجد حصص {viewMode === 'postponed' ? 'مؤجلة' : 'في هذا النطاق'}</p>
          </div>
        ) : (
          filteredSessions.map((session, idx) => renderSessionCard(session, viewMode === 'postponed' || filterType === 'week' || filterType === 'month', idx))
        )}
      </div>

      {showReschedule && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
          <div className="glass-3d w-full max-w-sm rounded-[3rem] p-10 border border-white/10 shadow-3xl text-center">
            <h3 className="text-2xl font-black text-white mb-6">إعادة الجدولة</h3>
            <div className="space-y-4">
              <input 
                type="datetime-local" 
                className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-sm outline-none"
                value={newReschedDate}
                onChange={e => setNewReschedDate(e.target.value)}
              />
              <button 
                onClick={handleReschedule} 
                className="w-full bg-blue-600 text-white py-5 rounded-[1.8rem] font-black text-lg"
              >
                تأكيد الموعد البديل 🔁
              </button>
              <button onClick={() => setShowReschedule(null)} className="w-full text-slate-500 py-2 font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderSessionCard(session: Session, showDate = false, index: number) {
    const student = getStudentById(session.studentId);
    const dateObj = new Date(session.dateTime);
    
    return (
      <div 
        key={session.id} 
        className={`glass-3d p-6 rounded-[2.5rem] border-white/5 relative overflow-hidden transition-all group hover:border-blue-500/20 ${
          session.status === SessionStatus.CANCELLED ? 'opacity-40 grayscale' : ''
        }`}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner transition-transform group-hover:scale-105 ${
               session.status === SessionStatus.COMPLETED ? 'bg-emerald-500/10 text-emerald-500' :
               session.status === SessionStatus.CANCELLED ? 'bg-rose-500/10 text-rose-500' :
               'bg-blue-500/10 text-blue-400'
            }`}>
              {student?.name?.charAt(0) || '؟'}
            </div>
            <div>
              <h4 className="font-black text-white text-base leading-none mb-2">{student?.name || 'طالب مجهول'}</h4>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <svg className="h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4l3 3" /></svg>
                  <p className="text-[10px] text-slate-500 font-bold">
                    {showDate ? 
                      `${dateObj.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' })} • ${dateObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}` :
                      dateObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
                    }
                  </p>
                </div>
                {student?.level && <p className="text-[9px] text-blue-500/60 font-black uppercase tracking-widest">{student.level}</p>}
              </div>
            </div>
          </div>
          <div className="text-left">
            <p className="font-black text-white text-lg tracking-tighter leading-none">{session.price} <span className="text-[10px] text-blue-400">ج.م</span></p>
          </div>
        </div>
        {session.note && (
          <div className="mt-4">
            <p className="text-[12px] text-slate-400 font-bold">{session.note}</p>
          </div>
        )}

        {isActionable(session.status) && (
          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={() => updateSessionStatus(session.id, SessionStatus.COMPLETED)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-2xl text-[10px] font-black shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
            >
              تـمـت
            </button>
            <button 
              onClick={() => setShowReschedule(session.id)}
              className="bg-amber-500 hover:bg-amber-400 text-black py-3.5 rounded-2xl text-[10px] font-black shadow-lg shadow-amber-900/20 active:scale-95 transition-all"
            >
              تـأجـيـل
            </button>
            <button 
              onClick={() => updateSessionStatus(session.id, SessionStatus.CANCELLED)}
              className="bg-rose-600 hover:bg-rose-500 text-white py-3.5 rounded-2xl text-[10px] font-black shadow-lg shadow-rose-900/20 active:scale-95 transition-all"
            >
              إلـغـاء
            </button>
          </div>
        )}
        
        {session.status === SessionStatus.POSTPONED && (
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
             <div className="px-3 py-1 bg-amber-500/10 rounded-lg border border-amber-500/10">
               <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">مؤجلة بانتظار موعد بديل</span>
             </div>
             {session.originalSessionId && (
               <span className="text-[8px] text-slate-600 font-bold">تعويض عن موعد سابق</span>
             )}
          </div>
        )}
      </div>
    );
  }
};

function weekdayAndDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const weekday = d.toLocaleDateString('ar-EG', { weekday: 'long' });
  const fullDate = d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${weekday} الموافق ${fullDate}`;
}

function getHeaderText(this: any) {
  return '';
}


export default SessionList;
