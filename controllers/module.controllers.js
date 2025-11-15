const Module = require("../models/module.models");

// Create a new module
exports.createModule = async (req, res) => {
  try {
    const { name, description, type } = req.body;
    const moduleObj = new Module({ name, description, type });
    await moduleObj.save();
    const populatedModule = await Module.findById(moduleObj._id);
    res.status(201).json(populatedModule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all modules
exports.getModules = async (req, res) => {
  try {
    const modules = await Module.find();
    res.json({ message: "Module Fetched Successfully", data: modules });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single module
exports.getModuleById = async (req, res) => {
  try {
    const moduleObj = await Module.findById(req.params.id);
    if (!moduleObj) return res.status(404).json({ error: "Module not found" });
    res.json(moduleObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a module
exports.updateModule = async (req, res) => {
  try {
    const { name, description } = req.body;
    const moduleObj = await Module.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );
    if (!moduleObj) return res.status(404).json({ error: "Module not found" });
    res.json(moduleObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a module
exports.deleteModule = async (req, res) => {
  try {
    const moduleObj = await Module.findByIdAndDelete(req.params.id);
    if (!moduleObj) return res.status(404).json({ error: "Module not found" });
    res.json({ message: "Module deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
