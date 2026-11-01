import { createHash } from "node:crypto";
import Session from "../models/session.model.js";
import { createHttpError } from "../utils/http-error.js";

export const hashToken = (token) =>
  createHash("sha256").update(token).digest("hex");

export const requireAuth = async (request, _response, next) => {
  const authorization = request.get("authorization") ?? "";
  const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(authorization);

  if (!match) {
    return next(createHttpError(401, "A valid bearer token is required."));
  }

  try {
    const session = await Session.findOne({
      tokenHash: hashToken(match[1]),
      expiresAt: { $gt: new Date() },
    }).populate("user");

    if (!session || !session.user) {
      return next(createHttpError(401, "The bearer token is invalid or expired."));
    }

    request.authSession = session;
    request.authUser = session.user;
    next();
  } catch (error) {
    next(error);
  }
};
