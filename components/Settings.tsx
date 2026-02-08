import React, { useRef, useState } from 'react';
import { useSettings } from '../themeStore';

const Settings: React.FC = () => {
  const {
    theme, setTheme, soundEnabled, setSoundEnabled, notificationsEnabled, setNotificationsEnabled,
    systemNotificationsEnabled, setSystemNotificationsEnabled,
    notificationOffsetMinutes, setNotificationOffsetMinutes,
    autoBackupDays, setAutoBackupDays,
    autoBackupPath, setAutoBackupPath,
    customColors, setCustomColors, resetCustomColors,
    teacherProfile, setTeacherProfile,
    exportData, importData, resetToDefaults
  } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [showTeacherProfile, setShowTeacherProfile] = useState(false);

  const colorOptions = [
    '#3b82f6', '#a855f7', '#10b981', '#ef4444', '#06b6d4', '#ec4899', '#f97316', '#eab308', '#6b7280', '#1f2937',
    '#1e40af', '#7e22ce', '#059669', '#dc2626', '#0891b2', '#db2777', '#ea580c', '#ca8a04', '#4b5563', '#111827',
    '#f59e0b', '#fbbf24', '#9ca3af', '#374151', '#64748b', '#94a3b8', '#cbd5e1', '#f1f5f9', '#020617', '#0f172a'
  ];

  const colorLabels = {
    primary: 'لون الأزرار الرئيسية',
    secondary: 'لون الأزرار الثانوية',
    accent: 'لون التأكيد',
    background: 'لون الخلفية',
    text: 'لون النص'
  };

  const handleExport = async () => {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const data = exportData();
      const fileName = `tutor-backup-${new Date().toISOString().split('T')[0]}.json`;

      await Filesystem.writeFile({
        path: fileName,
        data: btoa(data),
        directory: Directory.Documents,
      });

      alert(`تم حفظ النسخة الاحتياطية في مجلد الوثائق باسم: ${fileName}`);
    } catch (error) {
      console.error('خطأ في حفظ النسخة الاحتياطية:', error);
      // Fallback to browser download
      const data = exportData();
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
      element.setAttribute('download', `tutor-backup-${new Date().toISOString().split('T')[0]}.json`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (importData(content)) {
        alert('تم استيراد البيانات بنجاح');
      } else {
        alert('فشل استيراد البيانات. تأكد من صيغة الملف');
      }
    };
    reader.readAsText(file);
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setTeacherProfile({ avatar: result });
    };
    reader.readAsDataURL(file);
  };

  const playSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  return (
    <div className="space-y-6 page-transition pb-24">
      <div className="px-2 space-y-1">
        <h2 className="text-2xl font-black text-white">الإعدادات</h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">خيارات التطبيق والتخصيص</p>
      </div>

      {/* المظهر */}
      <div className="px-2 space-y-3">
        <div className="glass-3d p-5 rounded-[2rem] border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white">المظهر (Theme)</h3>
              <p className="text-[11px] text-slate-500 font-bold">اختر بين الوضع الليلي والنهاري</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 py-3 rounded-xl font-black text-sm transition-all border ${
                theme === 'dark'
                  ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/50'
                  : 'bg-slate-900/50 border-white/10 text-slate-300 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                الليل
              </div>
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 py-3 rounded-xl font-black text-sm transition-all border ${
                theme === 'light'
                  ? 'bg-amber-500 border-amber-300 text-slate-900 shadow-lg shadow-amber-800/50'
                  : 'bg-slate-900/50 border-white/10 text-slate-300 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1m-16 0H1m15.364 1.636l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                النهار
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* تخصيص الألوان */}
      <div className="px-2 space-y-3">
        <div className="glass-3d p-5 rounded-[2rem] border-white/5 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-white">تخصيص الألوان</h3>
            <p className="text-[11px] text-slate-500 font-bold">اختر لون كل عنصر منفرداً</p>
          </div>

          <div className="space-y-3">
            {Object.entries(colorLabels).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <label className="text-xs font-bold text-white">{label}</label>
                <div className="flex gap-2">
                  <select
                    value={customColors[key as keyof typeof customColors]}
                    onChange={(e) => setCustomColors({ [key]: e.target.value })}
                    className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
                  >
                    {colorOptions.map((color) => (
                      <option key={color} value={color}>
                        {color.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <div
                    className="w-8 h-8 rounded-lg border-2 border-white/20"
                    style={{ backgroundColor: customColors[key as keyof typeof customColors] }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={resetCustomColors}
            className="w-full py-2 px-4 rounded-xl font-black text-sm text-slate-300 bg-slate-800/50 hover:bg-slate-800 border border-white/10 transition-all"
          >
            إعادة تعيين الألوان
          </button>
        </div>
      </div>

      {/* الإشعارات والصوت */}
      <div className="px-2 space-y-3">
        <div className="glass-3d p-5 rounded-[2rem] border-white/5 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <h3 className="text-sm font-black text-white">الإشعارات</h3>
                <p className="text-[10px] text-slate-500 font-bold">إشعارات قبل الحصة بـ {notificationOffsetMinutes} دقيقة</p>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    notificationsEnabled ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      notificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {notificationsEnabled && (
              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 font-bold">وقت الإشعار (دقائق قبل الحصة)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={notificationOffsetMinutes}
                  onChange={(e) => setNotificationOffsetMinutes(parseInt(e.target.value, 10))}
                  className="w-full py-2 px-3 rounded-xl font-black text-sm text-white bg-slate-800/50 border border-white/10 focus:border-blue-400 focus:outline-none"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <h3 className="text-sm font-black text-white">إشعارات النظام</h3>
                <p className="text-[10px] text-slate-500 font-bold">إشعارات في شريط الإشعارات</p>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={() => setSystemNotificationsEnabled(!systemNotificationsEnabled)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    systemNotificationsEnabled ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      systemNotificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <h3 className="text-sm font-black text-white">المؤثرات الصوتية</h3>
                <p className="text-[10px] text-slate-500 font-bold">تشغيل أصوات خفيفة</p>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    soundEnabled ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
                </button>
              </div>
            </div>

            {soundEnabled && (
              <button
                onClick={playSound}
                className="w-full py-2 px-4 rounded-xl font-black text-sm text-white bg-blue-600/50 hover:bg-blue-600 border border-blue-400/30 transition-all flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1V8a1 1 0 011-1h1.586l4.707-4.707a1 1 0 011.414 0l4.707 4.707H20a1 1 0 011 1v6a1 1 0 01-1 1h-1.586l-4.707 4.707a1 1 0 01-1.414 0L5.586 15z" />
                </svg>
                تجربة الصوت
              </button>
            )}
          </div>
        </div>
      </div>

      {/* النسخ الاحتياطي */}
      <div className="px-2 space-y-3">
        <div className="glass-3d p-5 rounded-[2rem] border-white/5 space-y-4">
          <div className="space-y-1 mb-4">
            <h3 className="text-sm font-black text-white">النسخ الاحتياطي والاستعادة</h3>
            <p className="text-[11px] text-slate-500 font-bold">احفظ بيانات تطبيقك أو استعدها</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleExport}
              className="w-full py-3 px-4 rounded-xl font-black text-sm text-white bg-emerald-600/80 hover:bg-emerald-600 border border-emerald-400/30 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              تحميل النسخة الاحتياطية
            </button>

            <button
              onClick={handleImportClick}
              className="w-full py-3 px-4 rounded-xl font-black text-sm text-white bg-blue-600/80 hover:bg-blue-600 border border-blue-400/30 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              استيراد النسخة الاحتياطية
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* النسخ التلقائي */}
      <div className="px-2 space-y-3">
        <div className="glass-3d p-5 rounded-[2rem] border-white/5 space-y-4">
          <div className="space-y-1 mb-4">
            <h3 className="text-sm font-black text-white">النسخ التلقائي</h3>
            <p className="text-[11px] text-slate-500 font-bold">نسخ تلقائي للبيانات كل عدد أيام محدد</p>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] text-slate-400 font-bold">عدد الأيام (0 = معطل)</label>
            <input
              type="number"
              min="0"
              max="365"
              value={autoBackupDays}
              onChange={(e) => setAutoBackupDays(parseInt(e.target.value, 10))}
              className="w-full py-2 px-3 rounded-xl font-black text-sm text-white bg-slate-800/50 border border-white/10 focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] text-slate-400 font-bold">مسار النسخ التلقائي</label>
            <input
              type="text"
              value={autoBackupPath}
              onChange={(e) => setAutoBackupPath(e.target.value)}
              placeholder="مثال: Downloads/TutorMaster-Backups"
              className="w-full py-2 px-3 rounded-xl font-black text-sm text-white bg-slate-800/50 border border-white/10 focus:border-blue-400 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500">المسار النسبي من مجلد التحميلات</p>
          </div>
        </div>
      </div>

      {/* حذف البيانات */}
      <div className="px-2 space-y-3">
        <div className="glass-3d p-5 rounded-[2rem] border-white/5 space-y-4">
          <div className="space-y-1 mb-4">
            <h3 className="text-sm font-black text-white">إدارة البيانات</h3>
            <p className="text-[11px] text-slate-500 font-bold">حذف أو إعادة تعيين التطبيق</p>
          </div>

          <button
            onClick={resetToDefaults}
            className="w-full py-3 px-4 rounded-xl font-black text-sm text-red-400 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 transition-all flex items-center justify-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            حذف جميع البيانات
          </button>
        </div>
      </div>

      {/* ملف المعلم */}
      <div className="px-2 space-y-3">
        <div className="glass-3d p-5 rounded-[2rem] border-white/5 space-y-4">
          <button
            onClick={() => setShowTeacherProfile(!showTeacherProfile)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white">ملف المعلم</h3>
              <p className="text-[11px] text-slate-500 font-bold">اضغط لعرض/إخفاء البيانات الشخصية</p>
            </div>
            <svg
              className={`h-5 w-5 text-slate-400 transition-transform ${showTeacherProfile ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showTeacherProfile && (
            <div className="space-y-3 border-t border-white/10 pt-4">
              {/* Avatar Section */}
              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 font-bold">الصورة الشخصية</label>
                <div className="flex items-center gap-4">
                  <div 
                    onClick={handleAvatarClick}
                    className="w-16 h-16 rounded-full bg-slate-700 border-2 border-dashed border-slate-500 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors overflow-hidden"
                  >
                    {teacherProfile.avatar ? (
                      <img 
                        src={teacherProfile.avatar} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <button
                      onClick={handleAvatarClick}
                      className="w-full py-2 px-3 rounded-xl font-black text-sm text-blue-400 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 transition-all"
                    >
                      {teacherProfile.avatar ? 'تغيير الصورة' : 'اختيار صورة'}
                    </button>
                    {teacherProfile.avatar && (
                      <button
                        onClick={() => setTeacherProfile({ avatar: '' })}
                        className="w-full mt-1 py-1 px-3 rounded-xl font-black text-xs text-red-400 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 transition-all"
                      >
                        حذف الصورة
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 font-bold">الاسم الكامل</label>
                <input
                  type="text"
                  value={teacherProfile.name}
                  onChange={(e) => setTeacherProfile({ name: e.target.value })}
                  placeholder="أدخل اسمك الكامل"
                  className="w-full py-2 px-3 rounded-xl font-black text-sm text-white bg-slate-800/50 border border-white/10 focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 font-bold">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={teacherProfile.email}
                  onChange={(e) => setTeacherProfile({ email: e.target.value })}
                  placeholder="example@email.com"
                  className="w-full py-2 px-3 rounded-xl font-black text-sm text-white bg-slate-800/50 border border-white/10 focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 font-bold">رقم الهاتف</label>
                <input
                  type="tel"
                  value={teacherProfile.phone}
                  onChange={(e) => setTeacherProfile({ phone: e.target.value })}
                  placeholder="+966 50 000 0000"
                  className="w-full py-2 px-3 rounded-xl font-black text-sm text-white bg-slate-800/50 border border-white/10 focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 font-bold">التخصص</label>
                <input
                  type="text"
                  value={teacherProfile.specialization}
                  onChange={(e) => setTeacherProfile({ specialization: e.target.value })}
                  placeholder="مثال: رياضيات، فيزياء، لغة عربية..."
                  className="w-full py-2 px-3 rounded-xl font-black text-sm text-white bg-slate-800/50 border border-white/10 focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 font-bold">نبذة تعريفية</label>
                <textarea
                  value={teacherProfile.bio}
                  onChange={(e) => setTeacherProfile({ bio: e.target.value })}
                  placeholder="اكتب نبذة قصيرة عن نفسك وخبراتك..."
                  rows={3}
                  className="w-full py-2 px-3 rounded-xl font-black text-sm text-white bg-slate-800/50 border border-white/10 focus:border-blue-400 focus:outline-none resize-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* معلومات */}
      <div className="px-2 pb-4">
        <div className="glass-3d p-5 rounded-[2rem] border border-blue-500/10 bg-blue-600/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] text-slate-300 font-black">معلومات التطبيق</p>
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                جميع البيانات تُحفظ محلياً على جهازك. استخدم النسخ الاحتياطية للحفاظ على بيانات للطوارئ. جميع المؤثرات الصوتية خفيفة وآمنة.
              </p>
              <p className="text-[10px] text-slate-400 font-bold mt-3">تم عمل التطبيق بواسطة محمد النعماني</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
