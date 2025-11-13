// ...existing code...
const Role = require("../models/role.models");
const Permission = require("../models/customerPermission.model");
const Module = require("../models/customerModule.model");
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
        .json({ error: "createdBy is required (or req.user not set)" });
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
    const role = await Role.findById(req.params.id).populate("permissions");
    if (!role) return res.status(404).json({ error: "Role not found" });
    res.json(role);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) return res.status(404).json({ error: "Role not found" });
    res.json({ message: "Role deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.assignPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ error: "Role not found" });
    role.permissions = permissions;
    await role.save();
    res.json(role);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRoleStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ error: "Role not found" });
    role.status_history.push({
      status,
      remarks,
      user_id: req.customer.id,
    });
    await role.save();
    res.status(200).json({
      message: "Role Status Updated Successfully",
    });
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
};
