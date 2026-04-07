import express from "express";
import cors from "cors";
import sosRoutes from "./routes/sosRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/sos", sosRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req,res) => {
    res.send("Backend is Working ");
})

export default app;