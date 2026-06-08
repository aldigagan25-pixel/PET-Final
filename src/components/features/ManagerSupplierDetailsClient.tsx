"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  CreditCard,
  MapPin,
  MessageCircle,
  Search,
  Target,
  User,
  Wallet,
  TrendingUp,
  Warehouse as WarehouseIcon,
  ChevronRight
} from "lucide-react"
import { fmtKg, fmtRp, fmtTon } from "@/lib/format"

interface PurchaseItem {
  id: string
  sku_name: string
  spec: string | null
  berat_final_item: number
  harga_per_kg: number
  subtotal: number
}

interface Purchase {
  id: string
  nomor_nota: string | null
  createdAt: string
  status_approval: string
  total_nilai_setelah_retur: number | null
  total_nilai_sebelum_retur: number | null
  total_dibayar: number | null
  staff: {
    nama: string
  }
  warehouse: {
    nama: string
  }
  items: PurchaseItem[]
}

interface DownPayment {
  id: string
  nominal_diajukan: number
  nominal_disetujui: number | null
  dp_used_amount: number
  status_approval: string
  sisa_dp: number | null
  tanggal_permintaan: string
  keterangan: string | null
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
  frekuensi_ambilan_mingguan: number
  hari_ambilan: string | null
  warehouse: {
    nama: string
  } | null
  purchases: Purchase[]
  downPayments: DownPayment[]
}

export default function ManagerSupplierDetailsClient({ supplier }: { supplier: Supplier }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"transaksi" | "dp">("transaksi")

  // Copy bank info helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // WA Link helper
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

  // Calculate stats
  const totalTransactions = supplier.purchases.length
  const totalVolumeKg = supplier.purchases.reduce((sum, p) => {
    const pVolume = p.items.reduce((s, i) => s + (i.berat_final_item || 0), 0)
    return sum + pVolume
  }, 0)
  const totalValue = supplier.purchases.reduce((sum, p) => {
    const val = p.total_dibayar ?? p.total_nilai_setelah_retur ?? p.total_nilai_sebelum_retur ?? 0
    return sum + val
  }, 0)
  const remainingDp = supplier.downPayments
    .filter(dp => dp.status_approval === "approved")
    .reduce((sum, dp) => sum + (dp.sisa_dp || 0), 0)

  // Filtered purchases
  const filteredPurchases = supplier.purchases.filter(p => {
    const query = searchQuery.toLowerCase()
    return (
      (p.nomor_nota && p.nomor_nota.toLowerCase().includes(query)) ||
      p.id.toLowerCase().includes(query) ||
      p.warehouse.nama.toLowerCase().includes(query) ||
      p.staff.nama.toLowerCase().includes(query)
    )
  })

  // Status map badges
  const statusMap: Record<string, { label: string; cls: string }> = {
    menunggu_double_cek: { label: "🕐 Menunggu Cek", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    menunggu_approval_harga: { label: "📋 Menunggu Approve", cls: "bg-orange-50 text-orange-700 border-orange-200" },
    approved: { label: "✓ Disetujui", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    sudah_transfer: { label: "💸 Sudah Transfer", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    rejected: { label: "✗ Ditolak", cls: "bg-red-50 text-red-700 border-red-200" },
    dibatalkan: { label: "⊘ Dibatalkan", cls: "bg-slate-50 text-slate-500 border-slate-200" }
  }

  const dpStatusMap: Record<string, { label: string; cls: string }> = {
    menunggu_approval_admin: { label: "🕐 Menunggu Admin", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    menunggu_approval_manager: { label: "📋 Menunggu Manager", cls: "bg-orange-50 text-orange-700 border-orange-200" },
    approved: { label: "✓ Approved", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    rejected: { label: "✗ Rejected", cls: "bg-red-50 text-red-700 border-red-200" }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Link href="/dashboard/manager" className="hover:text-cyan-600 transition-colors">
              Manager
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/dashboard/manager/suppliers" className="hover:text-cyan-600 transition-colors">
              Database Lapak
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600 font-semibold">{supplier.nama}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Detail Lapak: {supplier.nama}
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-cyan-50 text-cyan-600 uppercase tracking-wider shadow-inner">
              CC {supplier.warehouse?.nama.replace(/^Gudang\s+/i, "") || "CC"}
            </span>
          </h2>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm self-start md:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
      </div>

      {/* Profile & Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4 lg:col-span-2">
          <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-600" />
            Profil Lapak &amp; Kontak
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400 text-xs block">Nama Lengkap / Lapak</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{supplier.nama}</span>
            </div>
            <div>
              <span className="text-slate-400 text-xs block">Collection Center Utama</span>
              <span className="font-semibold text-slate-700 mt-0.5 block">{supplier.warehouse?.nama || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-xs block">Target Bulanan</span>
              <span className="font-bold text-slate-800 mt-0.5 block">
                {supplier.target_bulanan_kg > 0 ? fmtTon(supplier.target_bulanan_kg) : "—"}
                {supplier.target_bulanan_kg > 0 && (
                  <span className="text-xs text-slate-500 font-medium ml-1">
                    ({fmtKg(supplier.target_bulanan_kg)})
                  </span>
                )}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-xs block">Jadwal Ambilan</span>
              <span className="font-semibold text-slate-700 mt-0.5 block">
                {supplier.frekuensi_ambilan_mingguan}x seminggu
                {supplier.hari_ambilan ? ` (${supplier.hari_ambilan})` : ""}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {supplier.kontak_wa ? (
              <a
                href={getWaLink(supplier.kontak_wa)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-emerald-100/50"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                Chat WhatsApp ({supplier.kontak_wa})
              </a>
            ) : (
              <button
                disabled
                className="flex items-center justify-center gap-1.5 bg-slate-50 text-slate-400 px-4 py-2 rounded-xl text-xs font-bold border border-slate-100 cursor-not-allowed"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                Tidak Ada Kontak WA
              </button>
            )}

            <a
              href={
                supplier.link ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  supplier.nama + " " + (supplier.warehouse?.nama || "")
                )}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-600 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-cyan-100/50"
            >
              <MapPin className="w-4 h-4 shrink-0" />
              Lokasi Maps
            </a>
          </div>
        </div>

        {/* Bank Account Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-cyan-600" />
            Informasi Rekening
          </h3>
          {supplier.nomor_rekening ? (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-16 h-16 bg-cyan-500/5 rounded-full translate-x-4 translate-y-4" />
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Bank</span>
                <p className="font-extrabold text-slate-800 text-base">{supplier.nama_bank}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Nomor Rekening</span>
                <p className="font-mono font-bold text-slate-700 text-lg">{supplier.nomor_rekening}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Atas Nama</span>
                <p className="font-semibold text-slate-600 text-sm">{supplier.atas_nama || "—"}</p>
              </div>
              <button
                onClick={() => handleCopy(supplier.nomor_rekening || "")}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Berhasil Disalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    Salin Nomor Rekening
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-6 text-center border border-dashed border-slate-200">
              <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 italic">Data bank belum dilengkapi oleh admin.</p>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 shadow-inner">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Volume</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">
              {fmtKg(totalVolumeKg)}
              <span className="text-[10px] text-slate-400 block font-normal">({fmtTon(totalVolumeKg)})</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Transaksi</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalTransactions} kali</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Nilai Pembelian</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1 font-mono">{fmtRp(totalValue)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 shadow-inner">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Sisa Saldo DP</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1 font-mono">{fmtRp(remainingDp)}</p>
          </div>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setActiveTab("transaksi")}
            className={`flex-1 py-4 text-center font-bold text-sm transition-all border-b-2 ${
              activeTab === "transaksi"
                ? "border-cyan-600 text-cyan-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/30"
            }`}
          >
            📋 Riwayat Pembelian ({supplier.purchases.length})
          </button>
          <button
            onClick={() => setActiveTab("dp")}
            className={`flex-1 py-4 text-center font-bold text-sm transition-all border-b-2 ${
              activeTab === "dp"
                ? "border-cyan-600 text-cyan-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/30"
            }`}
          >
            💸 Saldo &amp; Kasbon DP ({supplier.downPayments.length})
          </button>
        </div>

        <div className="p-6">
          {activeTab === "transaksi" ? (
            <div className="space-y-4">
              {/* Search Purchases */}
              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari transaksi (No. Nota, CC, Staff)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white text-slate-800 transition-all font-medium"
                />
              </div>

              {filteredPurchases.length > 0 ? (
                <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">Tanggal / Waktu</th>
                        <th className="px-6 py-4">Nomor Nota / Draft</th>
                        <th className="px-6 py-4">Gudang / CC</th>
                        <th className="px-6 py-4 text-right">Berat Final</th>
                        <th className="px-6 py-4 text-right">Total Bayar</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredPurchases.map(p => {
                        const totalBerat = p.items.reduce((s, i) => s + (i.berat_final_item || 0), 0)
                        const totalNilai = p.total_dibayar ?? p.total_nilai_setelah_retur ?? p.total_nilai_sebelum_retur ?? 0
                        const badge = statusMap[p.status_approval] ?? {
                          label: p.status_approval,
                          cls: "bg-slate-50 text-slate-600 border-slate-200"
                        }

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-semibold text-slate-900">
                                {new Date(p.createdAt).toLocaleDateString("id-ID", {
                                  dateStyle: "medium",
                                  timeZone: "Asia/Jakarta"
                                })}
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                {new Date(p.createdAt).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-700">
                              {p.nomor_nota || `#${p.id.split("-")[0]}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-700">
                              {p.warehouse.nama}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-semibold text-slate-800">
                              {totalBerat.toFixed(1)} KG
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-slate-900">
                              {fmtRp(totalNilai)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border inline-block ${badge.cls}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="inline-flex gap-2">
                                <Link
                                  href={`/dashboard/manager/purchases/${p.id}`}
                                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-lg text-xs font-bold transition-all"
                                >
                                  Detail
                                </Link>
                                <Link
                                  href={`/dashboard/manager/edit/${p.id}`}
                                  className="bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 px-3 py-1 rounded-lg text-xs font-bold transition-all"
                                >
                                  Edit
                                </Link>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-12 text-center border border-dashed border-slate-200">
                  <p className="text-slate-400 text-xs">Tidak ada riwayat pembelian untuk lapak ini.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {supplier.downPayments.length > 0 ? (
                <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">Tanggal Diajukan</th>
                        <th className="px-6 py-4">Keterangan</th>
                        <th className="px-6 py-4 text-right">Diajukan</th>
                        <th className="px-6 py-4 text-right">Disetujui</th>
                        <th className="px-6 py-4 text-right">Terpakai</th>
                        <th className="px-6 py-4 text-right">Sisa DP</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {supplier.downPayments.map(dp => {
                        const badge = dpStatusMap[dp.status_approval] ?? {
                          label: dp.status_approval,
                          cls: "bg-slate-50 text-slate-600 border-slate-200"
                        }

                        return (
                          <tr key={dp.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-semibold text-slate-900">
                                {new Date(dp.tanggal_permintaan).toLocaleDateString("id-ID", {
                                  dateStyle: "medium",
                                  timeZone: "Asia/Jakarta"
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-xs max-w-xs truncate">
                              {dp.keterangan || "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-slate-600">
                              {fmtRp(dp.nominal_diajukan)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-semibold text-slate-700">
                              {dp.nominal_disetujui ? fmtRp(dp.nominal_disetujui) : "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-slate-600">
                              {fmtRp(dp.dp_used_amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-slate-800">
                              {dp.sisa_dp !== null ? fmtRp(dp.sisa_dp) : "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border inline-block ${badge.cls}`}>
                                {badge.label}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-12 text-center border border-dashed border-slate-200">
                  <p className="text-slate-400 text-xs">Tidak ada riwayat pengajuan DP/kasbon untuk lapak ini.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
