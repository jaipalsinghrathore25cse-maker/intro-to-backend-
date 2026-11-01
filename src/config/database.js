
import mongoose from "mongoose";

const connectDB = async () => {
  const { MONGODB_URI } = process.env;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set. Add it to the root .env file.");
  }

  const connection = await mongoose.connect(MONGODB_URI);
  console.log(`MongoDB connected: ${connection.connection.host}`);
};

export default connectDB;