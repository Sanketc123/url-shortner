const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

require("./config/passport");

const app = require("./app");

const DB = process.env.DATABASE_LOCAL;
mongoose
  .connect(DB, {
    // useNewUrlParser: true,
  })
  .then(() => console.log("DB connection successful"));

const port = process.env.port || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION! Shutting down...");
  server.close(() => {
    process.exit(1);
  });
});
