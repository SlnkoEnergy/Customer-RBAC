// ...existing code...
// Permission routes will go here
const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permission.controllers');
const auth = require('../middlewares/auth.middlewares');
const access = require('../middlewares/access.middlewares');

// Create a new permission
router.post('/', auth, permissionController.createPermission);

// Get all permissions
router.get('/', auth, access('read', 'permission'), permissionController.getPermissions);

// Get a single permission by ID
router.get('/:id', auth, access('read', 'permission'), permissionController.getPermissionById);

// Update a permission
router.put('/:id', auth, access('update', 'permission'), permissionController.updatePermission);

// Delete a permission
router.delete('/:id', auth, access('delete', 'permission'), permissionController.deletePermission);

module.exports = router;
