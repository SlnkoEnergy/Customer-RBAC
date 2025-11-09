const Customer = require("../models/customer.models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/app.config");

const populateCustomer = [
  { path: "department", populate: { path: "name" } },
  {
    path: "roles",
    populate: [
      {
        path: "permissions",
        populate: { path: "module", select: "name" },
      },
      {
        path: "department",
        select: "name",
      },
    ],
  },
];

const createCustomer = async (req, res) => {
  try {
    const { name, email, username, phone, password, roles, attachment_url } =
      req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const customer = new Customer({
      name,
      email,
      username,
      phone,
      password: hashedPassword,
      roles,
      attachment_url,
    });
    await customer.save();
    const populatedCustomer = await Customer.findById(customer._id);
    res.status(201).json(populatedCustomer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCustomers = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * pageSize;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { emp_id: { $regex: search, $options: "i" } },
      ];
    }

    const customers = await Customer.find(query)
      .populate(populateCustomer)
      .skip(skip)
      .limit(pageSize);

    res
      .status(200)
      .json({ message: "Customers fetched successfully", customers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate(
      populateCustomer
    );
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { name, email, password, departments, roles } = req.body;
    let updateData = { name, email, departments, roles };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
      }
    ).populate(populateCustomer);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ error: "customer not found" });
    res.json({ message: "customer deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const loginCustomer = async (req, res) => {
  try {
    const { name, password } = req.body;
    const customer = await Customer.findOne({ name });
    if (!customer)
      return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, customer.password);

    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: customer._id, name: customer.name },
      config.jwtSecret,
      { expiresIn: "1d" }
    );
    const populatedCustomer = await Customer.findById(customer._id).populate(
      populateCustomer
    );
    res.json({ token, customer: populatedCustomer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  loginCustomer,
};
