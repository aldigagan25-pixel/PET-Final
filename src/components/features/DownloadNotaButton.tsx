"use client"

import { PDFDownloadLink } from "@react-pdf/renderer"
import NotaPDF from "./NotaPDF"
import { useState, useEffect } from "react"

export default function DownloadNotaButton({ purchase, qrCodeUrl }: { purchase: any, qrCodeUrl: string }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return <button className="px-4 py-2 bg-slate-200 rounded animate-pulse">Loading PDF...</button>

  return (
    <PDFDownloadLink
      document={<NotaPDF purchase={purchase} qrCodeUrl={qrCodeUrl} />}
      fileName={`Nota-${purchase.nomor_nota || purchase.id}.pdf`}
    >
      {/* @ts-ignore */}
      {({ blob, url, loading, error }) =>
        loading ? (
          <button className="px-6 py-3 bg-cyan-100 text-cyan-600 rounded-xl font-medium animate-pulse cursor-wait">
            Menyiapkan PDF...
          </button>
        ) : (
          <button className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all">
            Download PDF Nota
          </button>
        )
      }
    </PDFDownloadLink>
  )
}
