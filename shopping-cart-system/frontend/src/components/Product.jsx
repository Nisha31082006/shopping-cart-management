import { useState } from "react";

const DISCOUNT_AMOUNT = 200;

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

/**
 * Requirement (i): functional component "Product" that accepts
 * "productName" and "price" as props and shows them with JSX.
 * productId and category are extra props used by the UI.
 */
function Product({ productId, productName, price, category }) {
  // Requirement (ii): useState keeps THIS product's displayed price.
  // Every <Product /> has its own state, so discounts are independent.
  const [currentPrice, setCurrentPrice] = useState(price);

  const applyDiscount = () => {
    // Functional update + Math.max keeps the price from going below 0.
    setCurrentPrice((prev) => Math.max(0, prev - DISCOUNT_AMOUNT));
  };

  const isDiscounted = currentPrice < price;
  const isAtZero = currentPrice <= 0;

  return (
    <article className="product-card">
      <div className="product-top">
        <span className="product-id">ID: {productId}</span>
        <span className="product-category">{category}</span>
      </div>

      <h3 className="product-name">{productName}</h3>

      <div className="product-price-row">
        <span className="product-price" aria-live="polite">
          {formatINR(currentPrice)}
        </span>
        {isDiscounted && <span className="product-original">{formatINR(price)}</span>}
      </div>

      <button
        type="button"
        className="discount-btn"
        onClick={applyDiscount}
        disabled={isAtZero}
      >
        {isAtZero ? "Price is ₹0" : "Apply ₹200 Discount"}
      </button>
    </article>
  );
}

export default Product;
