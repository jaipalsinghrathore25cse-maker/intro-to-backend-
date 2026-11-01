import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import Session from "../models/session.model.js";
import User, { toPublicUser } from "../models/user.model.js";
import { hashToken } from "../middleware/auth.middleware.js";
import { createHttpError } from "../utils/http-error.js";

const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

const createSession = async (user, response) => {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);

  await Session.create({
    user: user._id,
    tokenHash: hashToken(token),
    expiresAt,
  });

  response.status(200).json({
    token,
    tokenType: "Bearer",
    expiresAt,
    user: toPublicUser(user),
  });
};

export const register = async (request, response) => {
  const { username, email, password } = request.body ?? {};

  if (
    typeof username !== "string" ||
    username.trim().length < 3 ||
    username.trim().length > 30
  ) {
    throw createHttpError(400, "Username must be between 3 and 30 characters.");
  }

  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    throw createHttpError(400, "A valid email address is required.");
  }

  if (
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    throw createHttpError(400, "Password must be 8 to 72 bytes long.");
  }

  const user = await User.create({
    username: username.trim(),
    email: email.trim().toLowerCase(),
    password: await bcrypt.hash(password, 12),
  });

  response.status(201).json({ user: toPublicUser(user) });
};

export const login = async (request, response) => {
  const { email, password } = request.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    throw createHttpError(400, "Email and password are required.");
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
    "+password",
  );
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw createHttpError(401, "Email or password is incorrect.");
  }

  await createSession(user, response);
};

export const logout = async (request, response) => {
  await request.authSession.deleteOne();
  response.status(200).json({ message: "Logged out successfully." });
};

export const getCurrentUser = async (request, response) => {
  response.status(200).json({ user: toPublicUser(request.authUser) });
};
