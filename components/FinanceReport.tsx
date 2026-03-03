
import React, { useState, useMemo } from 'react';
import { useApp } from '../store';

const FinanceReport: React.FC = () => {
  const { getFinancialReport, recordPayment, getExpectedMonthlyIncome } = useApp();
  const report = getFinancialReport();
  const monthlyExpected = getExpectedMonthlyIncome();
  const fmt = (v: any) => {
    const n = Number(v || 0);
    if (isNaN(n)) return '0.0';
    return n.toFixed(1);
  };
  const [payAmount, setPayAmount] = useState<{[id: string]: number}>({});
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReports = useMemo(() => {
    return report.studentReports.filter(r =>
      r.student.name.includes(searchQuery) ||
      r.student.parentName?.includes(searchQuery)
    );
  }, [report.studentReports, searchQuery]);

  const handlePay = (studentId: string) => {
    const amount = payAmount[studentId] || 0;
    if (amount > 0) {
      recordPayment(studentId, amount);
      setPayAmount({ ...payAmount, [studentId]: 0 });
    }
  };

  return (
    <div className="space-y-6 page-transition pb-20">
      <div className="px-2 space-y-1">
        <h2 className="text-2xl font-black text-white">التقرير المالي</h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">تحصيل الاشتراكات الشهرية</p>
      </div>

      {/* إحصائيات ملخصة */}
      <div className="grid grid-cols-2 gap-3 px-2">
        <div className="glass-3d p-6 rounded-[2rem] text-center border-blue-500/20">
          <p className="text-[9px] text-blue-500 font-black uppercase mb-1">الدخل المتوقع</p>
          <h4 className="text-2xl font-black text-white">{fmt(monthlyExpected)} <span className="text-xs">ج.م</span></h4>
          <p className="text-[9px] text-blue-400 font-bold mt-1">شهري</p>
        </div>
        <div className="glass-3d p-6 rounded-[2rem] text-center border-emerald-500/20">
          <p className="text-[9px] text-emerald-500 font-black uppercase mb-1">المبلغ المحصل</p>
          <h4 className="text-2xl font-black text-white">{fmt(report.totalCollected)} <span className="text-xs">ج.م</span></h4>
          <p className="text-[9px] text-emerald-400 font-bold mt-1">
            {monthlyExpected ? ((report.totalCollected / monthlyExpected) * 100).toFixed(0) : '0'}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-2">
        <div className="glass-3d p-6 rounded-[2rem] text-center border-rose-500/20">
          <p className="text-[9px] text-rose-500 font-black uppercase mb-1">المتبقي</p>
          <h4 className="text-2xl font-black text-white">{fmt(monthlyExpected - report.totalCollected)} <span className="text-xs">ج.م</span></h4>
        </div>
        <div className="glass-3d p-6 rounded-[2rem] text-center border-amber-500/20">
          <p className="text-[9px] text-amber-500 font-black uppercase mb-1">إجمالي المستحق</p>
          <h4 className="text-2xl font-black text-white">{fmt(report.totalExpected)} <span className="text-xs">ج.م</span></h4>
        </div>
      </div>

      {/* خانة البحث */}
      <div className="px-2">
        <div className="relative">
          <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="ابحث باسم الطالب أو الولي..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* قائمة الطلاب */}
      <div className="space-y-3 px-2">
        <h3 className="text-sm font-black text-white">حالة الطلاب ({filteredReports.length})</h3>
        {filteredReports.length === 0 ? (
          <div className="glass-3d p-8 rounded-[2rem] border-dashed border-slate-700 text-center">
            <p className="text-slate-400 font-bold">لا توجد نتائج للبحث</p>
          </div>
        ) : (
          filteredReports.map(r => (
            <div key={r.student.id} className="glass-3d p-5 rounded-[2rem] border-white/5 space-y-4 hover:border-blue-500/20 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-black text-white text-base">{r.student.name}</h4>
                  <p className="text-[10px] text-slate-500 font-bold">
                    {r.completedSessionsCount} حصص • {fmt(r.student.sessionPrice)} ج.م/حصة • الشهري: {fmt(r.expectedMonthly)} ج.م
                  </p>
                  {r.student.parentName && (
                    <p className="text-[9px] text-slate-400 font-bold mt-1">ولي الأمر: {r.student.parentName}</p>
                  )}
                </div>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black whitespace-nowrap ml-2 ${
                  r.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 
                  r.status === 'partial' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
                }`}>
                  {r.status === 'paid' ? '✅ تم الدفع' : r.status === 'partial' ? '⏳ دفع جزئي' : '❌ لم يدفع'}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px] font-black bg-slate-900/30 p-3 rounded-lg">
                <div>
                  <p className="text-slate-400">المطلوب</p>
                  <p className="text-white text-lg">{fmt(r.debt)}</p>
                </div>
                <div>
                  <p className="text-slate-400">المدفوع</p>
                  <p className="text-emerald-500 text-lg">{fmt(r.paid)}</p>
                </div>
                <div>
                  <p className="text-slate-400">المتبقي</p>
                  <p className="text-rose-500 text-lg">{fmt(r.debt - r.paid)}</p>
                </div>
              </div>

              {r.debt > r.paid && (
                <div className="flex gap-2 pt-2 border-t border-white/5 items-center">
                  <input 
                    type="number" 
                    className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold flex-1 outline-none focus:border-blue-500/50"
                    placeholder="مبلغ التحصيل..."
                    value={payAmount[r.student.id] || ''}
                    onChange={e => setPayAmount({...payAmount, [r.student.id]: Number(e.target.value)})}
                  />
                  <button 
                    onClick={() => handlePay(r.student.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all"
                    style={{flexShrink:0}}
                  >
                    تسديد
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FinanceReport;
