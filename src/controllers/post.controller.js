import mongoose from "mongoose";
import Post from "../models/post.model.js";
import { createHttpError } from "../utils/http-error.js";

const validatePostId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createHttpError(400, "Post ID is invalid.");
  }
};

const validatePostFields = (fields, { partial = false } = {}) => {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
    throw createHttpError(400, "A JSON object is required.");
  }

  const updates = {};

  if ("title" in fields) {
    if (
      typeof fields.title !== "string" ||
      fields.title.trim().length === 0 ||
      fields.title.trim().length > 160
    ) {
      throw createHttpError(400, "Title must be between 1 and 160 characters.");
    }
    updates.title = fields.title.trim();
  }

  if ("content" in fields) {
    if (
      typeof fields.content !== "string" ||
      fields.content.trim().length === 0 ||
      fields.content.trim().length > 10000
    ) {
      throw createHttpError(400, "Content must be between 1 and 10000 characters.");
    }
    updates.content = fields.content.trim();
  }

  if (!partial && (!("title" in updates) || !("content" in updates))) {
    throw createHttpError(400, "Title and content are required.");
  }

  if (partial && Object.keys(updates).length === 0) {
    throw createHttpError(400, "Provide a title or content to update.");
  }

  return updates;
};

const findOwnedPost = async (id, userId) => {
  validatePostId(id);
  const post = await Post.findById(id);

  if (!post) {
    throw createHttpError(404, "Post not found.");
  }
  if (post.author.toString() !== userId.toString()) {
    throw createHttpError(403, "You cannot modify another user's post.");
  }

  return post;
};

export const listPosts = async (request, response) => {
  const page = Number(request.query.page ?? 1);
  const limit = Number(request.query.limit ?? 20);
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw createHttpError(400, "Page must be positive and limit must be 1 to 100.");
  }

  const [posts, total] = await Promise.all([
    Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "username")
      .lean(),
    Post.countDocuments(),
  ]);

  response.status(200).json({ posts, page, limit, total });
};

export const getPost = async (request, response) => {
  validatePostId(request.params.postId);
  const post = await Post.findById(request.params.postId)
    .populate("author", "username")
    .lean();

  if (!post) {
    throw createHttpError(404, "Post not found.");
  }
  response.status(200).json({ post });
};

export const createPost = async (request, response) => {
  const fields = validatePostFields(request.body ?? {});
  const post = await Post.create({
    ...fields,
    author: request.authUser._id,
  });

  response.status(201).json({ post });
};

export const updatePost = async (request, response) => {
  const updates = validatePostFields(request.body ?? {}, { partial: true });
  const post = await findOwnedPost(request.params.postId, request.authUser._id);

  Object.assign(post, updates);
  await post.save();
  await post.populate("author", "username");

  response.status(200).json({ post });
};

export const deletePost = async (request, response) => {
  const post = await findOwnedPost(request.params.postId, request.authUser._id);
  await post.deleteOne();
  response.status(200).json({ message: "Post deleted successfully." });
};
