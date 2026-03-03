import React, { useState, useMemo, useEffect } from 'react';
import { useSchool } from '../schoolStore';
import { useSettings } from '../themeStore';
import { SchoolSession } from '../types';

const SchoolSchedule: React.FC = () => {
  const { schoolSessions, addSchoolSession, updateSchoolSession, deleteSchoolSession, getSchoolSessionByDay } = useSchool();
  const { scheduleZoom, setScheduleZoom, teacherProfile } = useSettings();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<SchoolSession, 'id' | 'createdAt'>>({
    name: '',
    level: '',
    grade: '',
    boyGirl: 'mixed',
    day: 0,
    time: '08:00',
    duration: 60,
    endTime: '09:00',
    subject: '',
    notes: '',
    teacher: ''
  });

  const [handlePos, setHandlePos] = useState<{ x: number; y: number }>(() => {
    try { return JSON.parse(localStorage.getItem('school_handle_pos') || 'null') || { x: 0, y: 0 }; } catch { return { x: 0, y: 0 }; }
  });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });


  useEffect(() => {
    if (!dragging) localStorage.setItem('school_handle_pos', JSON.stringify(handlePos));
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

  // Zoom state for draggable resize button
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number }>(() => {
    try { return JSON.parse(localStorage.getItem('school_zoom_pos') || 'null') || { x: 60, y: 80 }; } catch { return { x: 60, y: 80 }; }
  });
  const [zoomDragging, setZoomDragging] = useState(false);
  const [zoomDragStart, setZoomDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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

  useEffect(() => { if (!zoomDragging) localStorage.setItem('school_zoom_pos', JSON.stringify(zoomPos)); }, [zoomDragging, zoomPos]);

  

  // endTime is entered explicitly by the user (from/to); do not auto-calc from duration

  const days = [
    { name: 'السبت', index: 6 },
    { name: 'الأحد', index: 0 },
    { name: 'الاثنين', index: 1 },
    { name: 'الثلاثاء', index: 2 },
    { name: 'الأربعاء', index: 3 },
    { name: 'الخميس', index: 4 },
    { name: 'الجمعة', index: 5 },
  ];

  const activeDays = useMemo(() => {
    return days.filter(d => schoolSessions.some(s => s.day === d.index));
  }, [schoolSessions]);

  const allTimeSlots = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 16; h++) {
      slots.push({
        raw: `${h.toString().padStart(2, '0')}:00`,
        display: `${h}:00`,
        hour: h
      });
    }
    return slots;
  }, []);

  // refreshTick allows forcing a refresh when user clicks refresh
  const [refreshTick, setRefreshTick] = useState<number>(0);

  // Build minute-accurate active time slots from actual session start times
  const activeTimeSlots = useMemo(() => {
    const setTimes = new Set<string>();
    for (const s of schoolSessions) {
      if (!s.time) continue;
      const t = s.time.slice(0,5);
      setTimes.add(t);
    }
    const arr = Array.from(setTimes);
    arr.sort((a, b) => {
      const [ah, am] = a.split(':').map(x => parseInt(x, 10));
      const [bh, bm] = b.split(':').map(x => parseInt(x, 10));
      return ah * 60 + am - (bh * 60 + bm);
    });
    return arr.map(t => ({ raw: t, display: t }));
  }, [schoolSessions, refreshTick]);

  // إضافة أو تحديث حصة
  const handleAddSession = () => {
    if (formData.level) {
      const teacherToSave = formData.teacher && formData.teacher.trim() ? formData.teacher.trim() : (teacherProfile?.name || '');
      const toSave = { ...formData, name: formData.level, grade: formData.level, teacher: teacherToSave } as any;
      // Prevent overlapping session at same day/time (check start/end overlap)
      const parseTimeToMinutes = (t: string) => {
        try {
          const [hh, mm] = (t || '').split(':').map(x => parseInt(x, 10));
          if (isNaN(hh)) return 0;
          return hh * 60 + (isNaN(mm) ? 0 : mm);
        } catch { return 0; }
      };

      const newStart = parseTimeToMinutes(toSave.time);
      const newEnd = toSave.endTime ? parseTimeToMinutes(toSave.endTime) : (newStart + (toSave.duration || 60));

      const conflict = schoolSessions.find(s => {
        if (s.day !== toSave.day) return false;
        if (editingId && s.id === editingId) return false;
        const sStart = parseTimeToMinutes(s.time);
        const sEnd = s.endTime ? parseTimeToMinutes(s.endTime) : (sStart + (s.duration || 60));
        // overlap if ranges intersect
        return (newStart < sEnd && sStart < newEnd);
      });

      if (conflict) {
        const cName = conflict.level || conflict.name || 'حصة مجهولة';
        const cTime = `${conflict.time}${conflict.endTime ? ' - ' + conflict.endTime : ''}`;
        window.alert(`لا يمكن إضافة الحصة — يوجد تعارض مع ${cName} في هذا اليوم والوقت (${cTime}).`);
        return;
      }
      if (editingId) {
        updateSchoolSession({ ...toSave, id: editingId, createdAt: Date.now() });
        setEditingId(null);
      } else {
        addSchoolSession(toSave);
      }
      setFormData({
        name: '',
        level: '',
        grade: '',
        boyGirl: 'mixed',
        day: 0,
        time: '08:00',
        duration: 60,
        endTime: '09:00',
        subject: '',
        notes: '',
        teacher: ''
      });
      setShowAddForm(false);
    }
  };

  // Return all sessions that start exactly at this minute slot for the given day
  const getSessionsForSlot = (dayIndex: number, timeStr: string) => {
    return schoolSessions.filter(s => s.day === dayIndex && (s.time || '').slice(0,5) === timeStr);
  };

  const formatDisplayTime = (time24?: string) => {
    if (!time24) return 'غير محدد';
    const [hhStr, mmStr] = time24.split(':');
    let hh = parseInt(hhStr || '0', 10);
    const mm = mmStr || '00';
    const isPM = hh >= 12;
    const suffix = isPM ? 'م' : 'ص';
    hh = hh % 12;
    if (hh === 0) hh = 12;
    return `${hh}:${mm} ${suffix}`;
  };

  // تحميل بيانات الحصة للتعديل
  const handleEdit = (session: SchoolSession) => {
    setFormData({
      name: session.name,
      level: session.level,
      grade: session.grade || '',
      boyGirl: session.boyGirl || 'mixed',
      day: session.day,
      time: session.time,
      duration: session.duration,      endTime: session.endTime || '',      subject: session.subject || '',
      notes: session.notes || '',
      teacher: session.teacher || ''
    });
    setEditingId(session.id);
    setShowAddForm(true);
  };

  // حذف مع تأكيد
  const handleDeleteConfirm = (sessionId: string) => {
    deleteSchoolSession(sessionId);
    setDeleteConfirmId(null);
  };

  // إلغاء العملية والعودة للوضع الطبيعي
  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      level: '',
      grade: '',
      boyGirl: 'mixed',
      day: 0,
      time: '08:00',
      duration: 60,
      endTime: '09:00',
      subject: '',
      notes: '',
      teacher: ''
    });
  };

  if (activeDays.length === 0 && !showAddForm) {
    return (
      <div className="space-y-6 page-transition pb-24 text-center py-20">
        <div className="glass-3d p-10 rounded-[3rem] border-dashed border-slate-800 mx-2">
          <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="h-10 w-10 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6M6 9h6m0 0h6" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-white mb-2">لم تضف أي حصص مدرسية</h3>
          <p className="text-slate-500 text-sm font-bold mb-4">ابدأ بإضافة الحصص المدرسية للجدول</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black text-sm"
          >
            إضافة حصة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-transition pb-24">
      <div className="px-2 space-y-1 flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white">جدول الحصص المدرسية</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">الجدول الأسبوعي للحصص</p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowAddForm(true)}
            className="w-10 h-10 rounded-xl glass-3d flex items-center justify-center text-blue-400 hover:border-blue-500/30 transition-all"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>

          <button
            onClick={() => setRefreshTick(Date.now())}
            title="تحديث الجدول"
            className="w-10 h-10 rounded-xl glass-3d flex items-center justify-center text-slate-300 hover:text-blue-400 hover:border-blue-500/30 transition-all"
          >
            <img src="/assets/update-icon.png" alt="تحديث" className="h-5 w-5" onError={(e:any)=>{e.currentTarget.style.display='none'}} />
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6" />
            </svg>
          </button>

          {/* Draggable zoom button */}
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
      </div>

      {/* نموذج إضافة/تعديل الحصة */}
      {showAddForm && (
        <div className="px-2 glass-3d p-6 rounded-[2rem] border-white/5 space-y-4">
          <h3 className="text-lg font-black text-white">
            {editingId ? '✏️ تعديل الحصة' : '➕ إضافة حصة جديدة'}
          </h3>
          
          <div className="space-y-3">
            <input
              type="text"
              placeholder="المستوى (يظهر بشكل بارز)"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-2xl font-black text-white outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={formData.day}
              onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) })}
              className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
            >
              {days.map(d => (
                <option key={d.index} value={d.index}>{d.name}</option>
              ))}
            </select>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">من الساعة</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">إلى الساعة</label>
                <input
                  type="time"
                  value={formData.endTime || ''}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="المادة (اختياري)"
              value={formData.subject || ''}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
            />
            <input
              type="text"
              placeholder={teacherProfile?.name ? `المعلم (الإفتراضي: ${teacherProfile.name})` : 'المعلم (اختياري)'}
              value={formData.teacher || ''}
              onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
              className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          <textarea
            placeholder="ملاحظات"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500/50 transition-colors w-full"
            rows={2}
          />

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleAddSession}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-black text-sm transition-colors"
            >
              {editingId ? '✓ تحديث' : '✓ حفظ'}
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl font-black text-sm transition-colors"
            >
              ✕ إلغاء
            </button>
          </div>
        </div>
      )}

      {/* الجدول الأسبوعي */}
      {activeDays.length > 0 && (
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-blue-600/50 scrollbar-track-white/5 pt-2" style={{ transform: 'scaleX(-1)' }}>
          <div className="min-w-max bg-[#0f172a] rounded-[2rem] p-4 border border-white/5 shadow-2xl relative" style={{ transform: 'scaleX(-1)', transformOrigin: 'center' }}>
            <table className="w-full border-separate relative z-10" style={{ borderSpacing: `${6 * scheduleZoom}px` }}>
              <thead>
                <tr>
                  <th className="pb-3" style={{ width: `${80 * scheduleZoom}px` }}></th>
                  {activeDays.map(day => (
                    <th key={day.index} className="pb-3" style={{ minWidth: `${140 * scheduleZoom}px` }}>
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
                      <td className="pr-2 py-1" style={{ paddingRight: `${8 * scheduleZoom}px` }}>
                        <span className="text-[9px] font-black text-slate-500 whitespace-nowrap block text-center bg-slate-900/50 rounded-lg border border-white/5" style={{ padding: `${4 * scheduleZoom}px ${8 * scheduleZoom}px`, fontSize: `${9 * scheduleZoom}px` }}>
                          {formatDisplayTime(slot.raw)}
                        </span>
                      </td>
                      {activeDays.map(day => {
                        const sessions = getSessionsForSlot(day.index, slot.raw);
                        return (
                          <td key={`${day.index}-${slot.raw}`} style={{ height: `${80 * scheduleZoom}px` }}>
                            <div
                              className={`w-full h-full rounded-xl transition-all relative ${sessions.length ? 'p-1.5 text-center group cursor-default' : 'bg-slate-900/10 border-dashed border-slate-800/30'}`}
                              style={ sessions.length ? { background: 'var(--color-schedule-box)', border: '1px solid rgba(0,0,0,0.18)', boxShadow: '0 6px 18px rgba(0,0,0,0.12)' } : undefined }
                            >
                              {sessions.length ? (
                                <div className="space-y-1">
                                  {sessions.map(session => (
                                    <div key={session.id} onClick={() => handleEdit(session)} className="bg-transparent rounded-md p-1 relative group">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <div className="text-white font-extrabold truncate" style={{ fontSize: `${12 * scheduleZoom}px`, lineHeight: 1 }}>
                                            {session.level || session.name}
                                          </div>
                                          <div className="text-[11px] text-purple-200 opacity-90 mt-0" style={{ fontSize: `${9 * scheduleZoom}px` }}>
                                            {formatDisplayTime(session.time)} - {session.endTime ? formatDisplayTime(session.endTime) : 'غير محدد'}
                                          </div>
                                          {session.subject && (
                                            <div className="text-[10px] text-purple-100 opacity-80" style={{ fontSize: `${8 * scheduleZoom}px` }}>{session.subject}</div>
                                          )}
                                          <div className="text-[9px] mt-1" style={{ fontSize: `${8 * scheduleZoom}px`, color: 'rgba(255,255,255,0.9)' }}>{session.teacher || teacherProfile?.name || '—'}</div>
                                          {session.notes && (
                                            <div className="text-[9px] mt-1" style={{ fontSize: `${7 * scheduleZoom}px`, whiteSpace: 'normal', color: '#000', fontWeight: 700 }}>{session.notes}</div>
                                          )}
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                          <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(session.id); }} className="w-7 h-7 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white text-[12px] font-black">🗑️</button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
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
      )}

      {/* Modal تأكيد الحذف */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full glass-3d">
            <h4 className="text-lg font-black text-white mb-2">تأكيد الحذف</h4>
            <p className="text-slate-300 text-sm mb-6">
              هل أنت متأكد من رغبتك في حذف هذه الحصة؟ هذا الإجراء لا يمكن التراجع عنه.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteConfirm(deleteConfirmId)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-black transition-colors"
              >
                ✓ حذف
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-xl font-black transition-colors"
              >
                ✕ إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolSchedule;
