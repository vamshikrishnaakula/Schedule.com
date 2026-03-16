const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  const email = 'vamshikrishnaakula99@gmail.com';
  const password = 'Admin123!@#';
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('✅ User already exists:', email);
    return;
  }
  
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      username: 'admin',
      name: 'Admin User',
      emailVerified: new Date(),
      completedOnboarding: true,
    },
  });
  
  console.log('✅ Admin user created:', email);
  console.log('Password:', password);
}

createAdmin().catch(console.error).finally(() => prisma.$disconnect());
