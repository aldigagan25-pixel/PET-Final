"use client"

import { useState } from "react"

interface WarehouseAmbilKirim {
  warehouseId: string
  warehouseName: string
  jumlahAmbil: number
  jumlahKirim: number
  total: number
}

interface AmbilKirimSummary {
  totalAmbil: number
  totalKirim: number
  total: number
  perWarehouse: WarehouseAmbilKirim[]
}

export default function AmbilKirimAnalytics({ data }: { data: AmbilKirimSummary }) {
  const [activeWarehouse, setActiveWarehouse] = useState<string>("all")

  const pctAmbil = data.total > 0 ? (data.totalAmbil / data.total) * 100 : 0
  const pctKirim = data.total > 0 ? (data.totalKirim / data.total) * 100 : 0

  const activeData = activeWarehouse === "all"
    ? { jumlahAmbil: data.totalAmbil, jumlahKirim: data.totalKirim, total: data.total }
    : data.perWarehouse.find(w => w.warehouseId === activeWarehouse) || { jumlahAmbil: 0, jumlahKirim: 0, total: 0 }

  const activePctAmbil = activeData.total > 0 ? (activeData.jumlahAmbil / activeData.total) * 100 : 0
  const activePctKirim = activeData.total > 0 ? (activeData.jumlahKirim / activeData.total) * 100 : 0

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-200 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
            <rect width="13" height="13" x="9" y="9" rx="2" ry="2"/>
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Rekap Ambil / Kirim Barang</h3>
          <p className="text-xs text-slate-400 mt-0.5">Jumlah transaksi per jenis pengambilan bulan ini</p>
        </div>
      </div>

      {/* Filter Gudang */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setActiveWarehouse("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeWarehouse === "all"
              ? "bg-violet-600 text-white shadow-md shadow-violet-200"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          Semua Gudang
        </button>
        {data.perWarehouse.map(w => (
          <button
            key={w.warehouseId}
            onClick={() => setActiveWarehouse(w.warehouseId)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeWarehouse === w.warehouseId
                ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {w.warehouseName}
          </button>
        ))}
      </div>

      {/* Big Cards */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* AMBIL */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📦</span>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Diambil</span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-700">{activeData.jumlahAmbil}</div>
          <div className="text-xs text-emerald-600 mt-1">transaksi</div>
          <div className="mt-3 w-full bg-emerald-100 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${activePctAmbil}%` }}
            />
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">{activePctAmbil.toFixed(1)}% dari total</div>
        </div>

        {/* KIRIM */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🚛</span>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Dikirim</span>
          </div>
          <div className="text-3xl font-extrabold text-blue-700">{activeData.jumlahKirim}</div>
          <div className="text-xs text-blue-600 mt-1">transaksi</div>
          <div className="mt-3 w-full bg-blue-100 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${activePctKirim}%` }}
            />
          </div>
          <div className="text-[10px] text-blue-600 font-semibold mt-1">{activePctKirim.toFixed(1)}% dari total</div>
        </div>
      </div>

      {/* Tabel per Gudang (only when "all" selected) */}
      {activeWarehouse === "all" && data.perWarehouse.length > 0 && (
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Gudang</th>
                <th className="text-center px-3 py-2.5 font-bold text-emerald-600 uppercase tracking-wider">📦 Ambil</th>
                <th className="text-center px-3 py-2.5 font-bold text-blue-600 uppercase tracking-wider">🚛 Kirim</th>
                <th className="text-center px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.perWarehouse.map((w, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-700">{w.warehouseName}</td>
                  <td className="px-3 py-3 text-center">
                    <span className="inline-flex items-center justify-center min-w-[36px] px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 font-bold">
                      {w.jumlahAmbil}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="inline-flex items-center justify-center min-w-[36px] px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 font-bold">
                      {w.jumlahKirim}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center font-semibold text-slate-600">{w.total}</td>
                </tr>
              ))}
              {/* Total Row */}
              <tr className="bg-slate-50 border-t border-slate-200">
                <td className="px-4 py-3 font-extrabold text-slate-800">TOTAL</td>
                <td className="px-3 py-3 text-center">
                  <span className="inline-flex items-center justify-center min-w-[36px] px-2 py-0.5 rounded-lg bg-emerald-200 text-emerald-800 font-extrabold">
                    {data.totalAmbil}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="inline-flex items-center justify-center min-w-[36px] px-2 py-0.5 rounded-lg bg-blue-200 text-blue-800 font-extrabold">
                    {data.totalKirim}
                  </span>
                </td>
                <td className="px-3 py-3 text-center font-extrabold text-slate-800">{data.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {data.total === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm">
          <div className="text-3xl mb-2">📊</div>
          Belum ada data pengambilan barang bulan ini
        </div>
      )}
    </div>
  )
}
