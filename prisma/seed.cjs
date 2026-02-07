// CommonJS seed script to avoid ESM/ts-node resolution issues
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash("Admin123!", 10);
  const userPass = await bcrypt.hash("User123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: { firstName: "Marko", lastName: "Petrovi\u0107", phone: "+381641234567", address: "Knez Mihailova 10, Beograd" },
    create: { email: "admin@demo.com", passwordHash: adminPass, role: "ADMIN", firstName: "Marko", lastName: "Petrovi\u0107", phone: "+381641234567", address: "Knez Mihailova 10, Beograd" },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@demo.com" },
    update: { firstName: "Jovana", lastName: "Nikoli\u0107", phone: "+381652345678", address: "Bulevar Oslobo\u0111enja 45, Novi Sad" },
    create: { email: "user@demo.com", passwordHash: userPass, role: "USER", firstName: "Jovana", lastName: "Nikoli\u0107", phone: "+381652345678", address: "Bulevar Oslobo\u0111enja 45, Novi Sad" },
  });

  // Create accounts and capture their IDs
  const userAccount = await prisma.account.upsert({
    where: { id: "265-1000000000001-88" },
    update: {},
    create: { id: "265-1000000000001-88", userId: user.id, currency: "RSD", balance: 250000 },
  });

  const adminAccount = await prisma.account.upsert({
    where: { id: "265-1000000000002-85" },
    update: {},
    create: { id: "265-1000000000002-85", userId: admin.id, currency: "RSD", balance: 1000000 },
  });

  // Seed sample transactions
  const existingTx = await prisma.transaction.count();
  if (existingTx === 0) {
    await prisma.transaction.createMany({
      data: [
        { type: "DEPOSIT",  status: "SUCCESS", amount: 500000, toAccountId: userAccount.id,  createdAt: new Date("2026-01-15T10:00:00Z") },
        { type: "DEPOSIT",  status: "SUCCESS", amount: 1000000, toAccountId: adminAccount.id, createdAt: new Date("2026-01-15T10:05:00Z") },
        { type: "TRANSFER", status: "SUCCESS", amount: 50000, fromAccountId: userAccount.id, toAccountId: adminAccount.id, createdAt: new Date("2026-01-20T14:30:00Z") },
        { type: "TRANSFER", status: "SUCCESS", amount: 25000, fromAccountId: adminAccount.id, toAccountId: userAccount.id, createdAt: new Date("2026-01-22T09:15:00Z") },
        { type: "WITHDRAW", status: "SUCCESS", amount: 10000, fromAccountId: userAccount.id, createdAt: new Date("2026-01-25T16:00:00Z") },
        { type: "DEPOSIT",  status: "SUCCESS", amount: 100000, toAccountId: userAccount.id,  createdAt: new Date("2026-02-01T08:00:00Z") },
        { type: "TRANSFER", status: "SUCCESS", amount: 75000, fromAccountId: userAccount.id, toAccountId: adminAccount.id, createdAt: new Date("2026-02-03T11:45:00Z") },
        { type: "WITHDRAW", status: "SUCCESS", amount: 20000, fromAccountId: adminAccount.id, createdAt: new Date("2026-02-05T13:20:00Z") },
        // Neuspešne transakcije
        { type: "TRANSFER", status: "FAILED", amount: 9999900, fromAccountId: userAccount.id, toAccountId: adminAccount.id, createdAt: new Date("2026-02-06T10:00:00Z") },
        { type: "WITHDRAW", status: "FAILED", amount: 5000000, fromAccountId: adminAccount.id, createdAt: new Date("2026-02-07T15:30:00Z") },
      ],
    });
    console.log("Seeded 10 sample transactions (8 uspešnih, 2 neuspešne)");

    // Audit zapisi za neuspešne transakcije
    await prisma.auditLog.createMany({
      data: [
        { userId: user.id, action: "TRANSFER_FAILED", entityType: "Transaction", meta: { fromAccountId: userAccount.id, toAccountId: adminAccount.id, amount: 9999900, reason: "INSUFFICIENT" }, createdAt: new Date("2026-02-06T10:00:00Z") },
        { userId: admin.id, action: "WITHDRAW_FAILED", entityType: "Transaction", meta: { accountId: adminAccount.id, amount: 5000000, reason: "INSUFFICIENT" }, createdAt: new Date("2026-02-07T15:30:00Z") },
        // Neuspešni pokušaji prijave
        { action: "LOGIN_FAILED", entityType: "User", meta: { email: "hacker@test.com", reason: "USER_NOT_FOUND" }, createdAt: new Date("2026-02-07T18:00:00Z") },
        { userId: user.id, action: "LOGIN_FAILED", entityType: "User", entityId: user.id, meta: { email: "user@demo.com", reason: "WRONG_PASSWORD" }, createdAt: new Date("2026-02-07T18:05:00Z") },
      ],
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
