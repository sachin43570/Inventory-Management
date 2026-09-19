const mongoose = require("mongoose");

// =========================
// USER MODEL
// =========================

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },

    password: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// =========================
// PRODUCT MODEL
// =========================

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },

    category: {
      type: String,
      required: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    minimumStock: {
      type: Number,
      default: 10
    },

    supplier: {
      type: String,
      default: "Not Assigned"
    }
  },
  {
    timestamps: true
  }
);

// =========================
// TRANSACTION MODEL
// =========================

const transactionSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    productName: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: ["IN", "OUT"],
      required: true
    },

    quantity: {
      type: Number,
      required: true
    },

    note: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

// =========================
// SUPPLIER MODEL
// =========================

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      default: ""
    },

    phone: {
      type: String,
      default: ""
    },

    company: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);
const Transaction = mongoose.model("Transaction", transactionSchema);
const Supplier = mongoose.model("Supplier", supplierSchema);

module.exports = {
  User,
  Product,
  Transaction,
  Supplier
};