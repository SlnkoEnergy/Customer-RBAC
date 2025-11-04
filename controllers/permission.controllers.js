const Permission = require("../models/permission.models");

exports.createPermission = async (req, res) => {
  try {
    const { name, module, access } = req.body;
    const permission = new Permission({ name, module, access });
    await permission.save();
    const populatedPermission = await Permission.findById(
      permission._id
    ).populate("module");
    res.status(201).json(populatedPermission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all permissions
exports.getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().populate("module");
    res.json(permissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single permission
exports.getPermissionById = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id).populate(
      "module"
    );
    if (!permission)
      return res.status(404).json({ error: "Permission not found" });
    res.json(permission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a permission
exports.updatePermission = async (req, res) => {
  try {
    const { name, module, access } = req.body;
    const permission = await Permission.findByIdAndUpdate(
      req.params.id,
      { name, module, access },
      { new: true }
    ).populate("module");
    if (!permission)
      return res.status(404).json({ error: "Permission not found" });
    res.json(permission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a permission
exports.deletePermission = async (req, res) => {
  try {
    const permission = await Permission.findByIdAndDelete(req.params.id);
    if (!permission)
      return res.status(404).json({ error: "Permission not found" });
    res.json({ message: "Permission deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
