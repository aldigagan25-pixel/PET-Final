import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || (session.user as any).role !== "MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: purchaseId } = await params
    const { action, rejection_reason } = await req.json()

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const currentPurchase = await prisma.purchase.findUnique({
      where: { id: purchaseId }
    })

    if (!currentPurchase) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (currentPurchase.status_approval !== "menunggu_approval_harga") {
      return NextResponse.json({ error: "Purchase is not waiting for manager approval" }, { status: 400 })
    }

    let updateData: any = {}
    if (action === "approve") {
      updateData = {
        status_approval: "approved",
        approvedByUserId: (session.user as any).id,
        approvedAt: new Date(),
        nomor_nota: `INV-${Date.now()}` // Generate Nota
      }
    } else {
      updateData = {
        status_approval: "rejected",
        rejection_reason: rejection_reason || "Ditolak oleh Manager tanpa alasan",
        approvedByUserId: (session.user as any).id,
        approvedAt: new Date()
      }
    }

    const updatedPurchase = await prisma.$transaction(async (tx) => {
      // If there was a DP used in double check, we need to return it back to Supplier's sisa_dp
      if (action === "reject" && currentPurchase.dp_yang_digunakan && currentPurchase.dp_yang_digunakan > 0) {
        const refund = currentPurchase.dp_yang_digunakan
        const dpsWithUsedAmount = await tx.downPayment.findMany({
          where: {
            supplierId: currentPurchase.supplierId,
            status_approval: "approved",
            dp_used_amount: { gt: 0 },
          },
          orderBy: { tanggal_approval: "desc" }, // LIFO refund
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

      return await tx.purchase.update({
        where: { id: purchaseId },
        data: updateData
      })
    })

    await createAuditLog({
      userId: (session.user as any).id,
      action: action === "approve" ? "MANAGER_APPROVE_PRICE" : "MANAGER_REJECT_PRICE",
      table_name: "Purchase",
      record_id: purchaseId,
      old_data: currentPurchase,
      new_data: updatedPurchase,
    })

    return NextResponse.json(updatedPurchase)
  } catch (error: any) {
    console.error("Error approving purchase:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
