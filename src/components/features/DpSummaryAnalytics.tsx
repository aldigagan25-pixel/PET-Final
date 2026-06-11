"use client"

import { useState } from "react"
import { fmtRp } from "@/lib/format"
import { Wallet, CreditCard, ChevronRight, User, Warehouse as WarehouseIcon } from "lucide-react"

interface DpSupplierRow {
  supplierId: string
  namaLapak: string
  warehouseId: string
  warehouseName: string
  totalDp: number
  totalUsed: number
  sisaDp: number
  transaksiDp: number
}

interface DpSummaryAnalyticsProps {
  dpData: DpSupplierRow[]
  warehouseNames: { id: string; nama: string }[]
}

export default function DpSummaryAnalytics({ dpData, warehouseNames }: DpSummaryAnalyticsProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("all")

  // Filter data based on warehouse dropdown
  const filtered = dpData.filter(d => 
    selectedWarehouseId === "all" || d.warehouseId === selectedWarehouseId
  )

  // Calculations for filtered data
  const totalApproved = filtered.reduce((s, d) => s + d.totalDp, 0)
  const totalUsed = filtered.reduce((s, d) => s + d.totalUsed, 0)
  const totalRemaining = filtered.reduce((s, d) => s + d.sisaDp, 0)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-violet-50/50 to-indigo-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-600" />
              Rekap Saldo DP &amp; Kasbon per Lapak
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Pantau total dana uang muka (down payment) disetujui, terpakai, dan sisa saldo aktif supplier.
            </p>
          </div>
          {/* Warehouse filter */}
          <select
            value={selectedWarehouseId}
            onChange={e => setSelectedWarehouseId(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 bg-white hover:bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-slate-700 cursor-pointer shadow-sm transition-all"
          >
            <option value="all">Semua Gudang</option>
            {warehouseNames.map(w => (
              <option key={w.id} value={w.id}>{w.nama}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Summary Card Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border-b border-slate-100">
        {/* Metric 1: Total Approved DP */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total DP Disetujui</p>
            <p className="text-lg font-extrabold text-slate-800 font-mono mt-0.5">{fmtRp(totalApproved)}</p>
          </div>
        </div>

        {/* Metric 2: Total Used DP */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total DP Terpakai</p>
            <p className="text-lg font-extrabold text-slate-800 font-mono mt-0.5">{fmtRp(totalUsed)}</p>
          </div>
        </div>

        {/* Metric 3: Total Remaining DP */}
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Sisa Saldo DP Aktif</p>
            <p className="text-lg font-extrabold text-emerald-700 font-mono mt-0.5">{fmtRp(totalRemaining)}</p>
          </div>
        </div>
      </div>

      {/* List Card Section (No Horizontal Scroll) */}
      <div className="p-6 space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-12 border border-dashed border-slate-200 rounded-2xl">
            <div className="text-4xl mb-3">💸</div>
            <p className="font-semibold">Belum ada data DP / Kasbon disetujui.</p>
            <p className="text-xs mt-1">Data saldo akan terisi setelah manager menyetujui pengajuan DP lapak.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((row, idx) => (
              <div
                key={row.supplierId}
                className="bg-white hover:bg-slate-50/50 rounded-2xl p-5 border border-slate-100 shadow-sm transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 group"
              >
                {/* Supplier Info */}
                <div className="flex items-start gap-3 lg:w-1/4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-extrabold text-sm shrink-0 shadow-inner">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-800 text-base flex items-center gap-2 flex-wrap">
                      {row.namaLapak}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100/50">
                        {row.transaksiDp}x DP disetujui
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 mt-1 block">
                      CC: <span className="font-bold text-slate-600">{row.warehouseName}</span>
                    </span>
                  </div>
                </div>

                {/* Timbangan / DP values */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                  {/* Total DP */}
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100/50">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total DP Disetujui</span>
                    <span className="font-mono text-slate-700 font-bold text-sm block mt-1">{fmtRp(row.totalDp)}</span>
                  </div>

                  {/* DP Terpakai */}
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100/50">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Terpakai</span>
                    <span className="font-mono text-slate-600 font-semibold text-sm block mt-1">{fmtRp(row.totalUsed)}</span>
                  </div>

                  {/* Sisa DP */}
                  <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100">
                    <span className="text-[10px] text-emerald-600 font-semibold uppercase block">Sisa DP Aktif</span>
                    <span className="font-mono text-emerald-700 font-extrabold text-sm block mt-1">{fmtRp(row.sisaDp)}</span>
                  </div>
                </div>

                {/* View Detail Link to Supplier page */}
                <div className="flex items-center justify-end lg:w-40 shrink-0">
                  <a
                    href={`/dashboard/manager/suppliers/${row.supplierId}`}
                    className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800 font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-slate-950/10 flex items-center justify-center gap-1"
                  >
                    Detail Lapak
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
