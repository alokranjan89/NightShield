import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userId: String,

  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
    },
  },
});

userSchema.index({ location: "2dsphere" });

export default mongoose.model("User", userSchema);
