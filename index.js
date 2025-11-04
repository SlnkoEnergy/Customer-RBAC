const express = require("express");
const cors = require("cors");

const customerRoutes = require("./routes/customer.routes");
const roleRoutes = require("./routes/role.routes");
const permissionRoutes = require("./routes/permission.routes");
const moduleRoutes = require("./routes/module.routes");

function createApp() {
  const app = express();
  app.use(express.json());

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : [];

  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) callback(null, true);
        else callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );

  // RBAC Routes
  app.use("/rbac/customers", customerRoutes);
  app.use("/rbac/roles", roleRoutes);
  app.use("/rbac/permissions", permissionRoutes);
  app.use("/rbac/modules", moduleRoutes);

  // Home route
  app.get("/", (req, res) => res.send("Access Control RBAC API"));

  return app;
}

module.exports = { createApp };
