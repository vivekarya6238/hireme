const mongoose = require("mongoose");

const connectdb = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`mongodb connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("db connection failed:", err.message);
    // no point running the server without db
    process.exit(1);
  }
};

module.exports = connectdb;