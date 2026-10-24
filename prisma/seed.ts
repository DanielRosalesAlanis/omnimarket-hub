import { PrismaClient } from "@prisma/client";
import { buildSeedOrders } from "../lib/seed-data";

const prisma = new PrismaClient();

async function main() {
  const orders = buildSeedOrders(500);
  await prisma.order.deleteMany();
  const { count } = await prisma.order.createMany({ data: orders });
  console.log(`Seed completado: ${count} pedidos`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
