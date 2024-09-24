import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a default user if it doesn't exist
  const defaultUser = await prisma.user.upsert({
    where: { codeAddress: 'default-code-address' },
    update: {},
    create: {
      codeAddress: 'default-code-address',
      name: 'Default User',
      bio: 'This is a default user created by the seed script.',
    },
  })

  console.log({ defaultUser })

  // Create a sample post if it doesn't exist
  const samplePost = await prisma.post.upsert({
    where: { slug: 'welcome-to-pennypost' },
    update: {},
    create: {
      title: 'Welcome to Pennypost',
      short: 'This is a sample post created by the seed script.',
      slug: 'welcome-to-pennypost',
      price: '0.25',
      paymentAddress: 'sample-payment-address',
      hasPaywall: true,
      owner: {
        connect: { id: defaultUser.id },
      },
      content: {
        create: {
          key: 'content',
          value: Buffer.from('Welcome to Pennypost! This is a sample post content.'),
          hash: 'sample-hash',
          owner: {
            connect: { id: defaultUser.id },
          },
        },
      },
    },
  })

  console.log({ samplePost })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })