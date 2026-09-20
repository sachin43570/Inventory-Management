import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LayoutDashboard, Package, Truck, ArrowDownToLine, ArrowUpFromLine,
  Plus, Trash2, Edit, Search, LogOut, Menu, X, AlertTriangle,
  Boxes, IndianRupee, Users
} from "lucide-react";

const API = "https://inventory-management-7n96.onrender.com/api";

function App() {

  // ========================================
  // STATE - AUTH
  // ========================================
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loginMode, setLoginMode] = useState(true);
  const [authData, setAuthData] = useState({ name: "", email: "", password: "" });

  // ========================================
  // STATE - NAVIGATION / UI
  // ========================================
  const [page, setPage] = useState("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [search, setSearch] = useState("");

  // ========================================
  // STATE - DATA (loaded from backend)
  // ========================================
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [dashboard, setDashboard] = useState({
    totalProducts: 0, totalUnits: 0, inventoryValue: 0, lowStock: 0, suppliers: 0, transactions: []
  });

  // ========================================
  // STATE - MODAL VISIBILITY TOGGLES
  // ========================================
  const [showProductForm, setShowProductForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [deleteTransactionTarget, setDeleteTransactionTarget] = useState(null); // holds the transaction pending delete confirmation
  const [showLogoutModal, setShowLogoutModal] = useState(false); // controls the logout confirmation popup
  const [detailView, setDetailView] = useState(null); // NEW: which stat card popup is open: "products" | "units" | "value" | "low"

  // ========================================
  // STATE - FORM FIELDS
  // ========================================
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockType, setStockType] = useState("IN");

  const [productForm, setProductForm] = useState({
    name: "", sku: "", category: "", price: "", quantity: "", minimumStock: 10, supplier: ""
  });

  const [supplierForm, setSupplierForm] = useState({ name: "", email: "", phone: "", company: "" });

  const [stockForm, setStockForm] = useState({ productId: "", quantity: "", note: "" });

  // ========================================
  // AXIOS CONFIG (attaches auth token to every request)
  // ========================================
  const api = axios.create({ baseURL: API });

  api.interceptors.request.use(config => {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // ========================================
  // LOAD DATA ON LOGIN
  // ========================================
  useEffect(() => {
    if (!token) return;
    loadDashboard();
    loadProducts();
    loadSuppliers();
    loadTransactions();
  }, [token]);

  const loadDashboard = async () => {
    try {
      const response = await api.get("/dashboard");
      setDashboard(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await api.get("/products");
      setProducts(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await api.get("/suppliers");
      setSuppliers(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await api.get("/transactions");
      setTransactions(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  // ========================================
  // AUTH ACTIONS
  // ========================================
  const handleAuth = async event => {
    event.preventDefault();
    try {
      const endpoint = loginMode ? "/auth/login" : "/auth/register";
      const response = await axios.post(API + endpoint, authData);
      localStorage.setItem("token", response.data.token);
      setToken(response.data.token);
      setAuthData({ name: "", email: "", password: "" });
    } catch (error) {
      alert(error.response?.data?.message || "Authentication failed");
    }
  };

  // logout: called only after user confirms in the Logout modal below
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setShowLogoutModal(false);
  };

  // ========================================
  // PRODUCT FORM ACTIONS (Add/Edit/Delete product - Products page)
  // ========================================
  const handleProductChange = event => {
    setProductForm({ ...productForm, [event.target.name]: event.target.value });
  };

  const saveProduct = async event => {
    event.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, productForm);
      } else {
        await api.post("/products", productForm);
      }
      setShowProductForm(false);
      setEditingProduct(null);
      resetProductForm();
      await loadProducts();
      await loadDashboard();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to save product");
    }
  };

  const resetProductForm = () => {
    setProductForm({ name: "", sku: "", category: "", price: "", quantity: "", minimumStock: 10, supplier: "" });
  };

  const editProduct = product => {
    setEditingProduct(product);
    setProductForm({
      name: product.name, sku: product.sku, category: product.category,
      price: product.price, quantity: product.quantity,
      minimumStock: product.minimumStock, supplier: product.supplier
    });
    setShowProductForm(true);
  };

  // uses plain window.confirm (no custom modal) - this is the OLD style delete for products
  const deleteProduct = async id => {
    const confirmed = window.confirm("Are you sure you want to delete this product?");
    if (!confirmed) return;
    try {
      await api.delete(`/products/${id}`);
      await loadProducts();
      await loadDashboard();
    } catch (error) {
      alert("Unable to delete product");
    }
  };

  // ========================================
  // STOCK MOVEMENT ACTIONS (Stock Movement page - Add new IN/OUT entry)
  // ========================================
  const handleStock = async event => {
    event.preventDefault();
    try {
      await api.post("/transactions", { ...stockForm, type: stockType });
      setShowStockForm(false);
      setStockForm({ productId: "", quantity: "", note: "" });
      await loadProducts();
      await loadDashboard();
      await loadTransactions();
    } catch (error) {
      alert(error.response?.data?.message || "Stock update failed");
    }
  };

  // ========================================
  // DELETE TRANSACTION FEATURE (custom confirm modal, not window.confirm)
  // Flow: click trash icon -> confirmDeleteTransaction (opens modal)
  //       -> user clicks Delete -> deleteTransaction (calls backend)
  //       -> user clicks Cancel/X -> cancelDeleteTransaction (closes modal)
  // ========================================
  const confirmDeleteTransaction = transaction => {
    setDeleteTransactionTarget(transaction); // opens the modal, stores which row is targeted
  };

  const cancelDeleteTransaction = () => {
    setDeleteTransactionTarget(null); // closes the modal without deleting
  };

  const deleteTransaction = async () => {
    if (!deleteTransactionTarget) return;
    try {
      await api.delete(`/transactions/${deleteTransactionTarget._id}`);
      setDeleteTransactionTarget(null);
      await loadProducts();     // refresh because backend adjusts product quantity
      await loadDashboard();
      await loadTransactions();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to delete transaction");
    }
  };

  // ========================================
  // SUPPLIER FORM ACTIONS (Suppliers page)
  // ========================================
  const handleSupplierChange = event => {
    setSupplierForm({ ...supplierForm, [event.target.name]: event.target.value });
  };

  const saveSupplier = async event => {
    event.preventDefault();
    try {
      await api.post("/suppliers", supplierForm);
      setSupplierForm({ name: "", email: "", phone: "", company: "" });
      setShowSupplierForm(false);
      await loadSuppliers();
      await loadDashboard();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to add supplier");
    }
  };

  // ========================================
  // PRODUCT SEARCH FILTER (Products page search box)
  // ========================================
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.sku.toLowerCase().includes(search.toLowerCase()) ||
    product.category.toLowerCase().includes(search.toLowerCase())
  );

  // ========================================
  // NEW: DATA FOR THE STAT CARD POPUPS (computed from the products already loaded)
  // ========================================
  const formatINR = n => `₹${Number(n).toLocaleString("en-IN")}`;

  const lowStockProducts = products.filter(p => p.quantity <= p.minimumStock);

  const productsByUnits = [...products].sort((a, b) => b.quantity - a.quantity);

  // groups products by category, with unit and value totals per category (biggest value first)
  const categoryGroups = Object.values(
    products.reduce((groups, p) => {
      const key = p.category || "Uncategorized";
      if (!groups[key]) groups[key] = { category: key, products: [], units: 0, value: 0 };
      groups[key].products.push(p);
      groups[key].units += Number(p.quantity);
      groups[key].value += Number(p.quantity) * Number(p.price);
      return groups;
    }, {})
  ).sort((a, b) => b.value - a.value);

  const detailInfo = {
    products: { title: "All Products", subtitle: `${products.length} products in your inventory` },
    units: { title: "Units by Product", subtitle: `${dashboard.totalUnits} units in stock across all products` },
    value: { title: "Inventory Value by Category", subtitle: `Total value ${formatINR(dashboard.inventoryValue)}` },
    low: { title: "Low Stock Products", subtitle: "Quantity is at or below the minimum stock level" }
  };

  // ========================================
  // LOGIN / REGISTER SCREEN (shown only when no token)
  // Uses CSS classes: .auth-page, .auth-card, .auth-brand, .auth-subtitle, .auth-switch
  // ========================================
  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="brand auth-brand">
            <div className="brand-icon"><Boxes size={22} /></div>
            <span>StockFlow</span>
          </div>
          <h1>{loginMode ? "Welcome back" : "Create your account"}</h1>
          <p className="auth-subtitle">
            {loginMode ? "Sign in to manage your inventory." : "Create an account to start managing inventory."}
          </p>
          <form onSubmit={handleAuth}>
            {!loginMode && (
              <div className="input-group">
                <label>Name</label>
                <input type="text" placeholder="Your name" value={authData.name}
                  onChange={e => setAuthData({ ...authData, name: e.target.value })} required />
              </div>
            )}
            <div className="input-group">
              <label>Email</label>
              <input type="email" placeholder="you@example.com" value={authData.email}
                onChange={e => setAuthData({ ...authData, email: e.target.value })} required />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={authData.password}
                onChange={e => setAuthData({ ...authData, password: e.target.value })} required />
            </div>
            <button className="primary-button full-button" type="submit">
              {loginMode ? "Sign In" : "Create Account"}
            </button>
          </form>
          <div className="auth-switch">
            {loginMode ? "Don't have an account?" : "Already have an account?"}
            <button onClick={() => setLoginMode(!loginMode)}>
              {loginMode ? "Create one" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // SIDEBAR NAVIGATION LINKS DATA
  // ========================================
  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "stock", label: "Stock Movement", icon: ArrowDownToLine },
    { id: "suppliers", label: "Suppliers", icon: Truck }
  ];

  // ========================================
  // MAIN APPLICATION LAYOUT (after login)
  // Uses CSS classes: .app, .sidebar, .main, .topbar, .content
  // ========================================
  return (
    <div className="app">

      {/* ==================== SIDEBAR (left navigation) - CSS: .sidebar ==================== */}
      <aside className={mobileMenu ? "sidebar mobile-open" : "sidebar"}>
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-icon"><Boxes size={21} /></div>
            <span>StockFlow</span>
          </div>
          <button className="mobile-close" onClick={() => setMobileMenu(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="nav-title">MAIN MENU</div>
        <nav>
          {navigation.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={page === item.id ? "nav-item active" : "nav-item"}
                onClick={() => { setPage(item.id); setMobileMenu(false); }}>
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          {/* Logout button now opens confirmation modal instead of logging out directly */}
          <button className="logout-button" onClick={() => setShowLogoutModal(true)}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT AREA - CSS: .main (inventory background), .topbar, .content ==================== */}
      <main className="main">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileMenu(true)}>
            <Menu size={22} />
          </button>
          <div>
            <h2>
              {page === "dashboard" && "Dashboard"}
              {page === "products" && "Products"}
              {page === "stock" && "Stock Movement"}
              {page === "suppliers" && "Suppliers"}
            </h2>
            <p>Manage your inventory efficiently</p>
          </div>
          <div className="topbar-user">
            <div className="avatar">U</div>
          </div>
        </header>

        <section className="content">

          {/* ==================== DASHBOARD PAGE - CSS: .stats-grid, .dashboard-grid ==================== */}
          {page === "dashboard" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Inventory Overview</h1>
                  <p>Here's what's happening with your inventory today.</p>
                </div>
                <button className="primary-button" onClick={() => { setPage("products"); setShowProductForm(true); }}>
                  <Plus size={18} />
                  Add Product
                </button>
              </div>
              {/* Each card is clickable and opens its detail popup (see detailView modal below) */}
              <div className="stats-grid">
                <StatCard title="Total Products" value={dashboard.totalProducts} icon={Package} onClick={() => setDetailView("products")} />
                <StatCard title="Total Units" value={dashboard.totalUnits} icon={Boxes} onClick={() => setDetailView("units")} />
                <StatCard title="Inventory Value" value={formatINR(dashboard.inventoryValue)} icon={IndianRupee} onClick={() => setDetailView("value")} />
                <StatCard title="Low Stock" value={dashboard.lowStock} icon={AlertTriangle} warning onClick={() => setDetailView("low")} />
              </div>
              <div className="dashboard-grid">
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>Recent Stock Movement</h3>
                      <p>Latest inventory transactions</p>
                    </div>
                  </div>
                  {/* Dashboard's table has NO delete button (onDelete not passed) */}
                  <TransactionTable transactions={dashboard.transactions} />
                </div>
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>Inventory Status</h3>
                      <p>Products requiring attention</p>
                    </div>
                  </div>
                  <div className="status-list">
                    {lowStockProducts.slice(0, 5).map(product => (
                      <div className="status-item" key={product._id}>
                        <div className="status-product">
                          <div className="product-icon"><Package size={17} /></div>
                          <div>
                            <strong>{product.name}</strong>
                            <span>{product.sku}</span>
                          </div>
                        </div>
                        <span className="badge danger">{product.quantity} left</span>
                      </div>
                    ))}
                    {lowStockProducts.length === 0 && (
                      <div className="empty">All products have healthy stock levels.</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ==================== PRODUCTS PAGE - CSS: .toolbar, .search-box, table ==================== */}
          {page === "products" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Products</h1>
                  <p>Manage all products in your inventory.</p>
                </div>
                <button className="primary-button" onClick={() => { setEditingProduct(null); resetProductForm(); setShowProductForm(true); }}>
                  <Plus size={18} />
                  Add Product
                </button>
              </div>
              <div className="panel">
                <div className="toolbar">
                  <div className="search-box">
                    <Search size={18} />
                    <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>PRODUCT</th>
                        <th>SKU</th>
                        <th>CATEGORY</th>
                        <th>PRICE</th>
                        <th>STOCK</th>
                        <th>STATUS</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(product => (
                        <tr key={product._id}>
                          <td>
                            <div className="table-product">
                              <div className="product-icon"><Package size={17} /></div>
                              <div>
                                <strong>{product.name}</strong>
                                <span>{product.supplier}</span>
                              </div>
                            </div>
                          </td>
                          <td>{product.sku}</td>
                          <td>{product.category}</td>
                          <td>₹{Number(product.price).toLocaleString("en-IN")}</td>
                          <td>{product.quantity}</td>
                          <td>
                            {product.quantity <= product.minimumStock ? (
                              <span className="badge danger">Low Stock</span>
                            ) : (
                              <span className="badge success">In Stock</span>
                            )}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button className="icon-button" onClick={() => editProduct(product)}>
                                <Edit size={16} />
                              </button>
                              {/* Product delete still uses browser's native window.confirm popup */}
                              <button className="icon-button danger-icon" onClick={() => deleteProduct(product._id)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredProducts.length === 0 && <div className="empty">No products found.</div>}
                </div>
              </div>
            </>
          )}

          {/* ==================== STOCK MOVEMENT PAGE - CSS: .stock-actions, .stock-card ==================== */}
          {page === "stock" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Stock Movement</h1>
                  <p>Track inventory coming in and going out.</p>
                </div>
                <button className="primary-button" onClick={() => setShowStockForm(true)}>
                  <Plus size={18} />
                  New Movement
                </button>
              </div>
              <div className="stock-actions">
                <button className="stock-card in" onClick={() => { setStockType("IN"); setShowStockForm(true); }}>
                  <div className="stock-card-icon"><ArrowDownToLine /></div>
                  <div>
                    <strong>Stock IN</strong>
                    <span>Add inventory</span>
                  </div>
                </button>
                <button className="stock-card out" onClick={() => { setStockType("OUT"); setShowStockForm(true); }}>
                  <div className="stock-card-icon"><ArrowUpFromLine /></div>
                  <div>
                    <strong>Stock OUT</strong>
                    <span>Remove inventory</span>
                  </div>
                </button>
              </div>
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Transaction History</h3>
                    <p>Recent inventory movements</p>
                  </div>
                </div>
                {/* This is the ONLY table with delete enabled (onDelete prop passed) */}
                <TransactionTable transactions={transactions} onDelete={confirmDeleteTransaction} />
              </div>
            </>
          )}

          {/* ==================== SUPPLIERS PAGE - CSS: .supplier-grid, .supplier-card ==================== */}
          {page === "suppliers" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Suppliers</h1>
                  <p>Manage your inventory suppliers.</p>
                </div>
                <button className="primary-button" onClick={() => setShowSupplierForm(true)}>
                  <Plus size={18} />
                  Add Supplier
                </button>
              </div>
              <div className="supplier-grid">
                {suppliers.map(supplier => (
                  <div className="supplier-card" key={supplier._id}>
                    <div className="supplier-icon"><Users size={20} /></div>
                    <h3>{supplier.name}</h3>
                    <p>{supplier.company || "Independent Supplier"}</p>
                    <div className="supplier-details">
                      <span>{supplier.email || "No email"}</span>
                      <span>{supplier.phone || "No phone"}</span>
                    </div>
                  </div>
                ))}
                {suppliers.length === 0 && <div className="empty">No suppliers added yet.</div>}
              </div>
            </>
          )}

        </section>
      </main>

      {/* ==================== ADD/EDIT PRODUCT MODAL - CSS: .modal, .modal-header, .form-grid ==================== */}
      {showProductForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>{editingProduct ? "Edit Product" : "Add Product"}</h2>
                <p>Enter product information below.</p>
              </div>
              <button className="close-button" onClick={() => setShowProductForm(false)}>
                <X size={20} />
              </button>
            </div>
            <form className="form-grid" onSubmit={saveProduct}>
              <Input label="Product Name" name="name" value={productForm.name} onChange={handleProductChange} placeholder="MacBook Air" />
              <Input label="SKU" name="sku" value={productForm.sku} onChange={handleProductChange} placeholder="LAP-001" />
              <Input label="Category" name="category" value={productForm.category} onChange={handleProductChange} placeholder="Electronics" />
              <Input label="Price" name="price" type="number" value={productForm.price} onChange={handleProductChange} placeholder="50000" />
              <Input label="Quantity" name="quantity" type="number" value={productForm.quantity} onChange={handleProductChange} placeholder="20" />
              <Input label="Minimum Stock" name="minimumStock" type="number" value={productForm.minimumStock} onChange={handleProductChange} placeholder="10" />
              <Input label="Supplier" name="supplier" value={productForm.supplier} onChange={handleProductChange} placeholder="ABC Suppliers" />
              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={() => setShowProductForm(false)}>Cancel</button>
                <button type="submit" className="primary-button">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ADD STOCK IN/OUT MODAL - CSS: .small-modal ==================== */}
      {showStockForm && (
        <div className="modal-overlay">
          <div className="modal small-modal">
            <div className="modal-header">
              <div>
                <h2>Stock {stockType}</h2>
                <p>Update product inventory.</p>
              </div>
              <button className="close-button" onClick={() => setShowStockForm(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleStock}>
              <div className="input-group">
                <label>Product</label>
                <select value={stockForm.productId} onChange={e => setStockForm({ ...stockForm, productId: e.target.value })} required>
                  <option value="">Select product</option>
                  {products.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.name} — {product.quantity} available
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Quantity</label>
                <input type="number" min="1" value={stockForm.quantity} onChange={e => setStockForm({ ...stockForm, quantity: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Note</label>
                <input type="text" placeholder="Purchase order / sale..." value={stockForm.note} onChange={e => setStockForm({ ...stockForm, note: e.target.value })} />
              </div>
              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={() => setShowStockForm(false)}>Cancel</button>
                <button type="submit" className="primary-button">Update Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ADD SUPPLIER MODAL - CSS: .small-modal ==================== */}
      {showSupplierForm && (
        <div className="modal-overlay">
          <div className="modal small-modal">
            <div className="modal-header">
              <div>
                <h2>Add Supplier</h2>
                <p>Add a new inventory supplier.</p>
              </div>
              <button className="close-button" onClick={() => setShowSupplierForm(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={saveSupplier}>
              <Input label="Name" name="name" value={supplierForm.name} onChange={handleSupplierChange} placeholder="John Smith" />
              <Input label="Company" name="company" value={supplierForm.company} onChange={handleSupplierChange} placeholder="ABC Supplies" />
              <Input label="Email" name="email" type="email" value={supplierForm.email} onChange={handleSupplierChange} placeholder="supplier@example.com" />
              <Input label="Phone" name="phone" value={supplierForm.phone} onChange={handleSupplierChange} placeholder="+91 9876543210" />
              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={() => setShowSupplierForm(false)}>Cancel</button>
                <button type="submit" className="primary-button">Add Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE TRANSACTION CONFIRMATION MODAL ====================
           Shown only when deleteTransactionTarget is not null.
           CSS reused: .modal, .small-modal, .modal-header, .form-grid, .form-actions */}
      {deleteTransactionTarget && (
        <div className="modal-overlay">
          <div className="modal small-modal">
            <div className="modal-header">
              <div>
                <h2>Delete Transaction</h2>
                <p>This action cannot be undone.</p>
              </div>
              <button className="close-button" onClick={cancelDeleteTransaction}>
                <X size={20} />
              </button>
            </div>
            <div className="form-grid">
              <p>
                Are you sure you want to delete this {deleteTransactionTarget.type === "IN" ? "Stock IN" : "Stock OUT"} entry for{" "}
                <strong>{deleteTransactionTarget.productName}</strong> (Qty: {deleteTransactionTarget.quantity})?
              </p>
              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={cancelDeleteTransaction}>Cancel</button>
                <button type="button" className="primary-button danger-icon" onClick={deleteTransaction}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== LOGOUT CONFIRMATION MODAL ====================
           Shown only when showLogoutModal is true. CSS: .logout-confirm (red button) */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal small-modal">
            <div className="modal-header">
              <div>
                <h2>Confirm Logout</h2>
                <p>Are you sure you want to log out?</p>
              </div>
              <button className="close-button" onClick={() => setShowLogoutModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="form-actions">
              <button className="secondary-button" onClick={() => setShowLogoutModal(false)}>
                Cancel
              </button>
              <button className="primary-button logout-confirm" onClick={logout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== NEW: STAT CARD DETAIL POPUP ====================
           Opens when a Dashboard stat card is clicked (detailView = "products" | "units" | "value" | "low").
           Click the dark backdrop or the X to close. CSS: .detail-modal, .detail-table, .category-block, .category-head */}
      {detailView && (
        <div className="modal-overlay" onClick={() => setDetailView(null)}>
          <div className="modal detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{detailInfo[detailView].title}</h2>
                <p>{detailInfo[detailView].subtitle}</p>
              </div>
              <button className="close-button" onClick={() => setDetailView(null)}>
                <X size={20} />
              </button>
            </div>

            {/* Total Products: every product with its SKU, category and supplier */}
            {detailView === "products" && (
              <div className="table-wrapper">
                <table className="detail-table">
                  <thead>
                    <tr><th>PRODUCT</th><th>SKU</th><th>CATEGORY</th><th>SUPPLIER</th></tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p._id}>
                        <td><strong>{p.name}</strong></td>
                        <td>{p.sku}</td>
                        <td>{p.category}</td>
                        <td>{p.supplier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {products.length === 0 && <div className="empty">No products yet.</div>}
              </div>
            )}

            {/* Total Units: units per product, highest first */}
            {detailView === "units" && (
              <div className="table-wrapper">
                <table className="detail-table">
                  <thead>
                    <tr><th>PRODUCT</th><th>SKU</th><th>UNITS IN STOCK</th><th>MINIMUM</th></tr>
                  </thead>
                  <tbody>
                    {productsByUnits.map(p => (
                      <tr key={p._id}>
                        <td><strong>{p.name}</strong></td>
                        <td>{p.sku}</td>
                        <td>{p.quantity}</td>
                        <td>{p.minimumStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {products.length === 0 && <div className="empty">No products yet.</div>}
              </div>
            )}

            {/* Inventory Value: one block per category with price x units per product and low stock badges */}
            {detailView === "value" && (
              <>
                {categoryGroups.map(group => (
                  <div className="category-block" key={group.category}>
                    <div className="category-head">
                      <strong>{group.category}</strong>
                      <span>{group.products.length} products · {group.units} units · {formatINR(group.value)}</span>
                    </div>
                    <div className="table-wrapper">
                      <table className="detail-table">
                        <thead>
                          <tr><th>PRODUCT</th><th>PRICE</th><th>UNITS</th><th>VALUE</th><th>STATUS</th></tr>
                        </thead>
                        <tbody>
                          {group.products.map(p => (
                            <tr key={p._id}>
                              <td><strong>{p.name}</strong></td>
                              <td>{formatINR(p.price)}</td>
                              <td>{p.quantity}</td>
                              <td>{formatINR(p.quantity * p.price)}</td>
                              <td>
                                {p.quantity <= p.minimumStock
                                  ? <span className="badge danger">Low Stock</span>
                                  : <span className="badge success">In Stock</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
                {categoryGroups.length === 0 && <div className="empty">No products yet.</div>}
              </>
            )}

            {/* Low Stock: only products at or below their minimum stock */}
            {detailView === "low" && (
              <div className="table-wrapper">
                <table className="detail-table">
                  <thead>
                    <tr><th>PRODUCT</th><th>SKU</th><th>CATEGORY</th><th>IN STOCK</th><th>MINIMUM</th><th>STATUS</th></tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map(p => (
                      <tr key={p._id}>
                        <td><strong>{p.name}</strong></td>
                        <td>{p.sku}</td>
                        <td>{p.category}</td>
                        <td>{p.quantity}</td>
                        <td>{p.minimumStock}</td>
                        <td>
                          <span className="badge danger">
                            {Number(p.quantity) === 0 ? "Out of stock" : "Low Stock"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {lowStockProducts.length === 0 && <div className="empty">All products have healthy stock levels.</div>}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// ========================================
// REUSABLE INPUT COMPONENT (used inside Product/Supplier forms)
// ========================================
function Input({ label, name, value, onChange, type = "text", placeholder }) {
  return (
    <div className="input-group">
      <label>{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required />
    </div>
  );
}

// ========================================
// STAT CARD COMPONENT (Dashboard: Total Products, Total Units, etc.)
// Now a button, so the whole card (icon included) is clickable and keyboard accessible
// ========================================
function StatCard({ title, value, icon: Icon, warning, onClick }) {
  return (
    <button type="button" className="stat-card clickable" onClick={onClick}>
      <div className="stat-content">
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
      <div className={warning ? "stat-icon warning" : "stat-icon"}>
        <Icon size={21} />
      </div>
    </button>
  );
}

// ========================================
// TRANSACTION TABLE COMPONENT
// Used in 2 places:
//   1. Dashboard page (no onDelete passed -> ACTION column hidden)
//   2. Stock Movement page (onDelete passed -> ACTION column with trash icon shown)
// ========================================
function TransactionTable({ transactions = [], onDelete }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>PRODUCT</th>
            <th>TYPE</th>
            <th>QUANTITY</th>
            <th>NOTE</th>
            <th>DATE</th>
            {onDelete && <th>ACTION</th>}
          </tr>
        </thead>
        <tbody>
          {transactions.map(transaction => (
            <tr key={transaction._id}>
              <td><strong>{transaction.productName}</strong></td>
              <td>
                {transaction.type === "IN" ? (
                  <span className="badge success">
                    <ArrowDownToLine size={13} />
                    Stock IN
                  </span>
                ) : (
                  <span className="badge danger">
                    <ArrowUpFromLine size={13} />
                    Stock OUT
                  </span>
                )}
              </td>
              <td>{transaction.quantity}</td>
              <td>{transaction.note || "-"}</td>
              <td>{new Date(transaction.createdAt).toLocaleDateString("en-IN")}</td>
              {/* Trash icon only rendered when onDelete function was passed by parent */}
              {onDelete && (
                <td>
                  <div className="action-buttons">
                    <button className="icon-button danger-icon" onClick={() => onDelete(transaction)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {transactions.length === 0 && <div className="empty">No transactions yet.</div>}
    </div>
  );
}

export default App;