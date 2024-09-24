// ./packages/backend/src/routes/post/post.controller.ts

import * as proto from "@code-blog/api";
import * as db from "@code-blog/database";

import { Request, Response } from "express";
import { useService } from "../../service";
import { useConfig } from "../../config";
import { getTimelockStatePda, getTimelockVaultPda } from "../../utils/pda";
import { extractFirstImage, extractTitleAndShortText, hasPaywall, removePaywallTag } from "../../utils/html";
import { generateSlug } from "../../utils/slug";
import { getOrCreateImageIdFromUrl } from "../../models/data";

const ErrPostNotFound = (res: Response) => res.error({ message: "Post not found" }, 404);
const ErrInvalidRequest = (res: Response) => res.error({ message: "Invalid request" }, 400);
const ErrUnexpectedError = (res: Response) => res.error({ message: "Unexpected error" }, 500);

const create = async (req: Request, res: Response) => {
  const config = useConfig();
  const service = useService(proto.PostService.methods.create);

  const { post, content  } = service.decode(req.body);
  if (!post || !content) {
    return ErrInvalidRequest(res);
  }

  if (!req.user || !req.user.id) {
    return ErrUnexpectedError(res);
  }

  const info = await db.user.getUserById(req.user.id);
  if (!info) {
    return ErrUnexpectedError(res);
  }

  const [timelock] = getTimelockStatePda(info.codeAddress);
  const [vault] = getTimelockVaultPda(timelock.toBase58());
  const paymentAddress = vault.toBase58();

  const { title, short } = await extractTitleAndShortText(content);
  const slug = await generateSlug(title);

  post.ownerId = req.user.id;
  post.paymentAddress = paymentAddress;
  post.price = `${config.defaultCost}`;
  post.hasPaywall = hasPaywall(content);
  post.title = title;
  post.short = short;
  post.slug = slug;

  const imageUrl = await extractFirstImage(content);
  if (imageUrl) {
    try {
      const imageId = await getOrCreateImageIdFromUrl(imageUrl, req.user.id);
      console.log('Image ID:', imageId);
      if (imageId) {
        post.imageId = imageId;
      }
    } catch (err) {
      console.warn('Could not get or create post image', err);
    }
  }

  try {
    const result = await db.resultOrNull(db.post.createPost)(
      post,
      content,
    );

    if (!result) {
      return ErrUnexpectedError(res);
    }

    const body = service.encode(
      new proto.PostCreateResponse({
          result: proto.PostCreateResponse_Result.OK,
          id: result.id,
          slug: result.slug,
      })
    );

    res.success({ body });

  } catch (err) {
    console.error(err);
    return ErrUnexpectedError(res);
  }
};

const get = async (req: Request, res: Response) => {
  const service = useService(proto.PostService.methods.get);
  const { id, slug } = service.decode(req.body);

  if (!id && !slug) {
    return ErrInvalidRequest(res);
  }

  try {
    const getPostBy = id ? db.post.getPostById : db.post.getPostBySlug;
    const post = await db.resultOrNull(getPostBy)(id || slug);
    if (!post) {
      return ErrPostNotFound(res);
    }

    const body = service.encode(
      new proto.PostGetResponse({
          result: proto.PostGetResponse_Result.OK,
          post: db.post.toProto(post),
      })
    );

    res.success({ body });

  } catch (err) {
    console.error(err);
    return ErrUnexpectedError(res);
  }
}

const getPaginated = async (req: Request, res: Response) => {
  const service = useService(proto.PostService.methods.getPaginated);
  
  console.log("Raw request body:", req.body);
  
  const decoded = service.decode(req.body);
  console.log("Decoded request:", decoded);
  
  const { ownerId, page, pageSize } = decoded;

  console.log(`ownerId: ${ownerId}, page: ${page}, pageSize: ${pageSize}`);

  if (pageSize > 12) {
    return ErrInvalidRequest(res);
  }

  try {
    const posts = await db.resultOrNull(db.post.getPaginatedPosts)(ownerId || undefined, {
      page,
      pageSize,
    });

    console.log("Fetched posts from database:", posts);

    if (!posts) {
      console.error("getPaginatedPosts returned null");
      return ErrUnexpectedError(res);
    }

    const body = service.encode(
      new proto.PostGetPaginatedResponse({
          result: proto.PostGetPaginatedResponse_Result.OK,
          posts: posts.map(a => db.post.toProto(a)),
      })
    );

    console.log("Paginated posts response:", body);

    res.success({ body });
  } catch (err) {
    console.error("Error in getPaginated:", err);
    return ErrUnexpectedError(res);
  }
}

export {
    create,
    get,
    getPaginated,
}