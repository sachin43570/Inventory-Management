const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./db");
const routes = require("./routes");

dotenv.config();

const app = express();


// ========================================
// DATABASE
// ========================================

connectDB();


// ========================================
// MIDDLEWARE
// ========================================

app.use(
  cors({
    origin: "http://localhost:5173"
  })
);

app.use(express.json());


// ========================================
// API ROUTES
// ========================================

app.use("/api", routes);


// ========================================
// TEST ROUTE
// ========================================

app.get("/", (req, res) => {
  res.json({
    message: "Inventory Management API is running"
  });
});


// ========================================
// ERROR HANDLER
// ========================================

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    message: "Something went wrong"
  });
});


// ========================================
// SERVER
// ========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});