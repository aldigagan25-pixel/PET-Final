import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"

const ALLOWED_ROLES = ["ADMIN", "MANAGER"]

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (!session || !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: { supplier: true, items: true, staff: true }
    })

    if (!purchase) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 })
    }

    // Admin hanya bisa lihat transaksi warehousenya sendiri
    const userWarehouseId = (session.user as any).warehouseId
    if (role === "ADMIN" && userWarehouseId && purchase.warehouseId !== userWarehouseId) {
      return NextResponse.json({ error: "Tidak memiliki akses ke transaksi ini" }, { status: 403 })
    }

    return NextResponse.json(purchase)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (!session || !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      supplierId,
      items,          // array of { id?, sku_name, spec, berat_final_item, harga_per_kg, subtotal }
      nomor_nota,
      metode_pembayaran_terpilih,
      berat_timbangan_lapak,
      berat_timbangan_gudang,
      potongan_sampah, berat_potongan_sampah, harga_potongan_sampah,
      potongan_susut,  berat_potongan_susut,  harga_potongan_susut,
      potongan_air,    berat_potongan_air,    harga_potongan_air,
      potongan_karung, berat_potongan_karung, harga_potongan_karung,
      // DP correction fields
      dp_yang_digunakan: new_dp_input,
    } = body

    // Fetch current purchase
    const existing = await prisma.purchase.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 })
    }

    // Admin hanya bisa edit warehousenya sendiri; Manager bisa semua
    const userWarehouseId = (session.user as any).warehouseId
    if (role === "ADMIN" && userWarehouseId && existing.warehouseId !== userWarehouseId) {
      return NextResponse.json({ error: "Tidak memiliki akses ke transaksi ini" }, { status: 403 })
    }

    // Recompute totals from items
    const totalBeforeCuts = items.reduce((s: number, i: any) => s + (parseFloat(i.subtotal) || 0), 0)
    const totalPotSampah  = parseFloat(harga_potongan_sampah) || 0
    const totalPotSusut   = parseFloat(harga_potongan_susut)  || 0
    const totalPotAir     = parseFloat(harga_potongan_air)    || 0
    const totalPotKarung  = parseFloat(harga_potongan_karung) || 0
    const totalNilaiSetelah = totalBeforeCuts - totalPotSampah - totalPotSusut - totalPotAir - totalPotKarung

    // DP delta calculation
    const old_dp = existing.dp_yang_digunakan ?? 0
    const new_dp = new_dp_input !== undefined ? (parseFloat(new_dp_input) || 0) : old_dp
    const dp_delta = new_dp - old_dp  // positive = more DP used, negative = less DP used

    // New total_dibayar = net total - new DP
    const new_total_dibayar = totalNilaiSetelah - new_dp

    // Perform atomic transaction
    const updatedPurchase = await prisma.$transaction(async (tx) => {
      // Handle DP balance adjustment if DP changed or supplier changed
      const oldSupplierId = existing.supplierId
      const newSupplierId = supplierId || oldSupplierId
      const supplierChanged = oldSupplierId !== newSupplierId

      if (supplierChanged) {
        // 1. Refund all old DP to the old supplier
        if (old_dp > 0) {
          const dpsWithUsedAmount = await tx.downPayment.findMany({
            where: {
              supplierId: oldSupplierId,
              status_approval: "approved",
              dp_used_amount: { gt: 0 },
            },
            orderBy: { tanggal_approval: "desc" }, // LIFO refund
          })

          let amountToRefund = old_dp
          for (const dp of dpsWithUsedAmount) {
            if (amountToRefund <= 0) break
            const currentUsed = dp.dp_used_amount ?? 0
            const refundAmount = Math.min(amountToRefund, currentUsed)

            await tx.downPayment.update({
              where: { id: dp.id },
              data: {
                dp_used_amount: { decrement: refundAmount },
                sisa_dp: { increment: refundAmount },
              },
            })

            amountToRefund -= refundAmount
          }
        }

        // 2. Deduct all new DP from the new supplier
        if (new_dp > 0) {
          const approvedDps = await tx.downPayment.findMany({
            where: {
              supplierId: newSupplierId,
              status_approval: "approved",
              sisa_dp: { gt: 0 },
            },
            orderBy: { tanggal_approval: "asc" }, // FIFO deduction
          })

          const totalAvailable = approvedDps.reduce((sum, dp) => sum + (dp.sisa_dp ?? 0), 0)
          if (totalAvailable < new_dp) {
            throw new Error(
              `Saldo DP untuk supplier baru tidak mencukupi. Dibutuhkan: Rp ${new_dp.toLocaleString("id-ID")}, namun hanya tersedia: Rp ${totalAvailable.toLocaleString("id-ID")}.`
            )
          }

          let amountToDeduct = new_dp
          for (const dp of approvedDps) {
            if (amountToDeduct <= 0) break
            const currentSisa = dp.sisa_dp ?? 0
            const deduct = Math.min(amountToDeduct, currentSisa)

            await tx.downPayment.update({
              where: { id: dp.id },
              data: {
                dp_used_amount: { increment: deduct },
                sisa_dp: { decrement: deduct },
              },
            })

            amountToDeduct -= deduct
          }
        }
      } else {
        // Supplier did not change, apply delta logic
        if (dp_delta !== 0) {
          if (dp_delta > 0) {
            // More DP being used → find approved DPs with sisa_dp > 0
            const approvedDps = await tx.downPayment.findMany({
              where: {
                supplierId: oldSupplierId,
                status_approval: "approved",
                sisa_dp: { gt: 0 },
              },
              orderBy: { tanggal_approval: "asc" }, // FIFO
            })

            const totalAvailable = approvedDps.reduce((sum, dp) => sum + (dp.sisa_dp ?? 0), 0)
            if (totalAvailable < dp_delta) {
              throw new Error(
                `Saldo DP tidak mencukupi. Dibutuhkan tambahan: Rp ${dp_delta.toLocaleString("id-ID")}, namun hanya tersedia: Rp ${totalAvailable.toLocaleString("id-ID")}.`
              )
            }

            let amountToDeduct = dp_delta
            for (const dp of approvedDps) {
              if (amountToDeduct <= 0) break
              const currentSisa = dp.sisa_dp ?? 0
              const deduct = Math.min(amountToDeduct, currentSisa)

              await tx.downPayment.update({
                where: { id: dp.id },
                data: {
                  dp_used_amount: { increment: deduct },
                  sisa_dp: { decrement: deduct },
                },
              })

              amountToDeduct -= deduct
            }
          } else {
            // Less DP being used → refund the difference back to DP record
            const refund = Math.abs(dp_delta)

            // Find all DP records with dp_used_amount > 0, ordered by latest approval first (LIFO refund)
            const dpsWithUsedAmount = await tx.downPayment.findMany({
              where: {
                supplierId: oldSupplierId,
                status_approval: "approved",
                dp_used_amount: { gt: 0 },
              },
              orderBy: { tanggal_approval: "desc" },
            })

            let amountToRefund = refund
            for (const dp of dpsWithUsedAmount) {
              if (amountToRefund <= 0) break
              const currentUsed = dp.dp_used_amount ?? 0
              const refundAmount = Math.min(amountToRefund, currentUsed)

              await tx.downPayment.update({
                where: { id: dp.id },
                data: {
                  dp_used_amount: { decrement: refundAmount },
                  sisa_dp: { increment: refundAmount },
                },
              })

              amountToRefund -= refundAmount
            }
          }
        }
      }

      // Delete all existing items then recreate
      await tx.purchaseItem.deleteMany({ where: { purchaseId: id } })

      const purchase = await tx.purchase.update({
        where: { id },
        data: {
          ...(supplierId ? { supplierId } : {}),
          ...(nomor_nota !== undefined ? { nomor_nota } : {}),
          ...(metode_pembayaran_terpilih ? { metode_pembayaran_terpilih } : {}),
          berat_timbangan_lapak: berat_timbangan_lapak != null ? parseFloat(berat_timbangan_lapak) : existing.berat_timbangan_lapak,
          berat_timbangan_gudang: berat_timbangan_gudang != null ? parseFloat(berat_timbangan_gudang) : existing.berat_timbangan_gudang,
          potongan_sampah:  parseFloat(potongan_sampah)  || 0,
          berat_potongan_sampah: parseFloat(berat_potongan_sampah) || 0,
          harga_potongan_sampah: totalPotSampah,
          potongan_susut:   parseFloat(potongan_susut)   || 0,
          berat_potongan_susut:  parseFloat(berat_potongan_susut)  || 0,
          harga_potongan_susut:  totalPotSusut,
          potongan_air:     parseFloat(potongan_air)     || 0,
          berat_potongan_air:    parseFloat(berat_potongan_air)    || 0,
          harga_potongan_air:    totalPotAir,
          potongan_karung:  parseFloat(potongan_karung)  || 0,
          berat_potongan_karung: parseFloat(berat_potongan_karung) || 0,
          harga_potongan_karung: totalPotKarung,
          total_nilai_sebelum_retur: totalBeforeCuts,
          total_nilai_setelah_retur: totalNilaiSetelah,
          // DP & payment fields
          dp_yang_digunakan: new_dp,
          total_dibayar: new_total_dibayar,
          items: {
            create: items.map((item: any) => ({
              sku_name: item.sku_name,
              spec: item.spec || null,
              berat_lapak: parseFloat(item.berat_lapak) || parseFloat(item.berat_final_item) || 0,
              berat_final_item: parseFloat(item.berat_final_item) || 0,
              harga_per_kg: parseFloat(item.harga_per_kg) || 0,
              subtotal: parseFloat(item.subtotal) || 0,
            }))
          }
        },
        include: { items: true, supplier: true }
      })

      return purchase
    })

    await createAuditLog({
      userId: (session.user as any).id,
      action: dp_delta !== 0 ? "KOREKSI_DP_NOTA" : "EDIT_PURCHASE",
      table_name: "Purchase",
      record_id: id,
      old_data: JSON.stringify({
        ...existing,
        dp_yang_digunakan: old_dp,
        total_dibayar: existing.total_dibayar,
      }),
      new_data: updatedPurchase,
    })

    return NextResponse.json({ message: "Transaksi berhasil diperbarui", purchase: updatedPurchase })
  } catch (error: any) {
    console.error("Edit Purchase Error:", error)
    return NextResponse.json({ error: "Gagal mengedit transaksi: " + error.message }, { status: 500 })
  }
}
