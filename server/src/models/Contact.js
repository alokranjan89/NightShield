import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  contactUserId: {
    type: String,
    default: "",
  },
  name: String,
  phone: String,
  relation: String,
  isPrimary: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model("Contact", contactSchema);
