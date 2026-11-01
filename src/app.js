import express from "express";
import postRoutes from "./routes/post.route.js";
import userRoutes from "./routes/user.route.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { createHttpError } from "./utils/http-error.js";

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);

app.use((_request, _response, next) => {
  next(createHttpError(404, "Route not found."));
});

app.use(errorHandler);

export default app;