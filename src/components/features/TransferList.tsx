"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

function formatRp(n: number) {
  return n.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })
}

export default function TransferList({ purchases }: { purchases: any[] }) {
  const router = useRouter()
  const [uploading, setUploading] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const handleUpload = async (purchaseId: string, file: File) => {
    setUploading(purchaseId)
    try {
      const form = new FormData()
      form.append("bukti", file)
      const res = await fetch(`/api/purchases/${purchaseId}/transfer`, {
        method: "POST",
        body: form
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Gagal upload")
      }
      router.refresh()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setUploading(null)
    }
  }

  return (
    <>
      {/* Lightbox preview */}
      {preview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="font-semibold text-slate-800 text-sm">Bukti Transfer</span>
              <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
            </div>
            <img src={preview} alt="Bukti Transfer" className="w-full object-contain max-h-[70vh]" />
          </div>
        </div>
      )}

      <div className="space-y-4">
        {purchases.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
            Belum ada transaksi yang sudah disetujui.
          </div>
        )}
        {purchases.map(p => {
          const total = p.total_dibayar ?? p.total_nilai_setelah_retur ?? p.items.reduce((s: number, i: any) => s + i.subtotal, 0)
          const isTransferred = p.status_approval === "sudah_transfer"
          return (
            <div key={p.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${isTransferred ? "border-emerald-200" : "border-slate-100"}`}>
              <div className="flex flex-wrap gap-4 justify-between items-start">
                {/* Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isTransferred ? "bg-emerald-100 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {isTransferred ? "✓ Sudah Transfer" : "⏳ Menunggu Transfer"}
                    </span>
                  </div>
                  <div className="font-bold text-slate-800 text-lg">{p.supplier.nama}</div>
                  <div className="text-xs text-slate-400">
                    {new Date(p.createdAt).toLocaleDateString("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" })} · {p.items.length} jenis barang
                  </div>
                  <div className="text-base font-extrabold text-cyan-700">{formatRp(total)}</div>
                  {isTransferred && p.tanggal_transfer && (
                    <div className="text-xs text-emerald-600">
                      Transfer: {new Date(p.tanggal_transfer).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" })}
                    </div>
                  )}
                </div>

                {/* Action / Bukti */}
                <div className="flex flex-col items-end gap-2">
                  {isTransferred && p.bukti_transfer ? (
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => setPreview(p.bukti_transfer)}
                        className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-emerald-300 hover:border-emerald-500 transition-all shadow-md cursor-pointer group"
                      >
                        <img src={p.bukti_transfer} alt="Bukti" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs font-bold">Lihat</span>
                        </div>
                      </button>
                      {/* Re-upload button */}
                      <button
                        onClick={() => fileRefs.current[p.id]?.click()}
                        className="text-xs text-slate-400 hover:text-slate-600 underline"
                      >
                        Ganti Bukti
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRefs.current[p.id]?.click()}
                      disabled={uploading === p.id}
                      className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-cyan-500/20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                      {uploading === p.id ? "Mengupload..." : "Upload Bukti Transfer"}
                    </button>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={el => { fileRefs.current[p.id] = el }}
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(p.id, file)
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
