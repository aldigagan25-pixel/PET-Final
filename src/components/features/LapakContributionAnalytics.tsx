"use client"

import { useState, useMemo } from "react"

interface SupplierContribution {
  supplierId: string
  nama: string
  warehouseId: string
  warehouseName: string
  totalKg: number
  totalNilai: number
  transaksi: number
  pctKg: number
  pctNilai: number
  prevTotalKg: number
  trendKgDelta: number
  trendKgPct: number
  status: "UP" | "DOWN" | "FLAT" | "NEW"
}

interface LapakContributionAnalyticsProps {
  contributionData: SupplierContribution[]
  selectedBulan: number
  selectedTahun: number
  warehouseNames: { id: string; nama: string }[]
}

function formatRp(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} jt`
  return `Rp ${n.toLocaleString("id-ID")}`
}

function formatKg(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(2)} ton`
  return `${n.toFixed(1)} kg`
}

const STATUS_CONFIG = {
  UP:   { label: "Naik",   bg: "bg-emerald-50",   text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500",  icon: "▲" },
  DOWN: { label: "Turun",  bg: "bg-rose-50",       text: "text-rose-700",    border: "border-rose-200",    dot: "bg-rose-500",     icon: "▼" },
  FLAT: { label: "Stabil", bg: "bg-slate-50",      text: "text-slate-600",   border: "border-slate-200",   dot: "bg-slate-400",    icon: "—" },
  NEW:  { label: "Baru",   bg: "bg-blue-50",       text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-500",     icon: "★" },
}

type SortKey = "totalKg" | "totalNilai" | "trendKgPct" | "pctKg" | "transaksi"

export default function LapakContributionAnalytics({
  contributionData,
  selectedBulan,
  selectedTahun,
  warehouseNames,
}: LapakContributionAnalyticsProps) {
  const [selectedWarehouse, setSelectedWarehouse] = useState("all")
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("totalKg")
  const [sortAsc, setSortAsc] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | "UP" | "DOWN" | "FLAT" | "NEW">("all")

  const bulanLabel = new Date(selectedTahun, selectedBulan - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  })

  // Filter by warehouse
  const filtered = useMemo(() => {
    let data = contributionData
    if (selectedWarehouse !== "all") data = data.filter(s => s.warehouseId === selectedWarehouse)
    if (statusFilter !== "all") data = data.filter(s => s.status === statusFilter)
    if (search.trim()) data = data.filter(s => s.nama.toLowerCase().includes(search.toLowerCase()))
    return [...data].sort((a, b) => {
      const diff = (a[sortKey] as number) - (b[sortKey] as number)
      return sortAsc ? diff : -diff
    })
  }, [contributionData, selectedWarehouse, statusFilter, search, sortKey, sortAsc])

  const grandTotalKg = filtered.reduce((s, r) => s + r.totalKg, 0)
  const grandTotalNilai = filtered.reduce((s, r) => s + r.totalNilai, 0)

  // Highlight cards
  const topContributor = [...filtered].sort((a, b) => b.totalKg - a.totalKg)[0]
  const mostGrowing = [...filtered].filter(s => s.status === "UP").sort((a, b) => b.trendKgPct - a.trendKgPct)[0]
  const needsAttention = [...filtered].filter(s => s.status === "DOWN").sort((a, b) => a.trendKgPct - b.trendKgPct)[0]

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(false) }
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <span className="text-slate-300 ml-1">↕</span>
    return <span className="text-cyan-500 ml-1">{sortAsc ? "↑" : "↓"}</span>
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800">Analisis Kontribusi Lapak</h3>
            <p className="text-xs text-slate-500 mt-0.5">Siapa yang mendorong volume bulan <strong>{bulanLabel}</strong> — dan siapa yang perlu perhatian</p>
          </div>
          {/* Warehouse Filter */}
          <select
            value={selectedWarehouse}
            onChange={e => setSelectedWarehouse(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 bg-white w-full sm:w-48"
          >
            <option value="all">Semua Gudang</option>
            {warehouseNames.map(w => (
              <option key={w.id} value={w.id}>{w.nama}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">

        {/* ── Highlight Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Top Contributor */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">1</div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Top Contributor</span>
            </div>
            {topContributor ? (
              <>
                <p className="font-bold text-slate-800 truncate text-sm mt-1">{topContributor.nama}</p>
                <p className="text-xs text-slate-500 mb-2">{topContributor.warehouseName}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-extrabold text-emerald-700">{formatKg(topContributor.totalKg)}</span>
                    <div className="text-xs text-emerald-600 mt-0.5">{topContributor.pctKg.toFixed(1)}% dari total</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-700">{formatRp(topContributor.totalNilai)}</div>
                    <div className="text-[10px] text-slate-400">{topContributor.transaksi} transaksi</div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400 mt-3">Tidak ada data</p>
            )}
          </div>

          {/* Most Growing */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-xl bg-blue-500 flex items-center justify-center text-white text-xs font-bold">▲</div>
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Paling Meningkat</span>
            </div>
            {mostGrowing ? (
              <>
                <p className="font-bold text-slate-800 truncate text-sm mt-1">{mostGrowing.nama}</p>
                <p className="text-xs text-slate-500 mb-2">{mostGrowing.warehouseName}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-extrabold text-blue-700">+{mostGrowing.trendKgPct.toFixed(1)}%</span>
                    <div className="text-xs text-blue-600 mt-0.5">vs bulan lalu</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-700">{formatKg(mostGrowing.totalKg)}</div>
                    <div className="text-[10px] text-slate-400">+{formatKg(mostGrowing.trendKgDelta)}</div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400 mt-3">Tidak ada lapak yang naik</p>
            )}
          </div>

          {/* Needs Attention */}
          <div className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-xl bg-rose-500 flex items-center justify-center text-white text-xs font-bold">!</div>
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Perlu Perhatian</span>
            </div>
            {needsAttention ? (
              <>
                <p className="font-bold text-slate-800 truncate text-sm mt-1">{needsAttention.nama}</p>
                <p className="text-xs text-slate-500 mb-2">{needsAttention.warehouseName}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-extrabold text-rose-700">{needsAttention.trendKgPct.toFixed(1)}%</span>
                    <div className="text-xs text-rose-600 mt-0.5">vs bulan lalu</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-700">{formatKg(needsAttention.totalKg)}</div>
                    <div className="text-[10px] text-slate-400">{formatKg(Math.abs(needsAttention.trendKgDelta))} turun</div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400 mt-3">Semua lapak stabil</p>
            )}
          </div>
        </div>

        {/* ── Search, Filter, Sort Controls ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Cari nama lapak..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>
          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "UP", "DOWN", "FLAT", "NEW"] as const).map(s => {
              const cfg = s === "all" ? null : STATUS_CONFIG[s]
              const isActive = statusFilter === s
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    isActive
                      ? s === "all"
                        ? "bg-slate-800 text-white border-slate-800"
                        : `${cfg!.bg} ${cfg!.text} ${cfg!.border}`
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {s === "all" ? "Semua" : `${cfg!.icon} ${cfg!.label}`}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Grand Total Summary ── */}
        {filtered.length > 0 && (
          <div className="flex flex-wrap gap-4 text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
            <span><strong>{filtered.length}</strong> lapak ditampilkan</span>
            <span className="text-slate-300">|</span>
            <span>Total Volume: <strong className="text-slate-800">{formatKg(grandTotalKg)}</strong></span>
            <span className="text-slate-300">|</span>
            <span>Total Nilai: <strong className="text-slate-800">{formatRp(grandTotalNilai)}</strong></span>
          </div>
        )}

        {/* ── Mobile Card View (< md) ── */}
        <div className="block md:hidden space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center text-slate-400 py-10 text-sm">Tidak ada lapak yang cocok.</div>
          ) : (
            filtered.map((s, i) => {
              const cfg = STATUS_CONFIG[s.status]
              const barPct = Math.min(s.pctKg, 100)
              return (
                <div key={s.supplierId} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 w-5 text-center">#{i + 1}</span>
                        <p className="font-bold text-slate-800 truncate">{s.nama}</p>
                      </div>
                      <p className="text-xs text-slate-400 ml-7">{s.warehouseName}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Kontribusi Volume</span>
                      <span className="font-bold text-slate-700">{s.pctKg.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-[10px] text-slate-400">Volume</p>
                      <p className="font-bold text-slate-800">{formatKg(s.totalKg)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Total Nilai</p>
                      <p className="font-semibold text-slate-700">{formatRp(s.totalNilai)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Bulan Lalu</p>
                      <p className="text-sm text-slate-600">{s.prevTotalKg > 0 ? formatKg(s.prevTotalKg) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Perubahan</p>
                      {s.status === "NEW" ? (
                        <span className="text-xs font-bold text-blue-600">Lapak Baru</span>
                      ) : s.prevTotalKg === 0 ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        <span className={`text-sm font-bold ${s.trendKgPct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {s.trendKgPct >= 0 ? "+" : ""}{s.trendKgPct.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ── Desktop Table (≥ md) ── */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Lapak</th>
                <th
                  onClick={() => handleSort("totalKg")}
                  className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-slate-700 select-none"
                >
                  Volume <SortIcon k="totalKg" />
                </th>
                <th
                  onClick={() => handleSort("pctKg")}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-slate-700 select-none"
                >
                  % Total <SortIcon k="pctKg" />
                </th>
                <th
                  onClick={() => handleSort("totalNilai")}
                  className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-slate-700 select-none"
                >
                  Total Nilai <SortIcon k="totalNilai" />
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Bulan Lalu</th>
                <th
                  onClick={() => handleSort("trendKgPct")}
                  className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-slate-700 select-none"
                >
                  Tren <SortIcon k="trendKgPct" />
                </th>
                <th
                  onClick={() => handleSort("transaksi")}
                  className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-slate-700 select-none"
                >
                  Transaksi <SortIcon k="transaksi" />
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    Tidak ada lapak yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => {
                  const cfg = STATUS_CONFIG[s.status]
                  const barPct = Math.min(s.pctKg, 100)
                  return (
                    <tr key={s.supplierId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{s.nama}</div>
                        <div className="text-xs text-slate-400">{s.warehouseName}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-bold text-slate-800 whitespace-nowrap">{formatKg(s.totalKg)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-700"
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-10 text-right">{s.pctKg.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700 whitespace-nowrap">
                        {formatRp(s.totalNilai)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-xs whitespace-nowrap">
                        {s.prevTotalKg > 0 ? formatKg(s.prevTotalKg) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {s.status === "NEW" ? (
                          <span className="text-xs font-bold text-blue-600">Lapak Baru</span>
                        ) : s.prevTotalKg === 0 ? (
                          <span className="text-xs text-slate-300">—</span>
                        ) : (
                          <span className={`text-sm font-bold ${s.trendKgPct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {s.trendKgPct >= 0 ? "+" : ""}{s.trendKgPct.toFixed(1)}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-semibold text-slate-700">{s.transaksi}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {/* Footer Total */}
            {filtered.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-xs font-extrabold text-slate-700 uppercase">
                    TOTAL ({filtered.length} lapak)
                  </td>
                  <td className="px-4 py-3 text-right font-extrabold text-slate-800 whitespace-nowrap">{formatKg(grandTotalKg)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <div className="flex-1 h-2 bg-cyan-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full w-full" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 w-10 text-right">100%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-extrabold text-slate-800 whitespace-nowrap">{formatRp(grandTotalNilai)}</td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-slate-500 text-sm font-medium">Belum ada data transaksi untuk periode ini.</p>
            <p className="text-slate-400 text-xs mt-1">Coba ubah filter gudang atau bulan.</p>
          </div>
        )}
      </div>
    </div>
  )
}
