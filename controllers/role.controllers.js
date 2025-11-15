// ...existing code...
const Role = require("../models/role.models");
const Permission = require("../models/permission.models");
const Module = require("../models/module.models");
const Customer = require("../models/customer.models");

const ALLOWED_ACCESS = ["create", "read", "update", "delete"];

exports.createRole = async (req, res) => {
  try {
    const { name, permissions: permissionsInput, icon } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Role name is required" });
    }

    const creatorId = req.customer?.id;
    if (!creatorId) {
      return res
        .status(400)
        .json({ error: "createdBy is required (or req.customer not set)" });
    }

    if (!icon) {
      return res.status(400).json({ error: "Icon is required for the role" });
    }

    if (!Array.isArray(permissionsInput) || permissionsInput.length === 0) {
      return res.status(400).json({
        error: "At least one permission (module + access) is required",
      });
    }

    const permissionIds = [];

    for (const item of permissionsInput) {
      const moduleId = item.moduleId;
      let access = item.access || [];

      if (!moduleId) {
        return res
          .status(400)
          .json({ error: "Each permission item must include moduleId" });
      }

      if (!Array.isArray(access) || access.length === 0) {
        return res
          .status(400)
          .json({ error: "Each permission item must include access array" });
      }

      access = Array.from(
        new Set(
          access
            .map((a) => String(a).toLowerCase())
            .filter((a) => ALLOWED_ACCESS.includes(a))
        )
      ).sort();

      if (access.length === 0) {
        return res.status(400).json({
          error:
            "Access array must contain at least one of: create, read, update, delete",
        });
      }

      const moduleDoc = await Module.findById(moduleId);
      if (!moduleDoc) {
        return res
          .status(400)
          .json({ error: `Module not found for id: ${moduleId}` });
      }

      let permission = await Permission.findOne({
        module: moduleId,
        access,
      });

      if (!permission) {
        const permName = `${moduleDoc.name} - ${access.join("/")}`;

        permission = await Permission.create({
          name: permName,
          module: moduleId,
          access,
        });
      }

      permissionIds.push(permission._id);
    }

    const customers = await Customer.findById(creatorId);

    const role = new Role({
      name: name.trim(),
      permissions: permissionIds,
      createdBy: creatorId,
      icon,
      company: customers.company,
    });

    await role.save();

    const populatedRole = await Role.findById(role._id)
      .populate({
        path: "permissions",
        populate: { path: "module", model: "CustomerModule" },
      })
      .lean();

    res.status(201).json(populatedRole);
  } catch (err) {
    console.error("createRole error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
};

exports.getRoles = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", status, company } = req.query;

    page = Math.max(parseInt(page, 10) || 1, 1);
    limit = Math.max(parseInt(limit, 10) || 10, 1);

    const filter = {};

    if (search && String(search).trim() !== "") {
      filter.name = { $regex: String(search).trim(), $options: "i" };
    }

    if (status && ["active", "inactive"].includes(status)) {
      filter["current_status.status"] = status;
    }

    if (company && String(company).trim() !== "") {
      filter.company = String(company).trim();
    }

    const skip = (page - 1) * limit;

    const [roles, totalDocs] = await Promise.all([
      Role.find(filter)
        .populate("permissions")
        .populate("createdBy", "_id name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Role.countDocuments(filter),
    ]);

    const totalPages = Math.max(Math.ceil(totalDocs / limit) || 1, 1);

    res.json({
      data: roles,
      page,
      limit,
      totalDocs,
      totalPages,
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages,
    });
  } catch (err) {
    console.error("getRoles error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
};

exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id)
      .populate({
        path: "permissions",
        select: "name access module",
        populate: {
          path: "module",
          select: "name type description",
        },
      })
      .lean();

    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    return res.json(role);
  } catch (err) {
    console.error("getRoleById error:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids must be a non-empty array" });
    }
    const result = await Role.deleteMany({ _id: { $in: ids } });

    if (!result || result.deletedCount === 0) {
      return res.status(404).json({ error: "No roles found for given ids" });
    }

    return res.json({
      message: "Roles deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("deleteRole error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};

exports.assignPermissions = async (req, res) => {
  try {
    const { permissions: permissionsInput } = req.body;
    const roleId = req.params.id;

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    if (!Array.isArray(permissionsInput) || permissionsInput.length === 0) {
      return res.status(400).json({
        error: "At least one permission (module + access) is required",
      });
    }

    const permissionIds = [];

    for (const item of permissionsInput) {
      const moduleId = item.moduleId;
      let access = item.access || [];

      if (!moduleId) {
        return res
          .status(400)
          .json({ error: "Each permission item must include moduleId" });
      }

      if (!Array.isArray(access) || access.length === 0) {
        return res
          .status(400)
          .json({ error: "Each permission item must include access array" });
      }

      access = Array.from(
        new Set(
          access
            .map((a) => String(a).toLowerCase())
            .filter((a) => ALLOWED_ACCESS.includes(a))
        )
      ).sort();

      if (access.length === 0) {
        return res.status(400).json({
          error:
            "Access array must contain at least one of: create, read, update, delete",
        });
      }

      const moduleDoc = await Module.findById(moduleId);
      if (!moduleDoc) {
        return res
          .status(400)
          .json({ error: `Module not found for id: ${moduleId}` });
      }

      let permission = await Permission.findOne({
        module: moduleId,
        access,
      });

      if (!permission) {
        const permName = `${moduleDoc.name} - ${access.join("/")}`;

        permission = await Permission.create({
          name: permName,
          module: moduleId,
          access,
        });
      }

      permissionIds.push(permission._id);
    }

    role.permissions = permissionIds;
    await role.save();

    const populatedRole = await Role.findById(role._id)
      .populate({
        path: "permissions",
        populate: { path: "module", model: "CustomerModule" },
      })
      .lean();

    return res.status(200).json({message:"Role Updated Successfully", populatedRole});
  } catch (err) {
    console.error("assignPermissions error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
};

exports.updateRoleStatus = async (req, res) => {
  try {
    const { status, remarks, ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids must be a non-empty array" });
    }

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    const allowedStatuses = ["active", "inactive", "invited", "suspended"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const roles = await Role.find({ _id: { $in: ids } });

    if (!roles || roles.length === 0) {
      return res
        .status(404)
        .json({ error: "No roles found for the given ids" });
    }

    const historyEntryBase = {
      status,
      remarks: remarks ?? null,
      user_id: req.customer?.id,
      updatedAt: new Date(),
    };

    let updatedCount = 0;

    for (const role of roles) {
      role.status_history.push(historyEntryBase);

      await role.save();
      updatedCount += 1;
    }

    return res.status(200).json({
      message: "Role status updated successfully",
      updatedCount,
    });
  } catch (error) {
    console.error("updateRoleStatus error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
};
