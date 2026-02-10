
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../store';
import { SessionStatus } from '../types';
import DailySummaryModal from './DailySummaryModal';

const Dashboard: React.FC<{ onNavigate: (tab: any) => void }> = ({ onNavigate }) => {
  const { getStats, getDailyIncome, getStudentById, notifications, clearNotifications, sessions } = useApp();
  const stats = getStats();
  const [showSummary, setShowSummary] = useState(false);
  const [showPostponedModal, setShowPostponedModal] = useState(false);
  const [showCancelledModal, setShowCancelledModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // العبارات التحفيزية الشاملة للمعلمين (30 عبارة لضمان التنوع اليومي)
  const motivationalQuotes = useMemo(() => [
    "أنت لا تدرس مادة علمية، أنت تبني إنساناً. ✨",
    "كلمتك اليوم قد تكون هي الوقود الذي يحرك طالباً طوال حياته. 🚀",
    "تذكر: \"من علّم علماً فله أجر من عمل به\". 💎",
    "أنت النور الذي يبدد عتمة الجهل في عقولهم. 🕯️",
    "الفصل ليس أربع جدران، بل هو معمل لصناعة القادة. 🧠",
    "الابتسامة التي تبدأ بها حصتك قد تكون أجمل ما يراه طالبك طوال يومه. 😊",
    "أنت تزرع بذوراً قد لا ترى ثمارها اليوم، لكنها ستزهر غداً يقيناً. 🌱",
    "التعليم هو المهنة التي تجعل كل المهن الأخرى ممكنة. 🏆",
    "كن أنت المعلم الذي كنت تتمنى أن تدرس عنده وأنت صغير. 👤",
    "بصمتك في نفوس طلابك لا يمحوها الزمن. 👣",
    "ابدأ يومك بشغف، فالشغف مُعدٍ وينتقل لطلابك تلقائياً. 🔥",
    "كل حصة هي فرصة جديدة لترك أثر لا يُنسى. 🌟",
    "لا تنظر لعدد الطلاب، بل انظر لحجم الطموح الذي ينتظر إشارتك. 🎯",
    "طاقتك الإيجابية هي مفتاح انضباط فصلك. 🔑",
    "اليوم هو صفحة بيضاء، اكتب فيها قصة نجاح ملهمة مع طلابك. 📝",
    "تذكر أن الصبر على التعلم هو أول خطوات التميز. ⏳",
    "كن \"ميسراً\" للنجاح، وليس مجرد \"ناقلاً\" للمعلومة. 🤝",
    "استعن بالله، فمهمتك سامية وتستحق كل مجهودك. 🤲",
    "عقولهم أمانة بين يديك، فاجعلها أمانة مزدهرة. 🌻",
    "لا يوجد طالب فاشل، بل يوجد معلم لم يجد المفتاح بعد.. وأنت تمتلك المفاتيح! 🗝️",
    "جدد نيتك كل صباح؛ فأنت في عبادة وفي مهمة تغيير عالم. 🌍",
    "اجعل من درسك مغامرة يستمتع بها الطلاب قبل أن يتعلموها. 🎢",
    "تميزك في شرحك هو احترام لذاتك ومهنتك. 🎖️",
    "صوتك القوي ووقفتك الواثقة هما نصف المحتوى التعليمي. 📣",
    "لا تكتفِ بالمعلومة، علّمهم كيف يفكرون وكيف يتساءلون. ❓",
    "كن قدوة في أخلاقك قبل علمك، فالعيون تراك قبل أن تسمعك الأذان. 👀",
    "اليوم ستصنع ذكريات لطلابك سيتحدثون عنها بعد عشرين عاماً. 💭",
    "كل تحدٍ يواجهك في الفصل هو تمرين لزيادة حكمتك ومهارتك. 💪",
    "العالم ينتظر ما ستقدمه اليوم من خلال عقول تلاميذك. 🌐",
    "أنت فخر هذه الأمة.. انطلق بكل ثقة! 👑"
  ], []);

  // اختيار عبارة بناءً على اليوم لضمان التغيير التلقائي
  const dailyQuote = useMemo(() => {
    const todayDate = new Date();
    const index = (todayDate.getDate() + todayDate.getMonth() * 31) % motivationalQuotes.length;
    return motivationalQuotes[index];
  }, [motivationalQuotes]);

  // حساب نسبة الإنجاز اليومي (عداد الإنجاز الذكي بدلاً من الأرباح)
  const totalToday = stats.todaySessions.length;
  const completedToday = stats.todaySessions.filter(s => 
    s.status === SessionStatus.COMPLETED || s.status === SessionStatus.RESCHEDULED
  ).length;
  const progressPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  // Refresh stats when sessions change
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [sessions]);

  return (
    <div className="space-y-8 page-transition pb-20">
      {/* 3D Progress Card with Daily Inspiration */}
      <div className="relative group">
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative bg-[#0f172a] rounded-[2.5rem] p-8 overflow-hidden border border-white/10 shadow-3xl" key={refreshKey}>
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px]"></div>
          
          <div className="mb-8 relative z-10">
            <h2 className="text-xl font-black text-white leading-relaxed tracking-tight mb-2 min-h-[4rem]">
              {dailyQuote}
            </h2>
            <div className="flex items-center gap-2">
               <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                 <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">
                   خطة اليوم: {totalToday} حصص مجدولة
                 </p>
               </div>
            </div>
          </div>
          
          <div className="flex items-end justify-between relative z-10">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-white text-glow tracking-tighter leading-none">
                  %{progressPercent}
                </span>
                <span className="text-xl font-bold text-emerald-400">إنجاز</span>
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">
                تم إنهاء {completedToday} من أصل {totalToday} حصص
              </p>
            </div>
            
            <button 
              onClick={() => setShowSummary(true)}
              className="group relative flex items-center justify-center p-5 bg-emerald-600 hover:bg-emerald-500 rounded-3xl transition-all shadow-[0_15px_30px_rgba(16,185,129,0.3)] active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-900 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {showPostponedModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
          <div className="glass-3d w-full max-w-lg rounded-[2rem] p-6 border border-white/10 shadow-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-white">تفاصيل الحصص المؤجلة</h3>
              <button onClick={() => setShowPostponedModal(false)} className="text-slate-400 font-bold">إغلاق</button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-auto">
              {sessions.filter(s => s.status === SessionStatus.POSTPONED).length === 0 ? (
                <p className="text-slate-500 font-bold">لا توجد حصص مؤجلة.</p>
              ) : (
                sessions.filter(s => s.status === SessionStatus.POSTPONED).map(s => (
                  <div key={s.id} className="p-3 rounded-lg border border-white/5 bg-slate-900/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-black text-white">{getStudentById(s.studentId)?.name || 'طالب مجهول'}</div>
                        <div className="text-[12px] text-slate-400">الميعاد الأصلي: {new Date(s.dateTime).toLocaleString('ar-EG')}</div>
                      </div>
                      <div className="text-[12px] text-amber-400 font-black">حالة: مؤجلة</div>
                    </div>
                    {s.note && <p className="mt-2 text-[13px] text-slate-300">{s.note}</p>}
                    {s.originalSessionId && <p className="mt-1 text-[11px] text-slate-500">معرف الحصة الأصلية: {s.originalSessionId}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showCancelledModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
          <div className="glass-3d w-full max-w-lg rounded-[2rem] p-6 border border-white/10 shadow-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-white">تفاصيل الإلغاءات اليوم</h3>
              <button onClick={() => setShowCancelledModal(false)} className="text-slate-400 font-bold">إغلاق</button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-auto">
              {(() => {
                const now = new Date(); now.setHours(0,0,0,0);
                const cancelledToday = sessions.filter(s => s.status === SessionStatus.CANCELLED && (() => { const d = new Date(s.dateTime); d.setHours(0,0,0,0); return d.getTime() === now.getTime(); })());
                if (cancelledToday.length === 0) return <p className="text-slate-500 font-bold">لا توجد إلغاءات اليوم.</p>;
                return cancelledToday.map(s => (
                  <div key={s.id} className="p-3 rounded-lg border border-white/5 bg-slate-900/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-black text-white">{getStudentById(s.studentId)?.name || 'طالب مجهول'}</div>
                        <div className="text-[12px] text-slate-400">الموعد: {new Date(s.dateTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div className="text-[12px] text-rose-400 font-black">ملغاة</div>
                    </div>
                    {s.note && <p className="mt-2 text-[13px] text-slate-300">{s.note}</p>}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 gap-5">
        <div className="glass-3d p-6 rounded-[2.2rem] group hover:border-amber-500/40">
            <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
              <button onClick={() => setShowPostponedModal(true)} className="absolute inset-0" aria-label="عرض التفاصيل للحصص المؤجلة"></button>
          </div>
          <h4 className="text-3xl font-black text-white mb-1">{stats.pendingPostponed}</h4>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">حصص مؤجلة</p>
        </div>
        
        <div className="glass-3d p-6 rounded-[2.2rem] group hover:border-rose-500/40">
            <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
              <button onClick={() => setShowCancelledModal(true)} className="absolute inset-0" aria-label="عرض تفاصيل الإلغاءات"></button>
          </div>
          <h4 className="text-3xl font-black text-white mb-1">{stats.cancelledCount}</h4>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">إلغاءات اليوم</p>
        </div>
      </div>

      {/* الإشعارات */}
      <section className="space-y-5">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-black text-white tracking-tight">الإشعارات</h3>
          {notifications.length > 0 && (
            <button onClick={clearNotifications} className="text-red-400 text-xs font-black uppercase tracking-widest bg-red-400/10 px-4 py-2 rounded-xl border border-red-400/20">مسح الكل</button>
          )}
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="glass-3d p-6 rounded-[2rem] border-white/5 text-center">
              <div className="w-16 h-16 bg-slate-600/20 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 12.683A17.925 17.925 0 0112 21c7.962 0 12-1.21 12-2.683m-12 2.683a17.925 17.925 0 01-7.132-8.317M12 21c4.411 0 8-4.03 8-9s-3.589-9-8-9-8 4.03-8 9a9.06 9.06 0 001.832 5.683L4 21l4.868-8.317z" />
                </svg>
              </div>
              <p className="text-slate-400 font-black text-sm">ليس لديك تنبيهات الآن</p>
              <p className="text-slate-500 text-xs font-bold mt-1">ستظهر هنا إشعارات الحصص القادمة</p>
            </div>
          ) : (
            notifications.map((notification: any) => (
              <div key={notification.id} className="glass-3d p-4 rounded-[1.5rem] border-white/5 bg-blue-600/5 border-blue-500/10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-white">{notification.title}</h4>
                    <p className="text-xs text-slate-400 font-bold mt-1">{notification.message}</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-2">{new Date(notification.timestamp).toLocaleString('ar-EG')}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-black text-white tracking-tight">جدول اليوم المباشر</h3>
          <button onClick={() => onNavigate('sessions')} className="text-blue-400 text-xs font-black uppercase tracking-widest bg-blue-400/10 px-4 py-2 rounded-xl border border-blue-400/20">عرض الكل</button>
        </div>
        
        <div className="space-y-4">
          {stats.todaySessions.length === 0 ? (
            <div className="text-center py-20 glass-3d rounded-[2.5rem] border-dashed">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-500 font-bold">لا توجد حصص مجدولة حالياً</p>
            </div>
          ) : (
            stats.todaySessions.map((session, idx) => (
              <div key={session.id} 
                   className="glass-3d p-5 rounded-3xl flex items-center justify-between group hover:border-blue-500/30"
                   style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg transition-transform group-hover:scale-110 ${
                    session.status === SessionStatus.COMPLETED ? 'bg-emerald-500/10 text-emerald-500' : 
                    session.status === SessionStatus.CANCELLED ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-black text-white text-base leading-none">
                      {getStudentById(session.studentId)?.name || 'طالب مجهول'}
                    </h4>
                    <div className="flex items-center gap-2 mt-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {new Date(session.dateTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-4 border-slate-900 ${
                  session.status === SessionStatus.COMPLETED ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 
                  session.status === SessionStatus.CANCELLED ? 'bg-rose-500 shadow-[0_0_15px_#f43f5e]' : 
                  'bg-blue-500 animate-pulse shadow-[0_0_15px_#3b82f6]'
                }`}></div>
              </div>
            ))
          )}
        </div>
      </section>

      {showSummary && <DailySummaryModal onClose={() => setShowSummary(false)} />}
    </div>
  );
};

export default Dashboard;
