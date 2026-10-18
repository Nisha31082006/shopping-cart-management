const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(path, options) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new Error("Cannot reach the server. Make sure the backend is running on port 5000.");
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Response had no JSON body.
  }

  if (!response.ok) {
    const details = data && Array.isArray(data.details) ? ` ${data.details.join(" ")}` : "";
    throw new Error(((data && data.error) || `Request failed (${response.status}).`) + details);
  }
  return data;
}

export function fetchProducts() {
  return request("/products");
}

export function addProduct(product) {
  return request("/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
}
