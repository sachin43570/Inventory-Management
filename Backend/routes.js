const express = require("express");

const {
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
} = require("./controllers");

const { protect } = require("./middleware");

const router = express.Router();


// ========================================
// AUTH
// ========================================

router.post("/auth/register", register);

router.post("/auth/login", login);


// ========================================
// DASHBOARD
// ========================================

router.get(
  "/dashboard",
  protect,
  getDashboard
);


// ========================================
// PRODUCTS
// ========================================

router.get(
  "/products",
  protect,
  getProducts
);

router.post(
  "/products",
  protect,
  createProduct
);

router.put(
  "/products/:id",
  protect,
  updateProduct
);

router.delete(
  "/products/:id",
  protect,
  deleteProduct
);


// ========================================
// STOCK
// ========================================

router.post(
  "/transactions",
  protect,
  stockTransaction
);

router.get(
  "/transactions",
  protect,
  getTransactions
);

router.delete(
  "/transactions/:id",
  protect,
  deleteTransaction
);


// ========================================
// SUPPLIERS
// ========================================

router.get(
  "/suppliers",
  protect,
  getSuppliers
);

router.post(
  "/suppliers",
  protect,
  createSupplier
);


module.exports = router;