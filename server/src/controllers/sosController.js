import SOS from "../models/SOS.js";
import Contact from "../models/Contact.js";
import User from "../models/User.js";
import { getIO, users } from "../socketStore.js";

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

export const createSOS = async (req, res) => {
  try {
    const io = getIO();
    const { userId, user, location, source, contacts = [], targetContact = null } = req.body;
    const lat = req.body.lat ?? location?.lat ?? location?.latitude;
    const lng = req.body.lng ?? location?.lng ?? location?.longitude;
    const normalizedLocation = lat != null && lng != null ? { lat, lng } : null;

    const sos = new SOS({
      userId,
      location: normalizedLocation || undefined,
    });

    await sos.save();

    const savedContacts = await Contact.find({ userId });

    savedContacts.forEach((contact) => {
      console.log(`Alert sent to ${contact.name} (${contact.phone})`);
    });

    const nearbyRecipients = [];

    if (normalizedLocation) {
      const nearbyUsers = await User.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance: 5000,
          },
        },
      });

      nearbyUsers
        .filter((nearbyUser) => nearbyUser.userId !== userId)
        .forEach((nearbyUser) => {
          nearbyRecipients.push(nearbyUser.userId);
          console.log(`Nearby user alert: ${nearbyUser.userId}`);
        });
    }

    const sentUserIds = new Set();

    nearbyRecipients.forEach((nearbyUserId) => {
      const socketId = users[nearbyUserId];

      if (io && socketId && !sentUserIds.has(nearbyUserId)) {
        io.to(socketId).emit(
          "SOS_ALERT",
          buildAlertPayload({
            sos,
            reqBody: req.body,
            userId,
            user,
            source,
            targetContact,
            contactsCount: contacts.length,
            contactsNotified: 0,
            nearbyUsers: nearbyRecipients.length,
            location: normalizedLocation,
            message: `${user?.name || "Someone"} triggered an SOS nearby.`,
            recipientType: "nearby",
          })
        );
        sentUserIds.add(nearbyUserId);
      } else if (!sentUserIds.has(nearbyUserId)) {
        console.log(`No active socket found for nearby user: ${nearbyUserId}`);
      }
    });

    res.status(201).json({
      id: sos._id.toString(),
      type: "Emergency SOS",
      status: "Active",
      createdAt: sos.createdAt,
      message: "SOS created and alerts sent",
      payload: req.body,
      location: normalizedLocation,
      sos,
      contactsNotified: 0,
      nearbyUsers: nearbyRecipients.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.message });
  }
};
