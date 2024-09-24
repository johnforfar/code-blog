// ./packages/database/prisma/test.ts

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const prisma = new PrismaClient();

async function main() {
  // Check if there are any posts in the database
  const allPosts = await prisma.post.findMany();
  console.log('All posts:', allPosts);

  // Get the total count of posts
  const postCount = await prisma.post.count();
  console.log('Total number of posts:', postCount);

  // Check the most recent post
  const latestPost = await prisma.post.findFirst({
    orderBy: {
      createdAt: 'desc'
    }
  });
  console.log('Latest post:', latestPost);

  // Check posts with pagination
  const paginatedPosts = await prisma.post.findMany({
    take: 12,
    skip: 0,
    orderBy: {
      createdAt: 'desc'
    }
  });
  console.log('Paginated posts:', paginatedPosts);

  // Check if there are any issues with the owner_id
  const postsWithOwners = await prisma.post.findMany({
    include: {
      owner: true
    }
  });
  console.log('Posts with owners:', postsWithOwners);

  // Simulate the getPaginatedPosts query used by the application
  const ownerId = ''; // Simulate the ownerId parameter
  const page = 1; // Simulate the page parameter
  const pageSize = 12; // Simulate the pageSize parameter

  const whereClause: any = {};
  if (ownerId) {
    whereClause.ownerId = ownerId;
  }

  const appPaginatedPosts = await prisma.post.findMany({
    where: whereClause,
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: {
      createdAt: 'desc'
    }
  });
  console.log('App paginated posts:', appPaginatedPosts);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });