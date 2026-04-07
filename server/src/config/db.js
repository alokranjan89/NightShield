import mongoose from "mongoose";

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("DB Error: Missing MONGO_URI environment variable.");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MONGODB CONNECTED");
  } catch (error) {
    console.error("DB Error:", error);
    process.exit(1);
  }
};

export default connectDB;
