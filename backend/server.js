require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectdb = require("./src/config/db");
const { errorhandler } = require("./src/middlewares/errorhandler");

const app = express();

// security headers
app.use(helmet());

// only our frontend can call the api
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT }));

// health check - render pings this to know we're alive
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "hireme api running",
    time: new Date().toISOString(),
  });
});

// feature routes will mount here one by one
// app.use("/api/auth", authroutes);

// unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "route not found" });
});

// keep this last
app.use(errorhandler);

// db first, then server
connectdb().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`server running on port ${process.env.PORT}`);
  });
});