import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../store';
import { useSettings } from '../themeStore';
import { DayTime, Student } from '../types';

const StudentList: React.FC = () => {
  // جلب البيانات والدوال من الـ Store
  // ملاحظة: لو اسم الـ Hook عندك useApp غيره هنا
  const { students, addStudent, updateStudent, deleteStudent, updateFixedSchedule } = useApp();

  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  // الحالة الكاملة للبيانات المطلوبة
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    level: '', 
    age: '',
    parentName: '', 
    parentPhone: '', 
    notes: '', 
    monthlyPrice: '',
    fixedSchedule: [] as DayTime[],
    startDate: ''
  });
  
  const daysAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const { theme } = useSettings();

  // refs for inputs to navigate with keyboard 'Next'
  const inputsRef = useRef<Array<HTMLInputElement | HTMLTextAreaElement | null>>([]);
  const formScrollRef = useRef<HTMLDivElement | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

  // حالات تعديل الوقت السريع
  const [quickTimeModal, setQuickTimeModal] = useState(false);
  const [selectedForQuickTime, setSelectedForQuickTime] = useState<{id: string, day: number, time: string} | null>(null);

  // دالة تنسيق الوقت (12 ساعة)
  const formatTimeArabic = (timeStr: string) => {
    if (!timeStr) return '--:--';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'م' : 'ص';
    const h12 = hours % 12 || 12;
    return `${h12}:${minutes < 10 ? '0' + minutes : minutes} ${period}`;
  };

  // تصفية الطلاب بناءً على البحث
  const filteredStudents = students.filter((s: any) => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.level && s.level.toLowerCase().includes(search.toLowerCase()))
  );

  // فتح مودال الإضافة
  const openAdd = () => {
    setEditingStudent(null);
    // if the user already typed something, keep it (don't erase unexpectedly)
    if (!formData.name && !formData.phone && !formData.level && !formData.parentName) {
      setFormData({ name: '', phone: '', level: '', age: '', parentName: '', parentPhone: '', notes: '', monthlyPrice: '', fixedSchedule: [], startDate: new Date().toISOString().slice(0,10) });
    }
    setShowModal(true);
  };

  // فتح مودال التعديل
  const openEdit = (s: any) => {
    setEditingStudent(s);
    setFormData({ 
      name: s.name, 
      phone: s.phone || '', 
      level: s.level || '', 
      age: s.age || '',
      parentName: s.parentName || '', 
      parentPhone: s.parentPhone || '', 
      notes: s.notes || '', 
      monthlyPrice: s.monthlyPrice?.toString() || '',
      fixedSchedule: [...s.fixedSchedule],
      startDate: s.startDate || ''
    });
    setShowModal(true);
  };

  // حفظ البيانات
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Conflict prevention: ensure no other student has same day+time
    for (const fd of formData.fixedSchedule) {
      const conflict = students.find(s => {
        if (editingStudent && s.id === editingStudent.id) return false;
        return s.fixedSchedule.some((other: DayTime) => other.day === fd.day && other.time === fd.time);
      });
      if (conflict) {
        alert(`هذا الموعد محجوز مسبقاً للطالب ${conflict.name}`);
        return;
      }
    }

    const monthlyPrice = formData.monthlyPrice ? Number(formData.monthlyPrice) : 0;
    const sessionsPerWeek = (formData.fixedSchedule || []).length || 0;
    const sessionPrice = sessionsPerWeek > 0 ? Math.round((monthlyPrice / (sessionsPerWeek * 4)) * 100) / 100 : 0;

    const studentData = {
      ...formData,
      monthlyPrice,
      sessionsPerWeek,
      sessionPrice
    };

    if (editingStudent) {
      updateStudent({ ...editingStudent, ...studentData });
    } else {
      addStudent({ ...studentData, id: Date.now().toString(), paidAmount: 0 } as any);
    }
    setShowModal(false);
  };

  // تحديث الوقت السريع
  const handleQuickTimeUpdate = () => {
    if (selectedForQuickTime) {
      updateFixedSchedule(selectedForQuickTime.id, selectedForQuickTime.day, selectedForQuickTime.time);
      setQuickTimeModal(false);
    }
  };

  // sheet (modal) fixed expanded size — non-draggable, scrollable content inside
  const [sheetHeight, setSheetHeight] = React.useState<number>(Math.round(window.innerHeight * 0.85));

  // ensure focused inputs scroll into view on mobile and expand sheet for visibility
  const onInputFocus = (e: React.FocusEvent) => {
    try {
      // expand sheet to give space for keyboard
      setSheetHeight(Math.round(window.innerHeight * 0.85));
      // ensure focused element is registered
      const idx = inputsRef.current.findIndex(i => i === e.target);
      if (idx >= 0) {
        setTimeout(() => { try { inputsRef.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {} }, 200);
      }
      // small delay then scroll into view
      setTimeout(() => { try { (e.target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {} }, 200);
    } catch {}
  };

  // handle visualViewport / keyboard insets
  useEffect(() => {
    const vv = (window as any).visualViewport;
    const onResize = () => {
      try {
        const h = vv ? (window.innerHeight - vv.height - (vv.offsetTop || 0)) : 0;
        setKeyboardHeight(h > 0 ? Math.max(0, Math.round(h)) : 0);
        if (h > 0) {
          setSheetHeight(Math.round(window.innerHeight * 0.85));
        }
      } catch (e) {}
    };
    if (vv) {
      vv.addEventListener('resize', onResize);
      vv.addEventListener('scroll', onResize);
    } else {
      window.addEventListener('resize', onResize);
    }
    onResize();
    return () => {
      if (vv) {
        vv.removeEventListener('resize', onResize);
        vv.removeEventListener('scroll', onResize);
      } else {
        window.removeEventListener('resize', onResize);
      }
    };
  }, []);

  // backdrop click: if keyboard open then just blur (dismiss keyboard), else close sheet
  const onBackdropClick = (e?: React.MouseEvent) => {
    if (keyboardHeight > 0 || (document.activeElement && /input|textarea|select/i.test((document.activeElement as HTMLElement).tagName))) {
      try { (document.activeElement as HTMLElement)?.blur(); } catch {}
      return;
    }
    setShowModal(false);
  };

  // helper to focus next input on 'Enter' or Next
  const focusNext = (index: number) => {
    const next = inputsRef.current[index + 1];
    if (next) {
      try { (next as HTMLElement).focus(); } catch {}
    } else {
      try { (inputsRef.current[index] as HTMLElement)?.blur(); } catch {}
    }
  };

  // helpers to update schedule in form (extracted to avoid complex inline JSX handlers)
  const toggleDayInForm = (i: number) => {
    setFormData(prev => {
      const exists = prev.fixedSchedule.find(fd => fd.day === i);
      return {
        ...prev,
        fixedSchedule: exists ? prev.fixedSchedule.filter(fd => fd.day !== i) : [...prev.fixedSchedule, { day: i, time: '16:00' }]
      };
    });
  };

  const updateFixedTime = (day: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      fixedSchedule: prev.fixedSchedule.map(item => item.day === day ? { ...item, time: value } : item)
    }));
  };

  const renderModal = () => {
    return (
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm" onClick={onBackdropClick}>
          <div className="pointer-events-none w-full h-full">
            <div onClick={e => e.stopPropagation()} className="pointer-events-auto fixed left-0 right-0 mx-auto rounded-t-[2rem] bg-[#071020] border border-white/10 glass-3d" style={{ maxWidth: 720, height: '85vh', bottom: 0 }}>
            <div className="w-full flex items-center justify-center py-2">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>
            <div className="p-5 overflow-auto h-full" ref={formScrollRef} style={{ paddingBottom: keyboardHeight + 32 }}>
              <h3 className="text-xl font-black text-white mb-4 text-center">{editingStudent ? 'تعديل طالب' : 'طالب جديد'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input ref={el => inputsRef.current[0] = el} required onFocus={onInputFocus} type="text" placeholder="اسم الطالب (إجباري)" enterKeyHint="next" className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); focusNext(0); } }} />
                <input ref={el => inputsRef.current[1] = el} onFocus={onInputFocus} type="date" placeholder="تاريخ بداية الدرس" className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); focusNext(1); } }} />

                <div className="grid grid-cols-2 gap-3">
                  <input ref={el => inputsRef.current[2] = el} onFocus={onInputFocus} type="tel" inputMode="tel" pattern="\d*" placeholder="رقم الطالب" enterKeyHint="next" className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white text-right" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); focusNext(2); } }} />
                  <input ref={el => inputsRef.current[3] = el} onFocus={onInputFocus} type="text" placeholder="المستوى" enterKeyHint="next" className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); focusNext(3); } }} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input ref={el => inputsRef.current[4] = el} type="text" placeholder="اسم ولي الأمر" enterKeyHint="next" className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white" value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); focusNext(4); } }} />
                  <input ref={el => inputsRef.current[5] = el} type="tel" inputMode="tel" pattern="\d*" placeholder="رقم ولي الأمر" enterKeyHint="next" className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white text-right" value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); focusNext(5); } }} />
                </div>

                <input ref={el => inputsRef.current[6] = el} onFocus={onInputFocus} inputMode="numeric" pattern="\d*" type="number" placeholder="السن" enterKeyHint="next" className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white text-right" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); focusNext(6); } }} />
                
                <input ref={el => inputsRef.current[7] = el} onFocus={onInputFocus} inputMode="numeric" pattern="\d*" type="number" placeholder="سعر الشهر (جنيه)" enterKeyHint="next" className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white text-right" value={formData.monthlyPrice} onChange={e => setFormData({...formData, monthlyPrice: e.target.value})} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); focusNext(7); } }} />
                <textarea ref={el => inputsRef.current[8] = el} onFocus={onInputFocus} placeholder="ملاحظات..." className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white h-20" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); focusNext(8); } }} />

                {/* اختيار المواعيد الثابتة */}
                <div className="p-4 bg-black/20 rounded-3xl border border-white/5 space-y-4">
                  <p className="text-[10px] font-black text-blue-400 uppercase text-center">الأيام والساعة</p>
                  <div className="grid grid-cols-4 gap-2">
                    {daysAr.map((d, i) => {
                      const exists = formData.fixedSchedule.find(fd => fd.day === i);
                      return (
                        <button key={i} type="button" onClick={() => toggleDayInForm(i)} className={`py-2 rounded-xl text-[9px] font-black transition-all ${exists ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-500'}`}>{d}</button>
                      );
                    })}
                  </div>
                  {formData.fixedSchedule.map(fd => (
                    <div key={fd.day} className="flex items-center justify-between bg-slate-900/50 p-2 rounded-xl border border-white/5">
                      <span className="text-[10px] font-bold text-white pr-2">{daysAr[fd.day]}</span>
                      <input onFocus={onInputFocus} type="time" className={`${theme === 'light' ? 'bg-white text-black' : 'bg-slate-800 text-white'} text-xs p-1.5 rounded-lg outline-none`} value={fd.time} onChange={e => updateFixedTime(fd.day, e.target.value)} />
                    </div>
                  ))}
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all">حفظ ✅</button>
                <button type="button" onClick={() => setShowModal(false)} className="w-full text-slate-500 py-2 font-bold text-sm">إلغاء</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 page-transition pb-24 px-4 pt-4 text-right" dir="rtl">
      {/* العنوان وزر الإضافة */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-black text-white">الطلاب</h2>
          <p className="text-slate-500 text-[10px] font-bold">إجمالي: {students.length}</p>
        </div>
        <button onClick={openAdd} className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      {/* حقل البحث */}
      <div className="relative">
        <input 
          type="text" 
          placeholder="ابحث عن طالب أو مستوى..." 
          className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-blue-500/50 transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* قائمة الطلاب */}
      <div className="grid gap-3">
        {filteredStudents.map((s: any, index: number) => {
          return (
          <div key={s.id} className={`glass-3d rounded-[2rem] border transition-all ${expandedId === s.id ? 'border-blue-500/30' : 'border-white/5'}`}>
            <div 
              onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
              className="p-5 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-slate-800 text-blue-400 flex items-center justify-center text-xs font-black border border-white/5">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-black text-white text-lg">{s.name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold">{s.level || 'عام'} • {s.phone || 'بدون رقم'}</p>
                </div>
              </div>
              <svg className={`h-5 w-5 text-slate-500 transition-transform ${expandedId === s.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth="2" /></svg>
            </div>

            {expandedId === s.id && (
              <div className="px-5 pb-5 space-y-4 animate-in fade-in zoom-in duration-300">
                <hr className="border-white/5" />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-slate-400">اسم ولي الأمر</p>
                    <p className="text-white font-bold">{s.parentName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">رقم ولي الأمر</p>
                    <p className="text-white font-bold">{s.parentPhone || '—'}</p>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-500 font-black uppercase">السن</p>
                    <p className="text-xs text-white font-bold">{s.age ? `${s.age} سنة` : 'غير محدد'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-500 font-black uppercase">سعر الحصة</p>
                    <p className="text-xs text-white font-bold">{s.sessionPrice ? `${s.sessionPrice} ج.م` : 'غير محدد'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] text-slate-500 font-black uppercase">المواعيد (اضغط للتعديل)</p>
                  <div className="flex flex-wrap gap-2">
                    {s.fixedSchedule.map((d: DayTime) => (
                      <button 
                        key={d.day} 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedForQuickTime({id: s.id, day: d.day, time: d.time});
                          setQuickTimeModal(true);
                        }}
                        className="bg-blue-600/10 border border-blue-500/20 p-2 rounded-xl flex items-center gap-2"
                      >
                        <span className="text-[9px] font-black text-blue-400">{daysAr[d.day]}</span>
                        <span className="text-[9px] text-white font-bold">{formatTimeArabic(d.time)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {s.notes && (
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                    <p className="text-[9px] text-slate-500 font-black mb-1">ملاحظات</p>
                    <p className="text-[10px] text-slate-300 leading-relaxed">{s.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button onClick={() => openEdit(s)} className="flex-1 bg-slate-800 text-blue-400 py-3 rounded-xl font-black text-xs">تعديل ✏️</button>
                  <button onClick={() => { if(window.confirm('حذف الطالب؟')) deleteStudent(s.id); }} className="flex-1 bg-rose-500/10 text-rose-500 py-3 rounded-xl font-black text-xs border border-rose-500/20">حذف 🗑️</button>
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>

      {/* مودال الإضافة والتعديل الكامل */}
      {showModal && renderModal()}

      {/* مودال تعديل الوقت السريع */}
      {quickTimeModal && selectedForQuickTime && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="glass-3d w-full max-w-sm rounded-[2.5rem] p-8 border border-white/10 text-center">
            <h3 className="text-xl font-black text-white mb-2">تعديل سريع</h3>
            <p className="text-slate-500 text-sm mb-6">يوم {daysAr[selectedForQuickTime.day]}</p>
            <input 
              type="time" 
              value={selectedForQuickTime.time} 
              onChange={e => setSelectedForQuickTime({...selectedForQuickTime, time: e.target.value})} 
              className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-4 text-white font-black text-3xl text-center mb-8 outline-none focus:border-blue-500" 
              onFocus={onInputFocus}
            />
            <div className="flex gap-3">
              <button onClick={handleQuickTimeUpdate} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg">تحديث</button>
              <button onClick={() => setQuickTimeModal(false)} className="flex-1 bg-slate-800 text-slate-400 py-4 rounded-2xl font-black">إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;