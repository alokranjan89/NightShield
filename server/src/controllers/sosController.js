import SOS from "../models/SOS.js";
import Contact from "../models/Contact.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import { getConnectedUsers, getIO, getUserSocketIds } from "../socketStore.js";

const DEFAULT_NEARBY_RADIUS_METERS = 20000;

function normalizeCoordinate(value) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}

function buildAlertPayload({
  sos,
  reqBody,
  userId,
  user,
  source,
  targetContact,
  contactsCount,
  contactsNotified,
  nearbyUsers,
  location,
  message,
  recipientType,
}) {
  return {
    id: sos._id.toString(),
    type: "Emergency SOS",
    status: "Active",
    createdAt: sos.createdAt,
    message,
    sender: user?.name || "Unknown user",
    senderEmail: user?.email || "",
    senderId: userId,
    source: source || "manual",
    targetContact,
    contactsCount,
    contactsNotified,
    nearbyUsers,
    recipientType,
    location,
    payload: reqBody,
    sos,
  };
}

function formatSOSResponse(sos) {
  return {
    id: sos._id.toString(),
    type: "Emergency SOS",
    status: sos.status === "resolved" ? "Resolved" : "Active",
    createdAt: sos.createdAt,
    resolvedAt: sos.resolvedAt,
    message:
      sos.status === "resolved"
        ? "SOS session resolved"
        : "SOS created and alerts sent",
    sender: sos.userName || "Unknown user",
    senderEmail: sos.userEmail || "",
    senderId: sos.userId,
    source: sos.source || "manual",
    targetContact: sos.targetContact || null,
    contactsCount: sos.contactsCount || 0,
    contactsNotified: sos.contactsNotified || 0,
    nearbyUsers: sos.nearbyUsers || 0,
    location: sos.location || null,
    evidence: sos.evidence || [],
    sos,
  };
}

function sanitizeFolderSegment(value, fallback) {
  return String(value || fallback)
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || fallback;
}

async function uploadBufferToCloudinary({ buffer, mimeType, folder, resourceType }) {
  const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

  return cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: resourceType,
  });
}

export const createSOS = async (req, res) => {
  try {
    const io = getIO();
    const { userId, user, location, source, contacts = [], targetContact = null } = req.body;
    const lat = normalizeCoordinate(req.body.lat ?? location?.lat ?? location?.latitude);
    const lng = normalizeCoordinate(req.body.lng ?? location?.lng ?? location?.longitude);
    const normalizedLocation = lat != null && lng != null ? { lat, lng } : null;
    const nearbyRadiusMeters = Number(process.env.SOS_NEARBY_RADIUS_METERS) || DEFAULT_NEARBY_RADIUS_METERS;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const nearbyRecipients = [];

    const sos = new SOS({
      userId,
      userName: user?.name || "",
      userEmail: user?.email || "",
      source: source || "manual",
      location: normalizedLocation || undefined,
      contactsCount: contacts.length,
      contactsNotified: 0,
      nearbyUsers: 0,
      targetContact: targetContact
        ? {
            name: targetContact.name || "",
            phone: targetContact.phone || "",
            relation: targetContact.relation || "",
          }
        : undefined,
    });

    await sos.save();

    const savedContacts = await Contact.find({ userId });

    savedContacts.forEach((contact) => {
      console.log(`Alert sent to ${contact.name} (${contact.phone})`);
    });

    if (normalizedLocation) {
      const matchedUsers = await User.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance: nearbyRadiusMeters,
          },
        },
      });

      matchedUsers
        .filter((nearbyUser) => nearbyUser.userId && nearbyUser.userId !== userId)
        .forEach((nearbyUser) => {
          nearbyRecipients.push(nearbyUser.userId);
          console.log(`Nearby user alert: ${nearbyUser.userId}`);
        });

      console.log(
        "SOS nearby match summary:",
        JSON.stringify({
          senderId: userId,
          location: normalizedLocation,
          nearbyRadiusMeters,
          matchedUsers: matchedUsers.map((nearbyUser) => nearbyUser.userId || "(missing userId)"),
        })
      );
    } else {
      console.log(`SOS created without normalized location for user ${userId}`);
    }

    if (nearbyRecipients.length === 0) {
      const connectedUsers = Object.keys(getConnectedUsers()).filter(
        (connectedUserId) => connectedUserId !== userId
      );

      connectedUsers.forEach((connectedUserId) => {
        nearbyRecipients.push(connectedUserId);
      });

      if (connectedUsers.length > 0) {
        console.log(
          `No nearby users with stored location found for ${userId}. Falling back to connected users: ${connectedUsers.join(", ")}`
        );
      }
    }

    const uniqueNearbyRecipients = [...new Set(nearbyRecipients)];
    const sentUserIds = new Set();

    uniqueNearbyRecipients.forEach((nearbyUserId) => {
      const socketIds = getUserSocketIds(nearbyUserId);

      if (io && socketIds.length > 0 && !sentUserIds.has(nearbyUserId)) {
        const payload = buildAlertPayload({
          sos,
          reqBody: req.body,
          userId,
          user,
          source,
          targetContact,
          contactsCount: contacts.length,
          contactsNotified: 0,
          nearbyUsers: uniqueNearbyRecipients.length,
          location: normalizedLocation,
          message: `${user?.name || "Someone"} triggered an SOS nearby.`,
          recipientType: "nearby",
        });

        socketIds.forEach((socketId) => {
          io.to(socketId).emit("SOS_ALERT", payload);
        });

        console.log(`Delivered SOS_ALERT to ${nearbyUserId} on ${socketIds.length} socket(s)`);
        sentUserIds.add(nearbyUserId);
      } else if (!sentUserIds.has(nearbyUserId)) {
        console.log(`No active socket found for nearby user: ${nearbyUserId}`);
      }
    });

    sos.notifiedUserIds = uniqueNearbyRecipients;
    sos.nearbyUsers = uniqueNearbyRecipients.length;
    await sos.save();

    res.status(201).json({
      ...formatSOSResponse(sos),
      payload: req.body,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.message });
  }
};

export const resolveSOS = async (req, res) => {
  try {
    const io = getIO();
    const { id } = req.params;
    const authUserId = req.auth?.userId;

    const existingSOS = await SOS.findById(id);

    if (!existingSOS) {
      return res.status(404).json({ message: "SOS not found" });
    }

    if (!authUserId || existingSOS.userId !== authUserId) {
      return res.status(403).json({ message: "Forbidden: you cannot resolve this SOS" });
    }

    const sos = await SOS.findByIdAndUpdate(
      id,
      { status: "resolved", resolvedAt: new Date() },
      { new: true }
    );

    (sos.notifiedUserIds || []).forEach((userId) => {
      const socketIds = getUserSocketIds(userId);
      socketIds.forEach((socketId) => {
        io?.to(socketId).emit("SOS_RESOLVED", {
          id: sos._id.toString(),
          status: "Resolved",
          message: "SOS session ended by sender.",
        });
      });
    });

    return res.status(200).json({
      ...formatSOSResponse(sos),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, error: error.message });
  }
};

export const uploadSOSEvidence = async (req, res) => {
  try {
    const file = req.file;
    const { userId, sosId = "session", mediaType = "photo", captureAt = "" } = req.body;

    if (!file) {
      return res.status(400).json({ message: "media file is required" });
    }

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const evidenceFolder = [
      "nightshield",
      "sos-evidence",
      sanitizeFolderSegment(userId, "unknown-user"),
      sanitizeFolderSegment(sosId, "session"),
    ].join("/");

    const resourceType = mediaType === "video" ? "video" : "image";
    const result = await uploadBufferToCloudinary({
      buffer: file.buffer,
      mimeType: file.mimetype,
      folder: evidenceFolder,
      resourceType,
    });

    const evidenceEntry = {
      publicId: result.public_id,
      url: result.secure_url,
      mediaType,
      resourceType,
      bytes: result.bytes,
      format: result.format,
      width: result.width || null,
      height: result.height || null,
      duration: result.duration || null,
      createdAt: captureAt || new Date().toISOString(),
    };

    let updatedSOS = null;

    if (sosId && sosId !== "session" && sosId.match(/^[a-fA-F0-9]{24}$/)) {
      updatedSOS = await SOS.findByIdAndUpdate(
        sosId,
        { $push: { evidence: evidenceEntry } },
        { new: true }
      );
    }

    return res.status(201).json({
      id: result.asset_id,
      publicId: result.public_id,
      mediaType,
      resourceType,
      url: result.secure_url,
      bytes: result.bytes,
      format: result.format,
      width: result.width || null,
      height: result.height || null,
      duration: result.duration || null,
      createdAt: captureAt || new Date().toISOString(),
      sosId: updatedSOS?._id?.toString() || sosId,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Unable to upload SOS evidence",
    });
  }
};

export const getSOSHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const sessions = await SOS.find({ userId }).sort({ createdAt: -1 }).limit(25);

    return res.status(200).json(sessions.map((sos) => formatSOSResponse(sos)));
  } catch (error) {
    return res.status(500).json({ message: error.message, error: error.message });
  }
};
