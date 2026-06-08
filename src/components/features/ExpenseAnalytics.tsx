"use client"

interface ExpenseData {
  harian: number
  mingguan: number
  bulanan: number
}

interface WarehouseExpense {
  id: string
  nama: string
  expenses: ExpenseData
}

interface ExpenseAnalyticsProps {
  globalExpenses: ExpenseData
  warehouseExpenses: WarehouseExpense[]
}

export default function ExpenseAnalytics({ globalExpenses, warehouseExpenses }: ExpenseAnalyticsProps) {
  const formatRp = (n: number) => n.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-rose-50 to-orange-50">
          <h3 className="text-lg font-bold text-slate-800">Total Pengeluaran (Semua Gudang)</h3>
          <p className="text-xs text-slate-500 mt-1">Akumulasi nilai pembelian yang harus/telah dibayarkan ke supplier berdasarkan periode.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="p-6 text-center hover:bg-slate-50/50 transition-colors">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Hari Ini</div>
            <div className="text-2xl font-extrabold text-rose-600">{formatRp(globalExpenses.harian)}</div>
          </div>
          <div className="p-6 text-center hover:bg-slate-50/50 transition-colors">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Minggu Ini</div>
            <div className="text-2xl font-extrabold text-rose-600">{formatRp(globalExpenses.mingguan)}</div>
          </div>
          <div className="p-6 text-center hover:bg-slate-50/50 transition-colors">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Bulan Ini</div>
            <div className="text-2xl font-extrabold text-rose-600">{formatRp(globalExpenses.bulanan)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {warehouseExpenses.map((w) => (
          <div key={w.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <h4 className="font-bold text-slate-800">{w.nama}</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Hari Ini</span>
                <span className="font-extrabold text-slate-700">{formatRp(w.expenses.harian)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Minggu Ini</span>
                <span className="font-extrabold text-slate-700">{formatRp(w.expenses.mingguan)}</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-3 border-t border-slate-50">
                <span className="text-slate-500 font-bold">Bulan Ini</span>
                <span className="font-extrabold text-rose-600">{formatRp(w.expenses.bulanan)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
