"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface PurchaseItem {
  id?: string
  sku_name: string
  spec: string | null
  berat_lapak: number
  berat_final_item: number
  harga_per_kg: number
  subtotal: number
}

interface Purchase {
  id: string
  nomor_nota: string | null
  supplierId: string
  supplier: { id: string; nama: string }
  metode_pembayaran_terpilih: string | null
  berat_timbangan_lapak: number | null
  berat_timbangan_gudang: number | null
  status_approval: string
  potongan_sampah: number | null
  berat_potongan_sampah: number | null
  harga_potongan_sampah: number | null
  potongan_susut: number | null
  berat_potongan_susut: number | null
  harga_potongan_susut: number | null
  potongan_air: number | null
  berat_potongan_air: number | null
  harga_potongan_air: number | null
  potongan_karung: number | null
  berat_potongan_karung: number | null
  harga_potongan_karung: number | null
  dp_yang_digunakan: number | null
  total_dibayar: number | null
  items: PurchaseItem[]
}

interface Supplier {
  id: string
  nama: string
}

interface DpRecord {
  id: string
  nominal_diajukan: number
  nominal_disetujui: number | null
  sisa_dp: number | null
  dp_used_amount: number
  keterangan: string | null
}

const SKU_OPTIONS = ["PET Clear", "PET Biru", "PET Hijau", "PET Kuning", "PET Mix", "HDPE", "PP", "Galon"]
const SPEC_OPTIONS = ["Gabyuk", "Grading"]
const STATUS_LABELS: Record<string, string> = {
  menunggu_double_cek: "Menunggu Double Cek",
  menunggu_approval_harga: "Menunggu Approval Harga",
  approved: "Disetujui",
  sudah_transfer: "Sudah Transfer",
  rejected: "Ditolak",
  dibatalkan: "Dibatalkan",
}

function fmtRp(n: number) {
  return n.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })
}

export default function EditTransaksiForm({
  purchase: initialPurchase,
  suppliers,
  dpTersedia = [],
  backUrl = "/dashboard/admin/history",
}: {
  purchase: Purchase
  suppliers: Supplier[]
  dpTersedia?: DpRecord[]
  backUrl?: string
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Basic fields
  const [nomor_nota, setNomorNota] = useState(initialPurchase.nomor_nota || "")
  const [supplierId, setSupplierId] = useState(initialPurchase.supplierId)
  const [metode, setMetode] = useState(initialPurchase.metode_pembayaran_terpilih || "TIMBANGAN_GUDANG")
  const [beratLapak, setBeratLapak] = useState(initialPurchase.berat_timbangan_lapak?.toString() || "")
  const [beratGudang, setBeratGudang] = useState(initialPurchase.berat_timbangan_gudang?.toString() || "")

  // Potongan
  const [potSampah, setPotSampah]   = useState(initialPurchase.potongan_sampah?.toString() || "0")
  const [potSusut, setPotSusut]     = useState(initialPurchase.potongan_susut?.toString() || "0")
  const [potAir, setPotAir]         = useState(initialPurchase.potongan_air?.toString() || "0")
  const [potKarung, setPotKarung]   = useState(initialPurchase.potongan_karung?.toString() || "0")

  const [beratPotSampah, setBeratPotSampah]   = useState(initialPurchase.berat_potongan_sampah?.toString() || "0")
  const [beratPotSusut, setBeratPotSusut]     = useState(initialPurchase.berat_potongan_susut?.toString() || "0")
  const [beratPotAir, setBeratPotAir]         = useState(initialPurchase.berat_potongan_air?.toString() || "0")
  const [beratPotKarung, setBeratPotKarung]   = useState(initialPurchase.berat_potongan_karung?.toString() || "0")

  // DP field
  const [dpDigunakan, setDpDigunakan] = useState((initialPurchase.dp_yang_digunakan ?? 0).toString())

  // Items
  const [items, setItems] = useState<PurchaseItem[]>(
    initialPurchase.items.map(i => ({ ...i }))
  )

  const updateItem = (idx: number, field: keyof PurchaseItem, value: any) => {
    setItems(prev => {
      const next = [...prev]
      const item = { ...next[idx], [field]: value }
      // Auto-compute subtotal
      if (field === "berat_final_item" || field === "harga_per_kg") {
        item.subtotal = (parseFloat(String(item.berat_final_item)) || 0) * (parseFloat(String(item.harga_per_kg)) || 0)
      }
      next[idx] = item
      return next
    })
  }

  const addItem = () => {
    setItems(prev => [...prev, {
      sku_name: "PET Clear",
      spec: "Gabyuk",
      berat_lapak: 0,
      berat_final_item: 0,
      harga_per_kg: 0,
      subtotal: 0,
    }])
  }

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  // Computed totals
  const totalBeforeCuts = items.reduce((s, i) => s + (parseFloat(String(i.subtotal)) || 0), 0)
  const hargaPotSampah  = (parseFloat(beratPotSampah) || 0) * (parseFloat(potSampah) || 0)
  const hargaPotSusut   = (parseFloat(beratPotSusut) || 0) * (parseFloat(potSusut) || 0)
  const hargaPotAir     = (parseFloat(beratPotAir) || 0) * (parseFloat(potAir) || 0)
  const hargaPotKarung  = (parseFloat(beratPotKarung) || 0) * (parseFloat(potKarung) || 0)
  const totalAfterCuts  = totalBeforeCuts - hargaPotSampah - hargaPotSusut - hargaPotAir - hargaPotKarung
  const dpValue         = parseFloat(dpDigunakan) || 0
  const totalDibayar    = totalAfterCuts - dpValue

  // DP availability check
  const totalSisaDp = dpTersedia.reduce((s, d) => s + (d.sisa_dp ?? 0), 0)
  const oldDp = initialPurchase.dp_yang_digunakan ?? 0
  const dpDelta = dpValue - oldDp
  const isDpInsufficient = dpDelta > 0 && dpDelta > totalSisaDp

  const handleSave = async () => {
    if (items.length === 0) {
      setError("Minimal harus ada 1 item.")
      return
    }
    if (isDpInsufficient) {
      setError(`Saldo DP tidak mencukupi. Tersedia: ${fmtRp(totalSisaDp)}, Tambahan dibutuhkan: ${fmtRp(dpDelta)}`)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/purchases/${initialPurchase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          nomor_nota: nomor_nota || null,
          metode_pembayaran_terpilih: metode,
          berat_timbangan_lapak: beratLapak || null,
          berat_timbangan_gudang: beratGudang || null,
          items,
          potongan_sampah:  potSampah,   berat_potongan_sampah: beratPotSampah,  harga_potongan_sampah: hargaPotSampah,
          potongan_susut:   potSusut,    berat_potongan_susut:  beratPotSusut,   harga_potongan_susut:  hargaPotSusut,
          potongan_air:     potAir,      berat_potongan_air:    beratPotAir,     harga_potongan_air:    hargaPotAir,
          potongan_karung:  potKarung,   berat_potongan_karung: beratPotKarung,  harga_potongan_karung: hargaPotKarung,
          dp_yang_digunakan: dpValue,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan")
      setSuccess(true)
      setTimeout(() => router.push(backUrl), 1500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status badge */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status saat ini:</span>
        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-lg text-xs font-bold">
          {STATUS_LABELS[initialPurchase.status_approval] || initialPurchase.status_approval}
        </span>
        <span className="text-xs text-slate-400">• Perubahan akan disimpan tanpa mengubah status</span>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Informasi Dasar</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Nomor Nota */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">No. Nota</label>
            <input
              type="text"
              value={nomor_nota}
              onChange={e => setNomorNota(e.target.value)}
              placeholder="Kosongkan jika tidak ada"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all"
            />
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Lapak / Supplier</label>
            <select
              value={supplierId}
              onChange={e => setSupplierId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all bg-white"
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.nama}</option>
              ))}
            </select>
          </div>

          {/* Metode */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Metode Pembayaran</label>
            <select
              value={metode}
              onChange={e => setMetode(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all bg-white"
            >
              <option value="TIMBANGAN_GUDANG">Timbangan Gudang</option>
              <option value="TIMBANGAN_LAPAK">Timbangan Lapak</option>
            </select>
          </div>

          {/* Berat Lapak */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Berat Timbangan Lapak (KG)</label>
            <input
              type="number"
              value={beratLapak}
              onChange={e => setBeratLapak(e.target.value)}
              placeholder="0"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all"
            />
          </div>

          {/* Berat Gudang */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Berat Timbangan Gudang (KG)</label>
            <input
              type="number"
              value={beratGudang}
              onChange={e => setBeratGudang(e.target.value)}
              placeholder="0"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Item Pembelian</h3>
          <button
            onClick={addItem}
            className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <span className="text-base leading-none">+</span> Tambah Item
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Spec</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Berat Final (KG)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Harga/KG (Rp)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Subtotal</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={item.sku_name}
                      onChange={e => updateItem(idx, "sku_name", e.target.value)}
                      list="sku-options"
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 min-w-[140px]"
                    />
                    <datalist id="sku-options">
                      {SKU_OPTIONS.map(s => <option key={s} value={s} />)}
                    </datalist>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={item.spec || ""}
                      onChange={e => updateItem(idx, "spec", e.target.value || null)}
                      className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                    >
                      <option value="">— Pilih —</option>
                      {SPEC_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={item.berat_final_item}
                      onChange={e => updateItem(idx, "berat_final_item", parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-right text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 min-w-[100px]"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={item.harga_per_kg}
                      onChange={e => updateItem(idx, "harga_per_kg", parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-right text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 min-w-[120px]"
                    />
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-slate-700 whitespace-nowrap">
                    {fmtRp(parseFloat(String(item.subtotal)) || 0)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => removeItem(idx)}
                      disabled={items.length === 1}
                      className="text-rose-400 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1 rounded-lg hover:bg-rose-50"
                      title="Hapus item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200">
                <td colSpan={4} className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">
                  Total Sebelum Potongan:
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-800 font-mono">
                  {fmtRp(totalBeforeCuts)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Potongan */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Potongan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Potongan Sampah", pct: potSampah, setPct: setPotSampah, berat: beratPotSampah, setBerat: setBeratPotSampah, harga: hargaPotSampah },
            { label: "Potongan Susut",  pct: potSusut,  setPct: setPotSusut,  berat: beratPotSusut,  setBerat: setBeratPotSusut,  harga: hargaPotSusut  },
            { label: "Potongan Air",    pct: potAir,    setPct: setPotAir,    berat: beratPotAir,    setBerat: setBeratPotAir,    harga: hargaPotAir    },
            { label: "Potongan Karung", pct: potKarung, setPct: setPotKarung, berat: beratPotKarung, setBerat: setBeratPotKarung, harga: hargaPotKarung },
          ].map(pot => (
            <div key={pot.label} className="border border-slate-100 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-slate-600">{pot.label}</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Harga/KG (Rp)</label>
                  <input
                    type="number"
                    value={pot.pct}
                    onChange={e => pot.setPct(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Berat (KG)</label>
                  <input
                    type="number"
                    value={pot.berat}
                    onChange={e => pot.setBerat(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>
              <p className="text-xs text-right text-rose-600 font-semibold">
                − {fmtRp(pot.harga)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== KOREKSI DP ===== */}
      <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider">Koreksi DP (Down Payment)</h3>
            <p className="text-xs text-amber-600 mt-0.5">Perbaiki potongan DP yang lupa diinput saat double cek</p>
          </div>
        </div>

        {/* DP Available Info */}
        {dpTersedia.length > 0 ? (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-xs font-bold text-emerald-700 mb-2">💰 DP Tersedia untuk Supplier Ini:</p>
            <div className="space-y-1.5">
              {dpTersedia.map(dp => (
                <div key={dp.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{dp.keterangan || "DP Tanpa Keterangan"}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">Disetujui: {fmtRp(dp.nominal_disetujui ?? 0)}</span>
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">
                      Sisa: {fmtRp(dp.sisa_dp ?? 0)}
                    </span>
                  </div>
                </div>
              ))}
              <div className="border-t border-emerald-200 pt-2 mt-2 flex justify-between text-xs font-bold">
                <span className="text-emerald-700">Total Sisa DP:</span>
                <span className="text-emerald-700">{fmtRp(totalSisaDp)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
            <p className="text-xs text-slate-500">ℹ Tidak ada DP aktif untuk supplier ini. Nilai DP harus 0.</p>
          </div>
        )}

        {/* DP Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Nominal DP yang Digunakan (Rp)
            </label>
            <div className="relative">
              <input
                type="number"
                value={dpDigunakan}
                onChange={e => setDpDigunakan(e.target.value)}
                min={0}
                max={dpTersedia.length > 0 ? totalSisaDp + oldDp : 0}
                placeholder="0"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 transition-all ${
                  isDpInsufficient
                    ? "border-rose-400 focus:ring-rose-400 bg-rose-50"
                    : dpValue > 0
                    ? "border-emerald-400 focus:ring-emerald-400 bg-emerald-50"
                    : "border-slate-200 focus:ring-amber-400 focus:border-amber-400"
                }`}
              />
            </div>
            {oldDp > 0 && (
              <p className="text-[10px] text-slate-400 mt-1">
                DP sebelumnya: {fmtRp(oldDp)}
              </p>
            )}
            {isDpInsufficient && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1.5">
                ⚠ Saldo DP tidak mencukupi! Tersedia: {fmtRp(totalSisaDp + oldDp)}
              </p>
            )}
            {dpValue > 0 && !isDpInsufficient && dpDelta > 0 && (
              <p className="text-[11px] text-emerald-600 font-semibold mt-1.5">
                ✓ Saldo DP akan berkurang {fmtRp(dpDelta)}
              </p>
            )}
            {dpDelta < 0 && (
              <p className="text-[11px] text-blue-600 font-semibold mt-1.5">
                ↩ Saldo DP akan dikembalikan {fmtRp(Math.abs(dpDelta))}
              </p>
            )}
          </div>

          {/* DP Summary */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-500 text-xs">
              <span>Total setelah potongan:</span>
              <span className="font-mono">{fmtRp(totalAfterCuts)}</span>
            </div>
            <div className={`flex justify-between text-xs ${dpValue > 0 ? "text-rose-600" : "text-slate-400"}`}>
              <span>Potongan DP:</span>
              <span className="font-mono font-semibold">− {fmtRp(dpValue)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between">
              <span className="text-xs font-bold text-slate-700">Total Dibayar:</span>
              <span className={`font-mono font-extrabold text-sm ${totalDibayar < 0 ? "text-rose-600" : "text-slate-800"}`}>
                {fmtRp(Math.max(0, totalDibayar))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grand Total */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-cyan-100 text-xs font-semibold uppercase tracking-wider">Total Nilai Setelah Potongan</p>
            <p className="text-3xl font-extrabold mt-1">{fmtRp(totalAfterCuts)}</p>
          </div>
          <div className="text-right text-xs text-cyan-200 space-y-0.5">
            <p>Sebelum potongan: {fmtRp(totalBeforeCuts)}</p>
            <p>Total potongan: − {fmtRp(hargaPotSampah + hargaPotSusut + hargaPotAir + hargaPotKarung)}</p>
            {dpValue > 0 && <p className="text-amber-200 font-semibold">DP digunakan: − {fmtRp(dpValue)}</p>}
            {dpValue > 0 && (
              <p className="text-white font-bold pt-1 border-t border-cyan-400/50">
                Total dibayar: {fmtRp(Math.max(0, totalDibayar))}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm font-medium">
          ⚠ {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-medium">
          ✓ Transaksi berhasil diperbarui! Mengarahkan kembali...
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => router.push(backUrl)}
          className="border border-slate-200 text-slate-600 hover:bg-slate-50 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
        >
          ← Kembali
        </button>
        <button
          onClick={handleSave}
          disabled={saving || success || isDpInsufficient}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
        >
          {saving ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Menyimpan...
            </>
          ) : "💾 Simpan Perubahan"}
        </button>
      </div>
    </div>
  )
}
