"use client"

import { useState } from "react"
import { fmtKg, fmtAngka, fmtPct } from "@/lib/format"

interface SkuSusutDetail {
  skuName: string
  beratLapak: number
  beratGudang: number
  selisih: number
}

interface TransaksiSusutDetail {
  purchaseId: string
  nomorNota: string | null
  tanggal: string
  beratLapak: number
  beratGudang: number
  selisih: number
  skus: SkuSusutDetail[]
}

interface LapakSusutData {
  supplierId: string
  namaLapak: string
  warehouseId: string
  warehouseName: string
  totalLapak: number       // total timbangan lapak (kg)
  totalGudang: number      // total timbangan gudang (kg)
  selisih: number          // gudang - lapak (negatif = susut, positif = lebih)
  totalSusut: number       // total selisih negatif (penyusutan)
  totalLebih: number       // total selisih positif (kelebihan)
  transaksi: number
  pctSusut: number         // % susut dari lapak
  pctLebih: number         // % lebih dari lapak
  detailTransaksi: TransaksiSusutDetail[]
}

interface SusutLebihSummary {
  totalLapakAll: number
  totalGudangAll: number
  totalSusutAll: number
  totalLebihAll: number
  totalSelisihBersih: number
  pctSusutAll: number
  pctLebihAll: number
  transaksiDenganData: number
}

interface Props {
  lapakData: LapakSusutData[]
  summary: SusutLebihSummary
  warehouseNames: { id: string; nama: string }[]
}

export default function SusutLebihAnalytics({ lapakData, summary, warehouseNames }: Props) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"susut" | "lebih" | "volume">("susut")
  const [showMode, setShowMode] = useState<"semua" | "susut" | "lebih">("semua")
  const [selectedLapak, setSelectedLapak] = useState<LapakSusutData | null>(null)

  const filtered = lapakData.filter(d =>
    (selectedWarehouseId === "all" || d.warehouseId === selectedWarehouseId) &&
    (showMode === "semua" ||
      (showMode === "susut" && d.totalSusut > 0) ||
      (showMode === "lebih" && d.totalLebih > 0))
  )

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "susut") return b.totalSusut - a.totalSusut
    if (sortBy === "lebih") return b.totalLebih - a.totalLebih
    return b.totalLapak - a.totalLapak
  })

  // Summary for filtered data
  const filteredSummary = {
    totalLapak: sorted.reduce((s, d) => s + d.totalLapak, 0),
    totalGudang: sorted.reduce((s, d) => s + d.totalGudang, 0),
    totalSusut: sorted.reduce((s, d) => s + d.totalSusut, 0),
    totalLebih: sorted.reduce((s, d) => s + d.totalLebih, 0),
  }
  const filteredSusutPct = filteredSummary.totalLapak > 0
    ? (filteredSummary.totalSusut / filteredSummary.totalLapak) * 100 : 0
  const filteredLebihPct = filteredSummary.totalLapak > 0
    ? (filteredSummary.totalLebih / filteredSummary.totalLapak) * 100 : 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Analisis Susut & Lebih Timbangan per Lapak</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Selisih timbangan lapak vs timbangan gudang — susut berarti gudang lebih kecil dari lapak
            </p>
          </div>
          {/* Warehouse filter */}
          <select
            value={selectedWarehouseId}
            onChange={e => setSelectedWarehouseId(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none text-sm font-semibold text-slate-700 cursor-pointer"
          >
            <option value="all">Semua Gudang</option>
            {warehouseNames.map(w => (
              <option key={w.id} value={w.id}>{w.nama}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 border-b border-slate-100">
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Total Lapak</p>
          <p className="text-xl font-extrabold text-slate-800">{fmtKg(filteredSummary.totalLapak)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Timbangan lapak</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Total Gudang</p>
          <p className="text-xl font-extrabold text-slate-800">{fmtKg(filteredSummary.totalGudang)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Timbangan gudang</p>
        </div>
        <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
          <p className="text-xs text-rose-500 font-semibold uppercase tracking-wider mb-1">Total Susut</p>
          <p className="text-xl font-extrabold text-rose-700">{fmtKg(filteredSummary.totalSusut)}</p>
          <p className="text-xs text-rose-400 mt-0.5 font-semibold">{fmtPct(filteredSusutPct)} dari lapak</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">Total Lebih</p>
          <p className="text-xl font-extrabold text-emerald-700">{fmtKg(filteredSummary.totalLebih)}</p>
          <p className="text-xs text-emerald-500 mt-0.5 font-semibold">{fmtPct(filteredLebihPct)} dari lapak</p>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
        {/* Show mode toggle */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {([
            { key: "semua", label: "Semua Lapak", icon: "📋" },
            { key: "susut", label: "Ada Susut", icon: "📉" },
            { key: "lebih", label: "Ada Lebih", icon: "📈" },
          ] as const).map(m => (
            <button
              key={m.key}
              onClick={() => setShowMode(m.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                showMode === m.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>{m.icon}</span> {m.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Urutkan:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-cyan-500 outline-none cursor-pointer"
          >
            <option value="susut">Susut Terbesar</option>
            <option value="lebih">Lebih Terbesar</option>
            <option value="volume">Volume Terbesar</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="p-6">
        {sorted.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-12">
            <div className="text-4xl mb-3">⚖️</div>
            <p>Belum ada data timbangan lapak vs gudang untuk periode ini.</p>
            <p className="text-xs mt-1">Data muncul setelah transaksi melewati proses double-check admin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="sticky left-0 z-10 bg-slate-800 text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                    #
                  </th>
                  <th className="sticky left-8 z-10 bg-slate-800 text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                    Nama Lapak
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-slate-300">
                    Gudang
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                    Timbang Lapak
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                    Timbang Gudang
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-rose-300 border-l border-slate-600">
                    Susut (KG)
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-rose-300">
                    % Susut
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-emerald-300 border-l border-slate-600">
                    Lebih (KG)
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-emerald-300">
                    % Lebih
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap border-l border-slate-600">
                    Transaksi
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap border-l border-slate-600">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, idx) => {
                  const netSelisih = row.totalGudang - row.totalLapak
                  const isNetSusut = netSelisih < 0
                  const isNetLebih = netSelisih > 0

                  return (
                    <tr
                      key={row.supplierId}
                      className={`transition-colors hover:bg-slate-50 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                    >
                      <td className={`sticky left-0 z-10 px-4 py-3 text-xs font-bold text-slate-400 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                        {idx + 1}
                      </td>
                      <td className={`sticky left-8 z-10 px-4 py-3 font-semibold text-slate-800 whitespace-nowrap ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                        <div className="flex items-center gap-2">
                          {isNetSusut && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
                          {isNetLebih && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                          {!isNetSusut && !isNetLebih && <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />}
                          {row.namaLapak}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {row.warehouseName}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600 whitespace-nowrap text-xs">
                        {fmtKg(row.totalLapak)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600 whitespace-nowrap text-xs">
                        {fmtKg(row.totalGudang)}
                      </td>
                      {/* Susut */}
                      <td className="px-4 py-3 text-right border-l border-slate-100 whitespace-nowrap">
                        {row.totalSusut > 0 ? (
                          <span className="font-bold text-rose-600">{fmtKg(row.totalSusut)}</span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {row.totalSusut > 0 ? (
                          <span className="text-xs font-semibold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">
                            {fmtPct(row.pctSusut)}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      {/* Lebih */}
                      <td className="px-4 py-3 text-right border-l border-slate-100 whitespace-nowrap">
                        {row.totalLebih > 0 ? (
                          <span className="font-bold text-emerald-600">{fmtKg(row.totalLebih)}</span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {row.totalLebih > 0 ? (
                          <span className="text-xs font-semibold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                            {fmtPct(row.pctLebih)}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 border-l border-slate-100 whitespace-nowrap text-xs">
                        {fmtAngka(row.transaksi)}x
                      </td>
                      <td className="px-4 py-3 text-center border-l border-slate-100 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLapak(row)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold px-3 py-1.5 rounded-xl text-xs transition-all border border-indigo-100 shadow-sm"
                        >
                          🔍 Cek Detail
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {/* Footer total */}
              <tfoot>
                <tr className="bg-slate-800 text-white font-bold border-t-2 border-slate-600">
                  <td className="sticky left-0 z-10 bg-slate-800 px-4 py-3 text-xs" />
                  <td className="sticky left-8 z-10 bg-slate-800 px-4 py-3 text-xs uppercase tracking-wider">
                    TOTAL ({sorted.length} Lapak)
                  </td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {fmtKg(filteredSummary.totalLapak)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {fmtKg(filteredSummary.totalGudang)}
                  </td>
                  <td className="px-4 py-3 text-right border-l border-slate-600">
                    <span className="text-rose-300 font-mono text-xs">{fmtKg(filteredSummary.totalSusut)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-bold text-rose-300">{fmtPct(filteredSusutPct)}</span>
                  </td>
                  <td className="px-4 py-3 text-right border-l border-slate-600">
                    <span className="text-emerald-300 font-mono text-xs">{fmtKg(filteredSummary.totalLebih)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-bold text-emerald-300">{fmtPct(filteredLebihPct)}</span>
                  </td>
                  <td className="px-4 py-3 text-right border-l border-slate-600 text-xs">
                    {fmtAngka(sorted.reduce((s, d) => s + d.transaksi, 0))}x
                  </td>
                  <td className="border-l border-slate-600 px-4 py-3 text-xs" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail Susut per Lapak */}
      {selectedLapak && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in scale-in duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Detail Susut &amp; Lebih: {selectedLapak.namaLapak}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Collection Center: <span className="font-semibold text-slate-700">{selectedLapak.warehouseName}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedLapak(null)}
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200/50 rounded-xl transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 max-h-[60vh] scrollbar-thin scrollbar-thumb-slate-200">
              {selectedLapak.detailTransaksi && selectedLapak.detailTransaksi.length > 0 ? (
                selectedLapak.detailTransaksi.map((tx) => {
                  const hasShrinkage = tx.selisih < 0
                  return (
                    <div key={tx.purchaseId} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                      {/* Tx Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div>
                          <span className="font-mono font-bold text-slate-700 text-sm">
                            {tx.nomorNota || `#${tx.purchaseId.split("-")[0]}`}
                          </span>
                          <span className="text-[10px] text-slate-450 ml-2 font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                            {new Date(tx.tanggal).toLocaleDateString("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" })}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-xs font-mono font-medium px-2 py-0.5 bg-slate-100 rounded text-slate-600 flex items-center">
                            Lapak: {tx.beratLapak.toFixed(1)} kg · Gudang: {tx.beratGudang.toFixed(1)} kg
                          </span>
                          <span className={`text-xs font-mono font-extrabold px-2.5 py-1 rounded-lg border ${tx.selisih < 0 ? "bg-rose-50 text-rose-600 border-rose-100" : tx.selisih > 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-650"}`}>
                            {tx.selisih === 0 ? "Sesuai" : tx.selisih < 0 ? `Susut: ${tx.selisih.toFixed(1)} kg` : `Lebih: +${tx.selisih.toFixed(1)} kg`}
                          </span>
                        </div>
                      </div>

                      {/* Sku Breakdown */}
                      <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full text-left text-xs text-slate-600">
                          <thead>
                            <tr className="bg-slate-100 font-semibold text-slate-500">
                              <th className="px-4 py-2">Nama SKU</th>
                              <th className="px-4 py-2 text-right">Timbang Lapak</th>
                              <th className="px-4 py-2 text-right">Timbang Gudang</th>
                              <th className="px-4 py-2 text-right">Selisih</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {tx.skus.map((sku, sIdx) => {
                              const sDiff = sku.selisih
                              return (
                                <tr key={sIdx} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-4 py-2.5 font-bold text-slate-700">{sku.skuName}</td>
                                  <td className="px-4 py-2.5 text-right font-mono">{sku.beratLapak.toFixed(1)} kg</td>
                                  <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-800">{sku.beratGudang.toFixed(1)} kg</td>
                                  <td className="px-4 py-2.5 text-right font-mono whitespace-nowrap">
                                    {sDiff === 0 ? (
                                      <span className="text-emerald-600 font-bold">✓ 0 kg</span>
                                    ) : (
                                      <span className={`font-bold ${sDiff < 0 ? "text-rose-600" : "text-cyan-600"}`}>
                                        {sDiff < 0 ? `${sDiff.toFixed(1)} kg` : `+${sDiff.toFixed(1)} kg`}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-center text-slate-400 text-sm py-8">Tidak ada data transaksi pengiriman lapak ini.</p>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedLapak(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-slate-900/10"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
