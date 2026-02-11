
import React from 'react';
import { useApp } from '../store';
import { SessionStatus } from '../types';

const DailySummaryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { getStats, getDailyIncome, updateSessionStatus } = useApp();
  const formatLocalDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const today = formatLocalDate(new Date());
  const stats = getStats();
  const todayIncome = getDailyIncome(today);
  
  // الحصص التي تحتاج إلى حسم (بانتظار الحضور أو مؤجلة حالياً)
  const pendingCount = stats.todaySessions.filter(s => 
    s.status === SessionStatus.PENDING || 
    s.status === SessionStatus.POSTPONED
  ).length;

  const handleQuickCompleteAll = () => {
    stats.todaySessions.forEach(s => {
      if (s.status === SessionStatus.PENDING || s.status === SessionStatus.POSTPONED) {
        updateSessionStatus(s.id, SessionStatus.COMPLETED);
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl page-transition">
      <div className="glass-3d w-full max-w-sm rounded-[3rem] p-10 text-center shadow-[0_0_100px_rgba(16,185,129,0.15)] border border-white/10 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px]"></div>

        <div className="relative w-28 h-28 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-900/40 rotate-6 border-4 border-white/10 group">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-white group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h3 className="text-3xl font-black text-white mb-2 leading-none tracking-tight">إغلاق الصندوق اليومي</h3>
        <p className="text-slate-500 text-[10px] font-black mb-10 tracking-widest uppercase">ملخص الإنجاز المالي والعملي</p>
        
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="glass-3d bg-blue-600/10 p-5 rounded-3xl border border-blue-600/20 shadow-inner">
            <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-2">صافي الربح</p>
            <p className="text-2xl font-black text-white leading-none tracking-tighter text-glow">{todayIncome} ج.م</p>
          </div>
          <div className="glass-3d bg-emerald-600/10 p-5 rounded-3xl border border-emerald-600/20 shadow-inner">
            <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mb-2">مكتملة</p>
            <p className="text-2xl font-black text-white leading-none tracking-tighter">
              {stats.todaySessions.filter(s => s.status === SessionStatus.COMPLETED).length}
            </p>
          </div>
          <div className="glass-3d bg-rose-600/10 p-5 rounded-3xl border border-rose-600/20 shadow-inner">
            <p className="text-[9px] text-rose-500 font-black uppercase tracking-widest mb-2">ملغية</p>
            <p className="text-2xl font-black text-white leading-none tracking-tighter">
              {stats.todaySessions.filter(s => s.status === SessionStatus.CANCELLED).length}
            </p>
          </div>
          <div className="glass-3d bg-amber-600/10 p-5 rounded-3xl border border-amber-600/20 shadow-inner">
            <p className="text-[9px] text-amber-500 font-black uppercase tracking-widest mb-2">تعويضية</p>
            <p className="text-2xl font-black text-white leading-none tracking-tighter">
              {stats.todaySessions.filter(s => s.status === SessionStatus.RESCHEDULED).length}
            </p>
          </div>
        </div>

        {pendingCount > 0 ? (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-10">
            <p className="text-amber-500 text-[10px] font-black uppercase tracking-tighter flex items-center justify-center gap-2">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              تنبيه: {pendingCount} حصص معلقة تحتاج حالة
            </p>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-10">
            <p className="text-emerald-500 text-[10px] font-black uppercase tracking-tighter">كل البيانات مؤكدة ومرتبة لهذا اليوم ✨</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {pendingCount > 0 && (
            <button 
              onClick={handleQuickCompleteAll}
              className="group relative w-full bg-white text-black py-5 rounded-[1.8rem] font-black shadow-2xl shadow-white/10 hover:scale-[1.02] transition-all active:scale-95 text-lg tracking-tight overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              اعتبار الكل "تم بنجاح" 🏁
            </button>
          )}
          <button 
            onClick={onClose}
            className="w-full bg-slate-900 text-slate-500 py-4 rounded-[1.8rem] font-black transition-all hover:text-white border border-white/5"
          >
            إغلاق التقرير
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailySummaryModal;
