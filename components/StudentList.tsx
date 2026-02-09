import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { DayTime, Student } from '../types';

const StudentList: React.FC = () => {
  const { students, addStudent, updateStudent, deleteStudent, updateFixedSchedule } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  const [formData, setFormData] = useState({ 
    name: '', phone: '', level: '', age: '', parentName: '', parentPhone: '',
    notes: '', monthlyPrice: 600, fixedSchedule: [] as DayTime[] 
  });
  
  const [calculatedPrice, setCalculatedPrice] = useState(150);
  const daysAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  // --- حالات خاصة بتعديل الوقت السريع ---
  const [quickTimeModal, setQuickTimeModal] = useState(false);
  const [selectedForQuickTime, setSelectedForQuickTime] = useState<{id: string, day: number, time: string} | null>(null);

  const sessionsPerWeek = formData.fixedSchedule.length;

  useEffect(() => {
    const totalSessionsMonth = sessionsPerWeek * 4;
    setCalculatedPrice(totalSessionsMonth > 0 ? Math.round(formData.monthlyPrice / totalSessionsMonth) : 0);
  }, [formData.monthlyPrice, sessionsPerWeek]);

  // دالة تحويل الوقت لشكل شيك (12 ساعة)
  const formatTimeArabic = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'م' : 'ص';
    const h12 = hours % 12 || 12;
    return `${h12}:${minutes < 10 ? '0' + minutes : minutes} ${period}`;
  };

  const openAdd = () => {
    setEditingStudent(null);
    setFormData({ 
      name: '', phone: '', level: '', age: '', parentName: '', parentPhone: '',
      notes: '', monthlyPrice: 600, fixedSchedule: [] 
    });
    setShowModal(true);
  };

  const openEdit = (s: Student) => {
    setEditingStudent(s);
    setFormData({ 
      name: s.name, phone: s.phone || '', level: s.level || '', age: (s as any).age || '',
      parentName: s.parentName || '', parentPhone: s.parentPhone || '',
      notes: (s as any).notes || '', monthlyPrice: s.monthlyPrice, 
      fixedSchedule: [...s.fixedSchedule] 
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData, sessionsPerWeek, sessionPrice: calculatedPrice };
    editingStudent ? updateStudent({ ...editingStudent, ...data }) : addStudent({ ...data, paidAmount: 0 });
    setShowModal(false);
  };

  const handleQuickTimeUpdate = () => {
    if (selectedForQuickTime) {
      updateFixedSchedule(selectedForQuickTime.id, selectedForQuickTime.day, selectedForQuickTime.time);
      setQuickTimeModal(false);
    }
  };

  return (
    <div className="space-y-6 page-transition pb-20 px-2">
      <div className="flex items-center justify-between mt-4 px-2">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white">إدارة الطلاب</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">المسجلين: {students.length}</p>
        </div>
        <button onClick={openAdd} className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      <div className="grid gap-4">
        {students.map(s => (
          <div key={s.id} className="glass-3d p-5 rounded-3xl relative overflow-hidden border border-white/5">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600"></div>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-black text-white text-lg">{s.name}</h3>
                <p className="text-[10px] text-slate-500 font-bold mb-3">{s.level || 'عام'} { (s as any).age ? `• ${ (s as any).age } سنة` : '' }</p>
                
                <div className="flex flex-wrap gap-2">
                  {s.fixedSchedule.map(d => (
                    <button 
                      key={d.day} 
                      onClick={() => {
                        setSelectedForQuickTime({ id: s.id, day: d.day, time: d.time });
                        setQuickTimeModal(true);
                      }}
                      className="bg-slate-900/80 hover:bg-blue-600 group transition-all p-2 rounded-xl border border-white/5 flex items-center gap-2"
                    >
                      <span className="text-[10px] font-black text-slate-400 group-hover:text-blue-100">{daysAr[d.day]}</span>
                      <span className="text-[10px] font-black text-blue-400 group-hover:text-white bg-blue-500/10 px-2 py-0.5 rounded-lg">
                        {formatTimeArabic(d.time)} 🕒
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2 mr-2">
                <button onClick={() => openEdit(s)} className="p-2 bg-slate-800 rounded-xl text-blue-400"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                <button onClick={() => window.confirm('حذف الطالب؟') && deleteStudent(s.id)} className="p-2 bg-slate-800 rounded-xl text-rose-500"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* مودال الإضافة والتعديل */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="glass-3d w-full max-w-md rounded-[2.5rem] p-6 border border-white/10 my-8">
            <h3 className="text-xl font-black text-white mb-6 text-center">{editingStudent ? 'تعديل طالب' : 'طالب جديد'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required type="text" placeholder="اسم الطالب" className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input type="tel" placeholder="رقم الموبايل" className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                <input type="text" placeholder="المستوى" className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} />
              </div>
              <div className="p-4 bg-black/20 rounded-[2rem] border border-white/5 space-y-4">
                <p className="text-[10px] font-black text-blue-400 uppercase text-center">أيام الحصص والساعة</p>
                <div className="grid grid-cols-4 gap-2">
                  {daysAr.map((d, i) => (
                    <button key={i} type="button" onClick={() => {
                      const exists = formData.fixedSchedule.find(fd => fd.day === i);
                      setFormData({...formData, fixedSchedule: exists ? formData.fixedSchedule.filter(fd => fd.day !== i) : [...formData.fixedSchedule, {day: i, time: '16:00'}]});
                    }} className={`py-2 rounded-xl text-[9px] font-black transition-all ${formData.fixedSchedule.find(fd => fd.day === i) ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-500'}`}>{d}</button>
                  ))}
                </div>
                {formData.fixedSchedule.map(fd => (
                  <div key={fd.day} className="flex items-center justify-between bg-slate-900/50 p-2 rounded-xl border border-white/10">
                    <span className="text-xs font-bold text-white pr-2">{daysAr[fd.day]}</span>
                    <input type="time" className="bg-slate-800 text-white text-xs p-1.5 rounded-lg outline-none border border-white/5" value={fd.time} onChange={e => setFormData({...formData, fixedSchedule: formData.fixedSchedule.map(item => item.day === fd.day ? {...item, time: e.target.value} : item)})} />
                  </div>
                ))}
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl">حفظ البيانات ✅</button>
              <button type="button" onClick={() => setShowModal(false)} className="w-full text-slate-500 py-2 font-bold text-sm">إلغاء</button>
            </form>
          </div>
        </div>
      )}

      {/* مودال تعديل الوقت السريع (يفتح عند الضغط على الساعة) */}
      {quickTimeModal && selectedForQuickTime && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
          <div className="glass-3d w-full max-w-sm rounded-[2.5rem] p-8 border border-white/10 shadow-3xl">
            <h3 className="text-xl font-black text-white mb-4 text-center">تعديل وقت الحصة</h3>
            <p className="text-slate-400 text-center text-sm mb-6">يوم {daysAr[selectedForQuickTime.day]}</p>
            <input 
              type="time" 
              value={selectedForQuickTime.time} 
              onChange={e => setSelectedForQuickTime({...selectedForQuickTime, time: e.target.value})} 
              className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-4 text-white font-black text-2xl text-center mb-6" 
            />
            <div className="flex gap-3">
              <button onClick={handleQuickTimeUpdate} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black">تحديث الآن</button>
              <button onClick={() => setQuickTimeModal(false)} className="flex-1 bg-slate-800 text-slate-400 py-4 rounded-2xl font-black">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;