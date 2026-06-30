"use client"

import { useState } from "react"
import {
  Search,
  Users,
  Target,
  Warehouse as WarehouseIcon,
  MessageCircle,
  MapPin,
  CreditCard,
  ArrowLeft,
  Copy,
  Check,
  Star,
  AlertTriangle,
  TrendingUp,
  Activity,
  Award
} from "lucide-react"
import { fmtKg, fmtTon, fmtRp, fmtPct } from "@/lib/format"
import Link from "next/link"

interface SkuPriceStandard {
  id: string
  sku_name: string
  warehouseId: string
  max_price_per_kg: number
}

interface PurchaseItem {
  id: string
  sku_name: string
  spec: string | null
  berat_lapak: number | null
  berat_final_item: number
  harga_per_kg: number
  subtotal: number
}

interface Purchase {
  id: string
  nomor_nota: string | null
  tanggal: string
  warehouseId: string
  supplierId: string
  berat_timbangan_lapak: number | null
  berat_timbangan_gudang: number | null
  total_nilai_sebelum_retur: number | null
  total_nilai_setelah_retur: number | null
  total_dibayar: number | null
  status_approval: string
  createdAt: string
  items: PurchaseItem[]
}

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
  purchases: Purchase[]
}

interface Warehouse {
  id: string
  nama: string
}

export default function ManagerSuppliersClient({
  suppliers,
  warehouses,
  skuPrices = []
}: {
  suppliers: Supplier[]
  warehouses: Warehouse[]
  skuPrices: SkuPriceStandard[]
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("all")
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<"all" | "A" | "B" | "C" | "active">("all")
  
  // Month & Year state for performance tracking
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const [selectedMonth, setSelectedMonth] = useState<number | "all">(currentMonth)
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const MONTHS = [
    { value: "all", label: "Semua Bulan" },
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" }
  ]

  const YEARS = [2025, 2026, 2027]

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

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // 1. Calculate performance details for a supplier under selected warehouse and month/year
  const getSupplierPerformance = (s: Supplier) => {
    const filteredPurchases = s.purchases.filter(p => {
      const matchWarehouse = selectedWarehouseId === "all" || p.warehouseId === selectedWarehouseId
      
      let matchDate = true
      if (selectedMonth !== "all") {
        const pDate = new Date(p.tanggal)
        const pMonth = pDate.getUTCMonth() + 1
        const pYear = pDate.getUTCFullYear()
        matchDate = pMonth === selectedMonth && pYear === selectedYear
      } else {
        const pDate = new Date(p.tanggal)
        matchDate = pDate.getUTCFullYear() === selectedYear
      }
      
      return matchWarehouse && matchDate
    })

    const totalTransactions = filteredPurchases.length

    // 2. Kuantiti (Quantity) calculations
    const totalGudangWeight = filteredPurchases.reduce((sum, p) => sum + (p.berat_timbangan_gudang || 0), 0)
    let qtyScore = 0
    let targetPct = 0
    if (s.target_bulanan_kg > 0) {
      targetPct = (totalGudangWeight / s.target_bulanan_kg) * 100
      qtyScore = Math.min(targetPct, 100)
    } else {
      if (totalGudangWeight >= 5000) qtyScore = 100
      else if (totalGudangWeight >= 2000) qtyScore = 80
      else if (totalGudangWeight >= 500) qtyScore = 60
      else if (totalGudangWeight > 0) qtyScore = 40
      else qtyScore = 0
    }

    // 3. Kualitas (Quality) calculations
    let totalSusut = 0
    let totalLapakWeight = 0
    filteredPurchases.forEach(p => {
      const lapak = p.berat_timbangan_lapak || 0
      const gudang = p.berat_timbangan_gudang || 0
      const selisih = gudang - lapak
      totalLapakWeight += lapak
      if (selisih < 0) {
        totalSusut += Math.abs(selisih)
      }
    })
    const pctSusut = totalLapakWeight > 0 ? (totalSusut / totalLapakWeight) * 100 : 0
    
    let qualityScore = 100
    if (totalLapakWeight > 0) {
      qualityScore = Math.max(0, 100 - (pctSusut * 25)) // 4% susut or more = 0 score
    }

    // 4. Harga (Price Efficiency) calculations
    let totalSubtotal = 0
    let totalItemWeight = 0
    let warningCount = 0
    
    filteredPurchases.forEach(p => {
      p.items.forEach(item => {
        const itemWeight = item.berat_final_item || 0
        const itemSubtotal = item.subtotal || (itemWeight * item.harga_per_kg) || 0
        totalSubtotal += itemSubtotal
        totalItemWeight += itemWeight

        const std = skuPrices.find(sp => sp.sku_name === item.sku_name && sp.warehouseId === p.warehouseId)
        if (std && item.harga_per_kg > std.max_price_per_kg) {
          warningCount++
        }
      })
    })

    const avgPrice = totalItemWeight > 0 ? totalSubtotal / totalItemWeight : 0
    let priceScore = 100
    if (totalTransactions > 0) {
      priceScore = Math.max(50, 100 - (warningCount * 20))
    }

    // 5. Overall Performance Index (OPI)
    let opi = 0
    let grade = "—"
    let gradeLabel = "Belum Ada Data"
    let gradeColor = "bg-slate-50 text-slate-400 border-slate-200"
    let stars = 0

    if (totalTransactions > 0) {
      opi = (qtyScore * 0.4) + (qualityScore * 0.4) + (priceScore * 0.2)
      if (opi >= 85) {
        grade = "A"
        gradeLabel = "Sangat Bagus"
        gradeColor = "bg-emerald-50 text-emerald-700 border-emerald-200"
        stars = 3
      } else if (opi >= 60) {
        grade = "B"
        gradeLabel = "Bagus/Cukup"
        gradeColor = "bg-blue-50 text-blue-700 border-blue-200"
        stars = 2
      } else {
        grade = "C"
        gradeLabel = "Perlu Evaluasi"
        gradeColor = "bg-rose-50 text-rose-700 border-rose-200"
        stars = 1
      }
    }

    return {
      totalTransactions,
      totalGudangWeight,
      targetPct,
      totalSusut,
      pctSusut,
      avgPrice,
      warningCount,
      opi,
      grade,
      gradeLabel,
      gradeColor,
      stars
    }
  }

  // Filter & calculate list of suppliers with performance
  const suppliersWithPerformance = suppliers.map(s => {
    const performance = getSupplierPerformance(s)
    return {
      ...s,
      performance
    }
  })

  // Filter based on warehouse and search query (base list without grade filter)
  const baseFilteredSuppliers = suppliersWithPerformance.filter(s => {
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

  // Global Performance metrics for base list (updates dynamically on warehouse/date search)
  const totalLapakCount = baseFilteredSuppliers.length
  const activeLapakCount = baseFilteredSuppliers.filter(s => s.performance.totalTransactions > 0).length
  const gradeACount = baseFilteredSuppliers.filter(s => s.performance.grade === "A").length
  const gradeBCount = baseFilteredSuppliers.filter(s => s.performance.grade === "B").length
  const gradeCCount = baseFilteredSuppliers.filter(s => s.performance.grade === "C").length
  const totalWeightFiltered = baseFilteredSuppliers.reduce((sum, s) => sum + s.performance.totalGudangWeight, 0)

  // Apply grade/status quick filter
  const filteredSuppliers = baseFilteredSuppliers.filter(s => {
    let matchesGrade = true
    if (selectedGradeFilter === "A") {
      matchesGrade = s.performance.grade === "A"
    } else if (selectedGradeFilter === "B") {
      matchesGrade = s.performance.grade === "B"
    } else if (selectedGradeFilter === "C") {
      matchesGrade = s.performance.grade === "C"
    } else if (selectedGradeFilter === "active") {
      matchesGrade = s.performance.totalTransactions > 0
    }
    return matchesGrade
  })

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Analisis Kinerja Mitra Lapak</h2>
          <p className="text-slate-500 text-sm mt-1">
            Evaluasi performa supplier berdasarkan 3 indikator utama: Kuantitas (Volume), Kualitas (Penyusutan), dan Harga (Kepatuhan Limit).
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Active */}
        <button
          onClick={() => setSelectedGradeFilter(prev => prev === "active" ? "all" : "active")}
          className={`rounded-2xl p-5 shadow-sm border flex items-center gap-4 relative overflow-hidden text-left transition-all cursor-pointer outline-none ${
            selectedGradeFilter === "active"
              ? "bg-cyan-50/50 border-cyan-500 ring-2 ring-cyan-500/20 scale-[1.02] shadow-md"
              : "bg-white border-slate-100 hover:border-slate-300 hover:shadow"
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            selectedGradeFilter === "active" ? "bg-cyan-600 text-white" : "bg-cyan-50 text-cyan-600"
          }`}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Mitra Aktif</p>
            <p className="text-lg font-extrabold text-slate-900 mt-1">
              {activeLapakCount} <span className="text-xs font-semibold text-slate-500">/ {totalLapakCount} Lapak</span>
            </p>
          </div>
          {selectedGradeFilter === "active" && (
            <div className="absolute right-2 top-2 bg-cyan-600 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase">Filter Aktif</div>
          )}
        </button>

        {/* Metric 2: Grade A */}
        <button
          onClick={() => setSelectedGradeFilter(prev => prev === "A" ? "all" : "A")}
          className={`rounded-2xl p-5 shadow-sm border flex items-center gap-4 relative overflow-hidden text-left transition-all cursor-pointer outline-none ${
            selectedGradeFilter === "A"
              ? "bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 scale-[1.02] shadow-md"
              : "bg-white border-slate-100 hover:border-slate-300 hover:shadow"
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            selectedGradeFilter === "A" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-600"
          }`}>
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Kinerja A (Sangat Bagus)</p>
            <p className="text-lg font-extrabold text-emerald-700 mt-1">
              {gradeACount} <span className="text-xs font-semibold text-slate-400">Lapak</span>
            </p>
          </div>
          {selectedGradeFilter === "A" && (
            <div className="absolute right-2 top-2 bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase">Filter Aktif</div>
          )}
        </button>

        {/* Metric 3: Grade B */}
        <button
          onClick={() => setSelectedGradeFilter(prev => prev === "B" ? "all" : "B")}
          className={`rounded-2xl p-5 shadow-sm border flex items-center gap-4 relative overflow-hidden text-left transition-all cursor-pointer outline-none ${
            selectedGradeFilter === "B"
              ? "bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/20 scale-[1.02] shadow-md"
              : "bg-white border-slate-100 hover:border-slate-300 hover:shadow"
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            selectedGradeFilter === "B" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
          }`}>
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">Kinerja B (Bagus/Cukup)</p>
            <p className="text-lg font-extrabold text-blue-700 mt-1">
              {gradeBCount} <span className="text-xs font-semibold text-slate-400">Lapak</span>
            </p>
          </div>
          {selectedGradeFilter === "B" && (
            <div className="absolute right-2 top-2 bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase">Filter Aktif</div>
          )}
        </button>

        {/* Metric 4: Grade C */}
        <button
          onClick={() => setSelectedGradeFilter(prev => prev === "C" ? "all" : "C")}
          className={`rounded-2xl p-5 shadow-sm border flex items-center gap-4 relative overflow-hidden text-left transition-all cursor-pointer outline-none ${
            selectedGradeFilter === "C"
              ? "bg-rose-50/50 border-rose-500 ring-2 ring-rose-500/20 scale-[1.02] shadow-md"
              : "bg-white border-slate-100 hover:border-slate-300 hover:shadow"
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            selectedGradeFilter === "C" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-600"
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-rose-600 font-semibold uppercase tracking-wider">Kinerja C (Perlu Evaluasi)</p>
            <p className="text-lg font-extrabold text-rose-700 mt-1">
              {gradeCCount} <span className="text-xs font-semibold text-slate-400">Lapak</span>
            </p>
          </div>
          {selectedGradeFilter === "C" && (
            <div className="absolute right-2 top-2 bg-rose-600 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase">Filter Aktif</div>
          )}
        </button>
      </div>

      {/* Active Grade Filter Alert */}
      {selectedGradeFilter !== "all" && (
        <div className="bg-indigo-50 border border-indigo-150 border-indigo-200 text-indigo-700 px-4 py-3 rounded-2xl text-xs flex justify-between items-center font-bold shadow-sm animate-in fade-in duration-200">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            Menampilkan hasil untuk filter: <span className="underline font-black">{
              selectedGradeFilter === "active" ? "Mitra Aktif" :
              selectedGradeFilter === "A" ? "Kinerja A (Sangat Bagus)" :
              selectedGradeFilter === "B" ? "Kinerja B (Bagus/Cukup)" :
              "Kinerja C (Perlu Evaluasi)"
            }</span> ({filteredSuppliers.length} Lapak ditemukan)
          </span>
          <button
            onClick={() => setSelectedGradeFilter("all")}
            className="text-indigo-650 hover:text-indigo-800 underline font-black text-xs cursor-pointer ml-2"
          >
            Bersihkan Filter ×
          </button>
        </div>
      )}

      {/* Filter and Search Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          
          {/* Warehouse Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedWarehouseId("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedWarehouseId === "all"
                  ? "bg-slate-900 text-white shadow-md"
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
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-cyan-600 text-white shadow-md"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {cleanedName}
                </button>
              )
            })}
          </div>

          {/* Month & Year Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Month Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-bold uppercase">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={e => {
                  const val = e.target.value
                  setSelectedMonth(val === "all" ? "all" : parseInt(val))
                }}
                className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-700 cursor-pointer outline-none transition-all shadow-sm"
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Year Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-bold uppercase">Tahun:</span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
                className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-700 cursor-pointer outline-none transition-all shadow-sm"
              >
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama lapak..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white text-slate-800 transition-all font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Info Box about Indicators */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center text-xs text-slate-550">
          <div className="space-y-1">
            <p className="font-bold text-slate-700">💡 Cara Penilaian Performa Mitra Lapak:</p>
            <p className="text-slate-500">
              Performa dinilai secara matematis menggunakan bobot: <strong>Kuantitas Volume (40%)</strong>, <strong>Kualitas / Penyusutan (40%)</strong>, dan <strong>Harga (20%)</strong>.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-[10px] font-bold">
            <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100">Grade A (≥ 85): Prima</span>
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">Grade B (60-84): Cukup</span>
            <span className="bg-rose-50 text-rose-700 px-2 py-1 rounded border border-rose-100">Grade C (&lt; 60): Evaluasi</span>
          </div>
        </div>

        {/* Suppliers List Cards Layout (No Horizontal Scroll) */}
        {filteredSuppliers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSuppliers.map((s) => {
              const perf = s.performance
              const cleanedCity = s.warehouse?.nama.replace(/^Gudang\s+/i, "") || "CC"
              const mapsLink = s.link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.nama + " " + (s.warehouse?.nama || ""))}`
              
              return (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-slate-150 border-slate-200/60 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 relative group overflow-hidden"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/manager/suppliers/${s.id}`}
                          className="font-extrabold text-slate-800 text-lg hover:text-cyan-600 transition-colors block truncate"
                        >
                          {s.nama}
                        </Link>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-cyan-50 text-cyan-600 uppercase tracking-wider inline-block mt-1">
                          CC {cleanedCity}
                        </span>
                      </div>
                      
                      {/* Overall Performance Badge */}
                      <div className="flex flex-col items-end shrink-0">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black border tracking-wide shadow-sm flex items-center gap-1 ${perf.gradeColor}`}>
                          Grade {perf.grade}
                        </span>
                        {perf.stars > 0 && (
                          <div className="flex gap-0.5 mt-1">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < perf.stars ? "fill-amber-400 text-amber-400 animate-pulse" : "text-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Performance Indicators Grid (3 Indicators) */}
                  <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100/50 space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">3 Indikator Performa</h4>
                    
                    {/* Indicator 1: Kuantitas Volume */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-cyan-600" />
                          Kuantitas (Volume)
                        </span>
                        <span className="font-extrabold text-slate-800 font-mono">
                          {perf.totalGudangWeight > 0 ? fmtKg(perf.totalGudangWeight) : "0 KG"}
                        </span>
                      </div>
                      
                      {/* Target progress bar */}
                      {s.target_bulanan_kg > 0 ? (
                        <div className="space-y-0.5">
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                perf.targetPct >= 100 ? "bg-emerald-500" : perf.targetPct >= 50 ? "bg-cyan-500" : "bg-amber-500"
                              }`}
                              style={{ width: `${Math.min(perf.targetPct, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                            <span>Target: {fmtTon(s.target_bulanan_kg)}</span>
                            <span>{perf.targetPct.toFixed(0)}% Tercapai</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 font-medium">
                          Target bulanan belum di-set
                        </div>
                      )}
                    </div>

                    {/* Indicator 2: Kualitas (Susut) */}
                    <div className="flex justify-between items-center text-xs border-t border-slate-100/80 pt-2.5">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-indigo-600" />
                        Kualitas (Susut)
                      </span>
                      {perf.totalTransactions > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono font-extrabold ${
                            perf.pctSusut <= 1.0 ? "text-emerald-600" : perf.pctSusut <= 3.0 ? "text-amber-600" : "text-rose-600"
                          }`}>
                            {perf.pctSusut === 0 ? "Sesuai (0%)" : `${perf.pctSusut.toFixed(2)}%`}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            perf.pctSusut <= 1.0 ? "bg-emerald-50 text-emerald-600" : perf.pctSusut <= 3.0 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-650 text-rose-600"
                          }`}>
                            {perf.pctSusut <= 1.0 ? "A" : perf.pctSusut <= 3.0 ? "B" : "C"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-mono">—</span>
                      )}
                    </div>

                    {/* Indicator 3: Harga Rata-rata */}
                    <div className="flex justify-between items-center text-xs border-t border-slate-100/80 pt-2.5">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-violet-600" />
                        Harga (Rata-rata)
                      </span>
                      {perf.totalTransactions > 0 ? (
                        <div className="flex flex-col items-end">
                          <span className="font-mono font-extrabold text-slate-700">{fmtRp(perf.avgPrice)}/kg</span>
                          {perf.warningCount > 0 ? (
                            <span className="text-[9px] text-rose-500 font-bold flex items-center gap-0.5 mt-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {perf.warningCount}x Melebihi Limit
                            </span>
                          ) : (
                            <span className="text-[9px] text-emerald-600 font-bold mt-0.5">
                              ✓ Harga Sesuai Limit
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 font-mono">—</span>
                      )}
                    </div>
                  </div>

                  {/* Rekening Info */}
                  <div className="text-xs space-y-1.5 border-t border-slate-100 pt-3.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Informasi Bank</span>
                    {s.nomor_rekening ? (
                      <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="font-medium text-slate-700 truncate max-w-[80%]">
                          {s.nama_bank} - <span className="font-mono font-bold">{s.nomor_rekening}</span>
                          <span className="block text-[10px] text-slate-400 truncate">a.n. {s.atas_nama || "—"}</span>
                        </span>
                        <button
                          onClick={() => handleCopy(s.id, s.nomor_rekening || "")}
                          className="text-slate-400 hover:text-cyan-600 p-1 rounded hover:bg-slate-100 transition-colors"
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
                      <span className="text-slate-400 italic text-[11px]">Rekening belum di-set</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    <Link
                      href={`/dashboard/manager/suppliers/${s.id}`}
                      className="col-span-2 bg-slate-900 text-white hover:bg-slate-800 font-extrabold text-xs py-2 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
                    >
                      Detail Lapak
                    </Link>
                    
                    {s.kontak_wa ? (
                      <a
                        href={getWaLink(s.kontak_wa)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100/40 rounded-xl flex items-center justify-center py-2"
                        title="Chat WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    ) : (
                      <button
                        disabled
                        className="bg-slate-50 text-slate-300 border border-slate-100 rounded-xl flex items-center justify-center py-2 cursor-not-allowed"
                        title="Tidak ada nomor WA"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deletingId === s.id}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100/40 rounded-xl flex items-center justify-center py-2 disabled:opacity-50"
                      title="Hapus Lapak"
                    >
                      {deletingId === s.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent animate-spin rounded-full" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-3xl p-16 text-center border border-dashed border-slate-200">
            <Users className="w-12 h-12 text-slate-350 mx-auto mb-3" />
            <h4 className="font-extrabold text-slate-700">Mitra Lapak Tidak Ditemukan</h4>
            <p className="text-slate-400 text-xs mt-1">
              Tidak ada mitra yang cocok dengan filter atau kata kunci pencarian Anda.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
