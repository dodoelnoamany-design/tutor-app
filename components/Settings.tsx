import React, { useState, useEffect } from 'react';
import { useSettings } from '../themeStore';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Device } from '@capacitor/device';

const Settings: React.FC = () => {
  const { 
    teacherProfile, setTeacherProfile, 
    customColors, setCustomColors,
    autoBackupDays, setAutoBackupDays,
    exportData, importData,
    notificationMinutes, setNotificationMinutes,
    notificationsEnabled, setNotificationsEnabled
  } = useSettings ? useSettings() : {
    notificationMinutes: 10,
    setNotificationMinutes: () => {},
    notificationsEnabled: false,
    setNotificationsEnabled: () => {}
  };
      {/* إعدادات الإشعارات */}
      <section className="glass-3d p-6 rounded-[2.5rem] border border-white/5 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-amber-400 text-[10px] font-black uppercase tracking-widest">الإشعارات</span>
          <button
            onClick={() => setNotificationsEnabled && setNotificationsEnabled(!notificationsEnabled)}
            className={`px-4 py-1 rounded-full text-xs font-bold border transition-all ${notificationsEnabled ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-slate-800 text-slate-300 border-white/10'}`}
          >
            {notificationsEnabled ? 'مفعّل' : 'غير مفعّل'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-bold">أرسل إشعار قبل الدرس بـ</span>
          <input
            type="number"
            min={1}
            max={120}
            value={notificationMinutes}
            onChange={e => setNotificationMinutes && setNotificationMinutes(Number(e.target.value))}
            className="w-16 bg-slate-900 border border-white/10 rounded-2xl px-2 py-1 text-white font-bold text-center"
            disabled={!notificationsEnabled}
          />
          <span className="text-[11px] text-slate-400 font-bold">دقيقة</span>
        </div>
        <p className="text-[10px] text-slate-500 px-2 italic">سيتم إرسال إشعار قبل موعد الدرس بعدد الدقائق المحدد.</p>
      </section>

  const [lastBackupDate, setLastBackupDate] = useState<string>(
    localStorage.getItem('last_auto_backup') || 'لم يتم بعد'
  );

  // --- 1. منطق النسخ الاحتياطي التلقائي ---
  useEffect(() => {
    const runAutoBackup = async () => {
      if (autoBackupDays === 0) return; // لو المستخدم قفل الخاصية

      const now = new Date().getTime();
      const last = parseInt(localStorage.getItem('last_auto_backup_timestamp') || '0');
      const diffDays = (now - last) / (1000 * 60 * 60 * 24);

      if (diffDays >= autoBackupDays) {
        try {
          // جلب كل البيانات كـ JSON (بناءً على دالة الـ export اللي في الـ store)
          const allData: Record<string, string> = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) allData[key] = localStorage.getItem(key) || '';
          }
          const backup = { version: '3.0', timestamp: now, data: allData };
          
          const fileName = `AutoBackup_TutorMaster.json`;
          await Filesystem.writeFile({
            path: `Backups/${fileName}`,
            data: JSON.stringify(backup),
            directory: Directory.Documents,
            encoding: Encoding.UTF8,
            recursive: true
          });

          const dateStr = new Date().toLocaleString('ar-EG');
          localStorage.setItem('last_auto_backup', dateStr);
          localStorage.setItem('last_auto_backup_timestamp', now.toString());
          setLastBackupDate(dateStr);
          console.log('تم النسخ التلقائي بنجاح ✅');
        } catch (e) {
          console.error('فشل النسخ التلقائي:', e);
        }
      }
    };

    runAutoBackup();
  }, [autoBackupDays]);

  // --- 2. وظيفة الاستيراد ---
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (importData(content)) {
          alert('تم استعادة البيانات بنجاح ✅');
        }
      };
      reader.readAsText(file);
    }
  };

  const [showThemes, setShowThemes] = useState(false);
  const themes = [
    { group: 'ليلي', items: [
      { name: 'ليلي أزرق', bg: '#020617', primary: '#3b82f6' },
      { name: 'بنفسجي عميق', bg: '#0f071a', primary: '#a855f7' },
      { name: 'أخضر غامق', bg: '#020d0a', primary: '#10b981' },
      { name: 'كلاسيك بلاك', bg: '#000000', primary: '#ffffff' },
    ]},
    { group: 'فاتح', items: [
      { name: 'فاتح أزرق', bg: '#f8fafc', primary: '#3b82f6' },
      { name: 'فاتح بنفسجي', bg: '#ede9fe', primary: '#a855f7' },
      { name: 'فاتح أخضر', bg: '#ecfdf5', primary: '#10b981' },
      { name: 'فاتح كلاسيك', bg: '#ffffff', primary: '#000000' },
    ]},
    { group: 'مجموعات مميزة', items: [
      { name: 'برتقالي عصري', bg: '#fff7ed', primary: '#f97316' },
      { name: 'رمادي أنيق', bg: '#f3f4f6', primary: '#64748b' },
      { name: 'أخضر فاتح', bg: '#d1fae5', primary: '#059669' },
    ]}
  ];

  const [showProfile, setShowProfile] = useState(false);
  const [profileImage, setProfileImage] = useState(teacherProfile.image || '');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imgData = event.target?.result as string;
        setProfileImage(imgData);
        setTeacherProfile({ ...teacherProfile, image: imgData });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 pb-24 px-4 pt-6 page-transition">
      <h2 className="text-2xl font-black text-white">الإعدادات</h2>

      {/* بيانات المعلم */}
      <section className="glass-3d p-6 rounded-[2.5rem] border border-white/5 space-y-4">
        <button
          onClick={() => setShowProfile(!showProfile)}
          className="w-full flex items-center justify-between text-left mb-4"
        >
          <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest">الملف الشخصي</span>
          <svg className={`h-5 w-5 text-slate-400 transition-transform ${showProfile ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showProfile && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="relative cursor-pointer">
                <img
                  src={profileImage || '/public/assets/default-profile.png'}
                  alt="صورة المعلم"
                  className="w-16 h-16 rounded-full object-cover border border-white/10"
                />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <span className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs rounded-full px-2 py-1">تغيير</span>
              </label>
              <input
                type="text"
                placeholder="اسمك الكريم"
                className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold"
                value={teacherProfile.name}
                onChange={(e) => setTeacherProfile({ ...teacherProfile, name: e.target.value })}
              />
            </div>
          </div>
        )}
      </section>

      {/* النسخ الاحتياطي التلقائي */}
      <section className="glass-3d p-6 rounded-[2.5rem] border border-white/5 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">النسخ التلقائي (صامت)</p>
          <span className="text-[9px] text-slate-500 font-bold">آخر نسخة: {lastBackupDate}</span>
        </div>
        
        <select 
          className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm font-bold outline-none"
          value={autoBackupDays}
          onChange={(e) => setAutoBackupDays(Number(e.target.value))}
        >
          <option value={0}>إيقاف النسخ التلقائي</option>
          <option value={1}>كل يوم (موصى به)</option>
          <option value={3}>كل 3 أيام</option>
          <option value={7}>كل أسبوع</option>
        </select>
        <p className="text-[10px] text-slate-500 px-2 italic">النسخة التلقائية تُحفظ في مجلد Documents/Backups داخل ذاكرة الموبايل.</p>
      </section>

      {/* التحكم اليدوي في البيانات */}
      <section className="glass-3d p-6 rounded-[2.5rem] border border-white/5 space-y-4">
        <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest">إجراءات يدوية</p>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => exportData()}
            className="bg-blue-600 text-white py-4 rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-all"
          >
            تصدير ومشاركة 📤
          </button>
          
          <label className="bg-slate-800 text-slate-300 py-4 rounded-2xl font-black text-xs text-center cursor-pointer active:scale-95 transition-all">
            استيراد نسخة 📥
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </section>

      {/* المظهر والألوان */}
      <section className="glass-3d p-6 rounded-[2.5rem] border border-white/5 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowThemes(!showThemes)}
            className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-widest"
          >
            ثيمات سريعة
            <svg className={`h-5 w-5 text-slate-400 transition-transform ${showThemes ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-bold">وضع الثيم:</span>
            <button
              onClick={() => setCustomColors({ background: customColors.background === '#ffffff' ? '#020617' : '#ffffff', primary: customColors.primary })}
              className="bg-slate-800 text-white px-3 py-1 rounded-full text-xs font-bold border border-white/10"
            >
              {customColors.background === '#ffffff' ? 'داكن' : 'فاتح'}
            </button>
          </div>
        </div>
        {showThemes && (
          <div className="space-y-6">
            {themes.map((group) => (
              <div key={group.group}>
                <p className="text-[11px] text-slate-400 font-bold mb-2">{group.group}</p>
                <div className="grid grid-cols-2 gap-3">
                  {group.items.map((t) => (
                    <button
                      key={t.name}
                      onClick={() => setCustomColors({ background: t.bg, primary: t.primary })}
                      className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-2xl border border-white/5 hover:border-blue-500/50 transition-all"
                    >
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.primary }}></div>
                      <span className="text-[11px] font-bold text-white">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Settings;