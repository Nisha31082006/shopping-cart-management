import { useEffect, useState } from "react";
import Product from "./components/Product.jsx";
import { fetchProducts, addProduct } from "./api.js";

const EMPTY_FORM = { productName: "", price: "", category: "" };

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Requirement (iii): runs once, when the component mounts ([] dependency array).
  useEffect(() => {
    console.log("Shopping Cart System Loaded");
  }, []);

  // Load products from the backend (MongoDB) on first render.
  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const price = Number(form.price);
    if (!form.productName.trim() || !form.category.trim() || form.price === "" || !Number.isFinite(price) || price < 0) {
      setFormError("Enter a product name, a category and a price of 0 or more.");
      return;
    }

    setSaving(true);
    try {
      const created = await addProduct({
        productName: form.productName.trim(),
        category: form.category.trim(),
        price,
      });
      setProducts((prev) => [...prev, created]);
      setForm(EMPTY_FORM);
      setError("");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Shopping Cart Management System</h1>
        <p>Browse products and apply discounts to each item.</p>
      </header>

      <main className="app-main">
        <section className="panel" aria-labelledby="add-heading">
          <h2 id="add-heading">Add a product</h2>
          <form className="add-form" onSubmit={handleSubmit} noValidate>
            <label>
              Product name
              <input
                name="productName"
                value={form.productName}
                onChange={handleChange}
                placeholder="e.g. USB-C Cable"
              />
            </label>
            <label>
              Price (₹)
              <input
                name="price"
                type="number"
                min="0"
                step="any"
                value={form.price}
                onChange={handleChange}
                placeholder="e.g. 399"
              />
            </label>
            <label>
              Category
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g. Electronics"
              />
            </label>
            <button type="submit" className="add-btn" disabled={saving}>
              {saving ? "Adding..." : "Add Product"}
            </button>
          </form>
          {formError && <p className="message error" role="alert">{formError}</p>}
        </section>

        <section aria-labelledby="products-heading">
          <h2 id="products-heading">Products</h2>

          {loading && <p className="message">Loading products...</p>}
          {!loading && error && <p className="message error" role="alert">{error}</p>}
          {!loading && !error && products.length === 0 && (
            <p className="message empty">No products available. Add a product to get started.</p>
          )}

          {products.length > 0 && (
            <div className="product-grid">
              {products.map((p) => (
                <Product
                  key={p.productId}
                  productId={p.productId}
                  productName={p.productName}
                  price={p.price}
                  category={p.category}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
