import User from "../models/User.js";

export const updateLocation = async (req, res) => {
  try {
    const { userId, lat, lng } = req.body;

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
    res.status(500).json({ error: err.message });
  }
};
