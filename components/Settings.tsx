import React, { useState, useEffect } from 'react';
import { useSettings } from '../themeStore'; // تأكد من المسار الصحيح
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const Settings: React.FC = () => {
  const { 
    theme, setTheme,
    teacherProfile, setTeacherProfile, 
    customColors, setCustomColors,
    autoBackupDays, setAutoBackupDays,
    exportData, importData,
    notificationMinutes, setNotificationMinutes,
    notificationsEnabled, setNotificationsEnabled 
  } = useSettings();

  const [showProfile, setShowProfile] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState(localStorage.getItem('last_auto_backup') || 'لم يتم بعد');

  // --- 1. تحديث صورة البروفايل ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imgData = event.target?.result as string;
        setTeacherProfile({ image: imgData });
      };
      reader.readAsDataURL(file);
    }
  };

  // --- 2. منطق استيراد نسخة احتياطية ---
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (importData(content)) {
          alert('تمت استعادة كافة البيانات بنجاح ✅');
        } else {
          alert('فشل الاستيراد، تأكد من صحة الملف ❌');
        }
      };
      reader.readAsText(file);
    }
  };

  const themesList = [
    { group: 'ألوان كلاسيكية', items: [
      { name: 'أزرق احترافي', primary: '#3b82f6', accent: '#60a5fa' },
      { name: 'أخضر مريح', primary: '#10b981', accent: '#34d399' },
      { name: 'برتقالي حيوي', primary: '#f59e0b', accent: '#fbbf24' },
      { name: 'بنفسجي ملكي', primary: '#a855f7', accent: '#c084fc' },
    ]},
    { group: 'ألوان جريئة', items: [
      { name: 'أحمر ناري', primary: '#ef4444', accent: '#f87171' },
      { name: 'وردي ناعم', primary: '#f472b6', accent: '#fbcfe8' },
      { name: 'رمادي مودرن', primary: '#64748b', accent: '#94a3b8' },
    ]}
  ];

  return (
    <div className="space-y-6 pb-28 px-4 pt-6 page-transition text-right" dir="rtl">
      
      {/* هيدر الترحيب */}
      <div className="flex items-center gap-4 bg-blue-600/10 p-4 rounded-[2rem] border border-blue-500/20">
        <img 
          src={teacherProfile.image || 'https://via.placeholder.com/150'} 
          className="w-14 h-14 rounded-full object-cover border-2 border-blue-500"
        />
        <div>
          <h2 className="text-white font-black text-lg">أهلاً بك، {teacherProfile.name || 'أستاذنا'} 👋</h2>
          <p className="text-blue-400 text-[10px] font-bold">كل بياناتك مؤمنة وجاهزة</p>
        </div>
      </div>

      {/* 1. الملف الشخصي */}
      <section className="glass-3d p-5 rounded-[2.5rem] border border-white/5 space-y-4">
        <button onClick={() => setShowProfile(!showProfile)} className="w-full flex items-center justify-between">
          <span className="text-blue-400 text-[10px] font-black uppercase">تعديل الملف الشخصي</span>
          <svg className={`h-4 w-4 text-slate-500 transition-all ${showProfile ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth="3"/></svg>
        </button>
        {showProfile && (
          <div className="space-y-4 animate-in slide-in-from-top duration-300">
            <div className="flex flex-col items-center gap-3">
              <label className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white text-[10px] font-bold">تغيير</div>
                <img src={teacherProfile.image || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-full object-cover border-2 border-white/10" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              <input 
                type="text" 
                placeholder="اكتب اسمك هنا" 
                className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold text-center"
                value={teacherProfile.name}
                onChange={(e) => setTeacherProfile({ name: e.target.value })}
              />
            </div>
          </div>
        )}
      </section>

      {/* 2. وضع المظهر (ليلي / نهاري) */}
      <section className="glass-3d p-5 rounded-[2.5rem] border border-white/5 flex items-center justify-between">
        <span className="text-slate-300 text-xs font-black">وضع المظهر</span>
        <div className="flex bg-slate-900 p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => setTheme('light')} 
            className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${theme === 'light' ? 'bg-white text-black shadow-lg' : 'text-slate-500'}`}
          >نهاراً</button>
          <button 
            onClick={() => setTheme('dark')} 
            className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${theme === 'dark' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}
          >ليلاً</button>
        </div>
      </section>

      {/* 3. الثيمات الملونة (قابلة للطي) */}
      <section className="glass-3d p-5 rounded-[2.5rem] border border-white/5 space-y-4">
        <button onClick={() => setShowThemes(!showThemes)} className="w-full flex items-center justify-between">
          <span className="text-amber-400 text-[10px] font-black uppercase">تخصيص ألوان التطبيق</span>
          <svg className={`h-4 w-4 text-slate-500 transition-all ${showThemes ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth="3"/></svg>
        </button>
        {showThemes && (
          <div className="space-y-4 animate-in slide-in-from-top">
            {themesList.map(group => (
              <div key={group.group}>
                <p className="text-[9px] text-slate-500 font-bold mb-2 mr-2">{group.group}</p>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map(t => (
                    <button 
                      key={t.name}
                      onClick={() => setCustomColors({ primary: t.primary, accent: t.accent })}
                      className="flex items-center gap-2 p-3 bg-slate-900/50 rounded-xl border border-white/5"
                    >
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.primary }} />
                      <span className="text-[10px] text-white font-bold">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. الإشعارات والتنبيه بـ (X) دقيقة */}
      <section className="glass-3d p-5 rounded-[2.5rem] border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔔</span>
            <span className="text-slate-300 text-xs font-black">جرس التنبيه</span>
          </div>
          <button 
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`w-12 h-6 rounded-full transition-all relative ${notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notificationsEnabled ? 'left-1' : 'left-7'}`} />
          </button>
        </div>
        
        {notificationsEnabled && (
          <div className="flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5 animate-in zoom-in">
            <span className="text-[11px] text-slate-400 font-bold">تنبيه قبل الدرس بـ:</span>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                className="w-14 bg-slate-900 border border-blue-500/30 rounded-lg p-2 text-white text-center font-black text-sm"
                value={notificationMinutes}
                onChange={(e) => setNotificationMinutes(Number(e.target.value))}
              />
              <span className="text-[11px] text-slate-400 font-bold">دقيقة</span>
            </div>
          </div>
        )}
      </section>

      {/* 5. النسخ الاحتياطي (يدوي وتلقائي) */}
      <section className="glass-3d p-5 rounded-[2.5rem] border border-white/5 space-y-4">
        <span className="text-emerald-400 text-[10px] font-black uppercase">البيانات والنسخ الاحتياطي</span>
        
        {/* التلقائي */}
        <div className="space-y-2">
          <p className="text-[10px] text-slate-500 mr-1">جدولة النسخ التلقائي:</p>
          <select 
            className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold outline-none"
            value={autoBackupDays}
            onChange={(e) => setAutoBackupDays(Number(e.target.value))}
          >
            <option value={0}>إيقاف النسخ التلقائي</option>
            <option value={1}>كل يوم (أمان كامل)</option>
            <option value={7}>كل أسبوع</option>
          </select>
          <p className="text-[9px] text-slate-600 italic mr-1">آخر نسخة تم حفظها: {lastBackupDate}</p>
        </div>

        {/* اليدوي */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button 
            onClick={() => exportData()}
            className="bg-blue-600 text-white py-4 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition-all"
          >تصدير نسخة (مشاركة) 📤</button>
          <label className="bg-slate-800 text-slate-300 py-4 rounded-2xl font-black text-xs text-center cursor-pointer border border-white/5 active:scale-95 transition-all">
            استعادة نسخة 📥
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </section>

    </div>
  );
};

export default Settings;