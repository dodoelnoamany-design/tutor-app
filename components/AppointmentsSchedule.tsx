
import React, { useMemo, useState } from 'react';
import { useApp } from '../store';
import { useSettings } from '../themeStore';

const AppointmentsSchedule: React.FC = () => {
  const { students } = useApp();
  const { scheduleZoom, setScheduleZoom } = useSettings();
  const [showZoomMenu, setShowZoomMenu] = useState(false);

  // أيام الأسبوع بالكامل
  const allDays = [
    { name: 'السبت', index: 6 },
    { name: 'الأحد', index: 0 },
    { name: 'الاثنين', index: 1 },
    { name: 'الثلاثاء', index: 2 },
    { name: 'الأربعاء', index: 3 },
    { name: 'الخميس', index: 4 },
    { name: 'الجمعة', index: 5 },
  ];

  // توليد فترات زمنية بنظام 12 ساعة (من 8 صباحاً حتى 11 مساءً)
  const allTimeSlots = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 23; h++) {
      const displayHour = h > 12 ? h - 12 : h;
      const amPm = h >= 12 ? 'م' : 'ص';
      slots.push({
        raw: `${h.toString().padStart(2, '0')}:00`,
        display: `${displayHour}:00 ${amPm}`,
        hour: h
      });
    }
    return slots;
  }, []);

  // 1. فلترة الأيام التي تحتوي على حصص فقط
  const activeDays = useMemo(() => {
    return allDays.filter(day => 
      students.some(s => s.fixedSchedule.some(fs => fs.day === day.index))
    );
  }, [students, allDays]);

  // 2. فلترة الساعات التي تحتوي على حصص فقط
  const activeTimeSlots = useMemo(() => {
    return allTimeSlots.filter(slot => 
      students.some(s => s.fixedSchedule.some(fs => {
        const fsHour = parseInt(fs.time.split(':')[0]);
        return fsHour === slot.hour;
      }))
    );
  }, [students, allTimeSlots]);

  const getStudentForSlot = (dayIndex: number, timeStr: string) => {
    const hour = parseInt(timeStr.split(':')[0]);
    return students.find(s => 
      s.fixedSchedule.some(fs => {
        const fsHour = parseInt(fs.time.split(':')[0]);
        return fs.day === dayIndex && fsHour === hour;
      })
    );
  };

  if (activeDays.length === 0 || activeTimeSlots.length === 0) {
    return (
      <div className="space-y-6 page-transition pb-24 text-center py-20">
        <div className="glass-3d p-10 rounded-[3rem] border-dashed border-slate-800 mx-2">
           <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
             <svg className="h-10 w-10 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
             </svg>
           </div>
           <h3 className="text-xl font-black text-white mb-2">لا توجد مواعيد ثابتة</h3>
           <p className="text-slate-500 text-sm font-bold">ابدأ بإضافة طلاب وحدد مواعيدهم ليظهر الجدول هنا</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-transition pb-24">
      <div className="px-2 space-y-1 flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white">خريطة المواعيد الثابتة</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">يتم عرض الأيام والساعات المشغولة فقط</p>
        </div>
        {/* Zoom Controls */}
        <div className="relative">
          <button
            onClick={() => setShowZoomMenu(!showZoomMenu)}
            className="w-10 h-10 rounded-xl glass-3d flex items-center justify-center text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all"
            title={`التصغير/التكبير: ${(scheduleZoom * 100).toFixed(0)}%`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          {showZoomMenu && (
            <div className="absolute top-12 left-0 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-3 space-y-2 z-50 min-w-[200px]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black text-slate-300">التصغير/التكبير</span>
                <span className="text-[10px] font-black text-blue-400">{(scheduleZoom * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="10"
                value={scheduleZoom * 100}
                onChange={(e) => setScheduleZoom(parseInt(e.target.value) / 100)}
                className="w-full"
              />
              <div className="flex gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => setScheduleZoom(0.1)}
                  className="flex-1 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-[10px] font-black text-slate-300 transition-all"
                >
                  صغر
                </button>
                <button
                  onClick={() => setScheduleZoom(1)}
                  className="flex-1 py-2 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-[10px] font-black text-blue-300 transition-all"
                >
                  عادي
                </button>
                <button
                  onClick={() => setScheduleZoom(2)}
                  className="flex-1 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-[10px] font-black text-slate-300 transition-all"
                >
                  كبر
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-blue-600/50 scrollbar-track-white/5 pt-2 [transform:rotateX(180deg)]" style={{ transform: 'scaleX(-1)' }}>
        <div className="min-w-max bg-[#0f172a] rounded-[2rem] p-4 border border-white/5 shadow-2xl relative [transform:rotateX(180deg)]" style={{ transform: 'scaleX(-1)', transformOrigin: 'center' }}>
          {/* Grid Background Effect */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]"></div>

          <table className="w-full border-separate relative z-10" style={{ borderSpacing: `${6 * scheduleZoom}px` }}>
            <thead>
              <tr>
                <th className="pb-3" style={{ width: `${80 * scheduleZoom}px` }}></th>
                {activeDays.map(day => (
                  <th key={day.index} className="pb-3" style={{ minWidth: `${120 * scheduleZoom}px` }}>
                    <div className="bg-slate-900 border border-white/10 rounded-xl py-2 text-[10px] font-black text-blue-400 shadow-sm" style={{ padding: `${8 * scheduleZoom}px ${12 * scheduleZoom}px`, fontSize: `${10 * scheduleZoom}px` }}>
                      {day.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeTimeSlots.map(slot => (
                <tr key={slot.raw}>
                  <td className="pr-2 py-1" style={{ paddingRight: `${8 * scheduleZoom}px`, paddingTop: `${4 * scheduleZoom}px`, paddingBottom: `${4 * scheduleZoom}px` }}>
                    <span className="text-[9px] font-black text-slate-500 whitespace-nowrap block text-center bg-slate-900/50 rounded-lg border border-white/5" style={{ padding: `${4 * scheduleZoom}px ${8 * scheduleZoom}px`, fontSize: `${9 * scheduleZoom}px` }}>
                      {slot.display}
                    </span>
                  </td>
                  {activeDays.map(day => {
                    const student = getStudentForSlot(day.index, slot.raw);
                    return (
                      <td key={`${day.index}-${slot.raw}`} style={{ height: `${64 * scheduleZoom}px` }}>
                        <div className={`w-full h-full rounded-xl border transition-all flex flex-col items-center justify-center text-center group ${
                          student 
                            ? 'bg-blue-600/20 border-blue-500/40 shadow-lg shadow-blue-900/10' 
                            : 'bg-slate-900/10 border-dashed border-slate-800/30'
                        }`} style={{ padding: `${6 * scheduleZoom}px` }}>
                          {student ? (
                            <>
                              <span className="text-[9px] font-black text-white truncate w-full" style={{ marginBottom: `${4 * scheduleZoom}px`, fontSize: `${9 * scheduleZoom}px` }}>{student.name}</span>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[7px] font-black text-blue-400 opacity-80 uppercase tracking-tighter" style={{ fontSize: `${7 * scheduleZoom}px` }}>
                                  {student.level}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="w-1 h-1 bg-slate-800 rounded-full opacity-10"></div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="glass-3d p-5 rounded-[2rem] border-blue-500/10 flex items-start gap-4 mx-2">
        <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] text-slate-300 font-black">الجدول الذكي</p>
          <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
            استخدم أزرار التصغير والتكبير لتحكم في عرض الجدول. يمكنك تصغيره لرؤية الجدول كاملاً على الشاشة.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsSchedule;
