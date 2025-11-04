// ...existing code...
// Module routes will go here
const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/module.controllers');
const auth = require('../middlewares/auth.middlewares');
const access = require('../middlewares/access.middlewares');

// Create a new module
router.post('/', auth, access('create', 'module'), moduleController.createModule);

// Get all modules
router.get('/', auth, access('read', 'module'), moduleController.getModules);

// Get a single module by ID
router.get('/:id', auth, access('read', 'module'), moduleController.getModuleById);

// Update a module
router.put('/:id', auth, access('update', 'module'), moduleController.updateModule);

// Delete a module
router.delete('/:id', auth, access('delete', 'module'), moduleController.deleteModule);

module.exports = router;
