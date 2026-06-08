"use client"

import { useState } from "react"
import { Search, Users, Target, Warehouse as WarehouseIcon, MessageCircle, MapPin, CreditCard, ArrowLeft, Copy, Check } from "lucide-react"
import { fmtKg, fmtTon } from "@/lib/format"
import Link from "next/link"

interface Supplier {
  id: string
  nama: string
  kontak_wa: string | null
  link: string | null
  nama_bank: string | null
  nomor_rekening: string | null
  atas_nama: string | null
  target_bulanan_kg: number
  warehouseId: string | null
  warehouse: {
    id: string
    nama: string
  } | null
}

interface Warehouse {
  id: string
  nama: string
}

export default function ManagerSuppliersClient({
  suppliers,
  warehouses
}: {
  suppliers: Supplier[]
  warehouses: Warehouse[]
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("all")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Hati-hati! Apakah Anda yakin ingin menghapus data lapak ini? Lapak tidak bisa dihapus jika memiliki riwayat transaksi/kasbon.")) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`/api/manager/suppliers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus data lapak");
      }
      alert("Data lapak berhasil dihapus.");
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  // 1. WhatsApp link helper
  const getWaLink = (num: string | null) => {
    if (!num) return "#"
    let clean = num.replace(/\D/g, "")
    if (clean.startsWith("0")) {
      clean = "62" + clean.slice(1)
    } else if (clean.startsWith("8")) {
      clean = "62" + clean
    }
    return `https://wa.me/${clean}`
  }

  // 2. Copy bank details helper
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // 3. Filter suppliers based on warehouse and search query
  const filteredSuppliers = suppliers.filter(s => {
    const matchesWarehouse = selectedWarehouseId === "all" || s.warehouseId === selectedWarehouseId
    
    const query = searchQuery.toLowerCase()
    const matchesSearch = 
      s.nama.toLowerCase().includes(query) ||
      (s.kontak_wa && s.kontak_wa.toLowerCase().includes(query)) ||
      (s.nama_bank && s.nama_bank.toLowerCase().includes(query)) ||
      (s.nomor_rekening && s.nomor_rekening.toLowerCase().includes(query)) ||
      (s.atas_nama && s.atas_nama.toLowerCase().includes(query)) ||
      (s.warehouse?.nama && s.warehouse.nama.toLowerCase().includes(query))

    return matchesWarehouse && matchesSearch
  })

  // 4. Calculate metrics for the currently filtered suppliers
  const totalLapakCount = filteredSuppliers.length
  const totalTargetKg = filteredSuppliers.reduce((sum, s) => sum + (s.target_bulanan_kg || 0), 0)
  
  // Count distinct warehouses in filtered list
  const activeWarehouseCount = new Set(
    filteredSuppliers.map(s => s.warehouseId).filter(Boolean)
  ).size

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Database Lapak (Supplier)</h2>
          <p className="text-slate-500 text-sm mt-1">
            Pantau dan kelola seluruh mitra lapak berdasarkan Collection Center masing-masing.
          </p>
        </div>
        <Link href="/dashboard/manager">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1: Total Lapak */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full translate-x-8 -translate-y-8" />
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 shadow-inner">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Lapak</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {totalLapakCount} <span className="text-sm font-semibold text-slate-500">Mitra</span>
            </p>
          </div>
        </div>

        {/* Metric 2: Total Target Tonase */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 rounded-full translate-x-8 -translate-y-8" />
          <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 shadow-inner">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Target Tonase</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {fmtTon(totalTargetKg)}{" "}
              <span className="text-xs font-semibold text-slate-400 block sm:inline sm:ml-1">
                ({fmtKg(totalTargetKg)})
              </span>
            </p>
          </div>
        </div>

        {/* Metric 3: Active Warehouses */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full translate-x-8 -translate-y-8" />
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
            <WarehouseIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Gudang Aktif</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {activeWarehouseCount} <span className="text-sm font-semibold text-slate-500">Collection Center</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Warehouse Pills (Horizontal Scroll on Mobile) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none w-full lg:w-auto">
            <button
              onClick={() => setSelectedWarehouseId("all")}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                selectedWarehouseId === "all"
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Semua Gudang
            </button>
            {warehouses.map(w => {
              const cleanedName = w.nama.replace(/^Gudang\s+/i, "CC ")
              const isActive = selectedWarehouseId === w.id
              return (
                <button
                  key={w.id}
                  onClick={() => setSelectedWarehouseId(w.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/10"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {cleanedName}
                </button>
              )
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari lapak, rekening, atau kontak..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white text-slate-800 transition-all font-medium"
            />
          </div>
        </div>

        {/* Suppliers List Table */}
        {filteredSuppliers.length > 0 ? (
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 bg-slate-900 text-white z-10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Nama Lapak</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Collection Center</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Target Bulanan</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Informasi Rekening</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">Aksi / Kontak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredSuppliers.map(s => {
                    const cleanedCity = s.warehouse?.nama.replace(/^Gudang\s+/i, "") || "CC"
                    const mapsLink = s.link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.nama + " " + (s.warehouse?.nama || ""))}`
                    
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors group">
                        {/* Nama Lapak */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/dashboard/manager/suppliers/${s.id}`}
                            className="font-bold text-slate-800 text-sm block hover:text-cyan-600 transition-colors"
                          >
                            {s.nama}
                          </Link>
                        </td>
                        {/* Collection Center */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-600 uppercase tracking-wider shadow-inner">
                            CC {cleanedCity}
                          </span>
                        </td>
                        {/* Target Bulanan */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="inline-flex flex-col items-end">
                            <span className="text-slate-800 font-extrabold text-sm">
                              {s.target_bulanan_kg > 0 ? fmtTon(s.target_bulanan_kg) : "—"}
                            </span>
                            {s.target_bulanan_kg > 0 && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                ({fmtKg(s.target_bulanan_kg)})
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Informasi Rekening */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {s.nomor_rekening ? (
                            <div className="flex items-center gap-2">
                              <div className="bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100 flex items-center gap-2">
                                <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <div className="text-xs">
                                  <span className="font-bold text-slate-700">{s.nama_bank}</span>
                                  <span className="font-mono text-slate-600 font-semibold ml-1.5">{s.nomor_rekening}</span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">a.n. {s.atas_nama || "—"}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleCopy(s.id, s.nomor_rekening || "")}
                                className="text-slate-400 hover:text-cyan-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
                                title="Salin nomor rekening"
                              >
                                {copiedId === s.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Belum dilengkapi</span>
                          )}
                        </td>
                        {/* Aksi / Kontak */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="inline-flex items-center justify-center gap-2">
                            <Link
                              href={`/dashboard/manager/suppliers/${s.id}`}
                              className="flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-indigo-100/50"
                              title="Detail Lapak"
                            >
                              Detail
                            </Link>

                            {s.kontak_wa ? (
                              <a
                                href={getWaLink(s.kontak_wa)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-emerald-100/50"
                                title="Chat WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                                WA
                              </a>
                            ) : (
                              <button
                                disabled
                                className="flex items-center justify-center gap-1.5 bg-slate-50 text-slate-400 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-100 cursor-not-allowed"
                                title="Tidak ada kontak WA"
                              >
                                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                                WA
                              </button>
                            )}

                            <a
                              href={mapsLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-cyan-100/50"
                              title="Buka Maps"
                            >
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              Maps
                            </a>
                            <button
                              onClick={() => handleDelete(s.id)}
                              disabled={deletingId === s.id}
                              className="flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-red-100/50 disabled:opacity-50"
                              title="Hapus Lapak"
                            >
                              {deletingId === s.id ? "Menghapus..." : "Hapus"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl p-12 text-center border border-dashed border-slate-200">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700">Mitra Lapak Tidak Ditemukan</h4>
            <p className="text-slate-400 text-xs mt-1">
              Tidak ada mitra yang cocok dengan filter atau kata kunci pencarian Anda.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
