// ----- State -----
let cart = JSON.parse(localStorage.getItem("cart") || "{}"); // { productId: qty }

// ----- Navigation -----
function goToPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

  document.getElementById(pageId).classList.add("active");
  const navBtn = document.querySelector(`.nav-btn[data-page="${pageId}"]`);
  if (navBtn) navBtn.classList.add("active");

  if (pageId === "cart") renderCart();
  if (pageId === "checkout") renderCheckout();

  window.scrollTo(0, 0);
}

document.querySelectorAll(".nav-btn[data-page]").forEach(btn => {
  btn.addEventListener("click", () => goToPage(btn.dataset.page));
});
document.querySelector(".nav-brand").addEventListener("click", () => goToPage("home"));
document.querySelectorAll("[data-goto]").forEach(el => {
  el.addEventListener("click", () => goToPage(el.dataset.goto));
});

// ----- Cart helpers -----
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function addToCart(productId) {
  cart[productId] = (cart[productId] || 0) + 1;
  saveCart();
}

function changeQty(productId, delta) {
  if (!cart[productId]) return;
  cart[productId] += delta;
  if (cart[productId] <= 0) delete cart[productId];
  saveCart();
  renderCart();
}

function removeFromCart(productId) {
  delete cart[productId];
  saveCart();
  renderCart();
}

function cartTotal() {
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = PRODUCTS.find(p => p.id === Number(id));
    return sum + (product ? product.price * qty : 0);
  }, 0);
}

function updateCartCount() {
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  document.getElementById("cart-count").textContent = count;
}

// ----- Home page -----
function renderCategories() {
  const categories = [...new Set(PRODUCTS.map(p => p.category))];
  const grid = document.getElementById("category-grid");
  grid.innerHTML = categories.map(cat => `
    <div class="category-card" data-category="${cat}">
      <span class="category-emoji">${PRODUCTS.find(p => p.category === cat).emoji}</span>
      <span>${cat}</span>
    </div>
  `).join("");

  grid.querySelectorAll(".category-card").forEach(card => {
    card.addEventListener("click", () => {
      goToPage("shop");
      document.getElementById("category-filter").value = card.dataset.category;
      renderProducts();
    });
  });
}

// ----- Shop page -----
function populateCategoryFilter() {
  const select = document.getElementById("category-filter");
  const categories = [...new Set(PRODUCTS.map(p => p.category))];
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

function renderProducts() {
  const search = document.getElementById("search-input").value.toLowerCase();
  const category = document.getElementById("category-filter").value;

  const filtered = PRODUCTS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search);
    const matchesCategory = category === "all" || p.category === category;
    return matchesSearch && matchesCategory;
  });

  const grid = document.getElementById("product-grid");
  if (filtered.length === 0) {
    grid.innerHTML = `<p class="empty-msg">No products found.</p>`;
    return;
  }

  grid.innerHTML = filtered.map(p => `
    <div class="product-card">
      <div class="product-emoji">${p.emoji}</div>
      <h3>${p.name}</h3>
      <p class="product-category">${p.category}</p>
      <p class="product-price">$${p.price.toFixed(2)}</p>
      <button class="btn primary add-btn" data-id="${p.id}">Add to Cart</button>
    </div>
  `).join("");

  grid.querySelectorAll(".add-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      addToCart(Number(btn.dataset.id));
      btn.textContent = "Added ✓";
      setTimeout(() => (btn.textContent = "Add to Cart"), 800);
    });
  });
}

document.getElementById("search-input").addEventListener("input", renderProducts);
document.getElementById("category-filter").addEventListener("change", renderProducts);

// ----- Cart page -----
function renderCart() {
  const container = document.getElementById("cart-items");
  const entries = Object.entries(cart);

  if (entries.length === 0) {
    container.innerHTML = `<p class="empty-msg">Your cart is empty. <a data-goto="shop" href="#">Go shopping</a></p>`;
    container.querySelector("[data-goto]").addEventListener("click", (e) => {
      e.preventDefault();
      goToPage("shop");
    });
    document.getElementById("cart-summary").style.display = "none";
    return;
  }

  container.innerHTML = entries.map(([id, qty]) => {
    const p = PRODUCTS.find(p => p.id === Number(id));
    return `
      <div class="cart-item">
        <span class="cart-item-emoji">${p.emoji}</span>
        <div class="cart-item-info">
          <h3>${p.name}</h3>
          <p>$${p.price.toFixed(2)} each</p>
        </div>
        <div class="qty-control">
          <button class="qty-btn" data-id="${id}" data-delta="-1">-</button>
          <span>${qty}</span>
          <button class="qty-btn" data-id="${id}" data-delta="1">+</button>
        </div>
        <div class="cart-item-total">$${(p.price * qty).toFixed(2)}</div>
        <button class="remove-btn" data-id="${id}">✕</button>
      </div>
    `;
  }).join("");

  container.querySelectorAll(".qty-btn").forEach(btn => {
    btn.addEventListener("click", () => changeQty(Number(btn.dataset.id), Number(btn.dataset.delta)));
  });
  container.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => removeFromCart(Number(btn.dataset.id)));
  });

  document.getElementById("cart-summary").style.display = "flex";
  document.getElementById("cart-total").textContent = `$${cartTotal().toFixed(2)}`;
}

// ----- Checkout page -----
function renderCheckout() {
  document.getElementById("order-confirmation").style.display = "none";
  document.getElementById("checkout-content").style.display = "block";

  const entries = Object.entries(cart);
  const itemsContainer = document.getElementById("checkout-items");

  if (entries.length === 0) {
    itemsContainer.innerHTML = `<p class="empty-msg">Your cart is empty.</p>`;
    document.getElementById("checkout-total").textContent = "$0.00";
    document.querySelector("#checkout-form button[type=submit]").disabled = true;
    return;
  }

  document.querySelector("#checkout-form button[type=submit]").disabled = false;
  itemsContainer.innerHTML = entries.map(([id, qty]) => {
    const p = PRODUCTS.find(p => p.id === Number(id));
    return `<div class="summary-line"><span>${p.name} x${qty}</span><span>$${(p.price * qty).toFixed(2)}</span></div>`;
  }).join("");

  document.getElementById("checkout-total").textContent = `$${cartTotal().toFixed(2)}`;
}

document.getElementById("checkout-form").addEventListener("submit", (e) => {
  e.preventDefault();
  cart = {};
  saveCart();
  document.getElementById("checkout-content").style.display = "none";
  document.getElementById("order-confirmation").style.display = "block";
  document.getElementById("checkout-form").reset();
});

// ----- Init -----
renderCategories();
populateCategoryFilter();
renderProducts();
updateCartCount();
