import mongoose from "mongoose";

const connect = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hansaria";
  const maxPoolSize = parseInt(process.env.MONGODB_MAX_POOL || "200", 10);
  const minPoolSize = parseInt(process.env.MONGODB_MIN_POOL || "10", 10);
  const maxIdleTimeMS = parseInt(process.env.MONGODB_MAX_IDLE_MS || "30000", 10);
  const socketTimeoutMS = parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS || "20000", 10);
  const readPreference = process.env.MONGODB_READ_PREFERENCE || "primary";
  const compressors = process.env.MONGODB_COMPRESSORS;
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize,
    minPoolSize,
    maxIdleTimeMS,
    socketTimeoutMS,
    readPreference,
    compressors
  });
};

export default connect;
