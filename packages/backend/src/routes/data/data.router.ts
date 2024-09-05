import { Router } from "express";
import { requireLogin } from "../../middleware/auth";
import * as controller from "./data.controller";

const router = Router();

router.post("/upload", requireLogin, controller.upload);
router.post("/get/post", requireLogin, controller.getFull);
router.post("/get/post-preview", controller.getPreview);
router.post("/get/all-posts", controller.getAllPosts); // Get all blog posts

export default router;