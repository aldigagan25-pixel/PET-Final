"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DPApprovalActions({ dp, role = "MANAGER" }: { dp: any, role?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [nominal, setNominal] = useState(dp.nominal_diajukan)

  const handleAction = async (action: "approve" | "reject" | "forward", finalNominal?: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/dp/${dp.id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          nominal_disetujui: action === "approve" ? (finalNominal || dp.nominal_diajukan) : undefined
        })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Gagal memproses persetujuan")
      }

      router.refresh()
    } catch (err: any) {
      alert(err.message || err)
      setLoading(false)
    }
  }

  if (showEdit) {
    return (
      <div className="flex items-center gap-2 justify-center">
        <input 
          type="number" 
          value={nominal} 
          onChange={(e) => setNominal(parseFloat(e.target.value) || 0)}
          className="border border-indigo-200 rounded-lg px-2 py-1.5 w-32 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <button 
          onClick={() => {
            if (role === "ADMIN" && nominal > 2000000) {
              alert("Admin tidak bisa menyetujui DP > Rp 2.000.000. Silakan forward ke Manager atau revisi ke <= Rp 2.000.000.")
              return
            }
            handleAction("approve", nominal)
          }} 
          disabled={loading}
          className="bg-emerald-500 text-white p-1.5 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
          title="Simpan & Setujui"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </button>
        <button 
          onClick={() => setShowEdit(false)} 
          disabled={loading}
          className="bg-slate-200 text-slate-600 p-1.5 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
          title="Batal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
    )
  }

  const isAdminForwardOnly = role === "ADMIN" && dp.nominal_diajukan > 2000000

  return (
    <div className="flex gap-2 justify-center">
      {isAdminForwardOnly ? (
        <button
          onClick={() => {
            if (confirm("Kasbon > Rp 2.000.000 memerlukan persetujuan Manager. Forward sekarang?")) {
              handleAction("forward")
            }
          }}
          disabled={loading}
          className="px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 font-bold text-xs rounded-lg border border-orange-200 transition-colors disabled:opacity-50 animate-pulse"
        >
          Forward ke Manager
        </button>
      ) : (
        <button
          onClick={() => handleAction("approve")}
          disabled={loading}
          className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 transition-colors disabled:opacity-50"
        >
          Setujui
        </button>
      )}
      <button
        onClick={() => setShowEdit(true)}
        disabled={loading}
        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 font-bold text-xs rounded-lg border border-indigo-200 transition-colors disabled:opacity-50"
      >
        Revisi Nilai
      </button>
      <button
        onClick={() => {
          if (confirm("Yakin ingin menolak pengajuan kasbon ini?")) {
            handleAction("reject")
          }
        }}
        disabled={loading}
        className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold text-xs rounded-lg border border-red-200 transition-colors disabled:opacity-50"
      >
        Tolak
      </button>
    </div>
  )
}
