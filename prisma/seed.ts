import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';
import 'dotenv/config'; // load .env

// Prisma v7 wajib pakai adapter
const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  // upsert = update kalau ada, create kalau belum ada
  // Aman dijalankan berkali-kali, tidak akan duplikat
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {}, // tidak update apa-apa kalau sudah ada
    create: {
      name: 'Admin',
      username: 'admin',
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10), // hash password
      role: 'ADMIN',
    },
  });
  console.log('Seeder selesai');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect()); // tutup koneksi setelah selesai