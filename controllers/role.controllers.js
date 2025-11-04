// ...existing code...
const Role = require("../models/role.models");

// Create a new role
exports.createRole = async (req, res) => {
  try {
    const { name, permissions, department } = req.body;
    const role = new Role({ name, permissions, department });
    await role.save();
    const populatedRole = await Role.findById(role._id).populate("permissions");
    res.status(201).json(populatedRole);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find().populate("permissions");
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
