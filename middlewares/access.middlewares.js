// authorize.js
const mongoose = require("mongoose");
const Customer = require("../models/customer.models");

module.exports = (action, resource) => async (req, res, next) => {
  try {
    const customerId = req.customer?.id;
    if (!customerId)
      return res.status(403).json({ error: "customer not authenticated" });

    const customer = await Customer.findById(customerId).populate({
      path: "roles",
      populate: {
        path: "permissions",
        model: "Permission",
        populate: {
          path: "module",
          model: "Module",
          select: "name",
        },
      },
    });

    if (!customer) return res.status(403).json({ error: "Customer not found" });

    const isAdmin = customer.roles?.some(
      (r) => r?.name === "superadmin" || r?.name === "admin"
    );
    if (isAdmin) return next();

    const act = String(action || "").toLowerCase();
    const resIsObjectId = mongoose.isValidObjectId(resource);

    const hasPermission = customer.roles?.some((role) =>
      role?.permissions?.some((perm) => {
        const access = (perm?.access || []).map((a) => String(a).toLowerCase());

        const modDoc =
          perm?.module && typeof perm.module === "object" ? perm.module : null;
        const modId = modDoc?._id?.toString() || perm?.module?.toString?.();
        const modName = modDoc?.name?.trim?.();

        const moduleMatches =
          (resIsObjectId && modId === String(resource)) ||
          (!resIsObjectId &&
            modName &&
            modName.toLowerCase() === String(resource).toLowerCase());

        return moduleMatches && access.includes(act);
      })
    );

    if (!hasPermission) return res.status(403).json({ error: "Access denied" });
    next();
  } catch (err) {
    console.error("authorize error:", err);
    res.status(500).json({ error: err.message });
  }
};
