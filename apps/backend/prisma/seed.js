const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.info('🌱 Seeding database...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { phone: '+628000000000' },
    update: {},
    create: {
      phone: '+628000000000',
      email: 'admin@bukupay.id',
      fullName: 'Admin BukuPay',
      role: 'ADMIN',
      kycStatus: 'VERIFIED',
    },
  });

  // Create sample merchant
  const merchant = await prisma.user.upsert({
    where: { phone: '+6281234567890' },
    update: {},
    create: {
      phone: '+6281234567890',
      email: 'merchant@example.com',
      fullName: 'Budi Santoso',
      role: 'OWNER',
      kycStatus: 'VERIFIED',
    },
  });

  // Create sample store
  await prisma.store.upsert({
    where: { qrisCode: 'SAMPLE_QRIS_CODE_001' },
    update: {},
    create: {
      name: 'Warung Budi',
      address: 'Jl. Sudirman No. 123',
      city: 'Jakarta',
      province: 'DKI Jakarta',
      category: 'kuliner',
      ownerId: merchant.id,
      qrisCode: 'SAMPLE_QRIS_CODE_001',
      isActive: true,
    },
  });

  console.info('✅ Seeding selesai!');
  console.info(`   Admin: ${admin.phone}`);
  console.info(`   Merchant: ${merchant.phone}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
