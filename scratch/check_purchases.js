const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const warehouses = await prisma.warehouse.findMany();
  console.log("Warehouses in DB:", warehouses.map(w => ({ id: w.id, nama: w.nama })));

  const purchases = await prisma.purchase.findMany({
    include: {
      items: true,
      warehouse: true
    }
  });
  console.log("Total purchases in DB:", purchases.length);

  const warehousesWithPurchases = {};
  for (const p of purchases) {
    if (!warehousesWithPurchases[p.warehouseId]) {
      warehousesWithPurchases[p.warehouseId] = 0;
    }
    warehousesWithPurchases[p.warehouseId] += p.items.length;
  }
  console.log("Purchase items count per warehouseId:", warehousesWithPurchases);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
