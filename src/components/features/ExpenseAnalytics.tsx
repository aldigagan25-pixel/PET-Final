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
