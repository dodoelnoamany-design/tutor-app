
import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../store';
import { useSettings } from '../themeStore';

const AppointmentsSchedule: React.FC = () => {
  const { students } = useApp();
  const { scheduleZoom, setScheduleZoom } = useSettings();
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number }>(() => {
    try { return JSON.parse(localStorage.getItem('appointments_zoom_pos') || 'null') || { x: 60, y: 80 }; } catch { return { x: 60, y: 80 }; }
  });
  const [zoomDragging, setZoomDragging] = useState(false);
  const [zoomDragStart, setZoomDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [handlePos, setHandlePos] = useState<{ x: number; y: number }>(() => {
    try { return JSON.parse(localStorage.getItem('appointments_handle_pos') || 'null') || { x: 0, y: 0 }; } catch { return { x: 0, y: 0 }; }
  });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!dragging) localStorage.setItem('appointments_handle_pos', JSON.stringify(handlePos));
  }, [dragging, handlePos]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      setHandlePos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };
    const onUp = () => { if (dragging) setDragging(false); };
    const onTouchMove = (e: TouchEvent) => { if (!dragging) return; setHandlePos({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y }); };
    const onTouchEnd = () => { if (dragging) setDragging(false); };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [dragging, dragStart]);

  // Zoom draggable handling and persistence
  useEffect(() => {
    const onZoomMove = (e: MouseEvent) => { if (!zoomDragging) return; setZoomPos({ x: e.clientX - zoomDragStart.x, y: e.clientY - zoomDragStart.y }); };
    const onZoomUp = () => { if (zoomDragging) setZoomDragging(false); };
    const onZoomTouchMove = (e: TouchEvent) => { if (!zoomDragging) return; setZoomPos({ x: e.touches[0].clientX - zoomDragStart.x, y: e.touches[0].clientY - zoomDragStart.y }); };
    const onZoomTouchEnd = () => { if (zoomDragging) setZoomDragging(false); };
    document.addEventListener('mousemove', onZoomMove);
    document.addEventListener('mouseup', onZoomUp);
    document.addEventListener('touchmove', onZoomTouchMove);
    document.addEventListener('touchend', onZoomTouchEnd);
    return () => {
      document.removeEventListener('mousemove', onZoomMove);
      document.removeEventListener('mouseup', onZoomUp);
      document.removeEventListener('touchmove', onZoomTouchMove);
      document.removeEventListener('touchend', onZoomTouchEnd);
    };
  }, [zoomDragging, zoomDragStart]);

  useEffect(() => { if (!zoomDragging) localStorage.setItem('appointments_zoom_pos', JSON.stringify(zoomPos)); }, [zoomDragging, zoomPos]);

  // persist handle position when not dragging

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

  // Build next 7 days starting from today (for "هذا الأسبوع" grouping)
  const weekDates = useMemo(() => {
    const today = new Date();
    const days: { date: Date; dayIndex: number; name: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayIdx = d.getDay();
      const nameObj = allDays.find(x => x.index === dayIdx) || { name: d.toLocaleDateString('ar-EG', { weekday: 'long' }), index: dayIdx };
      days.push({ date: d, dayIndex: dayIdx, name: nameObj.name });
    }
    return days;
  }, [students]);

  // Active days within the coming week that have fixedSchedule items
  const activeDays = useMemo(() => {
    return weekDates.filter(day => students.some(s => s.fixedSchedule.some(fs => fs.day === day.dayIndex)));
  }, [students, weekDates]);

  // Active time slots within the coming week
  const activeTimeSlots = useMemo(() => {
    return allTimeSlots.filter(slot => 
      students.some(s => s.fixedSchedule.some(fs => {
        const fsHour = parseInt(fs.time.split(':')[0]);
        return fsHour === slot.hour && weekDates.some(wd => wd.dayIndex === fs.day);
      }))
    );
  }, [students, allTimeSlots, weekDates]);

  // Return all students for a given day/time (to show conflicts or multiple students)
  const getStudentsForSlot = (dayIndex: number, timeStr: string) => {
    const hour = parseInt(timeStr.split(':')[0]);
    return students.filter(s => 
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
        {/* Draggable zoom/moveable resize button */}
        <div
          className="fixed z-40"
          style={{ left: zoomPos.x || 60, top: (zoomPos.y || 80) - 8 }}
          onMouseDown={(e) => { setZoomDragging(true); setZoomDragStart({ x: e.clientX - (zoomPos.x || 60), y: e.clientY - (zoomPos.y || 80) }); }}
          onTouchStart={(e: any) => { setZoomDragging(true); setZoomDragStart({ x: e.touches[0].clientX - (zoomPos.x || 60), y: e.touches[0].clientY - (zoomPos.y || 80) }); }}
        >
          <button
            onClick={() => setShowZoomMenu(prev => !prev)}
            className="w-11 h-11 rounded-full glass-3d flex items-center justify-center text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all"
            title={`حجم الجدول: ${(scheduleZoom * 100).toFixed(0)}%`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>

          {showZoomMenu && (
            <div className="fixed z-50 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-3 space-y-2" style={{ left: Math.max(8, (zoomPos.x || 60) - 20), top: (zoomPos.y || 80) + 44, minWidth: 220, maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-black text-slate-300">حجم الجدول</span>
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
                <button onClick={() => { setScheduleZoom(0.1); setShowZoomMenu(false); }} className="flex-1 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-[10px] font-black text-slate-300">10%</button>
                <button onClick={() => { setScheduleZoom(1); setShowZoomMenu(false); }} className="flex-1 py-2 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-[10px] font-black text-blue-300">100%</button>
                <button onClick={() => { setScheduleZoom(2); setShowZoomMenu(false); }} className="flex-1 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-[10px] font-black text-slate-300">200%</button>
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
                  <th key={day.dayIndex} className="pb-3" style={{ minWidth: `${140 * scheduleZoom}px` }}>
                    <div className="bg-slate-900 border border-white/10 rounded-xl py-2 text-[10px] font-black text-blue-400 shadow-sm" style={{ padding: `${8 * scheduleZoom}px ${12 * scheduleZoom}px`, fontSize: `${10 * scheduleZoom}px` }}>
                      <div className="text-sm font-black">{day.name}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{day.date.toLocaleDateString('ar-EG')}</div>
                      <div className="text-[9px] text-amber-400 mt-1 font-black">{(() => {
                        const today = new Date();
                        const diff = Math.floor((day.date.setHours(0,0,0,0) - (new Date()).setHours(0,0,0,0)) / (1000*60*60*24));
                        if (diff === 0) return 'اليوم';
                        if (diff === 1) return 'غداً';
                        return '';
                      })()}</div>
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
                    const studentsFor = getStudentsForSlot(day.dayIndex, slot.raw);
                    return (
                      <td key={`${day.dayIndex}-${slot.raw}`} style={{ height: `${64 * scheduleZoom}px` }}>
                        <div className={`w-full h-full rounded-xl border transition-all flex flex-col items-center justify-center text-center group ${studentsFor.length > 0 ? '' : 'bg-slate-900/10 border-dashed border-slate-800/30'}`} style={ studentsFor.length > 0 ? { padding: `${6 * scheduleZoom}px`, background: 'var(--color-appointments-box)', border: '1px solid rgba(0,0,0,0.16)', boxShadow: '0 6px 18px rgba(0,0,0,0.08)' } : { padding: `${6 * scheduleZoom}px` } }>
                          {studentsFor.length > 0 ? (
                            <>
                              <span className="text-[9px] font-black truncate w-full" style={{ marginBottom: `${4 * scheduleZoom}px`, fontSize: `${9 * scheduleZoom}px`, color: '#000' }}>{studentsFor.map(st => st.name).join(' • ')}</span>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[7px] font-black opacity-80 uppercase tracking-tighter" style={{ fontSize: `${7 * scheduleZoom}px`, color: 'rgba(0,0,0,0.7)' }}>
                                  {studentsFor.map(st => st.level).filter(Boolean).join(' • ')}
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
            يتم عرض مواعيد الطلاب المجدولة هنا وفقاً للأوقات المحددة.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsSchedule;
