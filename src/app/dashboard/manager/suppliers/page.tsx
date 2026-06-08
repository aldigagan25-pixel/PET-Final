import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"
import ManagerSuppliersClient from "@/components/features/ManagerSuppliersClient"
import { redirect } from "next/navigation"

export default async function ManagerSuppliersPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "MANAGER") {
    redirect("/login")
  }

  // Fetch all warehouses ordered by name
  const warehouses = await prisma.warehouse.findMany({
    orderBy: { nama: "asc" }
  })

  // Fetch all suppliers including their associated warehouse ordered by name
  const suppliers = await prisma.supplier.findMany({
    include: {
      warehouse: true
    },
    orderBy: { nama: "asc" }
  })

  return (
    <div className="max-w-7xl mx-auto">
      <ManagerSuppliersClient suppliers={suppliers} warehouses={warehouses} />
    </div>
  )
}
