import dotenv from "dotenv";
import connectDB from "./config/database.js";
import app from "./app.js";

dotenv.config();

const startServer = async () => {
  await connectDB();

  const port = Number(process.env.PORT || 8000);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("PORT must be an integer between 0 and 65535.");
  }

  const server = app.listen(port, () => {
    const address = server.address();
    const listeningPort =
      typeof address === "object" && address !== null ? address.port : port;
    console.log(`Server listening on port ${listeningPort}`);
  });

  server.on("error", (error) => {
    console.error("HTTP server failed to start:", error);
    process.exitCode = 1;
  });
};

startServer().catch((error) => {
  console.error("Server startup failed:", error);
  process.exitCode = 1;
});