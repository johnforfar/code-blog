import { PrismaClient, Post } from "@prisma/client";
import { hashBuffer } from "../utils/hash"
import * as proto from "@code-pennypost/api";

const prisma = new PrismaClient();

const toProto = (post: Post) : proto.Post => {
    return new proto.Post({
        id: post.id,
        ownerId: post.ownerId,

        imageId: post.imageId ?? undefined,
        contentId: post.contentId,

        title: post.title,
        short: post.short,
        slug: post.slug,

        price: post.price,
        paymentAddress: post.paymentAddress,
        hasPaywall: post.hasPaywall,

        createdAt: post.createdAt.toISOString(),
    });
};

interface CreatePostOpts {
  ownerId: string;
  title: string;
  short: string;
  imageId?: string;
  slug: string;
  price: string;
  paymentAddress: string;
  hasPaywall: boolean;
}

async function createPost(opt: CreatePostOpts, content: string): Promise<Post> {
    const key = "post";
    const buf = Buffer.from(content);
    const hash = hashBuffer(buf).toString("base64");

    const record = await prisma.post.create({
        data: {
            owner: { connect: { id: opt.ownerId, }, },

            title: opt.title,
            short: opt.short,
            price: opt.price,
            slug: opt.slug,
            paymentAddress: opt.paymentAddress,
            hasPaywall: opt.hasPaywall,

            image: opt.imageId ? { connect: { id: opt.imageId, }, } : undefined,

            content: {
                create: {
                    key: key,
                    value: buf,
                    hash: hash,
                    owner: { connect: { id: opt.ownerId, }, }
                },
            },
        },
    });
  return record;
}       

async function getPostById(postId: string): Promise<Post | null> {
  const record = await prisma.post.findUnique({
    where: {
      id: postId,
    },
  });
  return record;
}

async function getPostBySlug(slug: string): Promise<Post | null> {
  const record = await prisma.post.findUnique({
    where: {
      slug: slug,
    },
  });
  return record;
}

interface GetPaginatedPostsOpts {
    page: number;
    pageSize: number;
}

async function getPaginatedPosts(ownerId: string, opts: GetPaginatedPostsOpts): Promise<Post[]> {
    const records = await prisma.post.findMany({
        where: {
            ownerId: ownerId,
        },

        skip: opts.page * opts.pageSize,
        take: opts.pageSize,
    });

    return records;
}

async function getPostCountByOwner(ownerId: string): Promise<number> {
    const count = await prisma.post.count({
        where: {
            ownerId: ownerId,
        },
    });

    return count;
}

async function getPostCount(): Promise<number> {
    const count = await prisma.post.count();
    return count;
}

// Get all blog posts function
async function getAllPosts(filters: {
  tag?: string;
  authorId?: string;
  sortBy?: string;
  ascending?: boolean;
  page: number;
  pageSize: number;
}): Promise<Post[]> {
  const { tag, authorId, sortBy, ascending, page, pageSize } = filters;

  // Log the filters
  console.log("getAllPosts filters:", filters);

  const whereClause: any = {};

  if (authorId) {
    whereClause.ownerId = authorId;
  }

  if (tag) {
    whereClause.tags = {
      some: {
        name: tag,
      },
    };
  }

  // Log the where clause
  console.log("getAllPosts where clause:", whereClause);

  const posts = await prisma.post.findMany({
    where: whereClause,
    orderBy: sortBy ? { [sortBy]: ascending ? "asc" : "desc" } : undefined,
    skip: page * pageSize,
    take: pageSize,
  });

  // Log the fetched posts
  console.log("Fetched posts from database:", posts);

  return posts;
}

export {
  toProto,

  createPost,
  getPostById,
  getPostBySlug,
  getPaginatedPosts,

  getPostCount,
  getPostCountByOwner,

  getAllPosts, // Get all blog posts

};