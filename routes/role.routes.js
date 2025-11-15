// ...existing code...
const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controllers');
const auth = require('../middlewares/auth.middlewares');
const access = require('../middlewares/access.middlewares');

// Create a new role
router.post('/',auth, roleController.createRole);

// Get all roles
router.get('/', auth, roleController.getRoles);

// Get a single role by ID
router.get('/:id', auth, access('read', 'role'), roleController.getRoleById);


// Delete a role
router.delete('/:id', auth, access('delete', 'role'), roleController.deleteRole);

// Assign permissions to a role
router.put('/:id/permissions', auth,  roleController.assignPermissions);

module.exports = router;
