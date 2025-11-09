const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const customerRoutes = require("./routes/customer.routes");
const roleRoutes = require("./routes/role.routes");
const permissionRoutes = require("./routes/permission.routes");
const moduleRoutes = require("./routes/module.routes");

async function createApp() {
  // Connect once, using env provided by the parent process
  if (mongoose.connection.readyState === 0) {
    const uri = process.env.MONGO_URI || process.env.DB_DEVELOPMENT_URL;
    if (!uri) throw new Error("[customer-auth] MONGO_URI/DB_DEVELOPMENT_URL not set");
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log("[customer-auth] MongoDB connected");
  }

  const app = express();
  app.use(express.json());

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : [];

  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || allowedOrigins.includes(origin)) cb(null, true);
        else cb(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );

  // RBAC Routes
  app.use("/rbac/customers", customerRoutes);
  app.use("/rbac/roles", roleRoutes);
  app.use("/rbac/permissions", permissionRoutes);
  app.use("/rbac/modules", moduleRoutes);

  app.get("/", (_, res) => res.send("Access Control RBAC API"));
  return app;
}

module.exports = { createApp };
