import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create users
  const user1 = await prisma.user.create({
    data: {
      username: 'alice',
      email: 'alice@example.com',
      password: hashedPassword,
      role: 'USER',
      bio: 'Loves photography',
      profilePicture: 'alice.jpg',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      username: 'bob',
      email: 'bob@example.com',
      password: hashedPassword,
      role: 'ADMIN',
      bio: 'Video enthusiast',
      profilePicture: 'bob.jpg',
    },
  });

  // Create posts
  const post1 = await prisma.post.create({
    data: {
      userId: user1.id,
      mediaFile: 'photo1.jpg',
      caption: 'Beautiful sunset',
      timestamp: new Date(),
    },
  });

  // Create comments
  await prisma.comment.create({
    data: {
      userId: user2.id,
      postId: post1.id,
      content: 'Amazing view!',
      timestamp: new Date(),
    },
  });

  // Create likes and ratings
  await prisma.like.create({
    data: { userId: user2.id, postId: post1.id, timestamp: new Date() },
  });

  await prisma.rating.create({
    data: { userId: user2.id, postId: post1.id, value: 5, timestamp: new Date() },
  });

  console.log('Database seeded successfully');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });