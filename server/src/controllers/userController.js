import User from "../models/User.js";

export const updateLocation = async (req, res) => {
  try {
    const { userId } = req.body;
    let { lat, lng } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    lat = Number(lat);
    lng = Number(lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: "Valid lat and lng are required" });
    }

    const user = await User.findOneAndUpdate(
      { userId },
      {
        location: {
          type: "Point",
          coordinates: [lng, lat],
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    res.json(user);
  } catch (err) {
    console.error("UPDATE LOCATION ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};