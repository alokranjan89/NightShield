import mongoose from "mongoose";

const evidenceSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      default: "",
    },
    url: {
      type: String,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ["photo", "video"],
      required: true,
    },
    resourceType: {
      type: String,
      default: "",
    },
    bytes: {
      type: Number,
      default: 0,
    },
    format: {
      type: String,
      default: "",
    },
    width: {
      type: Number,
      default: null,
    },
    height: {
      type: Number,
      default: null,
    },
    duration: {
      type: Number,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const sosSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    default: "",
  },
  userEmail: {
    type: String,
    default: "",
  },
  source: {
    type: String,
    default: "manual",
  },
  location: {
    lat: Number,
    lng: Number,
  },
  status: {
    type: String,
    enum: ["active", "resolved"],
    default: "active",
  },
  notifiedUserIds: {
    type: [String],
    default: [],
  },
  contactsCount: {
    type: Number,
    default: 0,
  },
  contactsNotified: {
    type: Number,
    default: 0,
  },
  nearbyUsers: {
    type: Number,
    default: 0,
  },
  targetContact: {
    name: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    relation: {
      type: String,
      default: "",
    },
  },
  evidence: {
    type: [evidenceSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
});

export default mongoose.model("SOS", sosSchema);
