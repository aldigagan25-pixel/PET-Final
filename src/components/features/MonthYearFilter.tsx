"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"

export default function MonthYearFilter({
  selectedBulan,
  selectedTahun,
}: {
  selectedBulan: number
  selectedTahun: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handlePeriodChange = (bulan: number, tahun: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("bulan", String(bulan))
    params.set("tahun", String(tahun))
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-slate-100 p-2.5 rounded-2xl shadow-sm">
      <select
        value={selectedBulan}
        onChange={e => handlePeriodChange(parseInt(e.target.value), selectedTahun)}
        className="border-0 bg-transparent text-slate-800 text-sm font-semibold outline-none focus:ring-0 cursor-pointer pr-8"
      >
        {Array.from({ length: 12 }, (_, i) => {
          const m = new Date(2000, i, 1)
          return (
            <option key={i + 1} value={i + 1}>
              {m.toLocaleDateString("id-ID", { month: "long" })}
            </option>
          )
        })}
      </select>

      <div className="h-4 w-px bg-slate-200" />

      <select
        value={selectedTahun}
        onChange={e => handlePeriodChange(selectedBulan, parseInt(e.target.value))}
        className="border-0 bg-transparent text-slate-800 text-sm font-semibold outline-none focus:ring-0 cursor-pointer pr-8"
      >
        {Array.from({ length: 5 }, (_, i) => {
          const y = new Date().getFullYear() - 2 + i
          return (
            <option key={y} value={y}>
              {y}
            </option>
          )
        })}
      </select>
    </div>
  )
}
