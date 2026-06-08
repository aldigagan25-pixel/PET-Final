"use client"

import { useState } from "react"
import { fmtKg, fmtRpPerKg, fmtAngka } from "@/lib/format"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts"

interface TopSupplier {
  supplierId: string
  nama: string
  totalKg: number
  avgHarga: number
  transaksi: number
}

interface WarehouseTopData {
  warehouseId: string
  warehouseName: string
  topByVolume: TopSupplier[]
  topByHarga: TopSupplier[]
}

interface Props {
  warehouseTopData: WarehouseTopData[]
}

const COLORS = [
  "#0ea5e9","#6366f1","#8b5cf6","#ec4899","#f59e0b",
  "#10b981","#3b82f6","#f97316","#14b8a6","#ef4444"
]

export default function TopLapakAnalytics({ warehouseTopData }: Props) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouseTopData[0]?.warehouseId || "")
  const [mode, setMode] = useState<"volume" | "harga">("volume")

  const activeWarehouse = warehouseTopData.find(w => w.warehouseId === selectedWarehouseId)
  const suppliers = mode === "volume"
    ? activeWarehouse?.topByVolume || []
    : activeWarehouse?.topByHarga || []

  const chartData = suppliers.map((s, i) => ({
    name: s.nama.length > 14 ? s.nama.slice(0, 14) + "…" : s.nama,
    fullName: s.nama,
    value: mode === "volume" ? s.totalKg : s.avgHarga,
    transaksi: s.transaksi,
    color: COLORS[i % COLORS.length],
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-sm min-w-[180px]">
        <p className="font-bold text-slate-800 mb-2">{d.fullName}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">{mode === "volume" ? "Total Volume" : "Rata-rata Harga"}</span>
            <span className="font-semibold text-slate-800">
              {mode === "volume" ? fmtKg(d.value) : fmtRpPerKg(d.value)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Transaksi</span>
            <span className="font-semibold text-slate-800">{fmtAngka(d.transaksi)}x</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Top 10 Lapak / Supplier</h3>
            <p className="text-xs text-slate-400 mt-0.5">Peringkat lapak terbaik per gudang</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Warehouse selector */}
            <select
              value={selectedWarehouseId}
              onChange={e => setSelectedWarehouseId(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none text-sm font-semibold text-slate-700 cursor-pointer"
            >
              {warehouseTopData.map(w => (
                <option key={w.warehouseId} value={w.warehouseId}>
                  Gudang {w.warehouseName}
                </option>
              ))}
            </select>

            {/* Mode toggle */}
            <div className="flex bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setMode("volume")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === "volume"
                    ? "bg-white text-cyan-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                📦 Volume Terbanyak
              </button>
              <button
                onClick={() => setMode("harga")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === "harga"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                💰 Harga Tertinggi
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {suppliers.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-12">
            <div className="text-4xl mb-3">📊</div>
            <p>Belum ada data transaksi untuk gudang ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                {mode === "volume" ? "Volume Pembelian (KG)" : "Rata-rata Harga per KG (Rp)"}
              </p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ left: 0, right: 20, top: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis
                      type="number"
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      tickFormatter={v =>
                        mode === "volume"
                          ? v >= 1000 ? `${fmtAngka(v / 1000, 0)}t` : fmtAngka(v)
                          : `${fmtAngka(v / 1000, 0)}k`
                      }
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={90}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                      {chartData.map((entry: any, index: number) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ranking Table */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Peringkat Detail
              </p>
              <div className="space-y-2">
                {suppliers.map((s, i) => (
                  <div
                    key={s.supplierId}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    {/* Rank badge */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 text-white"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    >
                      {i + 1}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{s.nama}</p>
                      <p className="text-[11px] text-slate-400">{fmtAngka(s.transaksi)} transaksi</p>
                    </div>

                    {/* Value */}
                    <div className="text-right shrink-0">
                      {mode === "volume" ? (
                        <>
                          <p className="text-sm font-bold text-cyan-700">{fmtKg(s.totalKg)}</p>
                          <p className="text-[11px] text-slate-400">{fmtRpPerKg(s.avgHarga)}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-indigo-700">{fmtRpPerKg(s.avgHarga)}</p>
                          <p className="text-[11px] text-slate-400">{fmtKg(s.totalKg)}</p>
                        </>
                      )}
                    </div>

                    {/* Relative bar */}
                    <div className="w-16 shrink-0">
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            backgroundColor: COLORS[i % COLORS.length],
                            width: suppliers[0]
                              ? `${((mode === "volume" ? s.totalKg : s.avgHarga) /
                                (mode === "volume" ? suppliers[0].totalKg : suppliers[0].avgHarga)) * 100}%`
                              : "0%"
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
