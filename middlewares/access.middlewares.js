// middleware/authorize.js
const mongoose = require("mongoose");
const Customer = require("../models/customer.models"); 
require("../models/role.models");
require("../models/permission.models");
require("../models/module.models");

// normalize action to one of: create | read | update | delete
function normalizeAction(a) {
  const x = String(a || "").trim().toLowerCase();
  if (["get", "read", "list", "fetch", "view"].includes(x)) return "read";
  if (["post", "create", "add", "new"].includes(x)) return "create";
  if (["put", "patch", "edit", "update"].includes(x)) return "update";
  if (["del", "delete", "remove"].includes(x)) return "delete";
  return x; // assume already one of CRUD
}

// normalize resource into matcher: id or name(s)
function toResourceMatchers(res) {
  if (Array.isArray(res)) return res.map(toResourceMatchers).flat();
  if (!res) return [];
  const s = String(res).trim();
  const isId = mongoose.isValidObjectId(s);
  return [{ kind: isId ? "id" : "name", value: s.toLowerCase() }];
}

module.exports = (action, resource) => async (req, res, next) => {
  try {
    const customerId =
      req?.user?.userId || req?.user?.id || req?.customer?.id || null;

    if (!customerId) {
      return res.status(403).json({ error: "Customer not authenticated" });
    }

    // Fetch customer with deep RBAC populate
    const customer = await Customer.findById(customerId)
      .select("_id name roles")
      .populate({
        path: "roles",
        model: "CustomerRole", 
        select: "_id name permissions",
        populate: {
          path: "permissions",
          model: "CustomerPermission",
          select: "_id name access module",
          populate: {
            path: "module",
            model: "CustomerModule",
            select: "_id name",
          },
        },
      })
      .lean();

    if (!customer) {
      return res.status(403).json({ error: "Customer not found" });
    }

    // Superusers bypass checks
    const isAdmin = (customer.roles || []).some(
      (r) => ["superadmin", "admin"].includes(String(r?.name || "").toLowerCase())
    );
    if (isAdmin) return next();

    const act = normalizeAction(action);
    const needed = toResourceMatchers(resource);

    // If no resource specified, just check action exists anywhere
    const hasPermission = (customer.roles || []).some((role) =>
      (role.permissions || []).some((perm) => {
        // access array like ["create","read",...]
        const access = (perm?.access || []).map((a) => String(a).toLowerCase());
        if (!access.includes(act)) return false;

        const mod = perm?.module || null;
        if (!mod) return false;

        // If no resource constraint, any module with the action is okay
        if (needed.length === 0) return true;

        const modId = mod?._id ? String(mod._id) : "";
        const modName = String(mod?.name || "").toLowerCase();

        return needed.some((n) =>
          n.kind === "id" ? modId === n.value : modName === n.value
        );
      })
    );

    if (!hasPermission) {
      return res.status(403).json({ error: "Access denied" });
    }

    return next();
  } catch (err) {
    console.error("[authorize] error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
};
