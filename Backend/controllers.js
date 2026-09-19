const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
  User,
  Product,
  Transaction,
  Supplier
} = require("./models");

// ========================================
// AUTH
// ========================================

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// ========================================
// PRODUCTS
// ========================================

const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({
      createdAt: -1
    });

    res.json(products);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


const createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      price,
      quantity,
      minimumStock,
      supplier
    } = req.body;

    const existingProduct = await Product.findOne({
      sku
    });

    if (existingProduct) {
      return res.status(400).json({
        message: "SKU already exists"
      });
    }

    const product = await Product.create({
      name,
      sku,
      category,
      price,
      quantity,
      minimumStock,
      supplier
    });

    res.status(201).json(product);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json(product);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    await Transaction.deleteMany({
      productId: req.params.id
    });

    res.json({
      message: "Product deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// ========================================
// STOCK TRANSACTION
// ========================================

const stockTransaction = async (req, res) => {
  try {
    const {
      productId,
      type,
      quantity,
      note
    } = req.body;

    if (!productId || !type || !quantity) {
      return res.status(400).json({
        message: "Product, type and quantity are required"
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than zero"
      });
    }

    if (type === "OUT") {

      if (product.quantity < quantity) {
        return res.status(400).json({
          message: "Not enough stock available"
        });
      }

      product.quantity -= Number(quantity);

    } else if (type === "IN") {

      product.quantity += Number(quantity);

    } else {

      return res.status(400).json({
        message: "Invalid transaction type"
      });

    }

    await product.save();

    const transaction = await Transaction.create({
      productId: product._id,
      productName: product.name,
      type,
      quantity,
      note
    });

    res.status(201).json({
      message: "Stock updated successfully",
      product,
      transaction
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// ========================================
// TRANSACTIONS
// ========================================

const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .sort({
        createdAt: -1
      })
      .limit(20);

    res.json(transactions);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(
      req.params.id
    );

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found"
      });
    }

    const product = await Product.findById(transaction.productId);

    if (product) {

      if (transaction.type === "IN") {
        product.quantity -= Number(transaction.quantity);
      } else if (transaction.type === "OUT") {
        product.quantity += Number(transaction.quantity);
      }

      if (product.quantity < 0) {
        product.quantity = 0;
      }

      await product.save();

    }

    res.json({
      message: "Transaction deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// ========================================
// SUPPLIERS
// ========================================

const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({
      createdAt: -1
    });

    res.json(suppliers);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


const createSupplier = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company
    } = req.body;

    const supplier = await Supplier.create({
      name,
      email,
      phone,
      company
    });

    res.status(201).json(supplier);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// ========================================
// DASHBOARD
// ========================================

const getDashboard = async (req, res) => {
  try {
    const products = await Product.find();

    const suppliers = await Supplier.countDocuments();

    const transactions = await Transaction.find()
      .sort({
        createdAt: -1
      })
      .limit(5);

    const totalProducts = products.length;

    const totalUnits = products.reduce(
      (sum, product) =>
        sum + product.quantity,
      0
    );

    const inventoryValue = products.reduce(
      (sum, product) =>
        sum + product.quantity * product.price,
      0
    );

    const lowStock = products.filter(
      product =>
        product.quantity <= product.minimumStock
    ).length;

    res.json({
      totalProducts,
      totalUnits,
      inventoryValue,
      lowStock,
      suppliers,
      transactions
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


module.exports = {
  register,
  login,

  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,

  stockTransaction,
  getTransactions,
  deleteTransaction,

  getSuppliers,
  createSupplier,

  getDashboard
};