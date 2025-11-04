// ...existing code...
// User routes will go here
const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controllers");
const auth = require("../middlewares/auth.middlewares");
const access = require("../middlewares/access.middlewares");

// Login route (no auth required)
router.post("/login", customerController.loginCustomer);

// Create a new Customer
router.post(
  "/",
  auth,
  access("create", "Customer"),
  customerController.createCustomer
);

// Get all Customers
router.get(
  "/",
  auth,
  access("read", "Customer"),
  customerController.getCustomers
);

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
  auth,
  access("update", "Customer"),
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
