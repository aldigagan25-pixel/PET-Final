"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getWorkingDaysInMonth } from "@/lib/workingDays"

// Recycle Icon
function IconRecycle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
      <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
      <path d="m14 16-3 3 3 3" />
      <path d="M8.293 13.596 7.196 9.5 3.1 10.598" />
      <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843" />
      <path d="m13.378 9.633 4.096 1.098 1.097-4.096" />
    </svg>
  )
}

interface TargetValues {
  pet_bulanan: string
  pet_mingguan: string
  pet_harian: string
}

export default function TargetSettingForm({ warehouses, existingTargets }: { warehouses: any[], existingTargets: any[] }) {
  const router = useRouter()
  const now = new Date()
  const [selectedBulan, setSelectedBulan] = useState<number>(now.getMonth() + 1)
  const [selectedTahun, setSelectedTahun] = useState<number>(now.getFullYear())
  const [saving, setSaving] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({})
  const [errorMap, setErrorMap] = useState<Record<string, string>>({})

  const [values, setValues] = useState<Record<string, TargetValues>>(
    Object.fromEntries(
      warehouses.map(w => {
        const t = existingTargets.find(t => t.warehouseId === w.id && t.bulan === now.getMonth() + 1 && t.tahun === now.getFullYear())
        return [w.id, {
          pet_bulanan: t?.target_bulanan_pet_final && t.target_bulanan_pet_final !== 0
            ? (t.target_bulanan_pet_final / 1000).toString() : "",
          pet_mingguan: t?.target_mingguan_pet_final && t.target_mingguan_pet_final !== 0
            ? t.target_mingguan_pet_final.toString() : "",
          pet_harian: t?.target_harian_pet_final && t.target_harian_pet_final !== 0
            ? t.target_harian_pet_final.toString() : "",
        }]
      })
    )
  )

  // Reactively fetch targets when selected period changes
  useEffect(() => {
    async function fetchTargets() {
      setLoading(true)
      try {
        const res = await fetch(`/api/targets?bulan=${selectedBulan}&tahun=${selectedTahun}`)
        if (res.ok) {
          const data: any[] = await res.json()
          const newValues = Object.fromEntries(
            warehouses.map(w => {
              const t = data.find(t => t.warehouseId === w.id)
              return [w.id, {
                pet_bulanan: t?.target_bulanan_pet_final && t.target_bulanan_pet_final !== 0
                  ? (t.target_bulanan_pet_final / 1000).toString() : "",
                pet_mingguan: t?.target_mingguan_pet_final && t.target_mingguan_pet_final !== 0
                  ? t.target_mingguan_pet_final.toString() : "",
                pet_harian: t?.target_harian_pet_final && t.target_harian_pet_final !== 0
                  ? t.target_harian_pet_final.toString() : "",
              }]
            })
          )
          setValues(newValues)
        }
      } catch (err) {
        console.error("Gagal mengambil data target:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchTargets()
  }, [selectedBulan, selectedTahun, warehouses])

  // Hitung jumlah hari kerja untuk bulan yang dipilih
  const workingDaysThisMonth = getWorkingDaysInMonth(selectedTahun, selectedBulan)
  // Minggu efektif: bulan / 4.33 rata-rata, tapi kita gunakan hari kerja / 6 (Senin-Sabtu)
  const effectiveWeeks = workingDaysThisMonth / 6

  // Auto-calculate harian & mingguan dari target bulanan (input: ton)
  const handleBulananChange = (warehouseId: string, valStr: string) => {
    const clean = valStr === "0" ? "" : valStr

    if (clean === "") {
      setValues(prev => ({
        ...prev,
        [warehouseId]: {
          ...prev[warehouseId],
          pet_bulanan: "",
          pet_mingguan: "",
          pet_harian: "",
        }
      }))
      return
    }

    const ton = parseFloat(clean)
    if (isNaN(ton) || ton <= 0) {
      setValues(prev => ({
        ...prev,
        [warehouseId]: { ...prev[warehouseId], pet_bulanan: clean }
      }))
      return
    }

    const kg = ton * 1000
    // Bagi dengan hari kerja (minus Minggu & libur nasional)
    const dailyKg = workingDaysThisMonth > 0 ? Math.round(kg / workingDaysThisMonth) : 0
    // Mingguan: bulanan / minggu efektif
    const weeklyKg = effectiveWeeks > 0 ? Math.round(kg / effectiveWeeks) : 0
    setValues(prev => ({
      ...prev,
      [warehouseId]: {
        ...prev[warehouseId],
        pet_bulanan: clean,
        pet_mingguan: weeklyKg.toString(),
        pet_harian: dailyKg.toString(),
      }
    }))
  }

  const handleSave = async (warehouseId: string) => {
    setSaving(warehouseId)
    setErrorMap(prev => ({ ...prev, [warehouseId]: "" }))
    try {
      const v = values[warehouseId]

      // Bulanan: input dalam ton → simpan dalam KG
      const petBulanKg = v.pet_bulanan ? parseFloat(v.pet_bulanan) * 1000 : 0
      const petMingguan = v.pet_mingguan ? parseFloat(v.pet_mingguan) : 0
      const petHarian = v.pet_harian ? parseFloat(v.pet_harian) : 0

      const res = await fetch("/api/targets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseId,
          bulan: selectedBulan,
          tahun: selectedTahun,
          target_harian_pet_final: petHarian,
          target_mingguan_pet_final: petMingguan,
          target_bulanan_pet_final: petBulanKg,
          // Sync legacy fields
          target_harian_kg: petHarian,
          target_mingguan_kg: petMingguan,
          target_bulanan_kg: petBulanKg,
        })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Server error: ${res.status}`)
      }

      setSavedMap(prev => ({ ...prev, [warehouseId]: true }))
      setTimeout(() => setSavedMap(prev => ({ ...prev, [warehouseId]: false })), 3000)
      router.refresh()
    } catch (e: any) {
      setErrorMap(prev => ({ ...prev, [warehouseId]: e.message || "Gagal menyimpan. Coba lagi." }))
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Period Selection Panel */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Periode Target CC</h3>
          <p className="text-xs text-slate-400 mt-1">Pilih bulan dan tahun target yang ingin diatur di bawah ini.</p>
          <p className="text-xs font-semibold text-cyan-700 mt-1.5">
            📅 <span className="font-bold">{workingDaysThisMonth} hari kerja</span> di bulan ini (Senin–Sabtu, minus libur nasional)
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedBulan}
            onChange={e => setSelectedBulan(parseInt(e.target.value))}
            className="flex-1 sm:flex-initial border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-cyan-500"
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
          <select
            value={selectedTahun}
            onChange={e => setSelectedTahun(parseInt(e.target.value))}
            className="flex-1 sm:flex-initial border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-cyan-500"
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
      </div>

      {loading && (
        <div className="text-center py-6 text-slate-400 text-sm font-medium flex items-center justify-center gap-2">
          <svg className="animate-spin w-4 h-4 text-cyan-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Memuat target periode...
        </div>
      )}

      {!loading && warehouses.map(w => {
        const cityName = w.nama.replace(/^Gudang\s+/i, '')
        const isSaving = saving === w.id
        const isSaved = savedMap[w.id]
        const v = values[w.id]

        return (
          <div key={w.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Warehouse Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                {cityName.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-slate-800">Collection Center {cityName}</div>
                <div className="text-xs text-slate-400">Tetapkan target pembelian bahan baku PET</div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* ── PET Final Section ── */}
              <div className="rounded-xl border border-cyan-100 bg-cyan-50/40 p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <IconRecycle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">PET Final</div>
                    <div className="text-xs text-slate-500">Target pembelian bahan baku PET dari lapak/supplier</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* PET Bulanan */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-cyan-700 uppercase tracking-wider">Target Bulanan</label>
                    <div className="relative">
                      <input
                        type="number" min="0" step="0.1"
                        value={v?.pet_bulanan ?? ""}
                        onChange={e => handleBulananChange(w.id, e.target.value)}
                        placeholder="0"
                        className="w-full border border-cyan-200 rounded-xl px-4 py-2.5 bg-white focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none text-slate-800 font-mono font-semibold pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">ton</span>
                    </div>
                  </div>
                  {/* PET Mingguan */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-cyan-700 uppercase tracking-wider">Target Mingguan</label>
                    <div className="relative">
                      <input
                        type="number" min="0" step="1"
                        value={v?.pet_mingguan ?? ""}
                        onChange={e => setValues(prev => ({ ...prev, [w.id]: { ...prev[w.id], pet_mingguan: e.target.value === "0" ? "" : e.target.value } }))}
                        placeholder="0"
                        className="w-full border border-cyan-200 rounded-xl px-4 py-2.5 bg-white focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none text-slate-800 font-mono font-semibold pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">KG</span>
                    </div>
                  </div>
                  {/* PET Harian */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-cyan-700 uppercase tracking-wider">Target Harian</label>
                    <div className="relative">
                      <input
                        type="number" min="0" step="1"
                        value={v?.pet_harian ?? ""}
                        onChange={e => setValues(prev => ({ ...prev, [w.id]: { ...prev[w.id], pet_harian: e.target.value === "0" ? "" : e.target.value } }))}
                        placeholder="0"
                        className="w-full border border-cyan-200 rounded-xl px-4 py-2.5 bg-white focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none text-slate-800 font-mono font-semibold pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">KG</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error message */}
              {errorMap[w.id] && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                  <span className="text-base leading-none mt-0.5">⚠️</span>
                  <span>{errorMap[w.id]}</span>
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={() => handleSave(w.id)}
                disabled={isSaving}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${
                  isSaved
                    ? "bg-emerald-500 text-white shadow-emerald-200"
                    : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/20"
                } disabled:opacity-60`}
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Menyimpan...
                  </span>
                ) : isSaved ? (
                  "✓ Target Berhasil Disimpan!"
                ) : (
                  "Simpan Target"
                )}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
