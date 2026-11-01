import { Router } from "express";
import {
  createPost,
  deletePost,
  getPost,
  listPosts,
  updatePost,
} from "../controllers/post.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", listPosts);
router.get("/:postId", getPost);
router.post("/", requireAuth, createPost);
router.patch("/:postId", requireAuth, updatePost);
router.delete("/:postId", requireAuth, deletePost);

export default router;
