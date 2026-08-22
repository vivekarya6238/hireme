require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectdb = require("./src/config/db");
const { errorhandler } = require("./src/middlewares/errorhandler");
const authroutes = require("./src/routes/authroutes");
const userroutes = require("./src/routes/userroutes");
const jobroutes = require("./src/routes/jobroutes");
const applicationroutes = require("./src/routes/applicationroutes");
const ratingroutes = require("./src/routes/ratingroutes");
const categoryroutes = require("./src/routes/categoryroutes");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT }));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "hireme api running",
    time: new Date().toISOString(),
  });
});

app.use("/api/auth", authroutes);
app.use("/api/users", userroutes);
app.use("/api/jobs", jobroutes);
app.use("/api/applications", applicationroutes);
app.use("/api/ratings", ratingroutes);
app.use("/api/categories", categoryroutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "route not found" });
});

app.use(errorhandler);

connectdb().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`server running on port ${process.env.PORT}`);
  });
});