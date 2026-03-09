import mongoose from "mongoose";

const connect = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not defined in the environment.");
    process.exit(1);
  }
  const maxPoolSize = parseInt(process.env.MONGODB_MAX_POOL || "200", 10);
  const minPoolSize = parseInt(process.env.MONGODB_MIN_POOL || "10", 10);
  const maxIdleTimeMS = parseInt(process.env.MONGODB_MAX_IDLE_MS || "30000", 10);
  const socketTimeoutMS = parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS || "20000", 10);
  const readPreference = process.env.MONGODB_READ_PREFERENCE || "primary";
  const compressors = process.env.MONGODB_COMPRESSORS;
  
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // Increased timeout
      maxPoolSize,
      minPoolSize,
      maxIdleTimeMS,
      socketTimeoutMS,
      readPreference,
      compressors
    });
    console.log("MongoDB connected successfully.");
  } catch (err) {
    console.error("MongoDB connection error details:");
    console.error(err);
    // Suggesting the user check their network or use a different connection string format if SRV lookup fails
    if (err.message && err.message.includes("querySrv")) {
      console.warn("\nWARNING: It seems your environment is having trouble resolving DNS SRV records (mongodb+srv).");
      console.warn("Please ensure your DNS is configured correctly or consider using the standard 'mongodb://' connection string format from MongoDB Atlas (for Node.js 2.2.12 or later).\n");
    }
    process.exit(1);
  }
};

export default connect;
