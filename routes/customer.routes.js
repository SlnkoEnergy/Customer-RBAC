// ...existing code...
const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controllers");
const auth = require("../middlewares/auth.middlewares");
const access = require("../middlewares/access.middlewares");

// Login route (no auth required)
router.post("/login", customerController.loginCustomer);

// Create a new Customer
router.post("/", customerController.createCustomer);

// Get all Customers
router.get(
  "/",
  auth,
  access("read", "Customer"),
  customerController.getCustomers
);

// Get customer for themselves while login
router.get('/me', auth, customerController.me);

// Get a single Customer by ID
router.get(
  "/:id",
  auth,
  access("read", "Customer"),
  customerController.getCustomerById
);

// Update a Customer
router.put(
  "/:id",
  customerController.updateCustomer
);

// Delete a Customer
router.delete(
  "/:id",
  auth,
  access("delete", "Customer"),
  customerController.deleteCustomer
);

module.exports = router;
