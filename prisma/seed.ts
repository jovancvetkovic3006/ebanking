import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash("Admin123!", 10);
  const userPass = await bcrypt.hash("User123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: { email: "admin@demo.com", passwordHash: adminPass, role: "ADMIN" },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@demo.com" },
    update: {},
    create: { email: "user@demo.com", passwordHash: userPass, role: "USER" },
  });

  await prisma.account.createMany({
    data: [
      { userId: user.id, currency: "RSD", balance: 250000 },
      { userId: admin.id, currency: "RSD", balance: 1000000 },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
