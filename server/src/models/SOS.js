import mongoose from "mongoose";

const sosSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  location: {
    lat: Number,
    lng: Number,
  },
  status: {
    type: String,
    default: "active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("SOS", sosSchema);